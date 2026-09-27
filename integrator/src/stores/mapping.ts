import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { AutoMapResult, MappingCandidate, MappingRecord, MappingStats } from '@/types/mapping';
import type { EntityKey } from '@/types/integration';
import { MappingService } from '@/services/MappingService';
import { ApiError } from '@/api/http';

/**
 * mapping store
 * -------------
 * Pusat pemetaan SIAKAD <-> PDDikti. Semua perubahan (manual, bulk, auto,
 * unmap) dipersist melalui backend sehingga konsisten di seluruh halaman.
 */
export const useMappingStore = defineStore('integrator/mapping', () => {
    const summary = ref<MappingStats[]>([]);
    const records = ref<MappingRecord[]>([]);
    const meta = ref({ page: 1, perPage: 25, total: 0, lastPage: 1 });
    const currentEntity = ref<EntityKey | null>(null);
    const candidates = ref<Record<string, MappingCandidate[]>>({});
    const lastAutoMap = ref<AutoMapResult | null>(null);

    const loading = ref(false);
    const saving = ref(false);
    const autoMapping = ref(false);
    const error = ref<string | null>(null);

    const totalMapped = computed(() => summary.value.reduce((total, item) => total + item.mapped, 0));
    const totalUnmapped = computed(() => summary.value.reduce((total, item) => total + item.unmapped, 0));
    const totalRecords = computed(() => summary.value.reduce((total, item) => total + item.total, 0));
    const overallProgress = computed(() => (totalRecords.value === 0 ? 0 : Math.round((totalMapped.value / totalRecords.value) * 100)));
    const requiredIncomplete = computed(() => summary.value.filter((item) => item.required && item.unmapped + item.conflict > 0));

    const loadSummary = async (force = false): Promise<void> => {
        if (summary.value.length > 0 && !force) return;
        loading.value = true;
        error.value = null;
        try {
            summary.value = await MappingService.summary();
        } catch (caught) {
            error.value = caught instanceof ApiError ? caught.normalized.message : 'Gagal memuat statistik pemetaan.';
        } finally {
            loading.value = false;
        }
    };

    const loadRecords = async (
        entity: EntityKey,
        query: { page?: number; perPage?: number; search?: string; mappingStatus?: string; prodiId?: string } = {},
    ): Promise<void> => {
        loading.value = true;
        error.value = null;
        currentEntity.value = entity;
        try {
            const response = await MappingService.list(entity, { ...query, filters: { mappingStatus: query.mappingStatus, prodiId: query.prodiId } });
            records.value = response.data;
            meta.value = response.meta;
        } catch (caught) {
            error.value = caught instanceof ApiError ? caught.normalized.message : 'Gagal memuat data pemetaan.';
        } finally {
            loading.value = false;
        }
    };

    const loadCandidates = async (entity: EntityKey, localId: string): Promise<MappingCandidate[]> => {
        const key = `${entity}:${localId}`;
        if (candidates.value[key]) return candidates.value[key];
        try {
            const response = await MappingService.candidates(entity, localId);
            candidates.value = { ...candidates.value, [key]: response.candidates };
            return response.candidates;
        } catch {
            return [];
        }
    };

    const saveMapping = async (
        entity: EntityKey,
        payload: { localId: string; externalId: string; externalLabel?: string; externalCode?: string; mappingType?: string },
    ): Promise<boolean> => {
        saving.value = true;
        error.value = null;
        try {
            await MappingService.save(entity, payload);
            await Promise.all([loadRecords(entity, { page: meta.value.page }), loadSummary(true)]);
            return true;
        } catch (caught) {
            error.value = caught instanceof ApiError ? caught.normalized.message : 'Gagal menyimpan pemetaan.';
            return false;
        } finally {
            saving.value = false;
        }
    };

    const bulkUnmap = async (entity: EntityKey, localIds: string[]): Promise<number> => {
        saving.value = true;
        try {
            const response = await MappingService.unmap(entity, localIds);
            await Promise.all([loadRecords(entity, { page: meta.value.page }), loadSummary(true)]);
            return response.updated;
        } finally {
            saving.value = false;
        }
    };

    const runAutoMap = async (entity: EntityKey, mode: 'code' | 'name' | 'identity' = 'code'): Promise<AutoMapResult | null> => {
        autoMapping.value = true;
        error.value = null;
        try {
            const result = await MappingService.autoMap(entity, mode);
            lastAutoMap.value = result;
            await Promise.all([loadRecords(entity, { page: 1 }), loadSummary(true)]);
            return result;
        } catch (caught) {
            error.value = caught instanceof ApiError ? caught.normalized.message : 'Pencocokan otomatis gagal.';
            return null;
        } finally {
            autoMapping.value = false;
        }
    };

    return {
        summary,
        records,
        meta,
        currentEntity,
        candidates,
        lastAutoMap,
        loading,
        saving,
        autoMapping,
        error,
        totalMapped,
        totalUnmapped,
        totalRecords,
        overallProgress,
        requiredIncomplete,
        loadSummary,
        loadRecords,
        loadCandidates,
        saveMapping,
        bulkUnmap,
        runAutoMap,
    };
});
