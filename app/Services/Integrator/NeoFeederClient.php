<?php

namespace App\Services\Integrator;

use App\Models\IntegratorSetting;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Http;
use Throwable;

/** Small HTTP adapter for the Neo Feeder JSON Web Service contract. */
class NeoFeederClient
{
    public function isConfigured(): bool
    {
        $profile = $this->profile();

        return (bool) config('integrator.enabled', true)
            && (bool) ($profile['active'] ?? false)
            && filter_var($profile['webServiceUrl'] ?? null, FILTER_VALIDATE_URL) !== false
            && trim((string) ($profile['username'] ?? '')) !== ''
            && $this->password() !== null;
    }

    /** @return array{httpStatus:int,body:array<string,mixed>,durationMs:int} */
    public function requestToken(): array
    {
        if (! $this->isConfigured()) {
            throw new NeoFeederException('Koneksi Neo Feeder belum dikonfigurasi lengkap.', 'UNKNOWN_ERROR');
        }

        $profile = $this->profile();
        $started = microtime(true);
        $body = [
            'act' => 'GetToken',
            'username' => $profile['username'],
            'password' => $this->password(),
        ];

        return $this->send($body, $started);
    }

    /** @param array<string,mixed> $parameters
     * @return array{httpStatus:int,body:array<string,mixed>,durationMs:int}
     */
    public function callWithToken(string $act, string $token, array $parameters = []): array
    {
        if (! $this->isConfigured()) {
            throw new NeoFeederException('Koneksi Neo Feeder belum dikonfigurasi lengkap.', 'UNKNOWN_ERROR');
        }
        if ($act === '' || str_starts_with(strtolower($act), 'delete')) {
            throw new NeoFeederException('Act kosong atau operasi hapus tidak diizinkan dari Integrator.', 'VALIDATION_ERROR');
        }

        $body = ['act' => $act, 'token' => $token] + $parameters;

        return $this->send($body, microtime(true));
    }

    /** @return array<string,mixed> */
    public function profile(): array
    {
        $configured = config('integrator.neofeeder', []);
        $override = IntegratorSetting::get('connection.profile', []);
        $override = is_array($override) ? $override : [];

        $baseUrl = trim((string) ($override['baseUrl'] ?? $configured['base_url'] ?? ''));
        $wsUrl = trim((string) ($override['webServiceUrl'] ?? $configured['web_service_url'] ?? ''));
        if ($wsUrl === '' && $baseUrl !== '') {
            $wsUrl = rtrim($baseUrl, '/').'/ws/live2.php';
        }

        return [
            'baseUrl' => $baseUrl,
            'webServiceUrl' => $wsUrl,
            'username' => (string) ($override['username'] ?? $configured['username'] ?? ''),
            'timeoutSeconds' => max(3, min(120, (int) ($override['timeoutSeconds'] ?? $configured['timeout_seconds'] ?? 30))),
            'retryCount' => max(0, min(5, (int) ($override['retryCount'] ?? $configured['retry_count'] ?? 2))),
            'active' => (bool) ($override['active'] ?? true),
            'useProxy' => (bool) ($override['useProxy'] ?? $configured['use_proxy'] ?? false),
        ];
    }

    public function password(): ?string
    {
        $encrypted = IntegratorSetting::get('connection.password_encrypted');
        if (is_string($encrypted) && $encrypted !== '') {
            try {
                return Crypt::decryptString($encrypted);
            } catch (Throwable) {
                return null;
            }
        }

        $environmentPassword = config('integrator.neofeeder.password');

        return is_string($environmentPassword) && $environmentPassword !== '' ? $environmentPassword : null;
    }

    /** @param array<string,mixed> $requestBody
     * @return array{httpStatus:int,body:array<string,mixed>,durationMs:int}
     */
    private function send(array $requestBody, float $startedAt): array
    {
        $profile = $this->profile();
        $timeout = max(3, min(120, (int) $profile['timeoutSeconds']));
        $request = Http::acceptJson()->asJson()->timeout($timeout)->connectTimeout(min($timeout, 10));

        if ($profile['useProxy'] && is_string(config('integrator.neofeeder.proxy')) && config('integrator.neofeeder.proxy') !== '') {
            $request = $request->withOptions(['proxy' => config('integrator.neofeeder.proxy')]);
        }

        try {
            $response = $request->post($profile['webServiceUrl'], $requestBody);
        } catch (ConnectionException $exception) {
            $category = str_contains(strtolower($exception->getMessage()), 'timed out') ? 'TIMEOUT' : 'NETWORK_ERROR';
            throw new NeoFeederException(
                $category === 'TIMEOUT' ? 'Request ke Neo Feeder melewati batas waktu.' : 'Tidak dapat terhubung ke server Neo Feeder.',
                $category,
            );
        } catch (Throwable) {
            throw new NeoFeederException('Terjadi kegagalan komunikasi dengan Neo Feeder.', 'NETWORK_ERROR');
        }

        $decoded = $response->json();
        $body = is_array($decoded) ? $decoded : ['raw' => is_string($response->body()) ? mb_substr($response->body(), 0, 2000) : null];
        $safeBody = SensitiveDataSanitizer::sanitize($body);
        $duration = (int) round((microtime(true) - $startedAt) * 1000);

        if (! $response->successful()) {
            $status = $response->status();
            $category = $status === 401 || $status === 403 ? 'AUTH_ERROR' : ($status >= 500 ? 'SERVER_ERROR' : 'PDDIKTI_ERROR');
            throw new NeoFeederException(
                'Server Neo Feeder mengembalikan HTTP '.$status.'.',
                $category,
                $status,
                null,
                is_array($safeBody) ? $safeBody : null,
            );
        }

        return ['httpStatus' => $response->status(), 'body' => $body, 'durationMs' => $duration];
    }
}
