import type { JsonObject, JsonValue } from '@/types/common';
import type { NeoFeederRawResponse, NeoFeederResult } from '@/types/neofeeder';
import { asNumber, asString, maskSensitive } from '@/utils/json';

/**
 * ResponseNormalizer
 * ==================
 * Menyeragamkan seluruh respons Web Service Neo Feeder menjadi bentuk:
 *
 *   { success, code, message, data, raw, act, requestId, durationMs, ... }
 *
 * Neo Feeder mengembalikan `error_code` (0 = sukses) dan `error_desc`, dengan
 * `data` kadang berupa array dan kadang objek dengan kunci numerik
 * ({ "0": {...}, "1": {...} }). Normalizer menangani keduanya dan menyimpan
 * respons mentah untuk keperluan debugging (token selalu disensor).
 */

export const toRows = (data: unknown): JsonObject[] => {
    if (Array.isArray(data)) return data as JsonObject[];
    if (data && typeof data === 'object') {
        const record = data as JsonObject;
        const numericKeys = Object.keys(record).filter((key) => /^\d+$/.test(key));
        if (numericKeys.length > 0) {
            return numericKeys
                .sort((a, b) => Number(a) - Number(b))
                .map((key) => record[key])
                .filter((item): item is JsonObject => Boolean(item) && typeof item === 'object');
        }
        return [record];
    }
    return [];
};

export const neoFeederCode = (raw: NeoFeederRawResponse | JsonObject | null | undefined): number => {
    if (!raw) return -1;
    const value = (raw as JsonObject).error_code ?? (raw as JsonObject).errorCode;
    const parsed = asNumber(value, -1);
    return parsed ?? -1;
};

export const neoFeederMessage = (raw: NeoFeederRawResponse | JsonObject | null | undefined): string => {
    if (!raw) return 'Tidak ada respons dari Web Service.';
    const message = asString((raw as JsonObject).error_desc) || asString((raw as JsonObject).error_message);
    return message.trim() === '' ? 'Web Service tidak memberikan keterangan.' : message;
};

export interface NormalizeOptions {
    act: string;
    requestId: string;
    durationMs: number;
    attempts?: number;
    httpStatus?: number | null;
    mocked?: boolean;
}

export const normalizeResponse = (raw: unknown, options: NormalizeOptions): NeoFeederResult<JsonObject[]> => {
    const record = (raw && typeof raw === 'object' ? (raw as JsonObject) : {}) as NeoFeederRawResponse;
    const code = neoFeederCode(record);
    const success = code === 0;
    const data = toRows(record.data);

    return {
        success,
        code,
        message: neoFeederMessage(record),
        data,
        raw: (maskSensitive(record as JsonValue) as JsonObject) ?? {},
        act: options.act,
        requestId: options.requestId,
        durationMs: options.durationMs,
        attempts: options.attempts ?? 1,
        httpStatus: options.httpStatus ?? 200,
        mocked: options.mocked ?? false,
    };
};

/** Ambil satu nilai dari baris respons Neo Feeder, toleran terhadap variasi nama. */
export const pickValue = (row: JsonObject | null | undefined, keys: string[]): JsonValue | null => {
    if (!row) return null;
    for (const key of keys) {
        if (key in row && row[key] !== null && row[key] !== undefined && row[key] !== '') {
            return row[key];
        }
    }
    return null;
};

/** Ekstrak id record dari respons insert/update Neo Feeder. */
export const extractReturnedId = (row: JsonObject | null | undefined, candidates: string[]): string | null => {
    const value = pickValue(row, candidates);
    if (value === null) return null;
    return String(value);
};

export const mapNeoFeederErrorCategory = (code: number, message: string): string => {
    const text = message.toLowerCase();
    if (code === 401 || code === 403 || text.includes('token')) return 'AUTH_ERROR';
    if (text.includes('timeout') || text.includes('time out')) return 'TIMEOUT';
    if (code === 0) return 'SUCCESS';
    if (code >= 500) return 'PDDIKTI_ERROR';
    if (code >= 400) return 'VALIDATION_ERROR';
    return 'PDDIKTI_ERROR';
};
