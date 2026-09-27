import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { EntityKey, SyncLogEntry } from '@/types/integration';
import { SiakadService } from '@/services/SiakadService';
import { ApiError } from '@/api/http';

/**
 * logs store
 * ----------
 * Histori request/response Neo Feeder (audit trail) beserta detailnya.
 */
export const useLogsStore = defineStore('integrator/logs', () => {
    const logs = ref<SyncLogEntry[]>([]);
    const meta = ref({ page: 1, perPage: 25, total: 0, lastPage: 1 });
    const stats = ref({ total: 0, success: 0, failed: 0, avgDurationMs: 0 });
    const detail = ref<SyncLogEntry | null>(null);

    const filters = ref<{ entity: EntityKey | ''; status: '' | 'success' | 'failed'; errorCategory: string; search: string }>({
        entity: '',
        status: '',
        errorCategory: '',
        search: '',
    });

    const loading = ref(false);
    const loadingDetail = ref(false);
    const error = ref<string | null>(null);

    const failureRate = computed(() => (stats.value.total === 0 ? 0 : Math.round((stats.value.failed / stats.value.total) * 100)));
    const hasFailures = computed(() => stats.value.failed > 0);

    const load = async (query: { page?: number; perPage?: number } = {}): Promise<void> => {
        loading.value = true;
        error.value = null;
        try {
            const response = await SiakadService.logs({
                page: query.page ?? meta.value.page,
                perPage: query.perPage ?? meta.value.perPage,
                search: filters.value.search || undefined,
                filters: {
                    entity: filters.value.entity || undefined,
                    status: filters.value.status || undefined,
                    errorCategory: filters.value.errorCategory || undefined,
                },
            });
            logs.value = response.data;
            meta.value = response.meta;
            stats.value = response.stats;
        } catch (caught) {
            error.value = caught instanceof ApiError ? caught.normalized.message : 'Gagal memuat log sinkronisasi.';
        } finally {
            loading.value = false;
        }
    };

    const loadDetail = async (id: string): Promise<void> => {
        loadingDetail.value = true;
        try {
            detail.value = await SiakadService.log(id);
        } catch (caught) {
            error.value = caught instanceof ApiError ? caught.normalized.message : 'Gagal memuat detail log.';
        } finally {
            loadingDetail.value = false;
        }
    };

    const applyFilters = async (patch: Partial<typeof filters.value>): Promise<void> => {
        filters.value = { ...filters.value, ...patch };
        await load({ page: 1 });
    };

    const resetFilters = async (): Promise<void> => {
        filters.value = { entity: '', status: '', errorCategory: '', search: '' };
        await load({ page: 1 });
    };

    return {
        logs,
        meta,
        stats,
        detail,
        filters,
        loading,
        loadingDetail,
        error,
        failureRate,
        hasFailures,
        load,
        loadDetail,
        applyFilters,
        resetFilters,
    };
});
