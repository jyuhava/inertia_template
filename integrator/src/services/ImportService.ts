import type { EntityKey, ValidationIssue } from '@/types/integration';
import { csvToObjects } from '@/utils/csv';
import { siakadApi } from '@/api/siakad';

export interface ImportPreviewRow {
    index: number;
    row: Record<string, unknown>;
    issues: ValidationIssue[];
    blocking: number;
}

export interface ImportPreviewResult {
    entity: EntityKey;
    format: 'csv' | 'json';
    total: number;
    preview: ImportPreviewRow[];
    summary: { valid: number; invalid: number };
    note: string;
}

/**
 * ImportService
 * =============
 * Import data pendukung (CSV/JSON) dengan alur:
 *   Import → Preview → Validation → Mapping → Approval → Sync
 *
 * Import TIDAK PERNAH langsung menyinkronkan data. Hasil preview dipakai
 * operator untuk memutuskan langkah berikutnya.
 */
export const ImportService = {
    detectFormat: (filename: string, content: string): 'csv' | 'json' => {
        if (/\.json$/i.test(filename)) return 'json';
        if (/\.csv$/i.test(filename)) return 'csv';
        const trimmed = content.trim();
        return trimmed.startsWith('[') || trimmed.startsWith('{') ? 'json' : 'csv';
    },

    parseLocal: (format: 'csv' | 'json', content: string): Record<string, unknown>[] => {
        if (format === 'json') {
            try {
                const parsed = JSON.parse(content);
                return Array.isArray(parsed) ? (parsed as Record<string, unknown>[]) : [];
            } catch {
                return [];
            }
        }
        return csvToObjects(content) as unknown as Record<string, unknown>[];
    },

    /** Preview melalui backend agar validasi memakai aturan Neo Feeder yang sama. */
    preview: (entity: EntityKey, format: 'csv' | 'json', content: string): Promise<ImportPreviewResult> =>
        siakadApi.importPreview({ entity, format, content }) as Promise<ImportPreviewResult>,

    readFile: async (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result ?? ''));
            reader.onerror = () => reject(new Error('Gagal membaca berkas.'));
            reader.readAsText(file);
        });
    },

    /** Template kolom per entitas (dipakai untuk tombol unduh template). */
    templateColumns: (entity: EntityKey): string[] => {
        switch (entity) {
            case 'mahasiswa':
                return ['nim', 'nama', 'jenisKelamin', 'tempatLahir', 'tanggalLahir', 'agama', 'kewarganegaraan', 'alamat', 'noHp', 'email', 'nik', 'nisn', 'prodiKode', 'angkatan'];
            case 'mata-kuliah':
                return ['kode', 'nama', 'sks', 'sksTeori', 'sksPraktik', 'jenis', 'semester', 'prodiKode'];
            case 'kelas':
                return ['kodeKelas', 'namaKelas', 'kodeMk', 'prodiKode', 'semesterKode', 'sks', 'kapasitas', 'tipeKelas'];
            case 'dosen':
                return ['nidn', 'nidk', 'nip', 'nama', 'jenisKelamin', 'prodiKode', 'statusKepegawaian'];
            case 'krs':
                return ['nim', 'kodeKelas', 'sks', 'statusKrs'];
            case 'nilai':
                return ['nim', 'kodeKelas', 'nilaiAngka', 'nilaiHuruf', 'bobot', 'statusNilai'];
            default:
                return ['kode', 'nama'];
        }
    },
};
