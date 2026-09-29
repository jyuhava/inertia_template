<?php

namespace App\Services\Integrator;

use App\Models\Semester;
use Illuminate\Support\Facades\DB;

class IntegratorDependencyService
{
    public function __construct(private readonly IntegratorMappingService $mappings) {}

    /** @param array<string, mixed> $row
     * @return array{ok:bool,blockers:list<array{requirement:array{entity:string,label:string,field:string},localId:?string,localLabel:string,reason:string}>}
     */
    public function check(string $entity, array $row): array
    {
        $blockers = [];

        foreach ($this->fields()[$entity] ?? [] as $dependency) {
            $localId = null;
            if (isset($dependency['keyFrom'])) {
                $parts = array_map(static fn (string $field): string => trim((string) ($row[$field] ?? '')), $dependency['keyFrom']);
                if (in_array('', $parts, true)) {
                    $localId = null;
                } else {
                    $localId = implode(':', $parts);
                }
            } else {
                $value = $row[$dependency['localField']] ?? null;
                $localId = $value === null || $value === '' ? null : (string) $value;
            }

            if ($localId === null) {
                if ($dependency['required']) {
                    $blockers[] = $this->blocker($dependency, null, 'Data belum memiliki '.$dependency['label'].'.');
                }

                continue;
            }

            $externalId = $this->resolveExternalId($dependency['entity'], $localId);
            if ($externalId === null && $dependency['required']) {
                $labelField = $dependency['localField'].'Label';
                $localLabel = (string) ($row[$labelField] ?? $localId);
                $blockers[] = $this->blocker(
                    $dependency,
                    $localId,
                    $dependency['label'].' belum dipetakan ke ID PDDikti ('.$localLabel.').',
                    $localLabel,
                );
            }
        }

        return ['ok' => $blockers === [], 'blockers' => $blockers];
    }

    public function resolveExternalId(string $entity, int|string|null $localId): ?string
    {
        if ($localId === null || $localId === '') {
            return null;
        }

        if ($entity === 'program-studi') {
            $entity = 'prodi';
        }

        if ($entity === 'semester' && is_string($localId) && ! ctype_digit($localId)) {
            // Accept a PDDikti semester code only if it is present in an
            // operator mapping; otherwise derive a match from the local rows.
            $model = IntegratorEntityRegistry::modelClass('semester');
            $mapped = DB::table('pddikti_akademik_mappings')
                ->where('entity_type', $model)
                ->where('external_id', $localId)
                ->value('external_id');
            if (is_string($mapped)) {
                return $mapped;
            }

            $semester = Semester::query()->with('tahunAjaran')->get();
            $mappingService = app(IntegratorMappingService::class);
            foreach ($semester as $candidate) {
                if ($mappingService->pddiktiSemesterCode($candidate) === $localId) {
                    return $mappingService->externalIdFor('semester', $candidate->id) ?? $localId;
                }
            }

            return null;
        }

        return $this->mappings->externalIdFor($entity, $localId);
    }

    /** @return array<string, list<array<string, mixed>>> */
    private function fields(): array
    {
        return [
            'prodi' => [['entity' => 'perguruan-tinggi', 'label' => 'Perguruan Tinggi', 'localField' => 'kodePt', 'payloadField' => 'id_perguruan_tinggi', 'required' => false]],
            'dosen' => [['entity' => 'prodi', 'label' => 'Program Studi (homebase)', 'localField' => 'prodiId', 'payloadField' => 'id_prodi', 'required' => false]],
            'mahasiswa' => [
                ['entity' => 'prodi', 'label' => 'Program Studi', 'localField' => 'prodiId', 'payloadField' => 'id_prodi', 'required' => true],
                ['entity' => 'semester', 'label' => 'Semester Masuk', 'localField' => 'semesterMasuk', 'payloadField' => 'id_periode_masuk', 'required' => true],
            ],
            'riwayat-pendidikan' => [
                ['entity' => 'mahasiswa', 'label' => 'Mahasiswa', 'localField' => 'mahasiswaId', 'payloadField' => 'id_mahasiswa', 'required' => true],
                ['entity' => 'prodi', 'label' => 'Program Studi', 'localField' => 'prodiId', 'payloadField' => 'id_prodi', 'required' => true],
                ['entity' => 'semester', 'label' => 'Periode Masuk', 'localField' => 'semesterMasuk', 'payloadField' => 'id_periode_masuk', 'required' => true],
            ],
            'kurikulum' => [['entity' => 'prodi', 'label' => 'Program Studi', 'localField' => 'prodiId', 'payloadField' => 'id_prodi', 'required' => true]],
            'mata-kuliah' => [['entity' => 'prodi', 'label' => 'Program Studi', 'localField' => 'prodiId', 'payloadField' => 'id_prodi', 'required' => true]],
            'mata-kuliah-kurikulum' => [
                ['entity' => 'kurikulum', 'label' => 'Kurikulum', 'localField' => 'kurikulumId', 'payloadField' => 'id_kurikulum', 'required' => true],
                ['entity' => 'mata-kuliah', 'label' => 'Mata Kuliah', 'localField' => 'mataKuliahId', 'payloadField' => 'id_matkul', 'required' => true],
            ],
            'kelas' => [
                ['entity' => 'prodi', 'label' => 'Program Studi', 'localField' => 'prodiId', 'payloadField' => 'id_prodi', 'required' => true],
                ['entity' => 'semester', 'label' => 'Semester', 'localField' => 'semesterId', 'payloadField' => 'id_semester', 'required' => true],
                ['entity' => 'mata-kuliah', 'label' => 'Mata Kuliah', 'localField' => 'mataKuliahId', 'payloadField' => 'id_matkul', 'required' => true],
            ],
            'dosen-pengajar' => [
                ['entity' => 'kelas', 'label' => 'Kelas Kuliah', 'localField' => 'kelasId', 'payloadField' => 'id_kelas_kuliah', 'required' => true],
                ['entity' => 'dosen', 'label' => 'Dosen', 'localField' => 'dosenId', 'payloadField' => 'id_registrasi_dosen', 'required' => true],
            ],
            'krs' => [
                ['entity' => 'mahasiswa', 'label' => 'Mahasiswa', 'localField' => 'mahasiswaId', 'payloadField' => 'id_registrasi_mahasiswa', 'required' => true],
                ['entity' => 'kelas', 'label' => 'Kelas Kuliah', 'localField' => 'kelasId', 'payloadField' => 'id_kelas_kuliah', 'required' => true],
            ],
            'nilai' => [
                ['entity' => 'mahasiswa', 'label' => 'Mahasiswa', 'localField' => 'mahasiswaId', 'payloadField' => 'id_registrasi_mahasiswa', 'required' => true],
                ['entity' => 'kelas', 'label' => 'Kelas Kuliah', 'localField' => 'kelasId', 'payloadField' => 'id_kelas_kuliah', 'required' => true],
                ['entity' => 'krs', 'label' => 'Keanggotaan Kelas (KRS)', 'localField' => 'mahasiswaId', 'payloadField' => 'id_peserta_kelas_kuliah', 'required' => true, 'keyFrom' => ['mahasiswaId', 'kelasId']],
            ],
            'aktivitas-mahasiswa' => [['entity' => 'semester', 'label' => 'Semester', 'localField' => 'semesterNama', 'payloadField' => 'id_semester', 'required' => true]],
            'kelulusan' => [
                ['entity' => 'mahasiswa', 'label' => 'Mahasiswa', 'localField' => 'mahasiswaId', 'payloadField' => 'id_registrasi_mahasiswa', 'required' => true],
                ['entity' => 'semester', 'label' => 'Periode Keluar', 'localField' => 'periodeKeluar', 'payloadField' => 'id_periode_keluar', 'required' => true],
            ],
        ];
    }

    /** @param array<string, mixed> $field
     * @return array{requirement:array{entity:string,label:string,field:string},localId:?string,localLabel:string,reason:string}
     */
    private function blocker(array $field, ?string $localId, string $reason, string $label = '—'): array
    {
        return [
            'requirement' => ['entity' => $field['entity'], 'label' => $field['label'], 'field' => $field['payloadField']],
            'localId' => $localId,
            'localLabel' => $label,
            'reason' => $reason,
        ];
    }
}
