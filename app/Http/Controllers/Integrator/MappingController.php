<?php

namespace App\Http\Controllers\Integrator;

use App\Http\Controllers\Controller;
use App\Models\PddiktiDosenMapping;
use App\Services\Integrator\IntegratorAuditService;
use App\Services\Integrator\IntegratorEntityRegistry;
use App\Services\Integrator\IntegratorEntityService;
use App\Services\Integrator\IntegratorMappingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class MappingController extends Controller
{
    public function __construct(
        private readonly IntegratorMappingService $mappings,
        private readonly IntegratorEntityService $entities,
        private readonly IntegratorAuditService $audit,
    ) {}

    public function summary(): JsonResponse
    {
        $stats = [];
        foreach (IntegratorEntityRegistry::keys() as $entity) {
            $stats[] = $this->mappings->stats($entity);
        }

        return response()->json($stats);
    }

    public function list(Request $request, string $entity): JsonResponse
    {
        $this->assertEntity($entity);
        $entityList = $this->entities->list($entity, $request->query());
        $pageRows = $entityList['data'];
        $records = [];
        foreach ($pageRows as $row) {
            $meta = $this->mappings->metaFor($entity, [(string) $row['localId']])[(string) $row['localId']] ?? [];
            $records[] = $this->mappingRecord($entity, $row, $meta);
        }

        return response()->json([
            'data' => $records,
            'meta' => $entityList['meta'],
            'stats' => $this->mappings->stats($entity),
        ]);
    }

    public function save(Request $request, string $entity): JsonResponse
    {
        $this->assertEntity($entity);
        $validated = $request->validate([
            'localId' => ['required', 'string', 'max:191'],
            'externalId' => ['required', 'string', 'max:255'],
            'externalLabel' => ['sometimes', 'nullable', 'string', 'max:500'],
            'externalCode' => ['sometimes', 'nullable', 'string', 'max:120'],
            'mappingType' => ['sometimes', 'nullable', 'in:by-code,by-name,by-identity,manual'],
        ]);
        $localId = $validated['localId'];
        $row = $this->entities->find($entity, $localId);
        $this->assertUniqueLecturerId($entity, $localId, $validated['externalId']);

        DB::transaction(function () use ($entity, $localId, $validated): void {
            $this->mappings->setMapping($entity, $localId, $validated['externalId'], [
                'externalCode' => $validated['externalCode'] ?? null,
                'externalLabel' => $validated['externalLabel'] ?? null,
                'mappingType' => $validated['mappingType'] ?? 'manual',
                'confidence' => ($validated['mappingType'] ?? 'manual') === 'manual' ? 100 : null,
            ]);
        });

        $meta = $this->mappings->metaFor($entity, [$localId])[$localId] ?? [];
        $this->audit->record($request, 'MAPPING_SAVED', $entity, $localId, 1, 1, 0, ['mappingType' => $validated['mappingType'] ?? 'manual']);

        return response()->json(['record' => $this->mappingRecord($entity, $row, $meta)]);
    }

    public function bulk(Request $request, string $entity): JsonResponse
    {
        $this->assertEntity($entity);
        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1', 'max:500'],
            'items.*.localId' => ['required', 'string', 'max:191'],
            'items.*.externalId' => ['required', 'string', 'max:255'],
            'items.*.mappingType' => ['sometimes', 'nullable', 'in:by-code,by-name,by-identity,manual'],
        ]);
        $items = $validated['items'];
        $ids = array_values(array_unique(array_map(static fn (array $item): string => (string) $item['localId'], $items)));
        if (count($ids) !== count($items)) {
            throw ValidationException::withMessages(['items' => 'Setiap localId hanya boleh muncul satu kali dalam bulk mapping.']);
        }

        foreach ($items as $item) {
            $this->entities->find($entity, (string) $item['localId']);
            $this->assertUniqueLecturerId($entity, (string) $item['localId'], (string) $item['externalId']);
        }

        DB::transaction(function () use ($entity, $items): void {
            foreach ($items as $item) {
                $this->mappings->setMapping($entity, (string) $item['localId'], (string) $item['externalId'], [
                    'mappingType' => $item['mappingType'] ?? 'manual',
                    'confidence' => ($item['mappingType'] ?? 'manual') === 'manual' ? 100 : null,
                ]);
            }
        });
        $this->audit->record($request, 'MAPPING_BULK_SAVED', $entity, null, count($items), count($items), 0, ['requested' => count($items)]);

        return response()->json(['updated' => count($items), 'requested' => count($items)]);
    }

    public function unmap(Request $request, string $entity): JsonResponse
    {
        $this->assertEntity($entity);
        $validated = $request->validate([
            'localIds' => ['required', 'array', 'min:1', 'max:500'],
            'localIds.*' => ['required', 'string', 'max:191'],
        ]);
        $localIds = array_values(array_unique(array_map('strval', $validated['localIds'])));
        foreach ($localIds as $localId) {
            $this->entities->find($entity, $localId);
        }

        $updated = DB::transaction(fn (): int => $this->mappings->unmap($entity, $localIds));
        $this->audit->record($request, 'MAPPING_UNMAPPED', $entity, null, count($localIds), $updated, count($localIds) - $updated, ['remoteDeleted' => false]);

        return response()->json(['updated' => $updated]);
    }

    public function auto(Request $request, string $entity): JsonResponse
    {
        $this->assertEntity($entity);
        $validated = $request->validate(['mode' => ['required', 'in:code,name,identity']]);
        $result = $this->mappings->autoMap($entity, $validated['mode']);
        $this->audit->record($request, 'MAPPING_AUTO', $entity, null, $result['matched'] + $result['skipped'], $result['matched'], $result['skipped'], ['mode' => $validated['mode'], 'conflicts' => $result['conflicts']]);

        return response()->json($result);
    }

    public function candidates(Request $request, string $entity): JsonResponse
    {
        $this->assertEntity($entity);
        $validated = $request->validate(['localId' => ['required', 'string', 'max:191']]);
        $this->entities->find($entity, $validated['localId']);

        return response()->json(['candidates' => $this->mappings->candidates($entity, $validated['localId'])]);
    }

    private function assertEntity(string $entity): void
    {
        abort_unless(IntegratorEntityRegistry::exists($entity), 404, 'Entitas integrator tidak dikenal.');
    }

    private function assertUniqueLecturerId(string $entity, string $localId, string $externalId): void
    {
        if ($entity !== 'dosen') {
            return;
        }
        $duplicate = PddiktiDosenMapping::query()
            ->where('pddikti_id', $externalId)
            ->where('dosen_id', '<>', (int) $localId)
            ->exists();
        if ($duplicate) {
            throw ValidationException::withMessages(['externalId' => 'ID PDDikti ini sudah dipetakan ke dosen SIAKAD lain.']);
        }
    }

    /** @param array<string,mixed> $row
     * @param  array<string,mixed>  $meta
     * @return array<string,mixed>
     */
    private function mappingRecord(string $entity, array $row, array $meta): array
    {
        $identityField = match ($entity) {
            'perguruan-tinggi' => 'kodePt',
            'prodi' => 'kodeProdi',
            'semester' => 'kode',
            'dosen' => 'nidn',
            'mahasiswa' => 'nim',
            'riwayat-pendidikan' => 'nim',
            'kurikulum' => 'kode',
            'mata-kuliah' => 'kode',
            'mata-kuliah-kurikulum' => 'kodeMk',
            'kelas' => 'kodeKelas',
            'dosen-pengajar' => 'nim',
            'krs', 'nilai' => 'nim',
            default => 'id',
        };
        $localCode = $row[$identityField] ?? (string) ($row['id'] ?? '');
        $localLabel = $row['localLabel'] ?? $row['nama'] ?? $row['namaPt'] ?? $row['namaProdi'] ?? $row['namaMk'] ?? $row['namaKelas'] ?? $row['namaMahasiswa'] ?? $localCode;
        $status = ! empty($meta['externalId']) ? 'MAPPED' : 'UNMAPPED';
        if (in_array($meta['syncStatus'] ?? null, ['failed', 'error'], true)) {
            $status = 'INVALID';
        }

        return [
            'entity' => $entity,
            'localId' => (string) $row['localId'],
            'localCode' => (string) $localCode,
            'localLabel' => (string) $localLabel,
            'localMeta' => [
                'prodiId' => isset($row['prodiId']) ? (int) $row['prodiId'] : null,
                'semesterId' => isset($row['semesterId']) ? (int) $row['semesterId'] : null,
                'status' => isset($row['status']) ? (string) $row['status'] : null,
            ],
            'externalId' => $meta['externalId'] ?? null,
            'externalCode' => $meta['externalCode'] ?? null,
            'externalLabel' => $meta['externalLabel'] ?? null,
            'mappingType' => $meta['mappingType'] ?? null,
            'status' => $status,
            'confidence' => isset($meta['confidence']) ? (int) $meta['confidence'] : null,
            'lastSyncedAt' => $meta['lastSyncedAt'] ?? null,
            'lastMessage' => $meta['lastMessage'] ?? null,
        ];
    }
}
