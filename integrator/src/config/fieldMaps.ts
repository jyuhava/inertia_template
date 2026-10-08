import type { EntityKey } from '@/types/integration';
import type { ReferenceKey } from '@/types/reference';

/**
 * Pasangan field SIAKAD <-> PDDikti untuk kebutuhan comparison.
 *
 * `local`  : nama field pada baris SIAKAD (dikirim backend integrator)
 * `remote` : nama field pada response Web Service Neo Feeder
 * `identity`: true bila field ini menentukan identitas record. Perbedaan pada
 *             field identitas TIDAK pernah ditimpa otomatis (menjadi CONFLICT).
 * `refKey` : bila nilai lokal berupa label (mis. "Islam") dan PDDikti memakai
 *             id referensi (mis. id_agama).
 */
export interface FieldPair {
    local: string;
    remote: string | null;
    label: string;
    identity?: boolean;
    refKey?: ReferenceKey;
    type?: 'string' | 'number' | 'date' | 'boolean' | 'reference';
    /** field ini tidak dibandingkan (hanya dikirim saat insert) */
    noCompare?: boolean;
}

export const fieldMaps: Record<EntityKey, FieldPair[]> = {
    'perguruan-tinggi': [
        { local: 'kodePt', remote: 'kode_perguruan_tinggi', label: 'Kode PT', identity: true },
        { local: 'namaPt', remote: 'nama_perguruan_tinggi', label: 'Nama PT' },
        { local: 'singkatan', remote: 'nama_singkat', label: 'Singkatan' },
        { local: 'alamat', remote: 'jalan', label: 'Alamat' },
        { local: 'telepon', remote: 'telepon', label: 'Telepon' },
        { local: 'email', remote: 'email', label: 'Email' },
        { local: 'website', remote: 'website', label: 'Website' },
        { local: 'npwp', remote: 'npwp', label: 'NPWP' },
    ],

    prodi: [
        { local: 'kodeProdi', remote: 'kode_program_studi', label: 'Kode Program Studi', identity: true },
        { local: 'namaProdi', remote: 'nama_program_studi', label: 'Nama Program Studi' },
        { local: 'jenjang', remote: 'nama_jenjang_pendidikan', label: 'Jenjang' },
        { local: 'fakultas', remote: 'nama_fakultas', label: 'Fakultas' },
    ],

    semester: [
        { local: 'kode', remote: 'id_semester', label: 'Kode Semester', identity: true },
        { local: 'namaSemester', remote: 'nama_semester', label: 'Nama Semester' },
        { local: 'tahunAjaran', remote: 'tahun_ajaran', label: 'Tahun Ajaran' },
        { local: 'tanggalMulai', remote: 'tanggal_mulai', label: 'Tanggal Mulai', type: 'date' },
        { local: 'tanggalSelesai', remote: 'tanggal_selesai', label: 'Tanggal Selesai', type: 'date' },
    ],

    dosen: [
        { local: 'nidn', remote: 'nidn', label: 'NIDN', identity: true },
        { local: 'nidk', remote: 'nidk', label: 'NIDK' },
        { local: 'nuptk', remote: 'nuptk', label: 'NUPTK' },
        { local: 'nama', remote: 'nama_dosen', label: 'Nama Dosen' },
        { local: 'jenisKelamin', remote: 'jenis_kelamin', label: 'Jenis Kelamin' },
        { local: 'tempatLahir', remote: 'tempat_lahir', label: 'Tempat Lahir' },
        { local: 'tanggalLahir', remote: 'tanggal_lahir', label: 'Tanggal Lahir', type: 'date' },
        { local: 'agama', remote: 'id_agama', label: 'Agama', refKey: 'agama', type: 'reference' },
        { local: 'email', remote: 'email', label: 'Email' },
        { local: 'noHp', remote: 'handphone', label: 'No. HP' },
        { local: 'statusKepegawaian', remote: 'nama_status_pegawai', label: 'Status Kepegawaian' },
        { local: 'jabatanAkademik', remote: 'nama_jabatan_akademik', label: 'Jabatan Akademik' },
    ],

    mahasiswa: [
        { local: 'nim', remote: 'nim', label: 'NIM', identity: true },
        { local: 'nama', remote: 'nama_mahasiswa', label: 'Nama Mahasiswa' },
        { local: 'nik', remote: 'nik', label: 'NIK', identity: true },
        { local: 'nisn', remote: 'nisn', label: 'NISN' },
        { local: 'jenisKelamin', remote: 'jenis_kelamin', label: 'Jenis Kelamin' },
        { local: 'tempatLahir', remote: 'tempat_lahir', label: 'Tempat Lahir' },
        { local: 'tanggalLahir', remote: 'tanggal_lahir', label: 'Tanggal Lahir', type: 'date' },
        { local: 'agama', remote: 'id_agama', label: 'Agama', refKey: 'agama', type: 'reference' },
        { local: 'kewarganegaraan', remote: 'kewarganegaraan', label: 'Kewarganegaraan' },
        { local: 'alamat', remote: 'jalan', label: 'Alamat' },
        { local: 'noHp', remote: 'handphone', label: 'No. HP' },
        { local: 'email', remote: 'email', label: 'Email' },
        { local: 'prodiId', remote: 'id_prodi', label: 'Program Studi', refKey: 'program-studi', type: 'reference' },
    ],

    'riwayat-pendidikan': [
        { local: 'nim', remote: 'nim', label: 'NIM', identity: true },
        { local: 'jenisPendaftaran', remote: 'id_jenis_daftar', label: 'Jenis Pendaftaran', refKey: 'jenis-pendaftaran', type: 'reference' },
        { local: 'jalurMasuk', remote: 'id_jalur_daftar', label: 'Jalur Masuk', refKey: 'jalur-masuk', type: 'reference' },
        { local: 'semesterMasuk', remote: 'id_periode_masuk', label: 'Periode Masuk', refKey: 'semester', type: 'reference' },
        { local: 'tanggalMasuk', remote: 'tanggal_daftar', label: 'Tanggal Masuk', type: 'date' },
        { local: 'prodiId', remote: 'id_prodi', label: 'Program Studi', refKey: 'program-studi', type: 'reference' },
        { local: 'pembiayaan', remote: 'id_pembiayaan', label: 'Pembiayaan', refKey: 'pembiayaan', type: 'reference' },
    ],

    kurikulum: [
        { local: 'kode', remote: 'kode_kurikulum', label: 'Kode Kurikulum', identity: true },
        { local: 'nama', remote: 'nama_kurikulum', label: 'Nama Kurikulum' },
        { local: 'prodiId', remote: 'id_prodi', label: 'Program Studi', refKey: 'program-studi', type: 'reference' },
        { local: 'tahunMulai', remote: 'id_semester', label: 'Semester Mulai', refKey: 'semester', type: 'reference' },
        { local: 'totalSks', remote: 'jumlah_sks_wajib', label: 'Total SKS Wajib', type: 'number' },
    ],

    'mata-kuliah': [
        { local: 'kode', remote: 'kode_mata_kuliah', label: 'Kode Mata Kuliah', identity: true },
        { local: 'nama', remote: 'nama_mata_kuliah', label: 'Nama Mata Kuliah' },
        { local: 'sks', remote: 'sks_mata_kuliah', label: 'SKS', type: 'number' },
        { local: 'sksTeori', remote: 'sks_tatap_muka', label: 'SKS Tatap Muka', type: 'number' },
        { local: 'sksPraktik', remote: 'sks_praktek', label: 'SKS Praktik', type: 'number' },
        { local: 'prodiId', remote: 'id_prodi', label: 'Program Studi', refKey: 'program-studi', type: 'reference' },
        { local: 'jenis', remote: 'jenis_mata_kuliah', label: 'Jenis Mata Kuliah' },
    ],

    'mata-kuliah-kurikulum': [
        { local: 'kodeMk', remote: 'kode_mata_kuliah', label: 'Kode Mata Kuliah', identity: true },
        { local: 'namaMk', remote: 'nama_mata_kuliah', label: 'Nama Mata Kuliah' },
        { local: 'sks', remote: 'sks_mata_kuliah', label: 'SKS', type: 'number' },
        { local: 'semester', remote: 'semester', label: 'Semester Penempatan', type: 'number' },
        { local: 'wajib', remote: 'apakah_wajib', label: 'Wajib', type: 'boolean' },
        { local: 'kodeKurikulum', remote: 'kode_kurikulum', label: 'Kurikulum', identity: true },
    ],

    kelas: [
        { local: 'kodeMk', remote: 'kode_mata_kuliah', label: 'Kode Mata Kuliah', identity: true },
        { local: 'namaKelas', remote: 'nama_kelas_kuliah', label: 'Nama Kelas', identity: true },
        { local: 'prodiId', remote: 'id_prodi', label: 'Program Studi', refKey: 'program-studi', type: 'reference' },
        { local: 'semesterId', remote: 'id_semester', label: 'Semester', refKey: 'semester', type: 'reference' },
        { local: 'sks', remote: 'sks_mk', label: 'SKS Mata Kuliah', type: 'number' },
        { local: 'kapasitas', remote: 'kapasitas', label: 'Kapasitas', type: 'number' },
        { local: 'tipeKelas', remote: 'lingkup', label: 'Lingkup Kelas' },
    ],

    'dosen-pengajar': [
        { local: 'kodeKelas', remote: 'nama_kelas_kuliah', label: 'Kelas Kuliah', identity: true },
        { local: 'nim', remote: 'nidn', label: 'NIDN Dosen', identity: true },
        { local: 'nama', remote: 'nama_dosen', label: 'Nama Dosen' },
        { local: 'prodiId', remote: 'id_prodi', label: 'Program Studi', refKey: 'program-studi', type: 'reference' },
        { local: 'semesterId', remote: 'id_semester', label: 'Semester', refKey: 'semester', type: 'reference' },
    ],

    krs: [
        { local: 'nim', remote: 'nim', label: 'NIM', identity: true },
        { local: 'namaMahasiswa', remote: 'nama_mahasiswa', label: 'Nama Mahasiswa' },
        { local: 'kodeKelas', remote: 'nama_kelas_kuliah', label: 'Kelas Kuliah', identity: true },
        { local: 'prodiId', remote: 'id_prodi', label: 'Program Studi', refKey: 'program-studi', type: 'reference' },
        { local: 'semesterId', remote: 'id_semester', label: 'Semester', refKey: 'semester', type: 'reference' },
    ],

    nilai: [
        { local: 'nim', remote: 'nim', label: 'NIM', identity: true },
        { local: 'namaMahasiswa', remote: 'nama_mahasiswa', label: 'Nama Mahasiswa' },
        { local: 'kodeKelas', remote: 'nama_kelas_kuliah', label: 'Kelas Kuliah', identity: true },
        { local: 'nilaiAngka', remote: 'nilai_angka', label: 'Nilai Angka', type: 'number' },
        { local: 'nilaiHuruf', remote: 'nilai_huruf', label: 'Nilai Huruf' },
        { local: 'bobot', remote: 'nilai_indeks', label: 'Nilai Indeks / Bobot', type: 'number' },
    ],

    'aktivitas-mahasiswa': [
        { local: 'judul', remote: 'judul', label: 'Judul Aktivitas', identity: true },
        { local: 'jenisAktivitas', remote: 'id_jenis_aktivitas', label: 'Jenis Aktivitas', refKey: 'jenis-aktivitas-mahasiswa', type: 'reference' },
        { local: 'kategori', remote: 'id_kategori_kegiatan', label: 'Kategori Kegiatan', refKey: 'kategori-kegiatan', type: 'reference' },
        { local: 'semesterNama', remote: 'id_semester', label: 'Semester', refKey: 'semester', type: 'reference' },
        { local: 'tanggalMulai', remote: 'tanggal_mulai', label: 'Tanggal Mulai', type: 'date' },
        { local: 'tanggalSelesai', remote: 'tanggal_selesai', label: 'Tanggal Selesai', type: 'date' },
        { local: 'lokasi', remote: 'lokasi', label: 'Lokasi' },
        { local: 'jumlahAnggota', remote: null, label: 'Jumlah Anggota', noCompare: true, type: 'number' },
    ],

    kelulusan: [
        { local: 'nim', remote: 'nim', label: 'NIM', identity: true },
        { local: 'nama', remote: 'nama_mahasiswa', label: 'Nama Mahasiswa' },
        { local: 'jenisKeluar', remote: 'id_jenis_keluar', label: 'Jenis Keluar', refKey: 'jenis-keluar', type: 'reference' },
        { local: 'tanggalKeluar', remote: 'tanggal_keluar', label: 'Tanggal Keluar', type: 'date' },
        { local: 'ipk', remote: 'ipk', label: 'IPK', type: 'number' },
        { local: 'totalSks', remote: 'total_sks', label: 'Total SKS', type: 'number' },
        { local: 'nomorSk', remote: 'sk_yudisium', label: 'Nomor SK Yudisium' },
    ],
};

export const getFieldMap = (entity: EntityKey): FieldPair[] => fieldMaps[entity] ?? [];

/** Field identitas: perbedaan di sini menjadi CONFLICT dan tidak di-overwrite otomatis. */
export const getIdentityFields = (entity: EntityKey): FieldPair[] =>
    getFieldMap(entity).filter((field) => field.identity === true);
