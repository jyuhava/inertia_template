<?php

namespace App\Http\Controllers\Integrator;

use App\Http\Controllers\Controller;
use App\Services\Integrator\IntegratorAuditService;
use App\Services\Integrator\IntegratorConnectionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConnectionController extends Controller
{
    public function __construct(
        private readonly IntegratorConnectionService $connection,
        private readonly IntegratorAuditService $audit,
    ) {}

    public function show(): JsonResponse
    {
        return response()->json($this->connection->response());
    }

    public function save(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'profile' => ['sometimes', 'array'],
            'profile.baseUrl' => ['sometimes', 'nullable', 'url', 'max:500'],
            'profile.webServiceUrl' => ['sometimes', 'nullable', 'url', 'max:500'],
            'profile.username' => ['sometimes', 'string', 'max:255'],
            'profile.timeoutSeconds' => ['sometimes', 'integer', 'min:3', 'max:120'],
            'profile.retryCount' => ['sometimes', 'integer', 'min:0', 'max:5'],
            'profile.active' => ['sometimes', 'boolean'],
            'profile.useProxy' => ['sometimes', 'boolean'],
            // The password is accepted only over this authenticated backend API;
            // it is encrypted at rest and is never included in any response.
            'password' => ['sometimes', 'nullable', 'string', 'max:4096'],
        ]);

        $profile = $this->connection->saveProfile(
            is_array($validated['profile'] ?? null) ? $validated['profile'] : [],
            isset($validated['password']) ? (string) $validated['password'] : null,
        );
        $this->audit->record($request, 'CONNECTION_PROFILE_SAVED', result: [
            'profile' => array_diff_key($profile, ['passwordConfigured' => true]),
            'passwordSubmitted' => isset($validated['password']) && $validated['password'] !== '',
        ]);

        return response()->json(['profile' => $profile, 'status' => $this->connection->statusDto()]);
    }

    public function test(Request $request): JsonResponse
    {
        $result = $this->connection->test();
        $this->audit->record($request, 'CONNECTION_TEST', successCount: $result['status'] === 'CONNECTED' ? 1 : 0, failedCount: $result['status'] === 'CONNECTED' ? 0 : 1, result: [
            'status' => $result['status'],
            'latencyMs' => $result['latencyMs'],
            'steps' => $result['steps'],
        ]);

        return response()->json($result);
    }

    public function authenticate(Request $request): JsonResponse
    {
        $result = $this->connection->authenticate();
        $success = $result['status'] === 'CONNECTED';
        $this->audit->record($request, 'NEOFEEDER_AUTHENTICATE', successCount: $success ? 1 : 0, failedCount: $success ? 0 : 1, result: ['status' => $result['status']]);

        return response()->json($result);
    }

    public function refreshToken(Request $request): JsonResponse
    {
        $result = $this->connection->refreshToken();
        $success = $result['status'] === 'CONNECTED';
        $this->audit->record($request, 'NEOFEEDER_TOKEN_REFRESH', successCount: $success ? 1 : 0, failedCount: $success ? 0 : 1, result: ['status' => $result['status']]);

        return response()->json($result);
    }

    public function syncDictionary(Request $request): JsonResponse
    {
        $result = $this->connection->syncDictionary();
        $success = (bool) $result['synced'];
        $this->audit->record($request, 'NEOFEEDER_DICTIONARY_SYNC', successCount: $success ? 1 : 0, failedCount: $success ? 0 : 1, result: [
            'synced' => $success,
            'actCount' => $result['actCount'],
            'version' => $result['version'],
        ]);

        return response()->json($result);
    }
}
