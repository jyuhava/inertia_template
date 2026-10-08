<?php

namespace App\Http\Controllers\Integrator;

use App\Http\Controllers\Controller;
use App\Jobs\RunIntegratorSyncJob;
use App\Services\Integrator\IntegratorAuditService;
use App\Services\Integrator\IntegratorEntityRegistry;
use App\Services\Integrator\IntegratorSyncService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use RuntimeException;

class SyncController extends Controller
{
    public function __construct(
        private readonly IntegratorSyncService $sync,
        private readonly IntegratorAuditService $audit,
    ) {}

    public function order(): JsonResponse
    {
        return response()->json($this->sync->order());
    }

    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'page' => ['sometimes', 'integer', 'min:1'],
            'perPage' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'entity' => ['sometimes', 'nullable', 'string', 'max:40'],
            'status' => ['sometimes', 'nullable', 'in:QUEUED,RUNNING,COMPLETED,PARTIAL,FAILED,CANCELLED,queued,running,completed,partial,failed,cancelled'],
            'search' => ['sometimes', 'nullable', 'string', 'max:191'],
        ]);
        if (! empty($validated['entity']) && ! IntegratorEntityRegistry::exists($validated['entity'])) {
            throw ValidationException::withMessages(['entity' => 'Entitas filter tidak dikenal.']);
        }

        return response()->json($this->sync->index($validated));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'entity' => ['required', 'string', 'max:40'],
            'ids' => ['required', 'array', 'min:1', 'max:'.(int) config('integrator.sync.max_items_per_job', 500)],
            'ids.*' => ['required', 'string', 'max:191'],
            'dryRun' => ['required', 'boolean'],
            'periodId' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'periodLabel' => ['sometimes', 'nullable', 'string', 'max:255'],
            'prodiId' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'prodiLabel' => ['sometimes', 'nullable', 'string', 'max:255'],
        ]);
        if (! IntegratorEntityRegistry::exists($validated['entity'])) {
            throw ValidationException::withMessages(['entity' => 'Entitas integrator tidak dikenal.']);
        }

        try {
            $job = $this->sync->create([
                'entity' => $validated['entity'],
                'ids' => $validated['ids'],
                'dryRun' => (bool) $validated['dryRun'],
                'periodId' => $validated['periodId'] ?? null,
                'periodLabel' => $validated['periodLabel'] ?? null,
                'prodiId' => $validated['prodiId'] ?? null,
                'prodiLabel' => $validated['prodiLabel'] ?? null,
            ], $request->user());
        } catch (\InvalidArgumentException $exception) {
            throw ValidationException::withMessages(['ids' => $exception->getMessage()]);
        }
        $this->audit->record($request, 'SYNC_JOB_CREATED', $validated['entity'], null, count($validated['ids']), 0, 0, ['jobId' => (string) $job->id, 'dryRun' => (bool) $job->dry_run]);

        return response()->json($this->sync->toDto($job, true), 201);
    }

    public function show(string $id): JsonResponse
    {
        return response()->json($this->sync->toDto($this->sync->find($id), true));
    }

    public function run(Request $request, string $id): JsonResponse
    {
        $job = $this->sync->find($id);
        if (in_array($job->status, ['COMPLETED', 'PARTIAL', 'FAILED', 'CANCELLED'], true)) {
            return response()->json($this->sync->toDto($job, true));
        }

        if (config('integrator.sync.mode', 'sync') === 'queue') {
            RunIntegratorSyncJob::dispatch((string) $job->id);
            $this->audit->record($request, 'SYNC_JOB_QUEUED', $job->entity, null, (int) $job->total, 0, 0, ['jobId' => (string) $job->id]);

            return response()->json($this->sync->toDto($job, true));
        }

        $result = $this->sync->run((string) $job->id);
        $this->audit->record($request, 'SYNC_JOB_RUN', $result->entity, null, (int) $result->total, (int) $result->success, (int) $result->failed, [
            'jobId' => (string) $result->id,
            'status' => $result->status,
            'skipped' => (int) $result->skipped,
            'invalid' => (int) $result->invalid,
        ]);

        return response()->json($this->sync->toDto($result, true));
    }

    public function retryFailed(Request $request, string $id): JsonResponse
    {
        try {
            $job = $this->sync->retryFailed($id);
        } catch (RuntimeException $exception) {
            throw ValidationException::withMessages(['job' => $exception->getMessage()]);
        }

        $this->audit->record($request, 'SYNC_JOB_RETRY_REQUESTED', $job->entity, null, (int) $job->total, 0, (int) $job->failed, ['jobId' => (string) $job->id]);
        if (config('integrator.sync.mode', 'sync') === 'queue') {
            RunIntegratorSyncJob::dispatch((string) $job->id);
        } else {
            $job = $this->sync->run((string) $job->id);
        }

        return response()->json($this->sync->toDto($job, true));
    }

    public function cancel(Request $request, string $id): JsonResponse
    {
        $job = $this->sync->cancel($id);
        $this->audit->record($request, 'SYNC_JOB_CANCEL_REQUESTED', $job->entity, null, (int) $job->total, 0, 0, ['jobId' => (string) $job->id, 'status' => $job->status]);

        return response()->json($this->sync->toDto($job, true));
    }
}
