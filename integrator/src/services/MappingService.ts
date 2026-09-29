import type { ListQuery } from '@/types/common';
import type { EntityKey } from '@/types/integration';
import type { AutoMapResult, MappingCandidate, MappingRecord, MappingStats } from '@/types/mapping';
import { siakadApi } from '@/api/siakad';

/**
 * MappingService
 * ==============
 * Menangani pemetaan data SIAKAD -> PDDikti beserta statistiknya.
 * Semua penyimpanan dilakukan backend (mock menyimulasikannya in-memory),
 * sehingga pemetaan tetap konsisten antar halaman.
 */
export const MappingService = {
    summary: () => siakadApi.mapping.summary(),

    list: (entity: EntityKey, query: ListQuery = {}) => siakadApi.mapping.list(entity, query),

    candidates: (entity: EntityKey, localId: string) => siakadApi.mapping.candidates(entity, localId),

    save: (entity: EntityKey, payload: { localId: string; externalId: string; externalLabel?: string; externalCode?: string; mappingType?: string }) =>
        siakadApi.mapping.save(entity, payload),

    bulk: (entity: EntityKey, items: { localId: string; externalId: string; mappingType?: string }[]) => siakadApi.mapping.bulk(entity, items),

    unmap: (entity: EntityKey, localIds: string[]) => siakadApi.mapping.unmap(entity, localIds),

    autoMap: (entity: EntityKey, mode: 'code' | 'name' | 'identity' = 'code') => siakadApi.mapping.auto(entity, mode),

    /** Ringkasan hasil auto-map untuk dialog konfirmasi. */
    summarizeAutoMap: (result: AutoMapResult): { matched: number; skipped: number; conflicts: number; detail: string } => ({
        matched: result.matched,
        skipped: result.skipped,
        conflicts: result.conflicts,
        detail:
            result.conflicts > 0
                ? `${result.matched} berhasil dipetakan, ${result.conflicts} perlu keputusan operator, ${result.skipped} dilewati.`
                : `${result.matched} berhasil dipetakan otomatis, ${result.skipped} tidak menemukan kandidat yang meyakinkan.`,
    }),

    /** Statistik pemetaan dari daftar record (dipakai tabel mapping). */
    statsFromRecords: (records: MappingRecord[]): MappingStats => {
        const total = records.length;
        const mapped = records.filter((record) => record.status === 'MAPPED').length;
        return {
            entity: (records[0]?.entity ?? 'prodi') as EntityKey,
            label: '',
            total,
            mapped,
            unmapped: records.filter((record) => record.status === 'UNMAPPED').length,
            conflict: records.filter((record) => record.status === 'CONFLICT').length,
            invalid: records.filter((record) => record.status === 'INVALID').length,
            progress: total === 0 ? 0 : Math.round((mapped / total) * 100),
            required: false,
        };
    },

    /** Urutkan kandidat: terbaik lebih dahulu, sertakan alasan untuk tooltip. */
    rankedCandidates: (candidates: MappingCandidate[]): MappingCandidate[] => [...candidates].sort((a, b) => b.score - a.score),

    confidenceLabel: (confidence: number | null): string => {
        if (confidence === null) return '—';
        if (confidence >= 0.9) return 'Sangat yakin';
        if (confidence >= 0.7) return 'Yakin';
        if (confidence >= 0.5) return 'Perlu diperiksa';
        return 'Rendah';
    },
};
