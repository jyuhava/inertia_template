import type { ReferenceKey } from '@/types/reference';
import type { ListQuery } from '@/types/common';
import { siakadApi } from '@/api/siakad';

/**
 * ReferenceService
 * ================
 * Referensi PDDikti (agama, jalur masuk, jenis keluar, skala nilai, dst).
 * Referensi bersifat read-only dari Neo Feeder; yang dikelola operator adalah
 * pemetaan nilai lokal SIAKAD ke id referensi PDDikti.
 */
export const ReferenceService = {
    summary: () => siakadApi.references.summary(),

    list: (key: ReferenceKey | string, query: ListQuery = {}) => siakadApi.references.list(key, query),

    /** Referensi wajib yang belum sepenuhnya dipetakan — dipakai sebagai peringatan dashboard. */
    requiredUnmapped: async (): Promise<{ key: string; label: string; unmapped: number }[]> => {
        const summary = await ReferenceService.summary();
        return summary
            .filter((item) => item.unmappedLocalValues > 0)
            .map((item) => ({ key: item.key, label: item.label, unmapped: item.unmappedLocalValues }));
    },

    /** Nilai lokal yang belum dipetakan pada sebuah referensi. */
    unmappedValues: (items: { id: string; name: string; localValue?: string | null; usedBySiakad?: number }[]): { id: string; name: string }[] =>
        items.filter((item) => (item.usedBySiakad ?? 0) > 0 && !item.localValue).map((item) => ({ id: item.id, name: item.name })),

    copyPayload: (item: { id: string; code?: string; name: string }): string => JSON.stringify({ id: item.id, code: item.code ?? null, name: item.name }, null, 2),
};
