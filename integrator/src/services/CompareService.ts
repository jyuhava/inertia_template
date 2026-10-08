import type { ComparisonRow, ComparisonStatus, EntityKey } from '@/types/integration';
import { siakadApi } from '@/api/siakad';
import { compareEntity } from './StatusEngine';

export type ComparisonDecision =
    | 'KEEP_LOCAL'
    | 'KEEP_PDDIKTI'
    | 'SKIP'
    | 'MANUAL_REVIEW';

export interface ComparisonDecisionOption {
    value: ComparisonDecision;
    label: string;
    description: string;
    recommended: boolean;
}

/**
 * CompareService
 * ==============
 * Perbandingan SIAKAD vs PDDIKTI.
 *
 * Aturan penting: perbedaan TIDAK PERNAH ditimpa otomatis. Operator memilih
 * tindakan, dan pilihan tersebut hanya memengaruhi baris yang dikirim
 * (insert/update) atau dilewati.
 */
export const CompareService = {
    compare: (entity: EntityKey, ids: string[]) => siakadApi.entities.compare(entity, ids),

    /** Perbandingan lokal (dipakai sebelum sinkronisasi / saat backend belum tersedia). */
    compareLocal: (
        entity: EntityKey,
        local: Record<string, unknown>,
        remote: Record<string, unknown> | null,
        resolvers: Parameters<typeof compareEntity>[3],
    ) => compareEntity(entity, local, remote as never, resolvers),

    summarize: (rows: ComparisonRow[]): Record<ComparisonStatus, number> => ({
        MATCH: rows.filter((row) => row.status === 'MATCH').length,
        DIFFERENT: rows.filter((row) => row.status === 'DIFFERENT').length,
        MISSING_LOCAL: rows.filter((row) => row.status === 'MISSING_LOCAL').length,
        MISSING_PDDIKTI: rows.filter((row) => row.status === 'MISSING_PDDIKTI').length,
    }),

    diffOnly: (rows: ComparisonRow[]): ComparisonRow[] => rows.filter((row) => row.status !== 'MATCH'),

    identityDiff: (rows: ComparisonRow[]): ComparisonRow[] => rows.filter((row) => row.status === 'DIFFERENT' && row.identity === true),

    /** Opsi tindakan yang tersedia untuk satu baris perbandingan. */
    decisionOptions: (row: ComparisonRow): ComparisonDecisionOption[] => {
        if (row.status === 'MATCH') {
            return [{ value: 'SKIP', label: 'Tidak ada tindakan', description: 'Nilai sudah sama, tidak perlu dikirim.', recommended: true }];
        }

        if (row.identity === true) {
            return [
                {
                    value: 'KEEP_PDDIKTI',
                    label: 'Pertahankan nilai PDDikti',
                    description: 'Tidak mengirim perubahan identitas; perbedaan dicatat pada log sebagai konflik.',
                    recommended: true,
                },
                {
                    value: 'MANUAL_REVIEW',
                    label: 'Periksa manual',
                    description: 'Perbaiki data SIAKAD terlebih dahulu, lalu sinkronkan ulang.',
                    recommended: false,
                },
            ];
        }

        return [
            {
                value: 'KEEP_LOCAL',
                label: 'Gunakan nilai SIAKAD',
                description: 'Nilai SIAKAD akan dikirim melalui act Update.',
                recommended: true,
            },
            {
                value: 'KEEP_PDDIKTI',
                label: 'Pertahankan nilai PDDikti',
                description: 'Field ini dikosongkan dari payload sehingga nilai PDDikti tidak berubah.',
                recommended: false,
            },
            {
                value: 'MANUAL_REVIEW',
                label: 'Periksa manual',
                description: 'Tunda pengiriman sampai data diperiksa operator.',
                recommended: false,
            },
        ];
    },

    /** Ringkasan manusiawi untuk panel perbandingan. */
    describe: (rows: ComparisonRow[]): string => {
        const summary = CompareService.summarize(rows);
        if (summary.DIFFERENT === 0 && summary.MISSING_LOCAL === 0 && summary.MISSING_PDDIKTI === 0) {
            return 'Seluruh field yang dibandingkan sudah identik dengan PDDikti.';
        }
        const parts: string[] = [];
        if (summary.DIFFERENT > 0) parts.push(`${summary.DIFFERENT} field berbeda`);
        if (summary.MISSING_LOCAL > 0) parts.push(`${summary.MISSING_LOCAL} field kosong di SIAKAD`);
        if (summary.MISSING_PDDIKTI > 0) parts.push(`${summary.MISSING_PDDIKTI} field belum ada di PDDikti`);
        return `Perbandingan menemukan ${parts.join(', ')}.`;
    },
};
