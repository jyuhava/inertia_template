<?php

namespace App\Services\Integrator;

/**
 * Registry entitas integrator — sumber tunggal kunci entitas, model SIAKAD,
 * act Neo Feeder, capability, dependensi, dan cara mapping disimpan.
 *
 * Act names & capability mengikuti integrator/src/config/entities.ts pada
 * frontend (diverifikasi terhadap dictionary Neo Feeder 2.0–3.1). Dependensi
 * mengikuti integrator/src/config/syncOrder.ts.
 */
class IntegratorEntityRegistry
{
    public const STORAGE_MAHASISWA = 'mahasiswa';

    public const STORAGE_DOSEN = 'dosen';

    public const STORAGE_AKADEMIK = 'akademik';

    public const STORAGE_NONE = 'none';

    /** @return array<string, array<string, mixed>> */
    public static function definitions(): array
    {
        return [
            'perguruan-tinggi' => [
                'label' => 'Perguruan Tinggi',
                'model' => null,
                'source' => 'config',
                'available' => true,
                'storage' => self::STORAGE_NONE,
                'acts' => ['list' => 'GetProfilPT', 'count' => 'GetCountPerguruanTinggi'],
                'syncCapability' => 'read-only',
                'capabilityNote' => 'Neo Feeder tidak menyediakan act Insert/Update untuk profil PT — hanya pembacaan (GetProfilPT).',
                'dependsOn' => [],
                'mandatory' => true,
                'codeColumn' => 'kode_pt',
                'labelColumn' => 'nama_pt',
                'searchColumns' => [],
            ],
            'prodi' => [
                'label' => 'Program Studi',
                'model' => \App\Models\Prodi::class,
                'source' => 'model',
                'available' => true,
                'storage' => self::STORAGE_AKADEMIK,
                'acts' => ['list' => 'GetProdi', 'count' => 'GetCountProdi'],
                'syncCapability' => 'read-only',
                'capabilityNote' => 'Data prodi dibuat melalui PDDikti/Neo Feeder admin, bukan melalui Web Service. Integrator hanya memetakan.',
                'dependsOn' => ['perguruan-tinggi'],
                'mandatory' => true,
                'codeColumn' => 'kode_prodi',
                'labelColumn' => 'nama_prodi',
                'searchColumns' => ['kode_prodi', 'nama_prodi'],
                'prodiColumn' => 'id',
            ],
            'semester' => [
                'label' => 'Semester / Periode',
                'model' => \App\Models\Semester::class,
                'source' => 'model',
                'available' => true,
                'storage' => self::STORAGE_AKADEMIK,
                'acts' => ['list' => 'GetSemester'],
                'syncCapability' => 'read-only',
                'capabilityNote' => 'Semester adalah referensi PDDikti; SIAKAD hanya memetakan kode semester lokal ke kode PDDikti.',
                'dependsOn' => [],
                'mandatory' => true,
                'codeColumn' => 'kode',
                'labelColumn' => 'nama_semester',
                'searchColumns' => ['nama_semester'],
            ],
            'dosen' => [
                'label' => 'Dosen',
                'model' => \App\Models\Dosen::class,
                'source' => 'model',
                'available' => true,
                'storage' => self::STORAGE_DOSEN,
                'acts' => ['list' => 'GetListDosen', 'detail' => 'DetailBiodataDosen', 'count' => 'GetCountDosen'],
                'syncCapability' => 'read-only',
                'capabilityNote' => 'Web Service Neo Feeder tidak menyediakan InsertBiodataDosen/UpdateBiodataDosen. Gunakan entitas dosen-pengajar untuk mengirim relasi dosen–kelas.',
                'dependsOn' => ['prodi'],
                'mandatory' => false,
                'codeColumn' => 'nidn',
                'labelColumn' => 'nama_lengkap',
                'searchColumns' => ['nama_lengkap', 'nidn', 'nip', 'nidk'],
            ],
            'mahasiswa' => [
                'label' => 'Mahasiswa',
                'model' => \App\Models\Mahasiswa::class,
                'source' => 'model',
                'available' => true,
                'storage' => self::STORAGE_MAHASISWA,
                'acts' => [
                    'list' => 'GetListMahasiswa', 'detail' => 'GetBiodataMahasiswa', 'count' => 'GetCountMahasiswa',
                    'insert' => 'InsertBiodataMahasiswa', 'update' => 'UpdateBiodataMahasiswa',
                ],
                'syncCapability' => 'full',
                'capabilityNote' => 'Biodata mahasiswa dapat dikirim dan diperbarui melalui Web Service.',
                'dependsOn' => ['prodi', 'semester'],
                'mandatory' => true,
                'codeColumn' => 'nim',
                'labelColumn' => 'nama_lengkap',
                'searchColumns' => ['nim', 'nama_lengkap'],
                'prodiColumn' => 'prodi_id',
                'periodColumn' => 'angkatan',
            ],
            'riwayat-pendidikan' => [
                'label' => 'Riwayat Pendidikan',
                'model' => \App\Models\MahasiswaRegistrasi::class,
                'source' => 'model',
                'available' => true,
                'storage' => self::STORAGE_AKADEMIK,
                'acts' => [
                    'list' => 'GetListRiwayatPendidikanMahasiswa', 'count' => 'GetCountRiwayatPendidikanMahasiswa',
                    'insert' => 'InsertRiwayatPendidikanMahasiswa', 'update' => 'UpdateRiwayatPendidikanMahasiswa',
                ],
                'syncCapability' => 'full',
                'capabilityNote' => 'Riwayat pendidikan dapat dikirim dan diperbarui melalui Web Service.',
                'dependsOn' => ['mahasiswa', 'prodi', 'semester'],
                'mandatory' => true,
                'codeColumn' => 'no_pendaftaran',
                'labelColumn' => 'no_pendaftaran',
                'searchColumns' => ['no_pendaftaran'],
                'prodiColumn' => 'prodi_id',
            ],
            'kurikulum' => [
                'label' => 'Kurikulum',
                'model' => \App\Models\Kurikulum::class,
                'source' => 'model',
                'available' => true,
                'storage' => self::STORAGE_AKADEMIK,
                'acts' => [
                    'list' => 'GetListKurikulum', 'detail' => 'GetDetailKurikulum', 'count' => 'GetCountKurikulum',
                    'insert' => 'InsertKurikulum', 'update' => 'UpdateKurikulum',
                ],
                'syncCapability' => 'full',
                'capabilityNote' => 'Kurikulum dapat dikirim dan diperbarui melalui Web Service.',
                'dependsOn' => ['prodi'],
                'mandatory' => true,
                'codeColumn' => 'kode',
                'labelColumn' => 'nama',
                'searchColumns' => ['kode', 'nama'],
                'prodiColumn' => 'prodi_id',
            ],
            'mata-kuliah' => [
                'label' => 'Mata Kuliah',
                'model' => \App\Models\MataKuliah::class,
                'source' => 'model',
                'available' => true,
                'storage' => self::STORAGE_AKADEMIK,
                'acts' => [
                    'list' => 'GetListMataKuliah', 'detail' => 'GetDetailMataKuliah', 'count' => 'GetCountMataKuliah',
                    'insert' => 'InsertMataKuliah', 'update' => 'UpdateMataKuliah',
                ],
                'syncCapability' => 'full',
                'capabilityNote' => 'Mata kuliah dapat dikirim dan diperbarui melalui Web Service.',
                'dependsOn' => ['prodi'],
                'mandatory' => true,
                'codeColumn' => 'kode_mata_kuliah',
                'labelColumn' => 'nama_mata_kuliah',
                'searchColumns' => ['kode_mata_kuliah', 'nama_mata_kuliah'],
                'prodiColumn' => 'prodi_id',
            ],
            'mata-kuliah-kurikulum' => [
                'label' => 'Mata Kuliah Kurikulum',
                'model' => \App\Models\KurikulumMataKuliah::class,
                'source' => 'model',
                'available' => true,
                'storage' => self::STORAGE_AKADEMIK,
                'acts' => [
                    'list' => 'GetMatkulKurikulum', 'count' => 'GetCountMatkulKurikulum',
                    'insert' => 'InsertMatkulKurikulum', 'update' => 'UpdateMatkulKurikulum',
                ],
                'syncCapability' => 'full',
                'capabilityNote' => 'Relasi mata kuliah–kurikulum dapat dikirim dan diperbarui.',
                'dependsOn' => ['kurikulum', 'mata-kuliah'],
                'mandatory' => false,
                'codeColumn' => null,
                'labelColumn' => null,
                'searchColumns' => [],
                'prodiColumn' => 'kurikulum.prodi_id',
            ],
            'kelas' => [
                'label' => 'Kelas Kuliah',
                'model' => \App\Models\KelasKuliah::class,
                'source' => 'model',
                'available' => true,
                'storage' => self::STORAGE_AKADEMIK,
                'acts' => [
                    'list' => 'GetListKelasKuliah', 'detail' => 'GetDetailKelasKuliah', 'count' => 'GetCountKelasKuliah',
                    'insert' => 'InsertKelasKuliah', 'update' => 'UpdateKelasKuliah',
                ],
                'syncCapability' => 'full',
                'capabilityNote' => 'Kelas kuliah dapat dikirim dan diperbarui melalui Web Service.',
                'dependsOn' => ['prodi', 'semester', 'mata-kuliah'],
                'mandatory' => true,
                'codeColumn' => 'kode_kelas',
                'labelColumn' => 'nama_kelas',
                'searchColumns' => ['kode_kelas', 'nama_kelas'],
                'prodiColumn' => 'mataKuliah.prodi_id',
                'periodColumn' => 'semester_id',
            ],
            'dosen-pengajar' => [
                'label' => 'Penugasan Dosen',
                'model' => \App\Models\KelasKuliahPengajar::class,
                'source' => 'model',
                'available' => true,
                'storage' => self::STORAGE_AKADEMIK,
                'acts' => [
                    'list' => 'GetDosenPengajarKelasKuliah', 'count' => 'GetCountDosenPengajarKelasKuliah',
                    'insert' => 'InsertDosenPengajarKelasKuliah', 'update' => 'UpdateDosenPengajarKelasKuliah',
                ],
                'syncCapability' => 'full',
                'capabilityNote' => 'Penugasan dosen dapat dikirim dan diperbarui melalui Web Service.',
                'dependsOn' => ['kelas', 'dosen'],
                'mandatory' => true,
                'codeColumn' => null,
                'labelColumn' => null,
                'searchColumns' => [],
                'periodColumn' => 'kelasKuliah.semester_id',
            ],
            'krs' => [
                'label' => 'KRS / Anggota Kelas',
                'model' => \App\Models\StudentCourseRegistrationItem::class,
                'source' => 'model',
                'available' => true,
                'storage' => self::STORAGE_AKADEMIK,
                'acts' => [
                    'list' => 'GetPesertaKelasKuliah', 'count' => 'GetCountPesertaKelasKuliah',
                    'insert' => 'InsertPesertaKelasKuliah',
                ],
                'syncCapability' => 'full',
                'capabilityNote' => 'Peserta kelas dikirim dengan InsertPesertaKelasKuliah. Tidak ada act Update — perubahan keanggotaan dilakukan dengan hapus lalu tambah (tidak dilakukan otomatis oleh integrator).',
                'dependsOn' => ['mahasiswa', 'kelas'],
                'mandatory' => true,
                'codeColumn' => null,
                'labelColumn' => null,
                'searchColumns' => [],
                'periodColumn' => 'kelasKuliah.semester_id',
            ],
            'nilai' => [
                'label' => 'Nilai Perkuliahan',
                'model' => \App\Models\Penilaian::class,
                'source' => 'model',
                'available' => true,
                'storage' => self::STORAGE_AKADEMIK,
                'acts' => [
                    'list' => 'GetListNilaiPerkuliahanKelas', 'detail' => 'GetDetailNilaiPerkuliahanKelas',
                    'count' => 'GetCountNilaiPerkuliahanKelas', 'update' => 'UpdateNilaiPerkuliahanKelas',
                ],
                'syncCapability' => 'update-only',
                'capabilityNote' => 'Tidak ada act InsertNilaiPerkuliahanKelas. Nilai dapat dikirim hanya jika mahasiswa sudah menjadi peserta kelas di PDDikti.',
                'dependsOn' => ['mahasiswa', 'kelas', 'krs'],
                'mandatory' => false,
                'codeColumn' => null,
                'labelColumn' => null,
                'searchColumns' => [],
                'periodColumn' => 'jadwalKuliah.semester_id',
            ],
            'aktivitas-mahasiswa' => [
                'label' => 'Aktivitas Mahasiswa',
                'model' => null,
                'source' => 'unavailable',
                'available' => false,
                'storage' => self::STORAGE_AKADEMIK,
                'acts' => [
                    'list' => 'GetListAktivitasMahasiswa', 'count' => 'GetCountAktivitasMahasiswa',
                    'insert' => 'InsertAktivitasMahasiswa', 'update' => 'UpdateAktivitasMahasiswa',
                ],
                'syncCapability' => 'full',
                'capabilityNote' => 'Sumber data aktivitas MBKM pada SIAKAD belum disiapkan untuk integrator — data belum bisa dibaca backend.',
                'dependsOn' => ['mahasiswa', 'semester'],
                'mandatory' => false,
                'codeColumn' => null,
                'labelColumn' => null,
                'searchColumns' => [],
            ],
            'kelulusan' => [
                'label' => 'Kelulusan / Status Akhir',
                'model' => null,
                'source' => 'unavailable',
                'available' => false,
                'storage' => self::STORAGE_AKADEMIK,
                'acts' => [
                    'list' => 'GetListMahasiswaLulusDO', 'detail' => 'GetDetailMahasiswaLulusDO',
                    'count' => 'GetCountMahasiswaLulusDO', 'insert' => 'InsertMahasiswaLulusDO', 'update' => 'UpdateMahasiswaLulusDO',
                ],
                'syncCapability' => 'full',
                'capabilityNote' => 'Sumber data kelulusan/status akhir pada SIAKAD belum disiapkan untuk integrator — data belum bisa dibaca backend.',
                'dependsOn' => ['mahasiswa', 'semester'],
                'mandatory' => true,
                'codeColumn' => null,
                'labelColumn' => null,
                'searchColumns' => [],
            ],
        ];
    }

    /** @return list<string> */
    public static function keys(): array
    {
        return array_keys(self::definitions());
    }

    public static function exists(string $key): bool
    {
        return array_key_exists($key, self::definitions());
    }

    /** @return array<string, mixed> */
    public static function def(string $key): array
    {
        if (! self::exists($key)) {
            throw new \InvalidArgumentException("Entitas integrator tidak dikenal: {$key}");
        }

        return self::definitions()[$key];
    }

    public static function modelClass(string $key): ?string
    {
        $def = self::def($key);

        return is_string($def['model']) && class_exists($def['model']) ? $def['model'] : null;
    }

    public static function storageKind(string $key): string
    {
        return self::def($key)['storage'];
    }

    public static function label(string $key): string
    {
        return self::def($key)['label'];
    }

    public static function act(string $key, string $kind): ?string
    {
        return self::def($key)['acts'][$kind] ?? null;
    }

    /**
     * Urutan sinkronisasi sesuai dependensi (mirror syncOrder.ts frontend).
     *
     * @return list<array{order: int, entity: string, label: string, dependsOn: list<string>, mandatory: bool, capability: string, capabilityNote: string}>
     */
    public static function syncOrder(): array
    {
        $order = 0;

        return array_values(array_map(function (array $def, string $key) use (&$order): array {
            $order++;

            return [
                'order' => $order,
                'entity' => $key,
                'label' => $def['label'],
                'dependsOn' => $def['dependsOn'],
                'mandatory' => $def['mandatory'],
                'capability' => $def['syncCapability'],
                'capabilityNote' => $def['capabilityNote'],
            ];
        }, self::definitions(), array_keys(self::definitions())));
    }
}
