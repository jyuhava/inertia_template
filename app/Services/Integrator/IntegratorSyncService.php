<?php

namespace App\Services\Integrator;

use App\Models\IntegratorSyncJob;
use App\Models\IntegratorSyncJobItem;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

/** Durable sync-job lifecycle. No operation in this service deletes PDDikti data. */
class IntegratorSyncService
{
    public function __construct(
        private readonly IntegratorEntityService $entities,
        private readonly IntegratorMappingService $mappings,
        private readonly IntegratorConnectionService $connection,
    ) {}

    /** @param array<string,mixed> $payload */
    public function create(array $payload, User $user): IntegratorSyncJob
    {
        $entity = (string) $payload['entity'];
        $ids = array_values(array_unique(array_map('strval', $payload['ids'])));
        $maxItems = (int) config('integrator.sync.max_items_per_job', 500);
        if (count($ids) > $maxItems) {
            throw new \InvalidArgumentException("Satu job dibatasi maksimal {$maxItems} record.");
        }

        $preview = $this->entities->preview($entity, $ids, (bool) $payload['dryRun']);
        $rowsFound = count($preview['items']);
        if ($rowsFound !== count($ids)) {
            throw new \InvalidArgumentException('Satu atau lebih localId tidak ditemukan untuk entitas ini.');
        }

        return DB::transaction(function () use ($payload, $user, $entity, $preview): IntegratorSyncJob {
            $job = IntegratorSyncJob::query()->create([
                'entity' => $entity,
                'status' => 'QUEUED',
                'dry_run' => (bool) $payload['dryRun'],
                'period_id' => $payload['periodId'] ?? null,
                'period_label' => $payload['periodLabel'] ?? null,
                'prodi_id' => $payload['prodiId'] ?? null,
                'prodi_label' => $payload['prodiLabel'] ?? null,
                'user_id' => $user->getAuthIdentifier(),
                'created_by_name' => (string) ($user->name ?? $user->email ?? 'Operator'),
                'total' => count($preview['items']),
                'processed' => 0,
                'success' => 0,
                'failed' => 0,
                'skipped' => 0,
                'invalid' => 0,
                'cancel_requested' => false,
                'notes' => (bool) $payload['dryRun'] ? 'DRY RUN: tidak ada request tulis yang dikirim ke Neo Feeder.' : null,
            ]);

            foreach ($preview['items'] as $item) {
                $blocking = collect($item['issues'])->contains(fn (array $issue): bool => in_array($issue['severity'], ['critical', 'error'], true));
                $dependencyBlocked = ! ($item['dependencies']['ok'] ?? false);
                $status = $blocking ? 'INVALID' : (($item['action'] === 'SKIP' || $dependencyBlocked) ? 'SKIPPED' : 'PENDING');
                $message = $blocking
                    ? $this->firstBlockingMessage($item['issues'])
                    : ($dependencyBlocked ? $this->firstBlockerMessage($item['dependencies']['blockers'] ?? []) : ($status === 'SKIPPED' ? 'Entitas/action tidak dapat dikirim; tidak ada operasi hapus otomatis.' : null));

                IntegratorSyncJobItem::query()->create([
                    'job_id' => $job->id,
                    'entity' => $entity,
                    'local_id' => (string) $item['localId'],
                    'local_label' => (string) $item['localLabel'],
                    'pddikti_id' => $this->mappings->externalIdFor($entity, (string) $item['localId']),
                    'act' => (string) $item['act'],
                    'action' => (string) $item['action'],
                    'status' => $status,
                    'attempts' => 0,
                    'max_attempts' => max(1, (int) config('integrator.neofeeder.retry_count', 2) + 1),
                    'message' => $message,
                    'payload' => SensitiveDataSanitizer::sanitize($item['record']),
                ]);
            }

            return $job->load('items');
        });
    }

    /** Execute an existing job. */
    public function run(string $id): IntegratorSyncJob
    {
        $job = IntegratorSyncJob::query()->with('items')->findOrFail($id);
        if (in_array($job->status, ['COMPLETED', 'PARTIAL', 'FAILED', 'CANCELLED'], true)) {
            return $job;
        }

        $job->forceFill(['status' => 'RUNNING', 'started_at' => $job->started_at ?? now()])->save();
        $items = $job->items()->orderBy('created_at')->get();

        foreach ($items as $item) {
            $job->refresh();
            if ($job->cancel_requested) {
                $item->refresh();
                if ($item->status === 'PENDING') {
                    $item->forceFill(['status' => 'SKIPPED', 'message' => 'Job dibatalkan operator sebelum item diproses.', 'finished_at' => now()])->save();
                }

                continue;
            }
            if ($item->status !== 'PENDING') {
                continue;
            }

            if ($job->dry_run) {
                $item->forceFill([
                    'status' => 'SKIPPED',
                    'message' => 'DRY RUN: validasi/preview selesai; tidak ada request tulis ke Neo Feeder.',
                    'finished_at' => now(),
                    'duration_ms' => 0,
                ])->save();
                $this->refreshCounts($job);

                continue;
            }

            $this->runItem($job, $item);
            $this->refreshCounts($job);
        }

        $job->refresh();
        $this->refreshCounts($job, true);

        return $job->fresh('items');
    }

    private function runItem(IntegratorSyncJob $job, IntegratorSyncJobItem $item): void
    {
        $preview = $this->entities->preview($item->entity, [(string) $item->local_id], false);
        $current = $preview['items'][0] ?? null;
        if ($current === null) {
            $this->failItem($item, 'VALIDATION_ERROR', 'Data sumber tidak ditemukan saat job dijalankan.', null, null, 0);

            return;
        }

        $blocking = collect($current['issues'])->contains(fn (array $issue): bool => in_array($issue['severity'], ['critical', 'error'], true));
        if ($blocking) {
            $item->forceFill([
                'status' => 'INVALID',
                'message' => $this->firstBlockingMessage($current['issues']),
                'finished_at' => now(),
                'payload' => SensitiveDataSanitizer::sanitize($current['record']),
            ])->save();

            return;
        }
        if (! ($current['dependencies']['ok'] ?? false)) {
            $item->forceFill([
                'status' => 'SKIPPED',
                'message' => $this->firstBlockerMessage($current['dependencies']['blockers'] ?? []),
                'finished_at' => now(),
            ])->save();

            return;
        }
        if ($current['action'] === 'SKIP') {
            $item->forceFill(['status' => 'SKIPPED', 'message' => 'Act tidak tersedia untuk aksi ini; tidak dilakukan operasi hapus.', 'finished_at' => now()])->save();

            return;
        }
        if (! (bool) config('integrator.neofeeder.allow_write', false)) {
            $this->failItem($item, 'PDDIKTI_ERROR', 'Pengiriman langsung dinonaktifkan. Aktifkan INTEGRATOR_ALLOW_WRITE hanya setelah skema, referensi, dan konfigurasi Feeder diverifikasi.', null, null, 0);

            return;
        }
        $verifiedWriteActs = config('integrator.neofeeder.verified_write_acts', []);
        if (! is_array($verifiedWriteActs) || ! in_array((string) $current['act'], $verifiedWriteActs, true)) {
            $this->failItem($item, 'VALIDATION_ERROR', 'Act tulis belum mendapat persetujuan eksplisit pada INTEGRATOR_VERIFIED_WRITE_ACTS; tidak ada request yang dikirim.', null, null, 0);

            return;
        }
        $record = $current['record'];
        if ($record === []) {
            $this->failItem($item, 'VALIDATION_ERROR', 'Payload kosong setelah normalisasi; tidak ada request yang dikirim.', null, null, 0);

            return;
        }
        if (! $this->connection->isActVerified((string) $current['act'])
            || ! $this->connection->arePayloadFieldsVerified((string) $current['act'], array_keys($record))) {
            $this->failItem($item, 'VALIDATION_ERROR', 'Act atau field record belum terverifikasi dalam dictionary Neo Feeder yang terpasang; request tulis diblokir.', null, null, 0);

            return;
        }

        $autoAttempts = max(1, (int) config('integrator.neofeeder.retry_count', 2) + 1);
        $attemptLimit = min((int) $item->max_attempts, (int) $item->attempts + $autoAttempts);
        $attemptLimit = max((int) $item->attempts + 1, $attemptLimit);
        $existingExternalId = $this->mappings->externalIdFor($item->entity, (string) $item->local_id) ?? $item->pddikti_id;
        $startTime = microtime(true);
        $lastRequestId = null;
        for ($attempt = (int) $item->attempts + 1; $attempt <= $attemptLimit; $attempt++) {
            $lastRequestId = (string) Str::uuid();
            $item->forceFill([
                'status' => 'RUNNING',
                'action' => $current['action'],
                'act' => $current['act'],
                'pddikti_id' => $current['action'] === 'UPDATE' ? $existingExternalId : $item->pddikti_id,
                'attempts' => $attempt,
                'started_at' => $item->started_at ?? now(),
                'request_id' => $lastRequestId,
                'payload' => SensitiveDataSanitizer::sanitize($record),
                'message' => null,
                'error_category' => null,
            ])->save();

            try {
                $result = $this->connection->callActWithMeta((string) $current['act'], ['record' => $record]);
                $body = $result['body'];
                $externalId = $current['action'] === 'UPDATE'
                    ? ($item->pddikti_id ?? $current['pddiktiId'] ?? null)
                    : $this->extractReturnedId($current['entity'], $body);
                if ($externalId === null || $externalId === '') {
                    throw new NeoFeederException('Neo Feeder menerima request tetapi tidak mengembalikan ID yang dapat dipetakan; item tidak ditandai berhasil.', 'PDDIKTI_ERROR', $result['httpStatus'], $body['error_code'] ?? null, SensitiveDataSanitizer::sanitize($body));
                }

                $message = 'Neo Feeder mengembalikan respons sukses dan ID eksternal tersimpan.';
                $safeResponse = SensitiveDataSanitizer::sanitize($body);
                $item->forceFill([
                    'status' => 'SUCCESS',
                    'pddikti_id' => (string) $externalId,
                    'response' => $safeResponse,
                    'response_code' => $result['httpStatus'],
                    'duration_ms' => $result['durationMs'],
                    'message' => $message,
                    'error_category' => null,
                    'finished_at' => now(),
                ])->save();
                $this->mappings->recordSync($item->entity, (string) $item->local_id, (string) $externalId, $current['action'], true, $message);

                return;
            } catch (NeoFeederException $exception) {
                $safeMessage = SensitiveDataSanitizer::sanitizeText($exception->getMessage(), [$this->connectionTokenForRedaction()]);
                $item->forceFill([
                    'status' => 'FAILED',
                    'message' => $safeMessage,
                    'error_category' => $exception->category,
                    'response_code' => $exception->httpStatus,
                    'response' => $exception->response === null ? null : SensitiveDataSanitizer::sanitize($exception->response),
                    'duration_ms' => (int) round((microtime(true) - $startTime) * 1000),
                    'finished_at' => now(),
                ])->save();

                if (! $this->isRetryable($exception->category) || $attempt >= $attemptLimit) {
                    $this->mappings->recordSync($item->entity, (string) $item->local_id, $item->pddikti_id, $current['action'], false, $safeMessage);

                    return;
                }
                $baseDelay = max(0, (int) config('integrator.neofeeder.retry_delay_ms', 500));
                if ($baseDelay > 0) {
                    usleep(min(2_000_000, $baseDelay * (2 ** ($attempt - 1))) * 1000);
                }
            } catch (Throwable) {
                $this->failItem($item, 'UNKNOWN_ERROR', 'Terjadi kesalahan internal saat memproses item. Detail teknis tidak dicatat karena mungkin memuat informasi sensitif.', null, $lastRequestId, (int) round((microtime(true) - $startTime) * 1000));

                return;
            }
        }
    }

    private function connectionTokenForRedaction(): ?string
    {
        // The connection service deliberately does not expose the token. The
        // sanitizer still masks key/value patterns in exception messages.
        return null;
    }

    private function failItem(IntegratorSyncJobItem $item, string $category, string $message, ?int $httpStatus, ?string $requestId, int $duration): void
    {
        $item->forceFill([
            'status' => 'FAILED',
            'message' => SensitiveDataSanitizer::sanitizeText($message),
            'error_category' => $category,
            'response_code' => $httpStatus,
            'request_id' => $requestId,
            'duration_ms' => $duration,
            'finished_at' => now(),
        ])->save();
        $this->mappings->recordSync($item->entity, (string) $item->local_id, $item->pddikti_id, $item->action, false, $message);
    }

    private function isRetryable(string $category): bool
    {
        return in_array($category, ['NETWORK_ERROR', 'TIMEOUT', 'SERVER_ERROR', 'AUTH_ERROR'], true);
    }

    /** @param array<string,mixed> $body */
    private function extractReturnedId(string $entity, array $body): ?string
    {
        $keys = match ($entity) {
            'mahasiswa' => ['id_mahasiswa', 'id_registrasi_mahasiswa', 'id'],
            'riwayat-pendidikan' => ['id_registrasi_mahasiswa', 'id_riwayat_pendidikan', 'id'],
            'kurikulum' => ['id_kurikulum', 'id'],
            'mata-kuliah' => ['id_matkul', 'id_mata_kuliah', 'id'],
            'mata-kuliah-kurikulum' => ['id_matkul_kurikulum', 'id', 'id_kurikulum_matkul'],
            'kelas' => ['id_kelas_kuliah', 'id'],
            'dosen-pengajar' => ['id_aktivitas_mengajar', 'id_dosen_pengajar_kelas_kuliah', 'id'],
            'krs' => ['id_peserta_kelas_kuliah', 'id'],
            'nilai' => ['id_registrasi_mahasiswa', 'id'],
            'aktivitas-mahasiswa' => ['id_aktivitas', 'id'],
            'kelulusan' => ['id_registrasi_mahasiswa', 'id'],
            default => ['id'],
        };
        $data = $body['data'] ?? null;
        if (is_array($data) && array_is_list($data)) {
            $data = $data[0] ?? null;
        }
        if (is_array($data)) {
            foreach ($keys as $key) {
                if (isset($data[$key]) && is_scalar($data[$key])) {
                    return (string) $data[$key];
                }
            }
        }
        foreach ($keys as $key) {
            if (isset($body[$key]) && is_scalar($body[$key])) {
                return (string) $body[$key];
            }
        }

        return null;
    }

    private function firstBlockingMessage(array $issues): string
    {
        foreach ($issues as $issue) {
            if (in_array($issue['severity'] ?? '', ['critical', 'error'], true)) {
                return (string) ($issue['message'] ?? 'Data tidak lolos validasi.');
            }
        }

        return 'Data tidak lolos validasi.';
    }

    private function firstBlockerMessage(array $blockers): string
    {
        return (string) ($blockers[0]['reason'] ?? 'Dependency data belum terpenuhi.');
    }

    private function refreshCounts(IntegratorSyncJob $job, bool $finish = false): void
    {
        $items = $job->items()->get();
        $success = $items->where('status', 'SUCCESS')->count();
        $failed = $items->where('status', 'FAILED')->count();
        $skipped = $items->where('status', 'SKIPPED')->count();
        $invalid = $items->where('status', 'INVALID')->count();
        $processed = $success + $failed + $skipped + $invalid;

        $values = [
            'success' => $success,
            'failed' => $failed,
            'skipped' => $skipped,
            'invalid' => $invalid,
            'processed' => $processed,
        ];
        if ($finish || $processed >= (int) $job->total) {
            $values['finished_at'] = now();
            if ($job->cancel_requested) {
                $values['status'] = 'CANCELLED';
            } elseif ($failed > 0 && $success === 0) {
                $values['status'] = 'FAILED';
            } elseif ($failed > 0 || $invalid > 0) {
                $values['status'] = 'PARTIAL';
            } else {
                $values['status'] = 'COMPLETED';
            }
        } else {
            $values['status'] = 'RUNNING';
        }
        $job->forceFill($values)->save();
    }

    /** @return array<string,mixed> */
    public function order(): array
    {
        $result = [];
        foreach (IntegratorEntityRegistry::syncOrder() as $step) {
            $stats = $this->mappings->stats($step['entity']);
            $dependenciesReady = true;
            foreach ($step['dependsOn'] as $dependency) {
                $parent = $this->mappings->stats($dependency);
                if ($parent['total'] > 0 && $parent['mapped'] < $parent['total']) {
                    $dependenciesReady = false;
                }
            }
            $ready = $dependenciesReady && $stats['invalid'] === 0;
            $result[] = [
                'order' => $step['order'],
                'entity' => $step['entity'],
                'label' => $step['label'],
                'dependsOn' => $step['dependsOn'],
                'mandatory' => $step['mandatory'],
                'mapped' => $stats['mapped'],
                'unmapped' => $stats['unmapped'],
                'total' => $stats['total'],
                'ready' => $ready,
                'capability' => $step['capability'],
                'capabilityNote' => $step['capabilityNote'],
            ];
        }

        return $result;
    }

    /** @param array<string,mixed> $filters
     * @return array<string,mixed>
     */
    public function index(array $filters): array
    {
        $query = IntegratorSyncJob::query();
        if (! empty($filters['entity'])) {
            $query->where('entity', $filters['entity']);
        }
        if (! empty($filters['status'])) {
            $query->where('status', strtoupper((string) $filters['status']));
        }
        $search = trim((string) ($filters['search'] ?? ''));
        if ($search !== '') {
            $query->where(function (Builder $where) use ($search): void {
                $where->where('id', 'like', '%'.$search.'%')->orWhere('created_by_name', 'like', '%'.$search.'%');
            });
        }

        $statsSource = IntegratorSyncJob::query();
        $jobStats = [
            'queued' => (clone $statsSource)->where('status', 'QUEUED')->count(),
            'running' => (clone $statsSource)->where('status', 'RUNNING')->count(),
            'completed' => (clone $statsSource)->where('status', 'COMPLETED')->count(),
            'partial' => (clone $statsSource)->where('status', 'PARTIAL')->count(),
            'failed' => (clone $statsSource)->where('status', 'FAILED')->count(),
            'totalItems' => (int) IntegratorSyncJobItem::query()->count(),
            'successItems' => (int) IntegratorSyncJobItem::query()->where('status', 'SUCCESS')->count(),
            'failedItems' => (int) IntegratorSyncJobItem::query()->where('status', 'FAILED')->count(),
        ];
        $page = max(1, (int) ($filters['page'] ?? 1));
        $perPage = max(1, min(100, (int) ($filters['perPage'] ?? 25)));
        $total = (clone $query)->count();
        $jobs = $query->latest('created_at')->forPage($page, $perPage)->get();

        return [
            'data' => $jobs->map(fn (IntegratorSyncJob $job): array => $this->toDto($job, false))->values()->all(),
            'meta' => ['page' => $page, 'perPage' => $perPage, 'total' => $total, 'lastPage' => max(1, (int) ceil($total / $perPage))],
            'stats' => $jobStats,
        ];
    }

    public function find(string $id): IntegratorSyncJob
    {
        return IntegratorSyncJob::query()->with('items')->findOrFail($id);
    }

    /** @return array<string,mixed> */
    public function toDto(IntegratorSyncJob $job, bool $includeItems = true): array
    {
        if ($includeItems && ! $job->relationLoaded('items')) {
            $job->load('items');
        }
        $order = 0;
        foreach (IntegratorEntityRegistry::syncOrder() as $step) {
            if ($step['entity'] === $job->entity) {
                $order = (int) $step['order'];
                break;
            }
        }

        return [
            'id' => (string) $job->id,
            'entity' => (string) $job->entity,
            'status' => (string) $job->status,
            'dryRun' => (bool) $job->dry_run,
            'periodId' => $job->period_id === null ? null : (string) $job->period_id,
            'periodLabel' => $job->period_label,
            'prodiId' => $job->prodi_id === null ? null : (string) $job->prodi_id,
            'prodiLabel' => $job->prodi_label,
            'createdBy' => (string) $job->created_by_name,
            'createdAt' => $job->created_at?->toISOString(),
            'startedAt' => $job->started_at?->toISOString(),
            'finishedAt' => $job->finished_at?->toISOString(),
            'total' => (int) $job->total,
            'processed' => (int) $job->processed,
            'success' => (int) $job->success,
            'failed' => (int) $job->failed,
            'skipped' => (int) $job->skipped,
            'invalid' => (int) $job->invalid,
            'cancelRequested' => (bool) $job->cancel_requested,
            'items' => $includeItems ? $job->items->map(fn (IntegratorSyncJobItem $item): array => $this->itemDto($item))->values()->all() : [],
            'order' => $order,
            'notes' => $job->notes,
        ];
    }

    /** @return array<string,mixed> */
    private function itemDto(IntegratorSyncJobItem $item): array
    {
        return [
            'id' => (string) $item->id,
            'jobId' => (string) $item->job_id,
            'entity' => $item->entity,
            'localId' => (string) $item->local_id,
            'localLabel' => (string) ($item->local_label ?? ''),
            'pddiktiId' => $item->pddikti_id,
            'act' => (string) $item->act,
            'action' => $item->action,
            'status' => $item->status,
            'attempts' => (int) $item->attempts,
            'maxAttempts' => (int) $item->max_attempts,
            'message' => $item->message,
            'errorCategory' => $item->error_category,
            'durationMs' => $item->duration_ms === null ? null : (int) $item->duration_ms,
            'startedAt' => $item->started_at?->toISOString(),
            'finishedAt' => $item->finished_at?->toISOString(),
            'responseCode' => $item->response_code === null ? null : (int) $item->response_code,
            'requestId' => $item->request_id,
        ];
    }

    public function retryFailed(string $id): IntegratorSyncJob
    {
        $job = IntegratorSyncJob::query()->with('items')->findOrFail($id);
        if (in_array($job->status, ['RUNNING', 'QUEUED'], true)) {
            throw new RuntimeException('Job yang masih berjalan tidak dapat di-retry.');
        }

        $retryable = $job->items->filter(static fn (IntegratorSyncJobItem $item): bool => $item->status === 'FAILED' && $item->isRetryable() && $item->attempts < $item->max_attempts
        );
        if ($retryable->isEmpty()) {
            throw new RuntimeException('Tidak ada item gagal teknis yang masih boleh di-retry.');
        }

        DB::transaction(function () use ($job, $retryable): void {
            foreach ($retryable as $item) {
                $item->forceFill(['status' => 'PENDING', 'message' => null, 'error_category' => null, 'finished_at' => null])->save();
            }
            $job->forceFill([
                'status' => 'QUEUED',
                'processed' => max(0, (int) $job->processed - $retryable->count()),
                'failed' => max(0, (int) $job->failed - $retryable->count()),
                'finished_at' => null,
                'cancel_requested' => false,
                'notes' => 'Retry hanya mencakup kegagalan teknis; item validasi/konflik tidak dikirim ulang.',
            ])->save();
        });

        return $job->fresh('items');
    }

    public function cancel(string $id): IntegratorSyncJob
    {
        $job = IntegratorSyncJob::query()->with('items')->findOrFail($id);
        if (in_array($job->status, ['COMPLETED', 'PARTIAL', 'FAILED', 'CANCELLED'], true)) {
            return $job;
        }
        $job->forceFill(['cancel_requested' => true])->save();
        if ($job->status === 'QUEUED') {
            $job->items()->where('status', 'PENDING')->update([
                'status' => 'SKIPPED',
                'message' => 'Job dibatalkan operator sebelum dijalankan.',
                'finished_at' => now(),
                'updated_at' => now(),
            ]);
            $this->refreshCounts($job, true);
        }

        return $job->fresh('items');
    }
}
