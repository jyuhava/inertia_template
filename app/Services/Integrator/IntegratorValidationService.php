<?php

namespace App\Services\Integrator;

use Illuminate\Support\Str;

/** Server-side validation rules for the currently supported SIAKAD entities. */
class IntegratorValidationService
{
    public function __construct(private readonly IntegratorMappingService $mappings) {}

    /** @param list<array<string, mixed>> $rows
     * @return list<array<string, mixed>>
     */
    public function validateRows(string $entity, array $rows): array
    {
        $issues = [];
        foreach ($rows as $row) {
            array_push($issues, ...$this->validateRow($entity, $row));
        }

        return $issues;
    }

    /** @param array<string, mixed> $row
     * @return list<array<string, mixed>>
     */
    public function validateRow(string $entity, array $row): array
    {
        $issues = [];
        $localId = (string) ($row['localId'] ?? $row['id'] ?? '0');
        $label = (string) ($row['localLabel'] ?? $row['nama'] ?? $row['namaProdi'] ?? $row['nim'] ?? $localId);

        $addRequired = function (string $field, string $labelText, string $severity = 'critical') use (&$issues, $entity, $localId, $label, $row): void {
            if ($this->blank($row[$field] ?? null)) {
                $issues[] = $this->issue($entity, $localId, $label, $severity, 'FIELD_REQUIRED', $field, "{$labelText} wajib diisi.", "Lengkapi {$labelText} pada data SIAKAD.");
            }
        };

        switch ($entity) {
            case 'perguruan-tinggi':
                $addRequired('kodePt', 'Kode Perguruan Tinggi');
                $addRequired('namaPt', 'Nama Perguruan Tinggi');
                break;

            case 'prodi':
                $addRequired('kodeProdi', 'Kode Program Studi');
                $addRequired('namaProdi', 'Nama Program Studi');
                break;

            case 'semester':
                $addRequired('kode', 'Kode Semester');
                $addRequired('tahunAjaran', 'Tahun Ajaran');
                if (! $this->blank($row['tanggalMulai'] ?? null) && ! $this->blank($row['tanggalSelesai'] ?? null)
                    && (string) $row['tanggalMulai'] > (string) $row['tanggalSelesai']) {
                    $issues[] = $this->issue($entity, $localId, $label, 'error', 'SEMESTER_DATE_RANGE_INVALID', 'tanggalSelesai', 'Tanggal selesai semester lebih awal daripada tanggal mulai.', 'Periksa rentang tanggal semester.');
                }
                break;

            case 'dosen':
                if ($this->blank($row['nidn'] ?? null) && $this->blank($row['nidk'] ?? null)) {
                    $issues[] = $this->issue($entity, $localId, $label, 'warning', 'DOSEN_IDENTITY_MISSING', 'nidn', 'NIDN dan NIDK belum tersedia; verifikasi identitas dosen sebelum mapping.', 'Lengkapi NIDN/NIDK atau lakukan pencocokan manual dengan data PDDikti.');
                }
                $addRequired('nama', 'Nama Dosen');
                break;

            case 'mahasiswa':
                $addRequired('nim', 'NIM');
                $addRequired('nama', 'Nama Mahasiswa');
                $addRequired('jenisKelamin', 'Jenis Kelamin');
                $addRequired('tempatLahir', 'Tempat Lahir');
                $addRequired('tanggalLahir', 'Tanggal Lahir');
                if (! $this->blank($row['nim'] ?? null)) {
                    $nim = (string) $row['nim'];
                    if (! ctype_digit($nim) || strlen($nim) > 16) {
                        $issues[] = $this->issue($entity, $localId, $label, 'error', 'MAHASISWA_NIM_INVALID', 'nim', 'NIM harus berupa angka dan maksimal 16 digit.', 'Periksa NIM pada data mahasiswa.');
                    }
                }
                if (! $this->blank($row['jenisKelamin'] ?? null) && ! in_array(strtoupper((string) $row['jenisKelamin']), ['L', 'P'], true)) {
                    $issues[] = $this->issue($entity, $localId, $label, 'error', 'MAHASISWA_GENDER_INVALID', 'jenisKelamin', 'Jenis kelamin harus memakai kode L atau P.', 'Gunakan kode jenis kelamin L/P sesuai referensi PDDikti.');
                }
                if (! $this->blank($row['nik'] ?? null) && (! ctype_digit((string) $row['nik']) || strlen((string) $row['nik']) !== 16)) {
                    $issues[] = $this->issue($entity, $localId, $label, 'error', 'MAHASISWA_NIK_INVALID', 'nik', 'NIK harus terdiri dari 16 digit angka.', 'Periksa NIK pada sumber data SIAKAD.');
                }
                $this->requireMapped($issues, $entity, $localId, $label, 'prodi', $row['prodiId'] ?? null, 'Program Studi', 'prodiId');
                break;

            case 'riwayat-pendidikan':
                $addRequired('nim', 'NIM');
                $addRequired('tanggalMasuk', 'Tanggal Masuk');
                $this->requireMapped($issues, $entity, $localId, $label, 'mahasiswa', $row['mahasiswaId'] ?? null, 'Mahasiswa', 'mahasiswaId');
                $this->requireMapped($issues, $entity, $localId, $label, 'prodi', $row['prodiId'] ?? null, 'Program Studi', 'prodiId');
                break;

            case 'kurikulum':
                $addRequired('kode', 'Kode Kurikulum');
                $addRequired('nama', 'Nama Kurikulum');
                $this->requireMapped($issues, $entity, $localId, $label, 'prodi', $row['prodiId'] ?? null, 'Program Studi', 'prodiId');
                if (isset($row['totalSks']) && (float) $row['totalSks'] <= 0) {
                    $issues[] = $this->issue($entity, $localId, $label, 'error', 'KURIKULUM_SKS_INVALID', 'totalSks', 'Total SKS wajib harus lebih besar dari nol.', 'Periksa struktur mata kuliah kurikulum.');
                }
                break;

            case 'mata-kuliah':
                $addRequired('kode', 'Kode Mata Kuliah');
                $addRequired('nama', 'Nama Mata Kuliah');
                $this->requireMapped($issues, $entity, $localId, $label, 'prodi', $row['prodiId'] ?? null, 'Program Studi', 'prodiId');
                $sks = $row['sks'] ?? null;
                if ($sks !== null && ((float) $sks < 0 || (float) $sks > 24)) {
                    $issues[] = $this->issue($entity, $localId, $label, 'error', 'MATA_KULIAH_SKS_INVALID', 'sks', 'SKS mata kuliah harus berada pada rentang 0–24.', 'Periksa nilai SKS pada data mata kuliah.');
                }
                if (isset($row['sksTeori'], $row['sksPraktik'], $row['sks'])
                    && abs(((float) $row['sksTeori'] + (float) $row['sksPraktik']) - (float) $row['sks']) > 0.01) {
                    $issues[] = $this->issue($entity, $localId, $label, 'warning', 'MATA_KULIAH_SKS_DECOMPOSITION', 'sksTeori', 'SKS teori dan praktik tidak sama dengan SKS total.', 'Periksa pembagian SKS teori/praktik sebelum pengiriman.');
                }
                break;

            case 'mata-kuliah-kurikulum':
                $this->requireMapped($issues, $entity, $localId, $label, 'kurikulum', $row['kurikulumId'] ?? null, 'Kurikulum', 'kurikulumId');
                $this->requireMapped($issues, $entity, $localId, $label, 'mata-kuliah', $row['mataKuliahId'] ?? null, 'Mata Kuliah', 'mataKuliahId');
                if (isset($row['semester']) && ((int) $row['semester'] < 1 || (int) $row['semester'] > 14)) {
                    $issues[] = $this->issue($entity, $localId, $label, 'error', 'KURIKULUM_SEMESTER_INVALID', 'semester', 'Semester penempatan mata kuliah di luar rentang yang wajar.', 'Gunakan semester penempatan 1–14 sesuai kurikulum.');
                }
                break;

            case 'kelas':
                $addRequired('namaKelas', 'Nama Kelas');
                $this->requireMapped($issues, $entity, $localId, $label, 'mata-kuliah', $row['mataKuliahId'] ?? null, 'Mata Kuliah', 'mataKuliahId');
                $this->requireMapped($issues, $entity, $localId, $label, 'semester', $row['semesterId'] ?? null, 'Semester', 'semesterId');
                if (isset($row['kapasitas'], $row['terisi']) && (int) $row['terisi'] > (int) $row['kapasitas']) {
                    $issues[] = $this->issue($entity, $localId, $label, 'warning', 'KELAS_OVER_CAPACITY', 'kapasitas', 'Jumlah peserta kelas melebihi kapasitas yang tercatat.', 'Periksa kapasitas kelas dan daftar peserta.');
                }
                break;

            case 'dosen-pengajar':
                $this->requireMapped($issues, $entity, $localId, $label, 'kelas', $row['kelasId'] ?? null, 'Kelas Kuliah', 'kelasId');
                $this->requireMapped($issues, $entity, $localId, $label, 'dosen', $row['dosenId'] ?? null, 'Dosen', 'dosenId');
                break;

            case 'krs':
                $this->requireMapped($issues, $entity, $localId, $label, 'mahasiswa', $row['mahasiswaId'] ?? null, 'Mahasiswa', 'mahasiswaId');
                $this->requireMapped($issues, $entity, $localId, $label, 'kelas', $row['kelasId'] ?? null, 'Kelas Kuliah', 'kelasId');
                if (! in_array(strtolower((string) ($row['statusKrs'] ?? '')), ['approved', 'locked', 'disetujui', 'terkunci'], true)) {
                    $issues[] = $this->issue($entity, $localId, $label, 'error', 'KRS_NOT_APPROVED', 'statusKrs', 'KRS belum disetujui atau dikunci; peserta kelas belum siap dilaporkan.', 'Setujui/kunci KRS melalui alur akademik SIAKAD terlebih dahulu.');
                }
                break;

            case 'nilai':
                $this->requireMapped($issues, $entity, $localId, $label, 'mahasiswa', $row['mahasiswaId'] ?? null, 'Mahasiswa', 'mahasiswaId');
                $this->requireMapped($issues, $entity, $localId, $label, 'kelas', $row['kelasId'] ?? null, 'Kelas Kuliah', 'kelasId');
                if (($row['statusNilai'] ?? null) !== 'final') {
                    $issues[] = $this->issue($entity, $localId, $label, 'error', 'NILAI_NOT_FINAL', 'statusNilai', 'Nilai belum berstatus final.', 'Finalisasi nilai pada SIAKAD sebelum sinkronisasi.');
                }
                if (isset($row['nilaiAngka']) && ((float) $row['nilaiAngka'] < 0 || (float) $row['nilaiAngka'] > 100)) {
                    $issues[] = $this->issue($entity, $localId, $label, 'error', 'NILAI_ANGKA_INVALID', 'nilaiAngka', 'Nilai angka harus berada pada rentang 0–100.', 'Periksa nilai akhir mahasiswa.');
                }
                break;

            case 'aktivitas-mahasiswa':
                $addRequired('judul', 'Judul Aktivitas');
                if (! ($row['sourceAvailable'] ?? false)) {
                    $issues[] = $this->issue($entity, $localId, $label, 'warning', 'SOURCE_NOT_CONFIGURED', 'entity', 'Sumber data aktivitas mahasiswa belum tersedia pada skema SIAKAD yang terhubung.', 'Konfigurasikan sumber aktivitas sebelum memakai entitas ini.');
                }
                break;

            case 'kelulusan':
                $addRequired('nim', 'NIM');
                $addRequired('tanggalKeluar', 'Tanggal Keluar');
                if (! ($row['sourceAvailable'] ?? false)) {
                    $issues[] = $this->issue($entity, $localId, $label, 'warning', 'SOURCE_NOT_CONFIGURED', 'entity', 'Sumber data kelulusan/status akhir belum tersedia pada skema SIAKAD yang terhubung.', 'Konfigurasikan sumber data kelulusan sebelum memakai entitas ini.');
                }
                break;
        }

        return $issues;
    }

    /** @param list<array<string,mixed>> $issues */
    private function requireMapped(array &$issues, string $entity, string $localId, string $label, string $parentEntity, mixed $parentLocalId, string $parentLabel, string $field): void
    {
        if ($parentLocalId === null || $parentLocalId === '' || $this->mappings->externalIdFor($parentEntity, (string) $parentLocalId) === null) {
            $issues[] = $this->issue($entity, $localId, $label, 'critical', 'DEPENDENCY_MAPPING_MISSING', $field, "{$parentLabel} belum memiliki mapping PDDikti.", "Lengkapi mapping {$parentLabel} terlebih dahulu.");
        }
    }

    /** @return array<string,mixed> */
    private function issue(string $entity, string $localId, string $label, string $severity, string $code, ?string $field, string $message, ?string $remediation): array
    {
        return [
            'id' => (string) Str::uuid(),
            'entity' => $entity,
            'localId' => $localId,
            'localLabel' => $label,
            'severity' => $severity,
            'code' => $code,
            'field' => $field,
            'message' => $message,
            'remediation' => $remediation,
            'createdAt' => now()->toISOString(),
        ];
    }

    private function blank(mixed $value): bool
    {
        return $value === null || (is_string($value) && trim($value) === '');
    }
}
