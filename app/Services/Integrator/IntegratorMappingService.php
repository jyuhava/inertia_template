<?php

namespace App\Services\Integrator;

use App\Models\IntegratorSetting;
use App\Models\Semester;
use App\Models\TahunAjaran;
use Illuminate\Support\Facades\DB;

/**
 * Repository facade for the PDDikti mapping tables already used by SIAKAD.
 *
 * No remote entity is invented here. The only locally-derived mapping is the
 * well-defined PDDikti semester code (academic-year start + odd/even suffix).
 */
class IntegratorMappingService
{
    /** @var array<string, string|null> */
    private array $externalIdCache = [];

    /**
     * @param  list<int|string>  $localIds
     * @return array<string, array{
     *   externalId: string|null, externalCode: string|null, externalLabel: string|null,
     *   mappingType: string|null, confidence: int|null, lastSyncedAt: string|null,
     *   lastMessage: string|null, lastAction: string|null, syncStatus: string|null
     * }>
     */
    public function metaFor(string $entity, array $localIds): array
    {
        $meta = [];
        foreach ($localIds as $localId) {
            $meta[(string) $localId] = $this->emptyMeta();
        }

        if ($meta === []) {
            return [];
        }

        $kind = IntegratorEntityRegistry::storageKind($entity);
        if ($kind === IntegratorEntityRegistry::STORAGE_NONE) {
            $id = IntegratorSetting::get('connection.pddikti_pt_id');
            $label = IntegratorSetting::get('connection.pddikti_pt_label');
            if (is_string($id) && $id !== '') {
                foreach ($meta as &$value) {
                    $value['externalId'] = $id;
                    $value['externalCode'] = $id;
                    $value['externalLabel'] = is_string($label) ? $label : null;
                    $value['mappingType'] = 'manual';
                    $value['confidence'] = 100;
                }
                unset($value);
            }

            return $meta;
        }

        if ($kind === IntegratorEntityRegistry::STORAGE_MAHASISWA) {
            $rows = DB::table('pddikti_mahasiswa_mappings')
                ->whereIn('mahasiswa_id', $localIds)
                ->get();

            foreach ($rows as $row) {
                $meta[(string) $row->mahasiswa_id] = [
                    'externalId' => $row->pddikti_id,
                    'externalCode' => $row->pddikti_nim,
                    'externalLabel' => $row->external_label ?? null,
                    'mappingType' => $row->mapping_type ?? null,
                    'confidence' => isset($row->confidence) ? (int) $row->confidence : null,
                    'lastSyncedAt' => $this->dateString($row->last_synced_at),
                    'lastMessage' => $row->last_message,
                    'lastAction' => $row->last_action,
                    'syncStatus' => $row->status_mapping,
                ];
            }

            return $meta;
        }

        if ($kind === IntegratorEntityRegistry::STORAGE_DOSEN) {
            $rows = DB::table('pddikti_dosen_mappings')
                ->whereIn('dosen_id', $localIds)
                ->get();

            foreach ($rows as $row) {
                $meta[(string) $row->dosen_id] = [
                    'externalId' => $row->pddikti_id,
                    'externalCode' => $row->pddikti_id,
                    'externalLabel' => $row->external_label ?? null,
                    'mappingType' => $row->mapping_type ?? null,
                    'confidence' => isset($row->confidence) ? (int) $row->confidence : null,
                    'lastSyncedAt' => $this->dateString($row->last_synced_at),
                    'lastMessage' => $row->last_message,
                    'lastAction' => $row->last_action,
                    'syncStatus' => $row->status_mapping,
                ];
            }

            return $meta;
        }

        $model = IntegratorEntityRegistry::modelClass($entity);
        if ($model === null) {
            return $meta;
        }

        $rows = DB::table('pddikti_akademik_mappings')
            ->where('entity_type', $model)
            ->whereIn('entity_id', $localIds)
            ->get();

        foreach ($rows as $row) {
            $meta[(string) $row->entity_id] = [
                'externalId' => $row->external_id,
                'externalCode' => $row->external_code ?? $row->external_id,
                'externalLabel' => $row->external_label ?? null,
                'mappingType' => $row->mapping_type ?? null,
                'confidence' => isset($row->confidence) ? (int) $row->confidence : null,
                'lastSyncedAt' => $this->dateString($row->last_synced_at),
                'lastMessage' => $row->last_sync_message,
                'lastAction' => $row->last_sync_action,
                'syncStatus' => $row->sync_status,
            ];
        }

        return $meta;
    }

    /** @return array<string, string|int|null> */
    private function emptyMeta(): array
    {
        return [
            'externalId' => null,
            'externalCode' => null,
            'externalLabel' => null,
            'mappingType' => null,
            'confidence' => null,
            'lastSyncedAt' => null,
            'lastMessage' => null,
            'lastAction' => null,
            'syncStatus' => null,
        ];
    }

    private function dateString(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        return $value instanceof \DateTimeInterface ? $value->format(DATE_ATOM) : (string) $value;
    }

    public function externalIdFor(string $entity, int|string $localId): ?string
    {
        $cacheKey = $entity.':'.(string) $localId;
        if (array_key_exists($cacheKey, $this->externalIdCache)) {
            return $this->externalIdCache[$cacheKey];
        }

        // KRS dependency identifiers are composite in the frontend. Resolve
        // that key to its actual registration-item row before reading mapping.
        if ($entity === 'krs' && is_string($localId) && str_contains($localId, ':')) {
            [$mahasiswaId, $kelasId] = array_pad(explode(':', $localId, 2), 2, null);
            if (! is_numeric($mahasiswaId) || ! is_numeric($kelasId)) {
                return null;
            }

            $itemId = DB::table('student_course_registration_items as item')
                ->join('student_course_registrations as registration', 'registration.id', '=', 'item.registration_id')
                ->where('registration.mahasiswa_id', (int) $mahasiswaId)
                ->where('item.kelas_kuliah_id', (int) $kelasId)
                ->where('item.status', 'active')
                ->orderByDesc('item.id')
                ->value('item.id');

            $resolved = $itemId === null ? null : $this->externalIdFor('krs', (int) $itemId);
            $this->externalIdCache[$cacheKey] = $resolved;

            return $resolved;
        }

        $resolved = $this->metaFor($entity, [$localId])[(string) $localId]['externalId'] ?? null;
        $this->externalIdCache[$cacheKey] = $resolved;

        return $resolved;
    }

    /**
     * @param  array{externalCode?: string|null, externalLabel?: string|null, mappingType?: string|null, confidence?: int|null}  $extra
     */
    public function setMapping(string $entity, int|string $localId, string $externalId, array $extra = []): void
    {
        unset($this->externalIdCache[$entity.':'.(string) $localId]);
        $now = now();
        $mappingType = $extra['mappingType'] ?? 'manual';
        $confidence = isset($extra['confidence']) ? max(0, min(100, (int) $extra['confidence'])) : null;
        $externalCode = $extra['externalCode'] ?? null;
        $externalLabel = $extra['externalLabel'] ?? null;
        $kind = IntegratorEntityRegistry::storageKind($entity);

        if ($kind === IntegratorEntityRegistry::STORAGE_NONE) {
            IntegratorSetting::put('connection.pddikti_pt_id', $externalId);
            IntegratorSetting::put('connection.pddikti_pt_label', $externalLabel);

            return;
        }

        if ($kind === IntegratorEntityRegistry::STORAGE_MAHASISWA) {
            DB::table('pddikti_mahasiswa_mappings')->updateOrInsert(
                ['mahasiswa_id' => (int) $localId],
                [
                    'pddikti_id' => $externalId,
                    'pddikti_nim' => $externalCode,
                    'external_label' => $externalLabel,
                    'mapping_type' => $mappingType,
                    'confidence' => $confidence,
                    'status_mapping' => 'mapped',
                    'last_message' => null,
                    'updated_at' => $now,
                ],
            );

            return;
        }

        if ($kind === IntegratorEntityRegistry::STORAGE_DOSEN) {
            DB::table('pddikti_dosen_mappings')->updateOrInsert(
                ['dosen_id' => (int) $localId],
                [
                    'pddikti_id' => $externalId,
                    'external_label' => $externalLabel,
                    'mapping_type' => $mappingType,
                    'confidence' => $confidence,
                    'status_mapping' => 'mapped',
                    'last_message' => null,
                    'updated_at' => $now,
                ],
            );

            return;
        }

        $model = IntegratorEntityRegistry::modelClass($entity);
        if ($model === null) {
            return;
        }

        DB::table('pddikti_akademik_mappings')->updateOrInsert(
            ['entity_type' => $model, 'entity_id' => (int) $localId],
            [
                'external_id' => $externalId,
                'external_code' => $externalCode,
                'external_label' => $externalLabel,
                'mapping_type' => $mappingType,
                'confidence' => $confidence,
                'sync_status' => 'not_synced',
                'last_sync_message' => null,
                'updated_at' => $now,
            ],
        );
    }

    /** Release only the local-to-PDDikti mapping. This never deletes remote data. */
    public function unmap(string $entity, array $localIds): int
    {
        if ($localIds === []) {
            return 0;
        }

        foreach ($localIds as $localId) {
            unset($this->externalIdCache[$entity.':'.(string) $localId]);
        }
        $now = now();
        $kind = IntegratorEntityRegistry::storageKind($entity);

        if ($kind === IntegratorEntityRegistry::STORAGE_NONE) {
            $hadMapping = IntegratorSetting::get('connection.pddikti_pt_id') !== null;
            IntegratorSetting::forget('connection.pddikti_pt_id');
            IntegratorSetting::forget('connection.pddikti_pt_label');

            return $hadMapping ? 1 : 0;
        }

        if ($kind === IntegratorEntityRegistry::STORAGE_MAHASISWA) {
            return DB::table('pddikti_mahasiswa_mappings')
                ->whereIn('mahasiswa_id', $localIds)
                ->update([
                    'pddikti_id' => null,
                    'pddikti_nim' => null,
                    'external_label' => null,
                    'mapping_type' => null,
                    'confidence' => null,
                    'status_mapping' => 'unmapped',
                    'updated_at' => $now,
                ]);
        }

        if ($kind === IntegratorEntityRegistry::STORAGE_DOSEN) {
            return DB::table('pddikti_dosen_mappings')
                ->whereIn('dosen_id', $localIds)
                ->update([
                    'pddikti_id' => null,
                    'external_label' => null,
                    'mapping_type' => null,
                    'confidence' => null,
                    'status_mapping' => 'unmapped',
                    'updated_at' => $now,
                ]);
        }

        $model = IntegratorEntityRegistry::modelClass($entity);
        if ($model === null) {
            return 0;
        }

        return DB::table('pddikti_akademik_mappings')
            ->where('entity_type', $model)
            ->whereIn('entity_id', $localIds)
            ->update([
                'external_id' => null,
                'external_code' => null,
                'external_label' => null,
                'mapping_type' => null,
                'confidence' => null,
                'sync_status' => 'not_synced',
                'updated_at' => $now,
            ]);
    }

    /** Persist a result only after the caller has a truthful result from a Feeder act. */
    public function recordSync(string $entity, int|string $localId, ?string $externalId, string $action, bool $success, string $message): void
    {
        unset($this->externalIdCache[$entity.':'.(string) $localId]);
        $now = now();
        $kind = IntegratorEntityRegistry::storageKind($entity);

        if ($kind === IntegratorEntityRegistry::STORAGE_MAHASISWA) {
            $values = [
                'last_synced_at' => $now,
                'last_action' => $action,
                'last_message' => $message,
                'status_mapping' => $success ? 'mapped' : 'error',
                'updated_at' => $now,
            ];
            if ($success && $externalId !== null) {
                $values['pddikti_id'] = $externalId;
            }
            DB::table('pddikti_mahasiswa_mappings')->updateOrInsert(['mahasiswa_id' => (int) $localId], $values);

            return;
        }

        if ($kind === IntegratorEntityRegistry::STORAGE_DOSEN) {
            $values = [
                'last_synced_at' => $now,
                'last_action' => $action,
                'last_message' => $message,
                'status_mapping' => $success ? 'mapped' : 'error',
                'updated_at' => $now,
            ];
            if ($success && $externalId !== null) {
                $values['pddikti_id'] = $externalId;
            }
            DB::table('pddikti_dosen_mappings')->updateOrInsert(['dosen_id' => (int) $localId], $values);

            return;
        }

        $model = IntegratorEntityRegistry::modelClass($entity);
        if ($model === null || $kind === IntegratorEntityRegistry::STORAGE_NONE) {
            return;
        }

        $values = [
            'sync_status' => $success ? 'synced' : 'failed',
            'last_synced_at' => $now,
            'last_sync_action' => $action,
            'last_sync_message' => $message,
            'updated_at' => $now,
        ];
        if ($success && $externalId !== null) {
            $values['external_id'] = $externalId;
        }
        DB::table('pddikti_akademik_mappings')->updateOrInsert(
            ['entity_type' => $model, 'entity_id' => (int) $localId],
            $values,
        );
    }

    /** @return array{entity:string,label:string,total:int,mapped:int,unmapped:int,conflict:int,invalid:int,progress:int,required:bool} */
    public function stats(string $entity): array
    {
        $definition = IntegratorEntityRegistry::def($entity);
        $total = $this->countLocal($entity);
        $mapped = min($this->countMapped($entity), $total);
        $unmapped = max(0, $total - $mapped);
        $invalid = $this->countFailedMappings($entity);

        return [
            'entity' => $entity,
            'label' => $definition['label'],
            'total' => $total,
            'mapped' => $mapped,
            'unmapped' => $unmapped,
            'conflict' => 0,
            'invalid' => $invalid,
            'progress' => $total > 0 ? (int) floor($mapped * 100 / $total) : 0,
            'required' => (bool) $definition['mandatory'],
        ];
    }

    public function countLocal(string $entity): int
    {
        $definition = IntegratorEntityRegistry::def($entity);
        if ($definition['source'] === 'config') {
            return 1;
        }
        if ($definition['source'] === 'unavailable') {
            return 0;
        }

        $model = IntegratorEntityRegistry::modelClass($entity);

        return $model === null ? 0 : (int) $model::query()->count();
    }

    public function countMapped(string $entity): int
    {
        $kind = IntegratorEntityRegistry::storageKind($entity);
        if ($kind === IntegratorEntityRegistry::STORAGE_NONE) {
            return is_string(IntegratorSetting::get('connection.pddikti_pt_id')) ? 1 : 0;
        }
        if ($kind === IntegratorEntityRegistry::STORAGE_MAHASISWA) {
            return (int) DB::table('pddikti_mahasiswa_mappings')->whereNotNull('pddikti_id')->count();
        }
        if ($kind === IntegratorEntityRegistry::STORAGE_DOSEN) {
            return (int) DB::table('pddikti_dosen_mappings')->whereNotNull('pddikti_id')->count();
        }

        $model = IntegratorEntityRegistry::modelClass($entity);

        return $model === null ? 0 : (int) DB::table('pddikti_akademik_mappings')
            ->where('entity_type', $model)
            ->whereNotNull('external_id')
            ->count();
    }

    private function countFailedMappings(string $entity): int
    {
        $kind = IntegratorEntityRegistry::storageKind($entity);
        if ($kind === IntegratorEntityRegistry::STORAGE_MAHASISWA) {
            return (int) DB::table('pddikti_mahasiswa_mappings')->where('status_mapping', 'error')->count();
        }
        if ($kind === IntegratorEntityRegistry::STORAGE_DOSEN) {
            return (int) DB::table('pddikti_dosen_mappings')->where('status_mapping', 'error')->count();
        }
        $model = IntegratorEntityRegistry::modelClass($entity);

        return $model === null ? 0 : (int) DB::table('pddikti_akademik_mappings')
            ->where('entity_type', $model)
            ->where('sync_status', 'failed')
            ->count();
    }

    /** @return list<array{externalId:string,externalCode:?string,label:string,score:int,reason:string}> */
    public function candidates(string $entity, int|string $localId): array
    {
        if ($entity !== 'semester') {
            return [];
        }

        $semester = Semester::query()->with('tahunAjaran')->find($localId);
        if ($semester === null || ($code = $this->pddiktiSemesterCode($semester)) === null) {
            return [];
        }

        return [[
            'externalId' => $code,
            'externalCode' => $code,
            'label' => 'Semester PDDikti '.$code,
            'score' => 100,
            'reason' => 'Kode semester dihitung dari tahun ajaran SIAKAD dan semester ganjil/genap.',
        ]];
    }

    /**
     * Only deterministic semester codes are auto-mapped without a remote
     * mirror. Existing/manual mappings are never overwritten.
     *
     * @return array{entity:string,matched:int,skipped:int,conflicts:int,details:list<array<string,mixed>>}
     */
    public function autoMap(string $entity, string $mode): array
    {
        if ($entity !== 'semester' || $mode !== 'code') {
            return [
                'entity' => $entity,
                'matched' => 0,
                'skipped' => $this->countLocal($entity),
                'conflicts' => 0,
                'details' => [],
            ];
        }

        $matched = 0;
        $skipped = 0;
        $details = [];
        $semesters = Semester::query()->with('tahunAjaran')->orderBy('id')->get();

        foreach ($semesters as $semester) {
            $localId = (string) $semester->id;
            $label = trim(($semester->tahunAjaran?->nama_tahun_ajaran ?? '').' '.$semester->nama_semester);
            if ($this->externalIdFor('semester', $semester->id) !== null) {
                $skipped++;
                $details[] = [
                    'localId' => $localId,
                    'localLabel' => $label,
                    'externalId' => $this->externalIdFor('semester', $semester->id),
                    'externalLabel' => null,
                    'status' => 'MAPPED',
                    'reason' => 'Mapping yang sudah ada dipertahankan; auto-map tidak menimpa mapping operator.',
                ];

                continue;
            }

            $code = $this->pddiktiSemesterCode($semester);
            if ($code === null) {
                $skipped++;
                $details[] = [
                    'localId' => $localId,
                    'localLabel' => $label,
                    'externalId' => null,
                    'externalLabel' => null,
                    'status' => 'UNMAPPED',
                    'reason' => 'Tahun ajaran atau jenis semester belum cukup untuk menghitung kode PDDikti.',
                ];

                continue;
            }

            $this->setMapping('semester', $semester->id, $code, [
                'externalCode' => $code,
                'externalLabel' => 'Semester PDDikti '.$code,
                'mappingType' => 'by-code',
                'confidence' => 100,
            ]);
            $matched++;
            $details[] = [
                'localId' => $localId,
                'localLabel' => $label,
                'externalId' => $code,
                'externalLabel' => 'Semester PDDikti '.$code,
                'status' => 'MAPPED',
                'reason' => 'Kode semester dihitung dari tahun ajaran dan semester lokal.',
            ];
        }

        return ['entity' => $entity, 'matched' => $matched, 'skipped' => $skipped, 'conflicts' => 0, 'details' => $details];
    }

    /**
     * Return the PDDikti semester identifier (YYYY1 for odd, YYYY2 for even).
     * The academic-year start year is used for both periods, per the Feeder
     * semester identifier convention. Unknown semester names are not guessed.
     */
    public function pddiktiSemesterCode(Semester $semester): ?string
    {
        $academicYear = $semester->tahunAjaran ?? TahunAjaran::query()->find($semester->tahun_ajaran_id);
        $name = strtolower((string) $semester->nama_semester);
        $yearLabel = $academicYear?->nama_tahun_ajaran;

        if (! is_string($yearLabel) || ! preg_match('/^(\d{4})\s*\/\s*\d{4}$/', trim($yearLabel), $matches)) {
            return null;
        }

        if (str_contains($name, 'ganjil') || str_contains($name, 'gasal')) {
            return $matches[1].'1';
        }
        if (str_contains($name, 'genap')) {
            return $matches[1].'2';
        }

        return null;
    }
}
