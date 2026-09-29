import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { EntityKey, PayloadPreviewResponse, SyncJob } from '@/types/integration';
import { SyncService, type SyncPlanSummary } from '@/services/SyncService';
import { ApiError } from '@/api/http';

interface SyncOrderRow {
    order: number;
    entity: EntityKey;
    label: string;
    dependsOn: EntityKey[];
    mandatory: boolean;
    mapped: number;
    unmapped: number;
    total: number;
    ready: boolean;
    capability: string;
    capabilityNote: string;
}

/**
 * sync store
 * ----------
 * Menyusun rencana sinkronisasi (preview + dry run) dan membuat job.
 *
 * Pemantauan progres TIDAK dilakukan di store: gunakan `useJobMonitor`
 * yang menyimpan snapshot job pada ref lokal komponen. Job yang dibuat
 * disimpan pada `activeJob` sebagai titik awal pemantauan.
 */
export const useSyncStore = defineStore('integrator/sync', () => {
    const order = ref<SyncOrderRow[]>([]);
    const jobs = ref<SyncJob[]>([]);
    const jobMeta = ref({ page: 1, perPage: 25, total: 0, lastPage: 1 });
    const jobStats = ref({ queued: 0, running: 0, completed: 0, partial: 0, failed: 0, totalItems: 0, successItems: 0, failedItems: 0 });
    const activeJob = ref<SyncJob | null>(null);
    const preview = ref<PayloadPreviewResponse | null>(null);

    const dryRun = ref(true);
    const loading = ref(false);
    const creating = ref(false);
    const error = ref<string | null>(null);

    const plan = computed<SyncPlanSummary | null>(() => (preview.value ? SyncService.planSummary(preview.value) : null));
    const sendableCount = computed(() => (preview.value ? SyncService.sendableIds(preview.value).length : 0));
    const retryableCount = computed(() => (activeJob.value ? SyncService.retryableItems(activeJob.value).length : 0));

    const loadOrder = async (): Promise<void> => {
        try {
            order.value = await SyncService.order();
        } catch (caught) {
            error.value = caught instanceof ApiError ? caught.normalized.message : 'Gagal memuat urutan sinkronisasi.';
        }
    };

    const loadJobs = async (query: { page?: number; perPage?: number; entity?: EntityKey | ''; status?: string; search?: string } = {}): Promise<void> => {
        loading.value = true;
        error.value = null;
        try {
            const response = await SyncService.jobs({
                page: query.page ?? jobMeta.value.page,
                perPage: query.perPage ?? jobMeta.value.perPage,
                search: query.search || undefined,
                filters: { entity: query.entity || undefined, status: query.status || undefined },
            });
            jobs.value = response.data;
            jobMeta.value = response.meta;
            jobStats.value = response.stats;
        } catch (caught) {
            error.value = caught instanceof ApiError ? caught.normalized.message : 'Gagal memuat daftar job sinkronisasi.';
        } finally {
            loading.value = false;
        }
    };

    /** Menyusun rencana sinkronisasi untuk data terpilih (selalu melalui preview). */
    const prepare = async (entity: EntityKey, ids: string[]): Promise<PayloadPreviewResponse | null> => {
        loading.value = true;
        error.value = null;
        try {
            preview.value = await SyncService.preview(entity, ids, dryRun.value);
            return preview.value;
        } catch (caught) {
            error.value = caught instanceof ApiError ? caught.normalized.message : 'Gagal menyusun rencana sinkronisasi.';
            return null;
        } finally {
            loading.value = false;
        }
    };

    const clearPreview = (): void => {
        preview.value = null;
    };

    /** Membuat job dan langsung menjalankannya (setelah operator menekan konfirmasi). */
    const confirmAndRun = async (payload: {
        entity: EntityKey;
        ids: string[];
        periodId?: string | null;
        periodLabel?: string | null;
        prodiId?: string | null;
        prodiLabel?: string | null;
        dryRun?: boolean;
    }): Promise<SyncJob | null> => {
        creating.value = true;
        error.value = null;
        try {
            const job = await SyncService.create({
                entity: payload.entity,
                ids: payload.ids,
                dryRun: payload.dryRun ?? dryRun.value,
                periodId: payload.periodId,
                periodLabel: payload.periodLabel,
                prodiId: payload.prodiId,
                prodiLabel: payload.prodiLabel,
            });
            activeJob.value = job;
            const started = await SyncService.run(job.id);
            activeJob.value = started;
            return started;
        } catch (caught) {
            error.value = caught instanceof ApiError ? caught.normalized.message : 'Gagal membuat job sinkronisasi.';
            return null;
        } finally {
            creating.value = false;
        }
    };

    const loadJob = async (id: string): Promise<SyncJob | null> => {
        try {
            activeJob.value = await SyncService.job(id);
            return activeJob.value;
        } catch (caught) {
            error.value = caught instanceof ApiError ? caught.normalized.message : 'Gagal memuat job.';
            return null;
        }
    };

    const setActiveJob = (job: SyncJob | null): void => {
        activeJob.value = job;
    };

    const reset = (): void => {
        preview.value = null;
        activeJob.value = null;
    };

    return {
        order,
        jobs,
        jobMeta,
        jobStats,
        activeJob,
        preview,
        dryRun,
        loading,
        creating,
        error,
        plan,
        sendableCount,
        retryableCount,
        loadOrder,
        loadJobs,
        prepare,
        clearPreview,
        confirmAndRun,
        loadJob,
        setActiveJob,
        reset,
    };
});