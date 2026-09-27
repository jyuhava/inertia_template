import type { EntityKey } from '@/types/integration';

/**
 * Peta dependency antar entitas.
 *
 * `localField`   : field pada baris SIAKAD yang menunjuk ke entitas induk
 * `payloadField` : field pada payload Neo Feeder yang menerima id PDDikti induk
 * `required`     : true bila sinkronisasi HARUS diblokir ketika induk belum dipetakan
 */
export interface DependencyField {
    entity: EntityKey;
    label: string;
    localField: string;
    payloadField: string;
    required: boolean;
    /**
     * Untuk dependency yang diidentifikasi oleh kombinasi field
     * (mis. keanggotaan kelas = mahasiswa + kelas), isi dengan daftar field
     * pembentuk kunci. Nilai akan digabung dengan ":" saat resolusi.
     */
    keyFrom?: string[];
}

export const dependencyFields: Record<EntityKey, DependencyField[]> = {
    'perguruan-tinggi': [],
    prodi: [{ entity: 'perguruan-tinggi', label: 'Perguruan Tinggi', localField: 'kodePt', payloadField: 'id_perguruan_tinggi', required: false }],
    semester: [],
    dosen: [{ entity: 'prodi', label: 'Program Studi (homebase)', localField: 'prodiId', payloadField: 'id_prodi', required: false }],
    mahasiswa: [
        { entity: 'prodi', label: 'Program Studi', localField: 'prodiId', payloadField: 'id_prodi', required: true },
        { entity: 'semester', label: 'Semester Masuk', localField: 'semesterMasuk', payloadField: 'id_periode_masuk', required: true },
    ],
    'riwayat-pendidikan': [
        { entity: 'mahasiswa', label: 'Mahasiswa', localField: 'mahasiswaId', payloadField: 'id_mahasiswa', required: true },
        { entity: 'prodi', label: 'Program Studi', localField: 'prodiId', payloadField: 'id_prodi', required: true },
        { entity: 'semester', label: 'Periode Masuk', localField: 'semesterMasuk', payloadField: 'id_periode_masuk', required: true },
    ],
    kurikulum: [{ entity: 'prodi', label: 'Program Studi', localField: 'prodiId', payloadField: 'id_prodi', required: true }],
    'mata-kuliah': [{ entity: 'prodi', label: 'Program Studi', localField: 'prodiId', payloadField: 'id_prodi', required: true }],
    'mata-kuliah-kurikulum': [
        { entity: 'kurikulum', label: 'Kurikulum', localField: 'kurikulumId', payloadField: 'id_kurikulum', required: true },
        { entity: 'mata-kuliah', label: 'Mata Kuliah', localField: 'mataKuliahId', payloadField: 'id_matkul', required: true },
    ],
    kelas: [
        { entity: 'prodi', label: 'Program Studi', localField: 'prodiId', payloadField: 'id_prodi', required: true },
        { entity: 'semester', label: 'Semester', localField: 'semesterId', payloadField: 'id_semester', required: true },
        { entity: 'mata-kuliah', label: 'Mata Kuliah', localField: 'mataKuliahId', payloadField: 'id_matkul', required: true },
    ],
    'dosen-pengajar': [
        { entity: 'kelas', label: 'Kelas Kuliah', localField: 'kelasId', payloadField: 'id_kelas_kuliah', required: true },
        { entity: 'dosen', label: 'Dosen', localField: 'dosenId', payloadField: 'id_registrasi_dosen', required: true },
        { entity: 'semester', label: 'Semester', localField: 'semesterId', payloadField: 'id_semester', required: false },
    ],
    krs: [
        { entity: 'mahasiswa', label: 'Mahasiswa', localField: 'mahasiswaId', payloadField: 'id_registrasi_mahasiswa', required: true },
        { entity: 'kelas', label: 'Kelas Kuliah', localField: 'kelasId', payloadField: 'id_kelas_kuliah', required: true },
    ],
    nilai: [
        { entity: 'mahasiswa', label: 'Mahasiswa', localField: 'mahasiswaId', payloadField: 'id_registrasi_mahasiswa', required: true },
        { entity: 'kelas', label: 'Kelas Kuliah', localField: 'kelasId', payloadField: 'id_kelas_kuliah', required: true },
        {
            entity: 'krs',
            label: 'Keanggotaan Kelas (KRS)',
            localField: 'mahasiswaId',
            payloadField: 'id_peserta_kelas_kuliah',
            required: true,
            keyFrom: ['mahasiswaId', 'kelasId'],
        },
    ],
    'aktivitas-mahasiswa': [
        { entity: 'semester', label: 'Semester', localField: 'semesterNama', payloadField: 'id_semester', required: true },
    ],
    kelulusan: [
        { entity: 'mahasiswa', label: 'Mahasiswa', localField: 'mahasiswaId', payloadField: 'id_registrasi_mahasiswa', required: true },
        { entity: 'semester', label: 'Periode Keluar', localField: 'periodeKeluar', payloadField: 'id_periode_keluar', required: true },
    ],
};

export const getDependencyFields = (entity: EntityKey): DependencyField[] => dependencyFields[entity] ?? [];
