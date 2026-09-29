import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { ListQuery } from '@/types/common';
import type { ReferenceItem, ReferenceSummary } from '@/types/reference';
import { ReferenceService } from '@/services/ReferenceService';

/**
 * reference store
 * ---------------
 * Menyimpan referensi PDDikti yang sudah diambil. Referensi bersifat
 * read-only dari Neo Feeder, sehingga cache lokal aman dipakai ulang.
 */
export const useReferenceStore = defineStore('integrator/reference', () => {
    const summaries = ref<ReferenceSummary[]>([]);
    const items = ref<Record<string, ReferenceItem[]>>({});
    const meta = ref<Record<string, { page: number; perPage: number; total: number; lastPage: number }>>({});
    const dictionaryVerified = ref<Record<string, boolean>>({});
    const loading = ref(false);
    const loadingKey = ref<string | null>(null);
    const error = ref<string | null>(null);

    const requiredUnmapped = computed(() => summaries.value.filter((summary) => summary.unmappedLocalValues > 0));

    const loadSummary = async (force = false): Promise<void> => {
        if (summaries.value.length > 0 && !force) return;
        loading.value = true;
        error.value = null;
        try {
            summaries.value = await ReferenceService.summary();
        } catch (caught) {
            error.value = (caught as Error).message;
        } finally {
            loading.value = false;
        }
    };

    const loadItems = async (key: string, query: ListQuery = {}, force = false): Promise<void> => {
        if (items.value[key] && !force && !query.search && !query.page) return;
        loadingKey.value = key;
        error.value = null;
        try {
            const response = await ReferenceService.list(key, query);
            items.value = { ...items.value, [key]: response.data };
            meta.value = { ...meta.value, [key]: response.meta };
            dictionaryVerified.value = { ...dictionaryVerified.value, [key]: response.dictionaryVerified };
        } catch (caught) {
            error.value = (caught as Error).message;
        } finally {
            loadingKey.value = null;
        }
    };

    const findById = (key: string, id: string): ReferenceItem | null => (items.value[key] ?? []).find((item) => item.id === id) ?? null;

    const labelOf = (key: string, id: string | null): string => {
        if (!id) return '—';
        return findById(key, id)?.name ?? id;
    };

    return {
        summaries,
        items,
        meta,
        dictionaryVerified,
        loading,
        loadingKey,
        error,
        requiredUnmapped,
        loadSummary,
        loadItems,
        findById,
        labelOf,
    };
});
