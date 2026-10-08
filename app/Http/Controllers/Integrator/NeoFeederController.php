<?php

namespace App\Http\Controllers\Integrator;

use App\Http\Controllers\Controller;
use App\Services\Integrator\IntegratorAuditService;
use App\Services\Integrator\IntegratorConnectionService;
use App\Services\Integrator\IntegratorEntityRegistry;
use App\Services\Integrator\IntegratorReferenceRegistry;
use App\Services\Integrator\NeoFeederException;
use App\Services\Integrator\SensitiveDataSanitizer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class NeoFeederController extends Controller
{
    public function __construct(
        private readonly IntegratorConnectionService $connection,
        private readonly IntegratorAuditService $audit,
    ) {}

    public function token(Request $request): JsonResponse
    {
        $result = $this->connection->authenticate();
        $success = $result['status'] === 'CONNECTED';
        $this->audit->record($request, 'NEOFEEDER_TOKEN_REQUEST', successCount: $success ? 1 : 0, failedCount: $success ? 0 : 1, result: ['status' => $result['status']]);

        return response()->json([
            'success' => $success,
            'message' => $result['message'],
            'expiresAt' => $result['tokenExpiresAt'],
            'serverVersion' => $result['serverVersion'],
        ]);
    }

    public function test(Request $request): JsonResponse
    {
        $result = $this->connection->test();
        $success = $result['status'] === 'CONNECTED';
        $this->audit->record($request, 'NEOFEEDER_PROXY_TEST', successCount: $success ? 1 : 0, failedCount: $success ? 0 : 1, result: ['status' => $result['status'], 'latencyMs' => $result['latencyMs']]);

        return response()->json([
            'ok' => $success,
            'message' => $result['message'],
            'latencyMs' => $result['latencyMs'],
            'serverVersion' => $result['serverVersion'],
            'apiStatus' => $result['apiStatus'],
        ]);
    }

    public function call(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'act' => ['required', 'string', 'max:100'],
            'token' => ['prohibited'],
            'filter' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'order' => ['sometimes', 'nullable', 'string', 'max:500'],
            'limit' => ['sometimes', 'integer', 'min:1', 'max:500'],
            'offset' => ['sometimes', 'integer', 'min:0', 'max:1000000'],
            'record' => ['sometimes', 'array'],
        ]);

        $act = $validated['act'];
        $actKind = $this->actKind($act);
        if ($actKind === null || $act === 'GetToken') {
            throw ValidationException::withMessages(['act' => 'Act tidak terdaftar pada registry backend atau harus dipanggil melalui endpoint autentikasi.']);
        }
        if (str_starts_with(strtolower($act), 'delete')) {
            throw ValidationException::withMessages(['act' => 'Operasi hapus tidak diizinkan melalui Integrator.']);
        }
        $record = is_array($validated['record'] ?? null) ? $validated['record'] : null;
        if ($record !== null && $this->containsSensitiveKey($record)) {
            throw ValidationException::withMessages(['record' => 'Payload tidak boleh menyertakan token, password, atau secret.']);
        }

        $write = in_array($actKind, ['insert', 'update'], true);
        if ($write) {
            if (! (bool) config('integrator.neofeeder.allow_write', false)) {
                return $this->failedResult($act, 'Pengiriman tulis dinonaktifkan sampai administrator mengaktifkan integrasi setelah verifikasi skema.', 'VALIDATION_ERROR');
            }
            $verifiedWriteActs = config('integrator.neofeeder.verified_write_acts', []);
            if (! is_array($verifiedWriteActs) || ! in_array($act, $verifiedWriteActs, true)) {
                return $this->failedResult($act, 'Act tulis belum mendapat persetujuan eksplisit pada INTEGRATOR_VERIFIED_WRITE_ACTS.', 'VALIDATION_ERROR');
            }
            if ($record === null || $record === []) {
                throw ValidationException::withMessages(['record' => 'Act tulis memerlukan object record.']);
            }
            if (! $this->connection->isActVerified($act) || ! $this->connection->arePayloadFieldsVerified($act, array_keys($record))) {
                return $this->failedResult($act, 'Act atau field record belum diverifikasi oleh dictionary Neo Feeder yang terpasang.', 'VALIDATION_ERROR');
            }
        }

        $parameters = [];
        foreach (['filter', 'order', 'limit', 'offset'] as $key) {
            if (array_key_exists($key, $validated) && $validated[$key] !== null && $validated[$key] !== '') {
                $parameters[$key] = $validated[$key];
            }
        }
        if ($record !== null) {
            $parameters['record'] = $record;
        }

        $requestId = (string) Str::uuid();
        try {
            $result = $this->connection->callActWithMeta($act, $parameters);
            $body = $result['body'];
            $raw = SensitiveDataSanitizer::sanitize($body);
            $data = $body['data'] ?? [];
            if (is_array($data) && ! array_is_list($data)) {
                $data = [$data];
            }
            $data = is_array($data) ? array_values(array_filter($data, 'is_array')) : [];
            $success = (int) ($body['error_code'] ?? 0) === 0;
            $this->audit->record($request, 'NEOFEEDER_ACT_CALL', successCount: $success ? 1 : 0, failedCount: $success ? 0 : 1, result: [
                'act' => $act,
                'httpStatus' => $result['httpStatus'],
                'durationMs' => $result['durationMs'],
                'code' => $body['error_code'] ?? null,
            ]);

            return response()->json([
                'success' => $success,
                'code' => is_numeric($body['error_code'] ?? null) ? (int) $body['error_code'] : 0,
                'message' => SensitiveDataSanitizer::sanitizeText((string) ($body['error_desc'] ?? '')),
                'data' => $data,
                'raw' => is_array($raw) ? $raw : [],
                'act' => $act,
                'requestId' => $requestId,
                'durationMs' => $result['durationMs'],
                'attempts' => 1,
                'httpStatus' => $result['httpStatus'],
                'mocked' => false,
            ]);
        } catch (NeoFeederException $exception) {
            $this->audit->record($request, 'NEOFEEDER_ACT_CALL', successCount: 0, failedCount: 1, result: [
                'act' => $act,
                'category' => $exception->category,
                'httpStatus' => $exception->httpStatus,
            ]);

            return $this->failedResult($act, $exception->getMessage(), $exception->category, $requestId, $exception->httpStatus, $exception->response);
        }
    }

    public function dictionary(): JsonResponse
    {
        $dictionary = $this->connection->dictionaryMeta();
        $verified = (bool) ($dictionary['synced'] ?? false);
        $acts = [];
        foreach ($this->knownActs() as $act => $metadata) {
            $actVerified = $this->connection->isActVerified($act);
            $acts[] = [
                'act' => $act,
                'label' => $metadata['label'],
                'kind' => $metadata['kind'],
                'entity' => $metadata['entity'],
                'counterpart' => null,
                'supportsFilter' => str_starts_with($act, 'Get'),
                'supportsOrder' => str_starts_with($act, 'Get'),
                'supportsPaging' => str_starts_with($act, 'Get'),
                'requiresRecord' => in_array($metadata['kind'], ['insert', 'update'], true),
                'recordFields' => [],
                'responseIdField' => null,
                'schemaSource' => $actVerified ? 'ws-dictionary' : 'assumed',
                'availableSince' => null,
                'notes' => $actVerified ? null : 'Belum terlihat pada dictionary Neo Feeder tersimpan; tidak boleh dipakai untuk write.',
            ];
        }

        return response()->json([
            'version' => (string) ($dictionary['version'] ?? config('integrator.neofeeder.version', 'unknown')),
            'fetchedAt' => (string) ($dictionary['fetchedAt'] ?? now()->toISOString()),
            'source' => $verified ? 'ws-dictionary' : 'assumed',
            'acts' => $acts,
        ]);
    }

    /** @return array<string,array{label:string,kind:string,entity:?string}> */
    private function knownActs(): array
    {
        $acts = [
            'GetToken' => ['label' => 'Autentikasi', 'kind' => 'auth', 'entity' => null],
            'GetDictionary' => ['label' => 'Dictionary', 'kind' => 'reference', 'entity' => null],
        ];
        foreach (IntegratorEntityRegistry::definitions() as $entity => $definition) {
            foreach ($definition['acts'] as $kind => $act) {
                if (! is_string($act) || $act === '') {
                    continue;
                }
                $acts[$act] = [
                    'label' => $definition['label'].' — '.$kind,
                    'kind' => in_array($kind, ['insert', 'update'], true) ? $kind : (in_array($kind, ['list', 'detail', 'count'], true) ? $kind : 'report'),
                    'entity' => $entity,
                ];
            }
        }
        foreach (IntegratorReferenceRegistry::definitions() as $definition) {
            if ($definition['act'] !== '') {
                $acts[$definition['act']] = ['label' => $definition['label'], 'kind' => 'reference', 'entity' => null];
            }
        }

        return $acts;
    }

    private function actKind(string $act): ?string
    {
        return $this->knownActs()[$act]['kind'] ?? null;
    }

    private function containsSensitiveKey(array $value): bool
    {
        foreach ($value as $key => $child) {
            if (in_array(strtolower((string) $key), ['token', 'password', 'secret', 'authorization', 'api_key'], true)) {
                return true;
            }
            if (is_array($child) && $this->containsSensitiveKey($child)) {
                return true;
            }
        }

        return false;
    }

    private function failedResult(string $act, string $message, string $category, ?string $requestId = null, ?int $httpStatus = null, ?array $raw = null): JsonResponse
    {
        return response()->json([
            'success' => false,
            'code' => match ($category) {
                'AUTH_ERROR' => 401,
                'VALIDATION_ERROR' => 422,
                default => -1,
            },
            'message' => SensitiveDataSanitizer::sanitizeText($message),
            'data' => [],
            'raw' => SensitiveDataSanitizer::sanitize($raw ?? []),
            'act' => $act,
            'requestId' => $requestId ?? (string) Str::uuid(),
            'durationMs' => 0,
            'attempts' => 0,
            'httpStatus' => $httpStatus,
            'mocked' => false,
            'errorCategory' => $category,
        ]);
    }
}
