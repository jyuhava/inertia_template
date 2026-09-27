import type { NeoFeederActDefinition, NeoFeederFieldSpec } from '@/types/neofeeder';

/**
 * NeoFeederActRegistry
 * ====================
 *
 * Sumber kebenaran tunggal untuk act Web Service Neo Feeder yang dipakai
 * integrator. Komponen Vue TIDAK boleh menulis nama act secara langsung —
 * selalu ambil dari registry ini (atau dari entityDefinitions.acts).
 *
 * Nama act & parameter (`filter`, `order`, `limit`, `offset`, `record`) mengikuti
 * daftar act Web Service Neo Feeder yang terverifikasi (211 act pada dokumentasi
 * Postman PDDikti Feeder / dictionary Neo Feeder, termasuk GetToken & GetDictionary).
 *
 * Keterbatasan yang HARUS dihormati (hasil verifikasi dokumentasi):
 *  - Tidak ada `InsertBiodataDosen` / `UpdateBiodataDosen`. Biodata dosen hanya
 *    dibaca (`GetListDosen`, `DetailBiodataDosen`); penulisan hanya melalui
 *    `InsertDosenPengajarKelasKuliah` / `UpdateDosenPengajarKelasKuliah`.
 *  - Tidak ada `InsertNilaiPerkuliahanKelas`. Nilai hanya bisa di-update setelah
 *    mahasiswa terdaftar sebagai peserta kelas (`InsertPesertaKelasKuliah`).
 *  - `prodi`, `semester`, dan profil PT tidak dikirim dari SIAKAD.
 *
 * Field pada `recordFields` mengikuti penamaan dictionary Neo Feeder. Untuk act
 * yang belum diverifikasi pada versi terpasang, `schemaSource` diset 'assumed'
 * sehingga UI menampilkan peringatan dan mewajibkan "Sinkronkan Dictionary"
 * (act `GetDictionary`) sebelum pengiriman.
 */

const string = (key: string, label: string, extra: Partial<NeoFeederFieldSpec> = {}): NeoFeederFieldSpec => ({
    key,
    label,
    type: 'string',
    ...extra,
});

const int = (key: string, label: string, extra: Partial<NeoFeederFieldSpec> = {}): NeoFeederFieldSpec => ({
    key,
    label,
    type: 'int',
    ...extra,
});

const decimal = (key: string, label: string, extra: Partial<NeoFeederFieldSpec> = {}): NeoFeederFieldSpec => ({
    key,
    label,
    type: 'decimal',
    ...extra,
});

const date = (key: string, label: string, extra: Partial<NeoFeederFieldSpec> = {}): NeoFeederFieldSpec => ({
    key,
    label,
    type: 'date',
    ...extra,
});

const reference = (
    key: string,
    label: string,
    refKey: NeoFeederFieldSpec['refKey'],
    extra: Partial<NeoFeederFieldSpec> = {},
): NeoFeederFieldSpec => ({
    key,
    label,
    type: 'reference',
    refKey,
    ...extra,
});

const actList: NeoFeederActDefinition[] = [
    // ---------------------------------------------------------------- auth
    {
        act: 'GetToken',
        label: 'Ambil token akses',
        kind: 'auth',
        schemaSource: 'ws-dictionary',
        notes: 'Dikirim oleh BACKEND (username & password tidak pernah melewati frontend).',
    },
    {
        act: 'GetDictionary',
        label: 'Ambil dictionary field',
        kind: 'detail',
        schemaSource: 'ws-dictionary',
        notes: 'Dipakai untuk memverifikasi nama field pada versi Neo Feeder yang terpasang.',
    },

    // ----------------------------------------------------------- referensi
    { act: 'GetProfilPT', label: 'Profil perguruan tinggi', kind: 'reference', entity: 'perguruan-tinggi', supportsFilter: true, schemaSource: 'ws-dictionary' },
    { act: 'GetAllPT', label: 'Semua perguruan tinggi', kind: 'reference', supportsFilter: true, schemaSource: 'ws-dictionary' },
    { act: 'GetProdi', label: 'Program studi', kind: 'reference', entity: 'prodi', supportsFilter: true, schemaSource: 'ws-dictionary' },
    { act: 'GetAllProdi', label: 'Semua program studi', kind: 'reference', entity: 'prodi', supportsFilter: true, schemaSource: 'ws-dictionary' },
    { act: 'GetCountProdi', label: 'Jumlah program studi', kind: 'count', entity: 'prodi', supportsFilter: true, schemaSource: 'ws-dictionary' },
    { act: 'GetFakultas', label: 'Fakultas', kind: 'reference', supportsFilter: true, schemaSource: 'ws-dictionary' },
    { act: 'GetSemester', label: 'Semester', kind: 'reference', entity: 'semester', supportsFilter: true, schemaSource: 'ws-dictionary' },
    { act: 'GetTahunAjaran', label: 'Tahun ajaran', kind: 'reference', supportsFilter: true, schemaSource: 'ws-dictionary' },
    { act: 'GetPeriode', label: 'Periode pelaporan', kind: 'reference', supportsFilter: true, schemaSource: 'ws-dictionary' },
    { act: 'GetPeriodeLampau', label: 'Periode lampau', kind: 'reference', supportsFilter: true, schemaSource: 'ws-dictionary' },
    { act: 'GetAgama', label: 'Agama', kind: 'reference', supportsFilter: true, schemaSource: 'ws-dictionary' },
    { act: 'GetJenjangPendidikan', label: 'Jenjang pendidikan', kind: 'reference', supportsFilter: true, schemaSource: 'ws-dictionary' },
    { act: 'GetBentukPendidikan', label: 'Bentuk pendidikan', kind: 'reference', supportsFilter: true, schemaSource: 'ws-dictionary' },
    { act: 'GetStatusMahasiswa', label: 'Status mahasiswa', kind: 'reference', supportsFilter: true, schemaSource: 'ws-dictionary' },
    { act: 'GetJenisPendaftaran', label: 'Jenis pendaftaran', kind: 'reference', supportsFilter: true, schemaSource: 'ws-dictionary' },
    { act: 'GetJalurMasuk', label: 'Jalur masuk', kind: 'reference', supportsFilter: true, schemaSource: 'ws-dictionary' },
    { act: 'GetJenisKeluar', label: 'Jenis keluar', kind: 'reference', supportsFilter: true, schemaSource: 'ws-dictionary' },
    { act: 'GetJenisTinggal', label: 'Jenis tinggal', kind: 'reference', supportsFilter: true, schemaSource: 'ws-dictionary' },
    { act: 'GetPembiayaan', label: 'Jenis pembiayaan', kind: 'reference', supportsFilter: true, schemaSource: 'ws-dictionary' },
    { act: 'GetKebutuhanKhusus', label: 'Kebutuhan khusus', kind: 'reference', supportsFilter: true, schemaSource: 'ws-dictionary' },
    { act: 'GetAlatTransportasi', label: 'Alat transportasi', kind: 'reference', supportsFilter: true, schemaSource: 'ws-dictionary' },
    { act: 'GetPekerjaan', label: 'Pekerjaan', kind: 'reference', supportsFilter: true, schemaSource: 'ws-dictionary' },
    { act: 'GetPenghasilan', label: 'Penghasilan', kind: 'reference', supportsFilter: true, schemaSource: 'ws-dictionary' },
    { act: 'GetStatusKepegawaian', label: 'Status kepegawaian', kind: 'reference', supportsFilter: true, schemaSource: 'ws-dictionary' },
    { act: 'GetStatusKeaktifanPegawai', label: 'Status keaktifan pegawai', kind: 'reference', supportsFilter: true, schemaSource: 'ws-dictionary' },
    { act: 'GetIkatanKerjaSdm', label: 'Ikatan kerja SDM', kind: 'reference', supportsFilter: true, schemaSource: 'ws-dictionary' },
    { act: 'GetJabfung', label: 'Jabatan fungsional', kind: 'reference', supportsFilter: true, schemaSource: 'ws-dictionary' },
    { act: 'GetPangkatGolongan', label: 'Pangkat golongan', kind: 'reference', supportsFilter: true, schemaSource: 'ws-dictionary' },
    { act: 'GetJenisSertifikasi', label: 'Jenis sertifikasi', kind: 'reference', supportsFilter: true, schemaSource: 'ws-dictionary' },
    { act: 'GetKategoriKegiatan', label: 'Kategori kegiatan', kind: 'reference', supportsFilter: true, schemaSource: 'ws-dictionary' },
    { act: 'GetJenisAktivitasMahasiswa', label: 'Jenis aktivitas mahasiswa', kind: 'reference', supportsFilter: true, schemaSource: 'ws-dictionary' },
    { act: 'GetJenisEvaluasi', label: 'Jenis evaluasi', kind: 'reference', supportsFilter: true, schemaSource: 'ws-dictionary' },
    { act: 'GetWilayah', label: 'Wilayah', kind: 'reference', supportsFilter: true, schemaSource: 'ws-dictionary' },
    { act: 'GetNegara', label: 'Negara', kind: 'reference', supportsFilter: true, schemaSource: 'ws-dictionary' },
    { act: 'GetLevelWilayah', label: 'Level wilayah', kind: 'reference', supportsFilter: true, schemaSource: 'ws-dictionary' },
    { act: 'GetLembagaPengangkat', label: 'Lembaga pengangkat', kind: 'reference', supportsFilter: true, schemaSource: 'ws-dictionary' },
    { act: 'GetTingkatPrestasi', label: 'Tingkat prestasi', kind: 'reference', supportsFilter: true, schemaSource: 'ws-dictionary' },
    { act: 'GetListSkalaNilaiProdi', label: 'Skala nilai prodi', kind: 'reference', supportsFilter: true, schemaSource: 'ws-dictionary' },

    // ----------------------------------------------------------- mahasiswa
    {
        act: 'GetListMahasiswa',
        label: 'Daftar mahasiswa',
        kind: 'list',
        entity: 'mahasiswa',
        counterpart: 'GetBiodataMahasiswa',
        supportsFilter: true,
        supportsOrder: true,
        supportsPaging: true,
        responseIdField: 'id_mahasiswa',
        schemaSource: 'ws-dictionary',
    },
    {
        act: 'GetBiodataMahasiswa',
        label: 'Biodata mahasiswa',
        kind: 'detail',
        entity: 'mahasiswa',
        supportsFilter: true,
        responseIdField: 'id_mahasiswa',
        schemaSource: 'ws-dictionary',
    },
    {
        act: 'GetCountMahasiswa',
        label: 'Jumlah mahasiswa',
        kind: 'count',
        entity: 'mahasiswa',
        supportsFilter: true,
        schemaSource: 'ws-dictionary',
    },
    {
        act: 'GetDataLengkapMahasiswaProdi',
        label: 'Data lengkap mahasiswa per prodi',
        kind: 'report',
        entity: 'mahasiswa',
        supportsFilter: true,
        schemaSource: 'ws-dictionary',
    },
    {
        act: 'InsertBiodataMahasiswa',
        label: 'Tambah biodata mahasiswa',
        kind: 'insert',
        entity: 'mahasiswa',
        requiresRecord: true,
        responseIdField: 'id_mahasiswa',
        schemaSource: 'ws-dictionary',
        recordFields: [
            string('nama_mahasiswa', 'Nama Mahasiswa', { required: true, localField: 'nama', maxLength: 100 }),
            string('jenis_kelamin', 'Jenis Kelamin', { required: true, localField: 'jenisKelamin' }),
            string('tempat_lahir', 'Tempat Lahir', { localField: 'tempatLahir' }),
            date('tanggal_lahir', 'Tanggal Lahir', { localField: 'tanggalLahir' }),
            reference('id_agama', 'Agama', 'agama', { localField: 'agama' }),
            string('nik', 'NIK', { localField: 'nik', maxLength: 16, notes: 'Wajib pada sebagian versi; ikuti kebijakan integrasi PT.' }),
            string('nisn', 'NISN', { localField: 'nisn' }),
            string('npwp', 'NPWP', { localField: 'npwp' }),
            string('kewarganegaraan', 'Kewarganegaraan', { localField: 'kewarganegaraan' }),
            string('jalan', 'Alamat', { localField: 'alamat' }),
            string('telepon', 'Telepon', { localField: 'noHp' }),
            string('handphone', 'Handphone', { localField: 'noHp', required: true, notes: 'Wajib sejak Neo Feeder 3.0.' }),
            string('email', 'Email', { localField: 'email' }),
            string('penerima_kps', 'Penerima KPS', { localField: 'penerimaKps' }),
            string('nomor_kps', 'Nomor KPS', { localField: 'nomorKps' }),
        ],
    },
    {
        act: 'UpdateBiodataMahasiswa',
        label: 'Perbarui biodata mahasiswa',
        kind: 'update',
        entity: 'mahasiswa',
        requiresRecord: true,
        responseIdField: 'id_mahasiswa',
        schemaSource: 'ws-dictionary',
        recordFields: [
            string('id_mahasiswa', 'ID Mahasiswa PDDikti', { required: true }),
            string('nama_mahasiswa', 'Nama Mahasiswa', { required: true, localField: 'nama', maxLength: 100 }),
            string('jenis_kelamin', 'Jenis Kelamin', { required: true, localField: 'jenisKelamin' }),
            string('tempat_lahir', 'Tempat Lahir', { localField: 'tempatLahir' }),
            date('tanggal_lahir', 'Tanggal Lahir', { localField: 'tanggalLahir' }),
            reference('id_agama', 'Agama', 'agama', { localField: 'agama' }),
            string('nik', 'NIK', { localField: 'nik', maxLength: 16 }),
            string('kewarganegaraan', 'Kewarganegaraan', { localField: 'kewarganegaraan' }),
            string('jalan', 'Alamat', { localField: 'alamat' }),
            string('handphone', 'Handphone', { required: true, localField: 'noHp' }),
            string('email', 'Email', { localField: 'email' }),
        ],
    },

    // -------------------------------------------------- riwayat pendidikan
    {
        act: 'GetListRiwayatPendidikanMahasiswa',
        label: 'Daftar riwayat pendidikan',
        kind: 'list',
        entity: 'riwayat-pendidikan',
        supportsFilter: true,
        supportsOrder: true,
        supportsPaging: true,
        responseIdField: 'id_registrasi_mahasiswa',
        schemaSource: 'ws-dictionary',
    },
    {
        act: 'GetCountRiwayatPendidikanMahasiswa',
        label: 'Jumlah riwayat pendidikan',
        kind: 'count',
        entity: 'riwayat-pendidikan',
        supportsFilter: true,
        schemaSource: 'ws-dictionary',
    },
    {
        act: 'InsertRiwayatPendidikanMahasiswa',
        label: 'Tambah riwayat pendidikan',
        kind: 'insert',
        entity: 'riwayat-pendidikan',
        requiresRecord: true,
        schemaSource: 'ws-dictionary',
        recordFields: [
            string('id_mahasiswa', 'ID Mahasiswa PDDikti', { required: true }),
            reference('id_jenis_daftar', 'Jenis Pendaftaran', 'jenis-pendaftaran', { required: true, localField: 'jenisPendaftaran' }),
            reference('id_jalur_daftar', 'Jalur Masuk', 'jalur-masuk', { localField: 'jalurMasuk' }),
            reference('id_periode_masuk', 'Periode Masuk', 'semester', { required: true, localField: 'semesterMasuk' }),
            date('tanggal_daftar', 'Tanggal Daftar', { localField: 'tanggalMasuk' }),
            reference('id_prodi', 'Program Studi', 'program-studi', { required: true, localField: 'prodiId' }),
            reference('id_pembiayaan', 'Pembiayaan', 'pembiayaan', { localField: 'pembiayaan' }),
            int('biaya_masuk', 'Biaya Masuk', { localField: 'biayaMasuk' }),
        ],
    },
    {
        act: 'UpdateRiwayatPendidikanMahasiswa',
        label: 'Perbarui riwayat pendidikan',
        kind: 'update',
        entity: 'riwayat-pendidikan',
        requiresRecord: true,
        schemaSource: 'ws-dictionary',
        recordFields: [
            string('id_registrasi_mahasiswa', 'ID Registrasi Mahasiswa', { required: true }),
            reference('id_jenis_daftar', 'Jenis Pendaftaran', 'jenis-pendaftaran', { required: true, localField: 'jenisPendaftaran' }),
            reference('id_jalur_daftar', 'Jalur Masuk', 'jalur-masuk', { localField: 'jalurMasuk' }),
            reference('id_periode_masuk', 'Periode Masuk', 'semester', { required: true, localField: 'semesterMasuk' }),
            reference('id_prodi', 'Program Studi', 'program-studi', { required: true, localField: 'prodiId' }),
            reference('id_pembiayaan', 'Pembiayaan', 'pembiayaan', { localField: 'pembiayaan' }),
        ],
    },

    // -------------------------------------------------------- mata kuliah
    {
        act: 'GetListMataKuliah',
        label: 'Daftar mata kuliah',
        kind: 'list',
        entity: 'mata-kuliah',
        counterpart: 'GetDetailMataKuliah',
        supportsFilter: true,
        supportsPaging: true,
        responseIdField: 'id_matkul',
        schemaSource: 'ws-dictionary',
    },
    {
        act: 'GetDetailMataKuliah',
        label: 'Detail mata kuliah',
        kind: 'detail',
        entity: 'mata-kuliah',
        supportsFilter: true,
        responseIdField: 'id_matkul',
        schemaSource: 'ws-dictionary',
    },
    {
        act: 'GetCountMataKuliah',
        label: 'Jumlah mata kuliah',
        kind: 'count',
        entity: 'mata-kuliah',
        supportsFilter: true,
        schemaSource: 'ws-dictionary',
    },
    {
        act: 'InsertMataKuliah',
        label: 'Tambah mata kuliah',
        kind: 'insert',
        entity: 'mata-kuliah',
        requiresRecord: true,
        responseIdField: 'id_matkul',
        schemaSource: 'ws-dictionary',
        recordFields: [
            reference('id_prodi', 'Program Studi', 'program-studi', { required: true, localField: 'prodiId' }),
            string('kode_mata_kuliah', 'Kode Mata Kuliah', { required: true, localField: 'kode', maxLength: 20 }),
            string('nama_mata_kuliah', 'Nama Mata Kuliah', { required: true, localField: 'nama', maxLength: 100 }),
            decimal('sks_mata_kuliah', 'SKS Mata Kuliah', { required: true, localField: 'sks' }),
            decimal('sks_tatap_muka', 'SKS Tatap Muka', { localField: 'sksTeori' }),
            decimal('sks_praktek', 'SKS Praktik', { localField: 'sksPraktik' }),
            decimal('sks_praktek_lapangan', 'SKS Praktik Lapangan', { localField: 'sksPraktikLapangan' }),
            decimal('sks_simulasi', 'SKS Simulasi', { localField: 'sksSimulasi' }),
            string('jenis_mata_kuliah', 'Jenis Mata Kuliah', { localField: 'jenis' }),
        ],
    },
    {
        act: 'UpdateMataKuliah',
        label: 'Perbarui mata kuliah',
        kind: 'update',
        entity: 'mata-kuliah',
        requiresRecord: true,
        responseIdField: 'id_matkul',
        schemaSource: 'ws-dictionary',
        recordFields: [
            string('id_matkul', 'ID Mata Kuliah PDDikti', { required: true }),
            string('kode_mata_kuliah', 'Kode Mata Kuliah', { required: true, localField: 'kode' }),
            string('nama_mata_kuliah', 'Nama Mata Kuliah', { required: true, localField: 'nama' }),
            decimal('sks_mata_kuliah', 'SKS Mata Kuliah', { required: true, localField: 'sks' }),
            string('jenis_mata_kuliah', 'Jenis Mata Kuliah', { localField: 'jenis' }),
        ],
    },

    // ----------------------------------------------------------- kurikulum
    {
        act: 'GetListKurikulum',
        label: 'Daftar kurikulum',
        kind: 'list',
        entity: 'kurikulum',
        counterpart: 'GetDetailKurikulum',
        supportsFilter: true,
        supportsPaging: true,
        responseIdField: 'id_kurikulum',
        schemaSource: 'ws-dictionary',
    },
    {
        act: 'GetDetailKurikulum',
        label: 'Detail kurikulum',
        kind: 'detail',
        entity: 'kurikulum',
        supportsFilter: true,
        responseIdField: 'id_kurikulum',
        schemaSource: 'ws-dictionary',
    },
    {
        act: 'GetCountKurikulum',
        label: 'Jumlah kurikulum',
        kind: 'count',
        entity: 'kurikulum',
        supportsFilter: true,
        schemaSource: 'ws-dictionary',
    },
    {
        act: 'InsertKurikulum',
        label: 'Tambah kurikulum',
        kind: 'insert',
        entity: 'kurikulum',
        requiresRecord: true,
        responseIdField: 'id_kurikulum',
        schemaSource: 'assumed',
        notes: 'Field record perlu diverifikasi melalui GetDictionary pada versi Neo Feeder terpasang.',
        recordFields: [
            reference('id_prodi', 'Program Studi', 'program-studi', { required: true, localField: 'prodiId' }),
            string('kode_kurikulum', 'Kode Kurikulum', { required: true, localField: 'kode' }),
            string('nama_kurikulum', 'Nama Kurikulum', { required: true, localField: 'nama' }),
            reference('id_semester', 'Semester Mulai', 'semester', { localField: 'tahunMulai' }),
            decimal('jumlah_sks_wajib', 'Jumlah SKS Wajib', { localField: 'totalSks' }),
            decimal('jumlah_sks_pilihan', 'Jumlah SKS Pilihan', { localField: 'totalSksPilihan' }),
        ],
    },
    {
        act: 'UpdateKurikulum',
        label: 'Perbarui kurikulum',
        kind: 'update',
        entity: 'kurikulum',
        requiresRecord: true,
        responseIdField: 'id_kurikulum',
        schemaSource: 'assumed',
        notes: 'Field record perlu diverifikasi melalui GetDictionary pada versi Neo Feeder terpasang.',
        recordFields: [
            string('id_kurikulum', 'ID Kurikulum PDDikti', { required: true }),
            string('nama_kurikulum', 'Nama Kurikulum', { required: true, localField: 'nama' }),
            reference('id_semester', 'Semester Mulai', 'semester', { localField: 'tahunMulai' }),
            decimal('jumlah_sks_wajib', 'Jumlah SKS Wajib', { localField: 'totalSks' }),
        ],
    },

    // ------------------------------------------------- mata kuliah kurikulum
    {
        act: 'GetMatkulKurikulum',
        label: 'Mata kuliah per kurikulum',
        kind: 'list',
        entity: 'mata-kuliah-kurikulum',
        supportsFilter: true,
        supportsPaging: true,
        schemaSource: 'ws-dictionary',
    },
    {
        act: 'GetCountMatkulKurikulum',
        label: 'Jumlah mata kuliah kurikulum',
        kind: 'count',
        entity: 'mata-kuliah-kurikulum',
        supportsFilter: true,
        schemaSource: 'ws-dictionary',
    },
    {
        act: 'InsertMatkulKurikulum',
        label: 'Tambah mata kuliah kurikulum',
        kind: 'insert',
        entity: 'mata-kuliah-kurikulum',
        requiresRecord: true,
        schemaSource: 'assumed',
        notes: 'Field record mengikuti dictionary; verifikasi melalui GetDictionary sebelum pengiriman massal.',
        recordFields: [
            string('id_kurikulum', 'ID Kurikulum PDDikti', { required: true }),
            string('id_matkul', 'ID Mata Kuliah PDDikti', { required: true }),
            int('semester', 'Semester Penempatan', { required: true, localField: 'semester' }),
            string('apakah_wajib', 'Wajib', { localField: 'wajib' }),
        ],
    },
    {
        act: 'UpdateMatkulKurikulum',
        label: 'Perbarui mata kuliah kurikulum',
        kind: 'update',
        entity: 'mata-kuliah-kurikulum',
        requiresRecord: true,
        schemaSource: 'assumed',
        recordFields: [
            string('id_matkul_kurikulum', 'ID Matkul Kurikulum', { required: true }),
            int('semester', 'Semester Penempatan', { localField: 'semester' }),
            string('apakah_wajib', 'Wajib', { localField: 'wajib' }),
        ],
    },

    // -------------------------------------------------------------- kelas
    {
        act: 'GetListKelasKuliah',
        label: 'Daftar kelas kuliah',
        kind: 'list',
        entity: 'kelas',
        counterpart: 'GetDetailKelasKuliah',
        supportsFilter: true,
        supportsPaging: true,
        responseIdField: 'id_kelas_kuliah',
        schemaSource: 'ws-dictionary',
    },
    {
        act: 'GetDetailKelasKuliah',
        label: 'Detail kelas kuliah',
        kind: 'detail',
        entity: 'kelas',
        supportsFilter: true,
        responseIdField: 'id_kelas_kuliah',
        schemaSource: 'ws-dictionary',
    },
    {
        act: 'GetCountKelasKuliah',
        label: 'Jumlah kelas kuliah',
        kind: 'count',
        entity: 'kelas',
        supportsFilter: true,
        schemaSource: 'ws-dictionary',
    },
    {
        act: 'InsertKelasKuliah',
        label: 'Tambah kelas kuliah',
        kind: 'insert',
        entity: 'kelas',
        requiresRecord: true,
        responseIdField: 'id_kelas_kuliah',
        schemaSource: 'ws-dictionary',
        recordFields: [
            reference('id_prodi', 'Program Studi', 'program-studi', { required: true, localField: 'prodiId' }),
            reference('id_semester', 'Semester', 'semester', { required: true, localField: 'semesterId' }),
            string('nama_kelas_kuliah', 'Nama Kelas', { required: true, localField: 'namaKelas' }),
            string('id_matkul', 'ID Mata Kuliah PDDikti', { required: true }),
            decimal('sks_mk', 'SKS Mata Kuliah', { required: true, localField: 'sks' }),
            decimal('sks_tm', 'SKS Tatap Muka', { localField: 'sksTeori' }),
            decimal('sks_prak', 'SKS Praktik', { localField: 'sksPraktik' }),
            decimal('sks_prak_lap', 'SKS Praktik Lapangan', { localField: 'sksPraktikLapangan' }),
            decimal('sks_sim', 'SKS Simulasi', { localField: 'sksSimulasi' }),
            string('lingkup', 'Lingkup', { localField: 'tipeKelas' }),
            string('mode', 'Mode Perkuliahan', { localField: 'mode' }),
            int('kapasitas', 'Kapasitas', { localField: 'kapasitas' }),
        ],
    },
    {
        act: 'UpdateKelasKuliah',
        label: 'Perbarui kelas kuliah',
        kind: 'update',
        entity: 'kelas',
        requiresRecord: true,
        responseIdField: 'id_kelas_kuliah',
        schemaSource: 'ws-dictionary',
        recordFields: [
            string('id_kelas_kuliah', 'ID Kelas Kuliah PDDikti', { required: true }),
            string('nama_kelas_kuliah', 'Nama Kelas', { required: true, localField: 'namaKelas' }),
            decimal('sks_mk', 'SKS Mata Kuliah', { localField: 'sks' }),
            int('kapasitas', 'Kapasitas', { localField: 'kapasitas' }),
            string('mode', 'Mode Perkuliahan', { localField: 'mode' }),
        ],
    },

    // ----------------------------------------------------- penugasan dosen
    {
        act: 'GetDosenPengajarKelasKuliah',
        label: 'Dosen pengajar kelas',
        kind: 'list',
        entity: 'dosen-pengajar',
        supportsFilter: true,
        supportsPaging: true,
        schemaSource: 'ws-dictionary',
    },
    {
        act: 'GetCountDosenPengajarKelasKuliah',
        label: 'Jumlah dosen pengajar',
        kind: 'count',
        entity: 'dosen-pengajar',
        supportsFilter: true,
        schemaSource: 'ws-dictionary',
    },
    {
        act: 'InsertDosenPengajarKelasKuliah',
        label: 'Tambah penugasan dosen',
        kind: 'insert',
        entity: 'dosen-pengajar',
        requiresRecord: true,
        schemaSource: 'ws-dictionary',
        recordFields: [
            string('id_registrasi_dosen', 'ID Registrasi Dosen', { required: true }),
            string('id_kelas_kuliah', 'ID Kelas Kuliah PDDikti', { required: true }),
            reference('id_prodi', 'Program Studi', 'program-studi', { localField: 'prodiId' }),
            reference('id_semester', 'Semester', 'semester', { localField: 'semesterId' }),
        ],
    },
    {
        act: 'UpdateDosenPengajarKelasKuliah',
        label: 'Perbarui penugasan dosen',
        kind: 'update',
        entity: 'dosen-pengajar',
        requiresRecord: true,
        schemaSource: 'ws-dictionary',
        recordFields: [
            string('id_aktivitas_mengajar', 'ID Aktivitas Mengajar', { required: true }),
            string('id_registrasi_dosen', 'ID Registrasi Dosen', { required: true }),
            string('id_kelas_kuliah', 'ID Kelas Kuliah PDDikti', { required: true }),
        ],
    },

    // --------------------------------------------------------------- KRS
    {
        act: 'GetPesertaKelasKuliah',
        label: 'Peserta kelas kuliah',
        kind: 'list',
        entity: 'krs',
        supportsFilter: true,
        supportsPaging: true,
        schemaSource: 'ws-dictionary',
    },
    {
        act: 'GetCountPesertaKelasKuliah',
        label: 'Jumlah peserta kelas',
        kind: 'count',
        entity: 'krs',
        supportsFilter: true,
        schemaSource: 'ws-dictionary',
    },
    {
        act: 'InsertPesertaKelasKuliah',
        label: 'Tambah peserta kelas',
        kind: 'insert',
        entity: 'krs',
        requiresRecord: true,
        schemaSource: 'ws-dictionary',
        recordFields: [
            string('id_registrasi_mahasiswa', 'ID Registrasi Mahasiswa', { required: true }),
            string('id_kelas_kuliah', 'ID Kelas Kuliah PDDikti', { required: true }),
        ],
    },

    // -------------------------------------------------------------- nilai
    {
        act: 'GetListNilaiPerkuliahanKelas',
        label: 'Daftar nilai perkuliahan',
        kind: 'list',
        entity: 'nilai',
        supportsFilter: true,
        supportsPaging: true,
        schemaSource: 'ws-dictionary',
    },
    {
        act: 'GetDetailNilaiPerkuliahanKelas',
        label: 'Detail nilai perkuliahan',
        kind: 'detail',
        entity: 'nilai',
        supportsFilter: true,
        schemaSource: 'ws-dictionary',
    },
    {
        act: 'GetCountNilaiPerkuliahanKelas',
        label: 'Jumlah nilai perkuliahan',
        kind: 'count',
        entity: 'nilai',
        supportsFilter: true,
        schemaSource: 'ws-dictionary',
    },
    {
        act: 'GetRiwayatNilaiMahasiswa',
        label: 'Riwayat nilai mahasiswa',
        kind: 'list',
        entity: 'nilai',
        supportsFilter: true,
        schemaSource: 'ws-dictionary',
    },
    {
        act: 'UpdateNilaiPerkuliahanKelas',
        label: 'Perbarui nilai perkuliahan',
        kind: 'update',
        entity: 'nilai',
        requiresRecord: true,
        schemaSource: 'ws-dictionary',
        notes: 'Tidak ada act Insert untuk nilai — nilai lahir otomatis saat peserta kelas dibuat.',
        recordFields: [
            string('id_registrasi_mahasiswa', 'ID Registrasi Mahasiswa', { required: true }),
            string('id_kelas_kuliah', 'ID Kelas Kuliah PDDikti', { required: true }),
            decimal('nilai_angka', 'Nilai Angka', { localField: 'nilaiAngka' }),
            string('nilai_huruf', 'Nilai Huruf', { localField: 'nilaiHuruf' }),
            decimal('nilai_indeks', 'Nilai Indeks', { localField: 'bobot' }),
        ],
    },

    // ---------------------------------------------------- aktivitas mhs
    {
        act: 'GetListAktivitasMahasiswa',
        label: 'Daftar aktivitas mahasiswa',
        kind: 'list',
        entity: 'aktivitas-mahasiswa',
        supportsFilter: true,
        supportsPaging: true,
        responseIdField: 'id_aktivitas',
        schemaSource: 'ws-dictionary',
    },
    {
        act: 'GetCountAktivitasMahasiswa',
        label: 'Jumlah aktivitas mahasiswa',
        kind: 'count',
        entity: 'aktivitas-mahasiswa',
        supportsFilter: true,
        schemaSource: 'ws-dictionary',
    },
    {
        act: 'GetListAnggotaAktivitasMahasiswa',
        label: 'Anggota aktivitas mahasiswa',
        kind: 'list',
        entity: 'aktivitas-mahasiswa',
        supportsFilter: true,
        schemaSource: 'ws-dictionary',
    },
    {
        act: 'InsertAktivitasMahasiswa',
        label: 'Tambah aktivitas mahasiswa',
        kind: 'insert',
        entity: 'aktivitas-mahasiswa',
        requiresRecord: true,
        responseIdField: 'id_aktivitas',
        schemaSource: 'assumed',
        notes: 'Verifikasi field melalui GetDictionary; sebagian versi memakai id_kategori_kegiatan wajib.',
        recordFields: [
            string('judul', 'Judul Aktivitas', { required: true, localField: 'judul', maxLength: 200 }),
            reference('id_jenis_aktivitas', 'Jenis Aktivitas', 'jenis-aktivitas-mahasiswa', { required: true, localField: 'jenisAktivitas' }),
            reference('id_kategori_kegiatan', 'Kategori Kegiatan', 'kategori-kegiatan', { required: true, localField: 'kategori' }),
            reference('id_semester', 'Semester', 'semester', { required: true, localField: 'semesterNama' }),
            date('tanggal_mulai', 'Tanggal Mulai', { localField: 'tanggalMulai' }),
            date('tanggal_selesai', 'Tanggal Selesai', { localField: 'tanggalSelesai' }),
            string('lokasi', 'Lokasi', { localField: 'lokasi' }),
            string('sk_tugas', 'SK Tugas', { localField: 'skTugas' }),
        ],
    },
    {
        act: 'UpdateAktivitasMahasiswa',
        label: 'Perbarui aktivitas mahasiswa',
        kind: 'update',
        entity: 'aktivitas-mahasiswa',
        requiresRecord: true,
        responseIdField: 'id_aktivitas',
        schemaSource: 'assumed',
        recordFields: [
            string('id_aktivitas', 'ID Aktivitas PDDikti', { required: true }),
            string('judul', 'Judul Aktivitas', { required: true, localField: 'judul' }),
            date('tanggal_mulai', 'Tanggal Mulai', { localField: 'tanggalMulai' }),
            date('tanggal_selesai', 'Tanggal Selesai', { localField: 'tanggalSelesai' }),
            string('lokasi', 'Lokasi', { localField: 'lokasi' }),
        ],
    },
    {
        act: 'InsertAnggotaAktivitasMahasiswa',
        label: 'Tambah anggota aktivitas',
        kind: 'insert',
        entity: 'aktivitas-mahasiswa',
        requiresRecord: true,
        schemaSource: 'assumed',
        recordFields: [
            string('id_aktivitas', 'ID Aktivitas PDDikti', { required: true }),
            string('id_registrasi_mahasiswa', 'ID Registrasi Mahasiswa', { required: true }),
        ],
    },

    // ------------------------------------------------------------ kelulusan
    {
        act: 'GetListMahasiswaLulusDO',
        label: 'Daftar mahasiswa lulus / DO',
        kind: 'list',
        entity: 'kelulusan',
        supportsFilter: true,
        supportsPaging: true,
        schemaSource: 'ws-dictionary',
    },
    {
        act: 'GetDetailMahasiswaLulusDO',
        label: 'Detail mahasiswa lulus / DO',
        kind: 'detail',
        entity: 'kelulusan',
        supportsFilter: true,
        schemaSource: 'ws-dictionary',
    },
    {
        act: 'GetCountMahasiswaLulusDO',
        label: 'Jumlah mahasiswa lulus / DO',
        kind: 'count',
        entity: 'kelulusan',
        supportsFilter: true,
        schemaSource: 'ws-dictionary',
    },
    {
        act: 'InsertMahasiswaLulusDO',
        label: 'Tambah status keluar',
        kind: 'insert',
        entity: 'kelulusan',
        requiresRecord: true,
        schemaSource: 'ws-dictionary',
        recordFields: [
            string('id_registrasi_mahasiswa', 'ID Registrasi Mahasiswa', { required: true }),
            reference('id_jenis_keluar', 'Jenis Keluar', 'jenis-keluar', { required: true, localField: 'jenisKeluar' }),
            date('tanggal_keluar', 'Tanggal Keluar', { required: true, localField: 'tanggalKeluar' }),
            reference('id_periode_keluar', 'Periode Keluar', 'semester', { localField: 'periodeKeluar' }),
            decimal('ipk', 'IPK', { localField: 'ipk' }),
            decimal('total_sks', 'Total SKS', { localField: 'totalSks' }),
            string('sk_yudisium', 'Nomor SK Yudisium', { localField: 'nomorSk' }),
            string('tanggal_sk', 'Tanggal SK', { localField: 'tanggalSk' }),
            string('nomor_ijazah', 'Nomor Ijazah', { localField: 'nomorIjazah' }),
        ],
    },
    {
        act: 'UpdateMahasiswaLulusDO',
        label: 'Perbarui status keluar',
        kind: 'update',
        entity: 'kelulusan',
        requiresRecord: true,
        schemaSource: 'ws-dictionary',
        recordFields: [
            string('id_registrasi_mahasiswa', 'ID Registrasi Mahasiswa', { required: true }),
            reference('id_jenis_keluar', 'Jenis Keluar', 'jenis-keluar', { required: true, localField: 'jenisKeluar' }),
            date('tanggal_keluar', 'Tanggal Keluar', { localField: 'tanggalKeluar' }),
            decimal('ipk', 'IPK', { localField: 'ipk' }),
            decimal('total_sks', 'Total SKS', { localField: 'totalSks' }),
        ],
    },
];

export const neoFeederActs: Record<string, NeoFeederActDefinition> = actList.reduce<Record<string, NeoFeederActDefinition>>(
    (registry, definition) => {
        registry[definition.act] = definition;
        return registry;
    },
    {},
);

export const getActDefinition = (act: string): NeoFeederActDefinition | null => neoFeederActs[act] ?? null;

export const getActsForEntity = (entity: string): NeoFeederActDefinition[] =>
    actList.filter((definition) => definition.entity === entity);

export const getActFields = (act: string): NeoFeederFieldSpec[] => neoFeederActs[act]?.recordFields ?? [];

/** true bila act masih memakai daftar field yang belum diverifikasi versi terpasang. */
export const isActSchemaAssumed = (act: string): boolean => neoFeederActs[act]?.schemaSource === 'assumed';

export const actCount = actList.length;
