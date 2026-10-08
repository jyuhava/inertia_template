<?php

namespace App\Services\Integrator;

use Illuminate\Support\Str;

/** Transform normalized SIAKAD DTO fields into a Neo Feeder record payload. */
class IntegratorPayloadService
{
    public function __construct(
        private readonly IntegratorMappingService $mappings,
        private readonly IntegratorDependencyService $dependencies,
    ) {}

    /** @param array<string,mixed> $row
     * @return array{record:array<string,mixed>,skippedFields:list<array{field:string,reason:string}>,issues:list<array<string,mixed>>}
     */
    public function build(string $entity, array $row, string $action): array
    {
        if ($action === 'SKIP') {
            return ['record' => [], 'skippedFields' => [], 'issues' => []];
        }

        $record = [];
        $skippedFields = [];
        $issues = [];
        foreach (IntegratorFieldMap::forEntity($entity) as $field) {
            $remoteField = $field['remote'];
            if ($remoteField === null || ($field['noCompare'] ?? false)) {
                continue;
            }

            $value = $row[$field['local']] ?? null;
            if ($value === null || $value === '') {
                $skippedFields[] = ['field' => $remoteField, 'reason' => 'Nilai sumber kosong; field tidak dikirim.'];
                if ($this->referenceIsRequired($entity, $field['local']) && isset($field['refKey'])) {
                    $issues[] = $this->issue($entity, $row, 'REFERENCE_VALUE_MISSING', $field['local'], $field['label'].' belum diisi pada data SIAKAD.');
                }

                continue;
            }

            if (isset($field['refKey'])) {
                $resolved = $this->resolveReference($field['refKey'], $value);
                if ($resolved === null) {
                    $skippedFields[] = ['field' => $remoteField, 'reason' => 'Referensi lokal belum diverifikasi/dipetakan ke ID PDDikti.'];
                    $issues[] = $this->issue($entity, $row, 'REFERENCE_MAPPING_MISSING', $field['local'], $field['label'].' belum memiliki mapping PDDikti.');

                    continue;
                }
                $value = $resolved;
            }

            $record[$remoteField] = $value;
        }

        $idField = $this->updateIdField($entity);
        if ($action === 'UPDATE' && $idField !== null && ! empty($row['pddiktiId'])) {
            $record[$idField] = (string) $row['pddiktiId'];
        }

        return ['record' => $record, 'skippedFields' => $skippedFields, 'issues' => $issues];
    }

    private function resolveReference(string $key, mixed $value): ?string
    {
        if ($key === 'program-studi') {
            return $this->mappings->externalIdFor('prodi', (string) $value);
        }
        if ($key === 'semester') {
            return $this->dependencies->resolveExternalId('semester', (string) $value);
        }

        $map = config('integrator.reference_map.'.$key, []);
        if (! is_array($map)) {
            return null;
        }
        $normalized = mb_strtoupper(trim((string) $value));
        foreach ($map as $localValue => $externalId) {
            if (mb_strtoupper(trim((string) $localValue)) === $normalized && is_scalar($externalId)) {
                return (string) $externalId;
            }
        }

        return null;
    }

    private function referenceIsRequired(string $entity, string $field): bool
    {
        return in_array($field, match ($entity) {
            'mahasiswa' => ['agama', 'prodiId'],
            'riwayat-pendidikan' => ['jenisPendaftaran', 'jalurMasuk', 'semesterMasuk', 'prodiId', 'pembiayaan'],
            'kurikulum' => ['prodiId', 'tahunMulai'],
            'mata-kuliah' => ['prodiId'],
            'kelas' => ['prodiId', 'semesterId'],
            'dosen-pengajar' => ['prodiId', 'semesterId'],
            'krs' => ['prodiId', 'semesterId'],
            'aktivitas-mahasiswa' => ['jenisAktivitas', 'kategori', 'semesterNama'],
            'kelulusan' => ['jenisKeluar', 'periodeKeluar'],
            default => [],
        }, true);
    }

    private function updateIdField(string $entity): ?string
    {
        return [
            'mahasiswa' => 'id_mahasiswa',
            'riwayat-pendidikan' => 'id_registrasi_mahasiswa',
            'kurikulum' => 'id_kurikulum',
            'mata-kuliah' => 'id_matkul',
            'mata-kuliah-kurikulum' => 'id_matkul_kurikulum',
            'kelas' => 'id_kelas_kuliah',
            'dosen-pengajar' => 'id_aktivitas_mengajar',
            'nilai' => 'id_registrasi_mahasiswa',
            'aktivitas-mahasiswa' => 'id_aktivitas',
            'kelulusan' => 'id_registrasi_mahasiswa',
        ][$entity] ?? null;
    }

    /** @param array<string,mixed> $row
     * @return array<string,mixed>
     */
    private function issue(string $entity, array $row, string $code, string $field, string $message): array
    {
        return [
            'id' => (string) Str::uuid(),
            'entity' => $entity,
            'localId' => (string) ($row['localId'] ?? $row['id'] ?? ''),
            'localLabel' => (string) ($row['localLabel'] ?? $row['nama'] ?? $row['nim'] ?? ''),
            'severity' => 'error',
            'code' => $code,
            'field' => $field,
            'message' => $message,
            'remediation' => 'Lengkapi mapping referensi setelah memastikan ID dari dictionary Neo Feeder yang terpasang.',
            'createdAt' => now()->toISOString(),
        ];
    }
}
