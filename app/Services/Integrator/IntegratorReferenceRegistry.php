<?php

namespace App\Services\Integrator;

class IntegratorReferenceRegistry
{
    /** @return array<string,array{key:string,label:string,group:string,act:string,idField:string,labelField:string,description:string,requiredForSync?:bool,requiresProdi?:bool,notes?:string}> */
    public static function definitions(): array
    {
        return [
            'perguruan-tinggi' => ['key' => 'perguruan-tinggi', 'label' => 'Perguruan Tinggi', 'group' => 'institusi', 'act' => 'GetProfilPT', 'idField' => 'id_perguruan_tinggi', 'labelField' => 'nama_perguruan_tinggi', 'description' => 'Profil perguruan tinggi terdaftar di PDDikti.', 'requiredForSync' => true],
            'fakultas' => ['key' => 'fakultas', 'label' => 'Fakultas', 'group' => 'institusi', 'act' => 'GetFakultas', 'idField' => 'id_fakultas', 'labelField' => 'nama_fakultas', 'description' => 'Daftar fakultas pada PDDikti.'],
            'program-studi' => ['key' => 'program-studi', 'label' => 'Program Studi', 'group' => 'institusi', 'act' => 'GetProdi', 'idField' => 'id_prodi', 'labelField' => 'nama_program_studi', 'description' => 'Program studi PDDikti untuk pencocokan dan mapping.', 'requiredForSync' => true],
            'semester' => ['key' => 'semester', 'label' => 'Semester', 'group' => 'akademik', 'act' => 'GetSemester', 'idField' => 'id_semester', 'labelField' => 'nama_semester', 'description' => 'Kode semester PDDikti (tahun + periode).', 'requiredForSync' => true],
            'tahun-ajaran' => ['key' => 'tahun-ajaran', 'label' => 'Tahun Ajaran', 'group' => 'akademik', 'act' => 'GetTahunAjaran', 'idField' => 'id_tahun_ajaran', 'labelField' => 'nama_tahun_ajaran', 'description' => 'Tahun ajaran yang dikenal PDDikti.'],
            'periode' => ['key' => 'periode', 'label' => 'Periode Pelaporan', 'group' => 'akademik', 'act' => 'GetPeriode', 'idField' => 'id_periode', 'labelField' => 'nama_periode', 'description' => 'Periode pelaporan PDDikti.', 'requiredForSync' => true],
            'jenjang-pendidikan' => ['key' => 'jenjang-pendidikan', 'label' => 'Jenjang Pendidikan', 'group' => 'akademik', 'act' => 'GetJenjangPendidikan', 'idField' => 'id_jenjang_pendidikan', 'labelField' => 'nama_jenjang_pendidikan', 'description' => 'Jenjang pendidikan D3, D4, S1, S2, dan S3.'],
            'bentuk-pendidikan' => ['key' => 'bentuk-pendidikan', 'label' => 'Bentuk Pendidikan', 'group' => 'akademik', 'act' => 'GetBentukPendidikan', 'idField' => 'id_bentuk_pendidikan', 'labelField' => 'nama_bentuk_pendidikan', 'description' => 'Bentuk pendidikan akademik, vokasi, dan profesi.'],
            'skala-nilai' => ['key' => 'skala-nilai', 'label' => 'Skala Nilai', 'group' => 'akademik', 'act' => 'GetListSkalaNilaiProdi', 'idField' => 'id_skala_nilai', 'labelField' => 'nama_skala_nilai', 'description' => 'Skala nilai per program studi.', 'requiredForSync' => true, 'requiresProdi' => true],
            'agama' => ['key' => 'agama', 'label' => 'Agama', 'group' => 'mahasiswa', 'act' => 'GetAgama', 'idField' => 'id_agama', 'labelField' => 'nama_agama', 'description' => 'Referensi agama PDDikti.', 'requiredForSync' => true],
            'jenis-kelamin' => ['key' => 'jenis-kelamin', 'label' => 'Jenis Kelamin', 'group' => 'mahasiswa', 'act' => '', 'idField' => 'id', 'labelField' => 'nama', 'description' => 'Kode statis L/P yang digunakan SIAKAD dan PDDikti.', 'notes' => 'Referensi lokal; bukan daftar yang diambil dari Web Service.'],
            'status-mahasiswa' => ['key' => 'status-mahasiswa', 'label' => 'Status Mahasiswa', 'group' => 'mahasiswa', 'act' => 'GetStatusMahasiswa', 'idField' => 'id_status_mahasiswa', 'labelField' => 'nama_status_mahasiswa', 'description' => 'Status mahasiswa pada PDDikti.', 'requiredForSync' => true],
            'jenis-pendaftaran' => ['key' => 'jenis-pendaftaran', 'label' => 'Jenis Pendaftaran', 'group' => 'mahasiswa', 'act' => 'GetJenisPendaftaran', 'idField' => 'id_jenis_daftar', 'labelField' => 'nama_jenis_daftar', 'description' => 'Jenis pendaftaran mahasiswa.', 'requiredForSync' => true],
            'jalur-masuk' => ['key' => 'jalur-masuk', 'label' => 'Jalur Masuk', 'group' => 'mahasiswa', 'act' => 'GetJalurMasuk', 'idField' => 'id_jalur_masuk', 'labelField' => 'nama_jalur_masuk', 'description' => 'Jalur masuk mahasiswa.', 'requiredForSync' => true],
            'jenis-keluar' => ['key' => 'jenis-keluar', 'label' => 'Jenis Keluar', 'group' => 'mahasiswa', 'act' => 'GetJenisKeluar', 'idField' => 'id_jenis_keluar', 'labelField' => 'nama_jenis_keluar', 'description' => 'Jenis keluar mahasiswa (lulus, DO, pindah, dll).', 'requiredForSync' => true],
            'jenis-tinggal' => ['key' => 'jenis-tinggal', 'label' => 'Jenis Tinggal', 'group' => 'mahasiswa', 'act' => 'GetJenisTinggal', 'idField' => 'id_jenis_tinggal', 'labelField' => 'nama_jenis_tinggal', 'description' => 'Jenis tempat tinggal mahasiswa.'],
            'pembiayaan' => ['key' => 'pembiayaan', 'label' => 'Jenis Pembiayaan', 'group' => 'mahasiswa', 'act' => 'GetPembiayaan', 'idField' => 'id_pembiayaan', 'labelField' => 'nama_pembiayaan', 'description' => 'Jenis pembiayaan studi.', 'requiredForSync' => true],
            'kebutuhan-khusus' => ['key' => 'kebutuhan-khusus', 'label' => 'Kebutuhan Khusus', 'group' => 'mahasiswa', 'act' => 'GetKebutuhanKhusus', 'idField' => 'id_kebutuhan_khusus', 'labelField' => 'nama_kebutuhan_khusus', 'description' => 'Referensi kebutuhan khusus mahasiswa.'],
            'alat-transportasi' => ['key' => 'alat-transportasi', 'label' => 'Alat Transportasi', 'group' => 'mahasiswa', 'act' => 'GetAlatTransportasi', 'idField' => 'id_alat_transportasi', 'labelField' => 'nama_alat_transportasi', 'description' => 'Alat transportasi mahasiswa.'],
            'pekerjaan' => ['key' => 'pekerjaan', 'label' => 'Pekerjaan', 'group' => 'mahasiswa', 'act' => 'GetPekerjaan', 'idField' => 'id_pekerjaan', 'labelField' => 'nama_pekerjaan', 'description' => 'Pekerjaan orang tua/wali.'],
            'penghasilan' => ['key' => 'penghasilan', 'label' => 'Penghasilan', 'group' => 'mahasiswa', 'act' => 'GetPenghasilan', 'idField' => 'id_penghasilan', 'labelField' => 'nama_penghasilan', 'description' => 'Rentang penghasilan orang tua/wali.'],
            'status-kepegawaian' => ['key' => 'status-kepegawaian', 'label' => 'Status Kepegawaian', 'group' => 'dosen', 'act' => 'GetStatusKepegawaian', 'idField' => 'id_status_pegawai', 'labelField' => 'nama_status_pegawai', 'description' => 'Status kepegawaian dosen.'],
            'ikatan-kerja' => ['key' => 'ikatan-kerja', 'label' => 'Ikatan Kerja', 'group' => 'dosen', 'act' => 'GetIkatanKerjaSdm', 'idField' => 'id_ikatan_kerja', 'labelField' => 'nama_ikatan_kerja', 'description' => 'Jenis ikatan kerja dosen.'],
            'jabatan-fungsional' => ['key' => 'jabatan-fungsional', 'label' => 'Jabatan Fungsional', 'group' => 'dosen', 'act' => 'GetJabfung', 'idField' => 'id_jabfung', 'labelField' => 'nama_jabfung', 'description' => 'Jabatan fungsional dosen.'],
            'pangkat-golongan' => ['key' => 'pangkat-golongan', 'label' => 'Pangkat/Golongan', 'group' => 'dosen', 'act' => 'GetPangkatGolongan', 'idField' => 'id_pangkat_golongan', 'labelField' => 'nama_pangkat_golongan', 'description' => 'Pangkat dan golongan dosen.'],
            'jenis-sertifikasi' => ['key' => 'jenis-sertifikasi', 'label' => 'Jenis Sertifikasi', 'group' => 'dosen', 'act' => 'GetJenisSertifikasi', 'idField' => 'id_jenis_sertifikasi', 'labelField' => 'nama_jenis_sertifikasi', 'description' => 'Jenis sertifikasi dosen.'],
            'kategori-kegiatan' => ['key' => 'kategori-kegiatan', 'label' => 'Kategori Kegiatan', 'group' => 'kegiatan', 'act' => 'GetKategoriKegiatan', 'idField' => 'id_kategori_kegiatan', 'labelField' => 'nama_kategori_kegiatan', 'description' => 'Kategori aktivitas mahasiswa.'],
            'jenis-aktivitas-mahasiswa' => ['key' => 'jenis-aktivitas-mahasiswa', 'label' => 'Jenis Aktivitas Mahasiswa', 'group' => 'kegiatan', 'act' => 'GetJenisAktivitasMahasiswa', 'idField' => 'id_jenis_aktivitas', 'labelField' => 'nama_jenis_aktivitas', 'description' => 'Jenis aktivitas mahasiswa.'],
            'wilayah' => ['key' => 'wilayah', 'label' => 'Wilayah', 'group' => 'wilayah', 'act' => 'GetWilayah', 'idField' => 'id_wilayah', 'labelField' => 'nama_wilayah', 'description' => 'Referensi wilayah administratif Indonesia.'],
            'negara' => ['key' => 'negara', 'label' => 'Negara', 'group' => 'wilayah', 'act' => 'GetNegara', 'idField' => 'id_negara', 'labelField' => 'nama_negara', 'description' => 'Referensi negara.'],
            'level-wilayah' => ['key' => 'level-wilayah', 'label' => 'Level Wilayah', 'group' => 'wilayah', 'act' => 'GetLevelWilayah', 'idField' => 'id_level_wilayah', 'labelField' => 'nama_level_wilayah', 'description' => 'Tingkatan wilayah administratif.'],
        ];
    }

    public static function exists(string $key): bool
    {
        return array_key_exists($key, self::definitions());
    }

    /** @return array<string,mixed> */
    public static function get(string $key): array
    {
        if (! self::exists($key)) {
            throw new \InvalidArgumentException('Kunci referensi tidak dikenal: '.$key);
        }

        return self::definitions()[$key];
    }
}
