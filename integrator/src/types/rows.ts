import type { IntegrationMeta, SiakadProdi, SiakadSemester, SiakadPerguruanTinggi } from './siakad';
import type { EntityKey } from './integration';

/** Baris SIAKAD per entitas (lengkap dengan metadata integrasi) untuk tabel generik. */

export interface SiakadProdiRow extends SiakadProdi, IntegrationMeta {}
export interface SiakadSemesterRow extends SiakadSemester, IntegrationMeta {}
export interface SiakadPerguruanTinggiRow extends SiakadPerguruanTinggi, IntegrationMeta {}

export interface SiakadRiwayatRow extends IntegrationMeta {
    id: number;
    mahasiswaId: number;
    nim: string;
    nama: string;
    prodiId: number;
    prodiNama: string;
    semesterId: number | null;
    jenisPendaftaran: string | null;
    jalurMasuk: string | null;
    semesterMasuk: string | null;
    pembiayaan: string | null;
    biayaMasuk: number | null;
    tanggalMasuk: string | null;
}

export interface SiakadMkKurikulumRow extends IntegrationMeta {
    id: number;
    kurikulumId: number;
    kodeKurikulum: string;
    prodiId: number;
    prodiNama: string;
    mataKuliahId: number;
    kodeMk: string;
    namaMk: string;
    sks: number;
    semester: number;
    wajib: boolean;
}

export interface SiakadDosenPengajarRow extends IntegrationMeta {
    id: number;
    kelasId: number;
    kodeKelas: string;
    namaKelas: string;
    dosenId: number;
    nim: string;
    nama: string;
    prodiId: number;
    prodiNama: string;
    semesterId: number;
    periodeNama: string;
    peran: string;
}

/** Pemetaan entitas -> tipe baris, agar EntityList/EntityDetail tetap type-safe. */
export interface RowMap {
    'perguruan-tinggi': SiakadPerguruanTinggiRow;
    prodi: SiakadProdiRow;
    semester: SiakadSemesterRow;
    dosen: import('./siakad').SiakadDosenRow;
    mahasiswa: import('./siakad').SiakadMahasiswaRow;
    'riwayat-pendidikan': SiakadRiwayatRow;
    kurikulum: import('./siakad').SiakadKurikulumRow;
    'mata-kuliah': import('./siakad').SiakadMataKuliahRow;
    'mata-kuliah-kurikulum': SiakadMkKurikulumRow;
    kelas: import('./siakad').SiakadKelasRow;
    'dosen-pengajar': SiakadDosenPengajarRow;
    krs: import('./siakad').SiakadKrsRow;
    nilai: import('./siakad').SiakadNilaiRow;
    'aktivitas-mahasiswa': import('./siakad').SiakadAktivitasRow;
    kelulusan: import('./siakad').SiakadKelulusanRow;
}

export type EntityRow<K extends EntityKey = EntityKey> = RowMap[K];

/** Akses generik untuk kebutuhan tabel (kolom diakses berdasarkan key config). */
export const rowValue = (row: unknown, key: string): unknown => {
    if (row === null || typeof row !== 'object') return undefined;
    return (row as Record<string, unknown>)[key];
};

export const rowString = (row: unknown, key: string): string => {
    const value = rowValue(row, key);
    if (value === null || value === undefined) return '';
    if (Array.isArray(value)) return value.join(', ');
    return String(value);
};
