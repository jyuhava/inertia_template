<?php

namespace App\Http\Controllers\Integrator;

use App\Http\Controllers\Controller;
use App\Models\IntegratorSyncJobItem;
use App\Services\Integrator\IntegratorEntityRegistry;
use App\Services\Integrator\SensitiveDataSanitizer;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'page' => ['sometimes', 'integer', 'min:1'],
            'perPage' => ['sometimes', 'integer', 'min:1', 'max:250'],
            'entity' => ['sometimes', 'nullable', 'string', 'max:40'],
            'status' => ['sometimes', 'nullable', 'in:success,failed,SUCCESS,FAILED'],
            'errorCategory' => ['sometimes', 'nullable', 'string', 'max:40'],
            'search' => ['sometimes', 'nullable', 'string', 'max:191'],
            'jobId' => ['sometimes', 'nullable', 'string', 'max:64'],
        ]);
        if (! empty($filters['entity']) && ! IntegratorEntityRegistry::exists($filters['entity'])) {
            abort(422, 'Entitas filter tidak dikenal.');
        }

        $query = IntegratorSyncJobItem::query()->with('job')->whereIn('status', ['SUCCESS', 'FAILED']);
        $this->applyFilters($query, $filters);
        $statsQuery = clone $query;
        $total = (clone $query)->count();
        $success = (clone $statsQuery)->where('status', 'SUCCESS')->count();
        $failed = (clone $statsQuery)->where('status', 'FAILED')->count();
        $avgDuration = (int) round((float) ((clone $statsQuery)->whereNotNull('duration_ms')->avg('duration_ms') ?? 0));
        $page = max(1, (int) ($filters['page'] ?? 1));
        $perPage = max(1, min(250, (int) ($filters['perPage'] ?? 25)));
        $rows = $query->latest('created_at')->forPage($page, $perPage)->get();

        return response()->json([
            'data' => $rows->map(fn (IntegratorSyncJobItem $item): array => $this->toDto($item))->values()->all(),
            'meta' => ['page' => $page, 'perPage' => $perPage, 'total' => $total, 'lastPage' => max(1, (int) ceil($total / $perPage))],
            'stats' => ['total' => $total, 'success' => $success, 'failed' => $failed, 'avgDurationMs' => $avgDuration],
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $item = IntegratorSyncJobItem::query()->with('job')->whereIn('status', ['SUCCESS', 'FAILED'])->findOrFail($id);

        return response()->json($this->toDto($item));
    }

    /** @param Builder<IntegratorSyncJobItem> $query
     * @param  array<string,mixed>  $filters
     */
    private function applyFilters(Builder $query, array $filters): void
    {
        if (! empty($filters['entity'])) {
            $query->where('entity', $filters['entity']);
        }
        if (! empty($filters['status'])) {
            $query->where('status', strtoupper((string) $filters['status']));
        }
        if (! empty($filters['errorCategory'])) {
            $query->where('error_category', $filters['errorCategory']);
        }
        if (! empty($filters['jobId'])) {
            $query->where('job_id', $filters['jobId']);
        }
        $search = trim((string) ($filters['search'] ?? ''));
        if ($search !== '') {
            $query->where(function (Builder $where) use ($search): void {
                $where->where('local_label', 'like', '%'.$search.'%')
                    ->orWhere('message', 'like', '%'.$search.'%')
                    ->orWhere('request_id', 'like', '%'.$search.'%')
                    ->orWhere('local_id', 'like', '%'.$search.'%')
                    ->orWhere('job_id', 'like', '%'.$search.'%');
            });
        }
    }

    /** @return array<string,mixed> */
    private function toDto(IntegratorSyncJobItem $item): array
    {
        $response = SensitiveDataSanitizer::sanitize($item->response);
        $response = is_array($response) ? $response : null;
        $neoCode = is_array($response) ? data_get($response, 'error_code') : null;
        $neoMessage = is_array($response) ? data_get($response, 'error_desc') : null;

        return [
            'id' => (string) $item->id,
            'requestId' => (string) ($item->request_id ?? $item->id),
            'entity' => $item->entity,
            'localId' => (string) $item->local_id,
            'localLabel' => (string) ($item->local_label ?? ''),
            'pddiktiId' => $item->pddikti_id,
            'act' => (string) $item->act,
            'action' => $item->action,
            'payload' => SensitiveDataSanitizer::sanitize($item->payload),
            'response' => $response,
            'httpStatus' => $item->response_code === null ? null : (int) $item->response_code,
            'neoFeederCode' => is_numeric($neoCode) ? (int) $neoCode : null,
            'neoFeederMessage' => is_string($neoMessage) ? $neoMessage : $item->message,
            'status' => $item->status === 'SUCCESS' ? 'success' : 'failed',
            'errorCategory' => $item->error_category,
            'durationMs' => (int) ($item->duration_ms ?? 0),
            'attempt' => (int) $item->attempts,
            'user' => (string) ($item->job?->created_by_name ?? '—'),
            'jobId' => (string) $item->job_id,
            'createdAt' => $item->created_at?->toISOString(),
        ];
    }
}
