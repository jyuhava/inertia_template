import { computed, onUnmounted, ref } from 'vue';
import type { SyncJob } from '@/types/integration';
import { SyncService } from '@/services/SyncService';
import { appConfig } from '@/config/app.config';
import { ApiError } from '@/api/http';

/**
 * useJobMonitor
 * =============
 * Memantau satu job sinkronisasi secara langsung (polling) dan menyimpan
 * snapshot-nya pada ref lokal komponen.
 *
 * Alasan memakai ref lokal alih-alih state store: panel progres harus
 * ter-update setiap polling, dan snapshot lokal menjamin pembaruan tampilan
 * tanpa bergantung pada penyebaran reaktivitas lintas modul.
 */
export const useJobMonitor = (options: { onFinished?: (job: SyncJob) => void } = {}) => {
    const job = ref<SyncJob | null>(null);
    const polling = ref(false);
    const error = ref<string | null>(null);
    const lastUpdatedAt = ref<string | null>(null);

    let timer: number | null = null;
    let watchedId: string | null = null;

    const progress = computed(() => (job.value && job.value.total > 0 ? Math.round((job.value.processed / job.value.total) * 100) : 0));
    const finished = computed(() => (job.value ? SyncService.isFinished(job.value) : true));
    const retryableCount = computed(() => (job.value ? SyncService.retryableItems(job.value).length : 0));

    const stop = (): void => {
        if (timer !== null) {
            window.clearTimeout(timer);
            timer = null;
        }
        polling.value = false;
    };

    const snapshot = (next: SyncJob | null): void => {
        job.value = next;
        lastUpdatedAt.value = new Date().toISOString();
    };

    const tick = async (): Promise<void> => {
        if (!watchedId) return;
        try {
            const latest = await SyncService.job(watchedId);
            snapshot(latest);
            error.value = null;

            if (SyncService.isFinished(latest)) {
                stop();
                options.onFinished?.(latest);
                return;
            }
        } catch (caught) {
            error.value = caught instanceof ApiError ? caught.normalized.message : 'Gagal memuat status job.';
            stop();
            return;
        }

        timer = window.setTimeout(() => void tick(), appConfig.syncPollIntervalMs);
    };

    /** Mulai memantau job tertentu (langsung mengambil snapshot pertama). */
    const watch = (jobId: string, initial?: SyncJob | null): void => {
        stop();
        watchedId = jobId;
        polling.value = true;
        if (initial) snapshot(initial);
        void tick();
    };

    /** Setel snapshot manual (mis. hasil respons pembuatan job). */
    const set = (next: SyncJob | null): void => {
        snapshot(next);
    };

    const refresh = async (): Promise<void> => {
        if (!watchedId) return;
        try {
            snapshot(await SyncService.job(watchedId));
        } catch (caught) {
            error.value = caught instanceof ApiError ? caught.normalized.message : 'Gagal memuat status job.';
        }
    };

    const retryFailed = async (): Promise<SyncJob | null> => {
        if (!watchedId) return null;
        const next = await SyncService.retryFailed(watchedId);
        snapshot(next);
        if (!SyncService.isFinished(next)) {
            watch(watchedId, next);
        }
        return next;
    };

    const cancel = async (): Promise<SyncJob | null> => {
        if (!watchedId) return null;
        const next = await SyncService.cancel(watchedId);
        snapshot(next);
        return next;
    };

    onUnmounted(stop);

    return {
        job,
        polling,
        error,
        lastUpdatedAt,
        progress,
        finished,
        retryableCount,
        watch,
        set,
        stop,
        refresh,
        retryFailed,
        cancel,
    };
};