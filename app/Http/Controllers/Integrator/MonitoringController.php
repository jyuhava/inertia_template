<?php

namespace App\Http\Controllers\Integrator;

use App\Http\Controllers\Controller;
use App\Models\IntegratorSyncJob;
use App\Models\IntegratorSyncJobItem;
use App\Services\Integrator\IntegratorConnectionService;
use App\Services\Integrator\SensitiveDataSanitizer;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class MonitoringController extends Controller
{
    public function __construct(private readonly IntegratorConnectionService $connection) {}

    public function summary(): JsonResponse
    {
        $queue = [
            'queued' => (int) IntegratorSyncJob::query()->where('status', 'QUEUED')->count(),
            'running' => (int) IntegratorSyncJob::query()->where('status', 'RUNNING')->count(),
            'completed' => (int) IntegratorSyncJob::query()->where('status', 'COMPLETED')->count(),
            'failed' => (int) IntegratorSyncJob::query()->whereIn('status', ['FAILED', 'PARTIAL'])->count(),
        ];

        $start = Carbon::today()->subDays(6)->startOfDay();
        $dailyItems = IntegratorSyncJobItem::query()->where('created_at', '>=', $start)->get(['status', 'created_at']);
        $byDate = [];
        for ($day = 0; $day < 7; $day++) {
            $date = $start->copy()->addDays($day)->toDateString();
            $byDate[$date] = ['label' => $start->copy()->addDays($day)->format('d M'), 'success' => 0, 'failed' => 0];
        }
        foreach ($dailyItems as $item) {
            $date = $item->created_at?->toDateString();
            if (! isset($byDate[$date])) {
                continue;
            }
            if ($item->status === 'SUCCESS') {
                $byDate[$date]['success']++;
            } elseif ($item->status === 'FAILED') {
                $byDate[$date]['failed']++;
            }
        }

        $latency = DB::table('integrator_sync_job_items')
            ->select('act', DB::raw('AVG(duration_ms) as avg_ms'), DB::raw('MAX(duration_ms) as max_ms'), DB::raw('COUNT(*) as calls'))
            ->whereNotNull('duration_ms')->where('duration_ms', '>', 0)
            ->groupBy('act')->orderByDesc('calls')->limit(25)->get()
            ->map(static fn ($row): array => ['act' => (string) $row->act, 'avgMs' => (int) round((float) $row->avg_ms), 'maxMs' => (int) $row->max_ms, 'calls' => (int) $row->calls])
            ->values()->all();

        $errorBreakdown = IntegratorSyncJobItem::query()->select('error_category', DB::raw('COUNT(*) as total'))
            ->where('status', 'FAILED')->whereNotNull('error_category')->groupBy('error_category')->orderByDesc('total')->get()
            ->map(static fn ($row): array => ['category' => (string) $row->error_category, 'count' => (int) $row->total])
            ->values()->all();

        $recentFailures = IntegratorSyncJobItem::query()->with('job')->where('status', 'FAILED')->latest('created_at')->limit(10)->get()
            ->map(fn (IntegratorSyncJobItem $item): array => $this->logDto($item))->values()->all();
        $connection = $this->connection->response();
        $token = $connection['token'];
        $status = $connection['status'];

        return response()->json([
            'queue' => $queue,
            'throughput' => array_values($byDate),
            'latency' => $latency,
            'errorBreakdown' => $errorBreakdown,
            'recentFailures' => $recentFailures,
            'tokenHealth' => [
                'status' => $status['status'],
                'tokenExpiresAt' => $token['expiresAt'],
                'refreshesLast24h' => $token['refreshesLast24h'],
            ],
        ]);
    }

    /** @return array<string,mixed> */
    private function logDto(IntegratorSyncJobItem $item): array
    {
        $response = SensitiveDataSanitizer::sanitize($item->response);
        $response = is_array($response) ? $response : null;
        $neoCode = $response ? data_get($response, 'error_code') : null;
        $neoMessage = $response ? data_get($response, 'error_desc') : null;

        return [
            'id' => (string) $item->id,
            'requestId' => (string) ($item->request_id ?? $item->id),
            'entity' => $item->entity,
            'localId' => (string) $item->local_id,
            'localLabel' => (string) ($item->local_label ?? ''),
            'pddiktiId' => $item->pddikti_id,
            'act' => $item->act,
            'action' => $item->action,
            'payload' => SensitiveDataSanitizer::sanitize($item->payload),
            'response' => $response,
            'httpStatus' => $item->response_code === null ? null : (int) $item->response_code,
            'neoFeederCode' => is_numeric($neoCode) ? (int) $neoCode : null,
            'neoFeederMessage' => is_string($neoMessage) ? $neoMessage : $item->message,
            'status' => 'failed',
            'errorCategory' => $item->error_category,
            'durationMs' => (int) ($item->duration_ms ?? 0),
            'attempt' => (int) $item->attempts,
            'user' => (string) ($item->job?->created_by_name ?? '—'),
            'jobId' => (string) $item->job_id,
            'createdAt' => $item->created_at?->toISOString(),
        ];
    }
}
