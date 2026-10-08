import type { ErrorCategory } from '@/types/common';
import type { DataStatus, JobStatus, MappingStatus } from '@/types/integration';
import type { StatusTone } from '@/types/common';

interface StatusDescriptor {
    label: string;
    tone: StatusTone;
    description: string;
}

/** Meta status data — dipakai StatusBadge & tooltip agar arti status konsisten. */
export const dataStatusMeta: Record<DataStatus, StatusDescriptor> = {
    UNMAPPED: {
        label: 'Belum dipetakan',
        tone: 'neutral',
        description: 'Data SIAKAD belum memiliki pasangan ID PDDikti. Jalankan pemetaan terlebih dahulu.',
    },
    MAPPED: {
        label: 'Terpetakan',
        tone: 'info',
        description: 'Sudah memiliki ID PDDikti tetapi belum pernah dikirim/disinkronkan.',
    },
    VALID: {
        label: 'Valid',
        tone: 'info',
        description: 'Lolos seluruh aturan validasi dan siap dikirim.',
    },
    INVALID: {
        label: 'Tidak valid',
        tone: 'danger',
        description: 'Ada kesalahan validasi. Perbaiki data SIAKAD sebelum dikirim.',
    },
    NEW: {
        label: 'Akan dikirim',
        tone: 'accent',
        description: 'Belum ada di PDDikti. Akan dikirim dengan act Insert.',
    },
    CHANGED: {
        label: 'Perlu update',
        tone: 'warning',
        description: 'Sudah ada di PDDikti tetapi ada field yang berbeda. Akan dikirim dengan act Update.',
    },
    SYNCED: {
        label: 'Sudah sinkron',
        tone: 'success',
        description: 'Data SIAKAD dan PDDikti identik pada field yang dibandingkan.',
    },
    SYNC_REQUIRED: {
        label: 'Perlu disinkronkan',
        tone: 'accent',
        description: 'Data valid dan menunggu antrean sinkronisasi.',
    },
    SYNCING: {
        label: 'Proses sinkronisasi',
        tone: 'warning',
        description: 'Sedang dikirim ke Neo Feeder.',
    },
    SUCCESS: {
        label: 'Berhasil',
        tone: 'success',
        description: 'Pengiriman terakhir ke Neo Feeder berhasil.',
    },
    FAILED: {
        label: 'Gagal',
        tone: 'danger',
        description: 'Pengiriman terakhir gagal. Lihat log untuk detail dan opsi retry.',
    },
    CONFLICT: {
        label: 'Konflik',
        tone: 'danger',
        description: 'Data identitas berbeda dengan PDDikti. Perlu keputusan operator, tidak di-overwrite otomatis.',
    },
};

export const mappingStatusMeta: Record<MappingStatus, StatusDescriptor> = {
    MAPPED: { label: 'Mapped', tone: 'success', description: 'Terpetakan ke ID PDDikti.' },
    UNMAPPED: { label: 'Unmapped', tone: 'neutral', description: 'Belum dipetakan.' },
    INVALID: { label: 'Invalid', tone: 'danger', description: 'Pemetaan tidak memenuhi syarat.' },
    CONFLICT: { label: 'Conflict', tone: 'danger', description: 'Lebih dari satu kandidat PDDikti yang cocok.' },
};

export const jobStatusMeta: Record<JobStatus, StatusDescriptor> = {
    QUEUED: { label: 'Antrean', tone: 'neutral', description: 'Menunggu dijalankan.' },
    RUNNING: { label: 'Berjalan', tone: 'warning', description: 'Sedang memproses item.' },
    COMPLETED: { label: 'Selesai', tone: 'success', description: 'Seluruh item berhasil.' },
    PARTIAL: { label: 'Sebagian berhasil', tone: 'warning', description: 'Sebagian item gagal.' },
    FAILED: { label: 'Gagal', tone: 'danger', description: 'Seluruh item gagal.' },
    CANCELLED: { label: 'Dibatalkan', tone: 'neutral', description: 'Dibatalkan operator.' },
};

/** Status per item di dalam job sinkronisasi. */
export const jobItemStatusMeta: Record<string, StatusDescriptor> = {
    PENDING: { label: 'Menunggu', tone: 'neutral', description: 'Item belum diproses.' },
    RUNNING: { label: 'Diproses', tone: 'warning', description: 'Item sedang dikirim ke Neo Feeder.' },
    SUCCESS: { label: 'Berhasil', tone: 'success', description: 'Item berhasil dikirim.' },
    FAILED: { label: 'Gagal', tone: 'danger', description: 'Item gagal dikirim.' },
    SKIPPED: { label: 'Dilewati', tone: 'neutral', description: 'Item dilewati (dry run, sudah sinkron, atau tidak ada act pengiriman).' },
    INVALID: { label: 'Tidak valid', tone: 'danger', description: 'Item tidak lolos validasi.' },
};

export const severityMeta: Record<'critical' | 'error' | 'warning' | 'info', StatusDescriptor> = {
    critical: { label: 'Critical', tone: 'danger', description: 'Menghalangi sinkronisasi.' },
    error: { label: 'Error', tone: 'danger', description: 'Harus diperbaiki sebelum dikirim.' },
    warning: { label: 'Warning', tone: 'warning', description: 'Boleh dikirim tetapi berisiko.' },
    info: { label: 'Info', tone: 'info', description: 'Informasi perbedaan data.' },
};

export const connectionStatusMeta: Record<string, StatusDescriptor> = {
    CONNECTED: { label: 'Connected', tone: 'success', description: 'Web service merespons dan token valid.' },
    DISCONNECTED: { label: 'Disconnected', tone: 'neutral', description: 'Belum terhubung ke web service.' },
    AUTHENTICATION_FAILED: { label: 'Auth failed', tone: 'danger', description: 'Username/password ditolak.' },
    TIMEOUT: { label: 'Timeout', tone: 'warning', description: 'Web service tidak merespons dalam batas waktu.' },
    SERVER_ERROR: { label: 'Server error', tone: 'danger', description: 'Web service mengembalikan kesalahan server.' },
};

export const comparisonStatusMeta: Record<string, StatusDescriptor> = {
    MATCH: { label: 'Sama', tone: 'success', description: 'Nilai identik.' },
    DIFFERENT: { label: 'Berbeda', tone: 'warning', description: 'Nilai berbeda antara SIAKAD dan PDDikti.' },
    MISSING_LOCAL: { label: 'Kosong di SIAKAD', tone: 'neutral', description: 'PDDikti punya nilai, SIAKAD belum.' },
    MISSING_PDDIKTI: { label: 'Kosong di PDDikti', tone: 'neutral', description: 'SIAKAD punya nilai, PDDikti belum.' },
};

export const errorCategoryMeta: Record<ErrorCategory, { label: string; description: string; retryable: boolean }> = {
    NETWORK_ERROR: {
        label: 'Gangguan jaringan',
        description: 'Neo Feeder tidak dapat dihubungi.',
        retryable: true,
    },
    TIMEOUT: {
        label: 'Waktu habis',
        description: 'Web service tidak merespons pada batas waktu yang ditentukan.',
        retryable: true,
    },
    AUTH_ERROR: {
        label: 'Autentikasi gagal',
        description: 'Token tidak valid atau kedaluwarsa. Perbarui token pada halaman Koneksi.',
        retryable: false,
    },
    VALIDATION_ERROR: {
        label: 'Validasi gagal',
        description: 'Data tidak memenuhi aturan Neo Feeder. Perbaiki data SIAKAD terlebih dahulu.',
        retryable: false,
    },
    PDDIKTI_ERROR: {
        label: 'Kesalahan PDDikti',
        description: 'Neo Feeder menolak request meskipun koneksi sehat.',
        retryable: true,
    },
    CONFLICT: {
        label: 'Konflik data',
        description: 'Data identitas berbeda dengan PDDikti sehingga tidak boleh dikirim otomatis.',
        retryable: false,
    },
    UNKNOWN_ERROR: {
        label: 'Kesalahan tidak dikenal',
        description: 'Perlu penelusuran teknis pada log.',
        retryable: true,
    },
};

export const toneClasses: Record<StatusTone, string> = {
    neutral: 'border-neutral-300 bg-neutral-100 text-neutral-700',
    info: 'border-sky-200 bg-sky-50 text-sky-700',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-800',
    danger: 'border-red-200 bg-red-50 text-red-700',
    accent: 'border-brand-300 bg-brand-50 text-brand-800',
};
