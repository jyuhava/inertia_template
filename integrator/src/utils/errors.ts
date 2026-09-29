import type { ErrorCategory, JsonObject } from '@/types/common';
import { errorCategoryMeta } from './status';

export interface NormalizedError {
    category: ErrorCategory;
    /** pesan manusiawi yang aman ditampilkan ke operator */
    message: string;
    /** detail teknis, disembunyikan di balik expandable section */
    detail: string | null;
    httpStatus: number | null;
    neoFeederCode: number | null;
    requestId: string | null;
    retryable: boolean;
    actions: string[];
}

const asRecord = (value: unknown): JsonObject => (value && typeof value === 'object' ? (value as JsonObject) : {});

const build = (
    category: ErrorCategory,
    message: string,
    extra: Partial<NormalizedError> = {},
): NormalizedError => ({
    category,
    message,
    detail: extra.detail ?? null,
    httpStatus: extra.httpStatus ?? null,
    neoFeederCode: extra.neoFeederCode ?? null,
    requestId: extra.requestId ?? null,
    retryable: extra.retryable ?? errorCategoryMeta[category].retryable,
    actions: extra.actions ?? [],
});

/**
 * Normalisasi error dari Backend SIAKAD / Neo Feeder menjadi bahasa yang
 * dapat dimengerti operator. Jangan pernah menampilkan pesan mentah
 * "500 Internal Server Error" sebagai satu-satunya informasi.
 */
export const normalizeError = (error: unknown): NormalizedError => {
    const err = asRecord(error as JsonObject);
    const response = asRecord(err.response);
    const data = asRecord(response.data);
    const config = asRecord(err.config);

    const httpStatus = typeof response.status === 'number' ? response.status : null;
    const requestId = typeof data.request_id === 'string' ? data.request_id : null;
    const neoFeederCode =
        typeof data.neo_feeder_code === 'number'
            ? data.neo_feeder_code
            : typeof data.error_code === 'number'
              ? data.error_code
              : null;

    const backendCategory = typeof data.error_category === 'string' ? (data.error_category as ErrorCategory) : null;
    const backendMessage = typeof data.message === 'string' ? data.message : null;
    const detail = typeof data.detail === 'string' ? data.detail : (typeof err.stack === 'string' ? err.stack : null);
    const code = typeof err.code === 'string' ? err.code : null;

    if (code === 'ECONNABORTED' || code === 'ETIMEDOUT' || /timeout/i.test(String(err.message ?? ''))) {
        return build('TIMEOUT', 'Neo Feeder tidak merespons dalam batas waktu. Coba lagi atau periksa jaringan ke server feeder.', {
            detail,
            httpStatus,
            actions: ['Ulangi request', 'Tingkatkan Timeout pada halaman Koneksi'],
        });
    }

    if (code === 'ERR_NETWORK' || (httpStatus === null && !response.status)) {
        return build('NETWORK_ERROR', 'Neo Feeder tidak dapat dihubungi. Periksa apakah web service aktif dan dapat diakses server.', {
            detail,
            actions: ['Uji Koneksi', 'Periksa URL Web Service'],
        });
    }

    if (httpStatus === 401 || httpStatus === 419 || neoFeederCode === 401) {
        return build('AUTH_ERROR', 'Sesi/token tidak valid. Lakukan autentikasi ulang pada halaman Koneksi.', {
            detail,
            httpStatus,
            neoFeederCode,
            actions: ['Autentikasi ulang', 'Refresh token'],
        });
    }

    if (httpStatus === 403) {
        return build('AUTH_ERROR', 'Akses ditolak. Peran operator tidak memiliki izin untuk aksi ini.', {
            detail,
            httpStatus,
            requestId,
            retryable: false,
        });
    }

    if (httpStatus === 409 || backendCategory === 'CONFLICT') {
        return build('CONFLICT', backendMessage ?? 'Terdapat konflik data yang memerlukan keputusan operator.', {
            detail,
            httpStatus,
            requestId,
            retryable: false,
            actions: ['Buka halaman Perbandingan', 'Pilih aksi manual'],
        });
    }

    if (httpStatus === 422 || backendCategory === 'VALIDATION_ERROR') {
        return build('VALIDATION_ERROR', backendMessage ?? 'Data tidak lolos validasi. Perbaiki data SIAKAD terlebih dahulu.', {
            detail,
            httpStatus,
            requestId,
            retryable: false,
            actions: ['Buka Validation Center'],
        });
    }

    if (backendCategory) {
        return build(backendCategory, backendMessage ?? errorCategoryMeta[backendCategory].description, {
            detail,
            httpStatus,
            neoFeederCode,
            requestId,
        });
    }

    if (httpStatus !== null && httpStatus >= 500) {
        return build('PDDIKTI_ERROR', 'Server feeder/backend mengalami kesalahan saat memproses permintaan.', {
            detail,
            httpStatus,
            neoFeederCode,
            requestId,
        });
    }

    return build('UNKNOWN_ERROR', backendMessage ?? 'Terjadi kesalahan yang belum dapat diklasifikasikan.', {
        detail,
        httpStatus,
        requestId,
    });
};

export const isRetryableCategory = (category: string): boolean =>
    ['NETWORK_ERROR', 'TIMEOUT', 'PDDIKTI_ERROR', 'UNKNOWN_ERROR'].includes(category);
