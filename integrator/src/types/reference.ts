import type { JsonObject } from './common';

/** Kunci referensi PDDikti / Neo Feeder yang dikelola modul ini. */
export type ReferenceKey =
    | 'perguruan-tinggi'
    | 'program-studi'
    | 'fakultas'
    | 'semester'
    | 'tahun-ajaran'
    | 'periode'
    | 'jenjang-pendidikan'
    | 'agama'
    | 'jenis-kelamin'
    | 'status-mahasiswa'
    | 'jenis-pendaftaran'
    | 'jalur-masuk'
    | 'jenis-keluar'
    | 'jenis-tinggal'
    | 'pembiayaan'
    | 'bentuk-pendidikan'
    | 'skala-nilai'
    | 'status-kepegawaian'
    | 'ikatan-kerja'
    | 'jabatan-fungsional'
    | 'pangkat-golongan'
    | 'jenis-sertifikasi'
    | 'kategori-kegiatan'
    | 'jenis-aktivitas-mahasiswa'
    | 'kebutuhan-khusus'
    | 'alat-transportasi'
    | 'pekerjaan'
    | 'penghasilan'
    | 'wilayah'
    | 'negara'
    | 'level-wilayah';

/** Alias agar modul lain tidak perlu mengimpor dua tipe referensi. */
export type ReferenceKeyAlias = ReferenceKey;

export interface ReferenceDefinition {
    key: ReferenceKey;
    label: string;
    group: 'institusi' | 'akademik' | 'mahasiswa' | 'dosen' | 'kegiatan' | 'wilayah';
    /** act Neo Feeder untuk menarik referensi ini; string kosong = referensi statis SIAKAD */
    act: string;
    /** nama field identitas pada response Neo Feeder */
    idField: string;
    labelField: string;
    description: string;
    /** true bila referensi ini wajib dipetakan sebelum sinkronisasi (misal jalur masuk, skala nilai) */
    requiredForSync?: boolean;
    /** true bila penarikan referensi membutuhkan id_prodi (mis. skala nilai per prodi) */
    requiresProdi?: boolean;
    /** catatan tambahan untuk operator */
    notes?: string;
}

export interface ReferenceItem {
    id: string;
    code?: string;
    name: string;
    description?: string;
    /** true bila referensi ini dianggap aktif pada PDDikti */
    active: boolean;
    /** apakah referensi ini sudah dipakai oleh data SIAKAD (dihitung backend) */
    usedBySiakad?: number;
    /** pemetaan nilai lokal SIAKAD -> nilai referensi PDDikti, bila ada */
    localValue?: string | null;
    extra?: JsonObject;
}

export interface ReferenceSummary {
    key: ReferenceKey;
    label: string;
    total: number;
    usedBySiakad: number;
    unmappedLocalValues: number;
    lastFetchedAt: string | null;
    act: string;
}
