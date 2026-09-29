<?php

namespace App\Http\Controllers\Integrator;

use App\Http\Controllers\Controller;
use App\Models\IntegratorSyncJob;
use App\Models\IntegratorSyncJobItem;
use App\Services\Integrator\IntegratorConnectionService;
use App\Services\Integrator\IntegratorEntityRegistry;
use App\Services\Integrator\IntegratorEntityService;
use App\Services\Integrator\IntegratorMappingService;
use App\Services\Integrator\IntegratorValidationService;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function __construct(
        private readonly IntegratorConnectionService $connection,
        private readonly IntegratorMappingService $mappings,
        private readonly IntegratorEntityService $entities,
        private readonly IntegratorValidationService $validator,
    ) {}

    public function summary(): JsonResponse
    {
        $jobs = IntegratorSyncJob::query()->latest('created_at')->limit(10)->get();
        $lastJob = IntegratorSyncJob::query()->whereIn('status', ['COMPLETED', 'PARTIAL', 'FAILED'])->latest('finished_at')->first();
        $perEntity = [];
        $totals = [
            'siakad' => 0, 'pddikti' => 0, 'synced' => 0, 'willSend' => 0, 'willUpdate' => 0,
            'invalid' => 0, 'failed' => 0, 'unmapped' => 0, 'conflict' => 0, 'inProgress' => 0,
        ];
        $validationWarnings = [];
        $mappingWarnings = [];

        foreach (IntegratorEntityRegistry::keys() as $entity) {
            $definition = IntegratorEntityRegistry::def($entity);
            $mapping = $this->mappings->stats($entity);
            $blockingIds = [];
            $groupedIssues = [];
            $this->entities->scanRows($entity, function (array $row) use ($entity, &$blockingIds, &$groupedIssues): void {
                foreach ($this->validator->validateRow($entity, $row) as $issue) {
                    if (in_array($issue['severity'], ['critical', 'error'], true)) {
                        $blockingIds[$issue['localId']] = true;
                    }
                    $key = $issue['entity'].'|'.$issue['code'].'|'.$issue['severity'];
                    $groupedIssues[$key] ??= [
                        'code' => $issue['code'],
                        'message' => $issue['message'],
                        'entity' => $entity,
                        'severity' => $issue['severity'],
                        'count' => 0,
                    ];
                    $groupedIssues[$key]['count']++;
                }
            });
            $invalid = count($blockingIds);
            $failed = IntegratorSyncJobItem::query()->where('entity', $entity)->where('status', 'FAILED')->count();
            $running = IntegratorSyncJobItem::query()->where('entity', $entity)->where('status', 'RUNNING')->count();
            $canInsert = in_array($definition['syncCapability'], ['full', 'assignment-only'], true);
            $willSend = $canInsert ? max(0, $mapping['unmapped'] - $invalid) : 0;

            $perEntity[] = [
                'entity' => $entity,
                'label' => $definition['label'],
                'siakad' => $mapping['total'],
                'pddikti' => $mapping['mapped'],
                'synced' => $mapping['mapped'] - min($mapping['invalid'], $mapping['mapped']),
                'willSend' => $willSend,
                'invalid' => $invalid,
                'mapped' => $mapping['mapped'],
                'unmapped' => $mapping['unmapped'],
                'progress' => $mapping['progress'],
            ];
            $totals['siakad'] += $mapping['total'];
            $totals['pddikti'] += $mapping['mapped'];
            $totals['synced'] += $perEntity[array_key_last($perEntity)]['synced'];
            $totals['willSend'] += $willSend;
            $totals['invalid'] += $invalid;
            $totals['failed'] += (int) $failed;
            $totals['unmapped'] += $mapping['unmapped'];
            $totals['inProgress'] += (int) $running;
            array_push($validationWarnings, ...array_values($groupedIssues));
            if ($mapping['unmapped'] > 0 || $mapping['conflict'] > 0) {
                $mappingWarnings[] = [
                    'entity' => $entity,
                    'label' => $definition['label'],
                    'unmapped' => $mapping['unmapped'],
                    'conflict' => $mapping['conflict'],
                    'total' => $mapping['total'],
                ];
            }
        }

        $failedItems = IntegratorSyncJobItem::query()->with('job')
            ->where('status', 'FAILED')->latest('created_at')->limit(10)->get()
            ->map(static fn (IntegratorSyncJobItem $item): array => [
                'entity' => $item->entity,
                'localId' => (string) $item->local_id,
                'localLabel' => (string) ($item->local_label ?? ''),
                'message' => (string) ($item->message ?? ''),
                'errorCategory' => (string) ($item->error_category ?? 'UNKNOWN_ERROR'),
                'createdAt' => $item->created_at?->toISOString(),
                'jobId' => (string) $item->job_id,
            ])->values()->all();

        $lastSync = $lastJob ? [
            'jobId' => (string) $lastJob->id,
            'entity' => $lastJob->entity,
            'finishedAt' => $lastJob->finished_at?->toISOString() ?? $lastJob->created_at?->toISOString(),
            'success' => (int) $lastJob->success,
            'failed' => (int) $lastJob->failed,
            'total' => (int) $lastJob->total,
            'user' => (string) $lastJob->created_by_name,
        ] : null;

        $recentJobs = $jobs->map(static fn (IntegratorSyncJob $job): array => [
            'id' => (string) $job->id,
            'entity' => $job->entity,
            'status' => $job->status,
            'total' => (int) $job->total,
            'success' => (int) $job->success,
            'failed' => (int) $job->failed,
            'createdAt' => $job->created_at?->toISOString(),
            'createdBy' => (string) $job->created_by_name,
            'dryRun' => (bool) $job->dry_run,
        ])->values()->all();

        return response()->json([
            'connection' => $this->connection->statusDto(),
            'lastSync' => $lastSync,
            'totals' => $totals,
            'perEntity' => $perEntity,
            'recentJobs' => $recentJobs,
            'failedItems' => $failedItems,
            'validationWarnings' => array_slice($validationWarnings, 0, 50),
            'mappingWarnings' => $mappingWarnings,
        ]);
    }
}
