<?php

namespace App\Services\Integrator;

use App\Models\IntegratorSetting;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;
use Throwable;

/** Connection profile, Feeder authentication, dictionary sync, and safe status DTOs. */
class IntegratorConnectionService
{
    private const TOKEN_CACHE_KEY = 'integrator.neofeeder.token.encrypted';

    public function __construct(private readonly NeoFeederClient $client) {}

    /** @return array<string,mixed> */
    public function response(): array
    {
        $dictionary = $this->dictionaryMeta();
        $token = $this->tokenMeta();

        return [
            'profile' => $this->profileDto(),
            'status' => $this->statusDto(),
            'token' => [
                'expiresAt' => $token['expiresAt'] ?? null,
                'issuedAt' => $token['issuedAt'] ?? null,
                'refreshesLast24h' => $this->refreshCountLast24Hours($token),
            ],
            'dictionary' => [
                'synced' => (bool) ($dictionary['synced'] ?? false),
                'version' => $dictionary['version'] ?? null,
                'fetchedAt' => $dictionary['fetchedAt'] ?? null,
                'actCount' => (int) ($dictionary['actCount'] ?? 0),
            ],
            'events' => $this->events(),
            'retryPolicy' => [
                'maxAttempts' => (int) config('integrator.sync.max_attempts', 3),
                'baseDelayMs' => (int) config('integrator.neofeeder.retry_delay_ms', 500),
            ],
        ];
    }

    /** @return array<string,mixed> */
    public function profileDto(): array
    {
        $profile = $this->client->profile();
        $profile['passwordConfigured'] = $this->client->password() !== null;

        return $profile;
    }

    /** @param array<string,mixed> $profile */
    public function saveProfile(array $profile, ?string $password): array
    {
        $current = IntegratorSetting::get('connection.profile', []);
        $current = is_array($current) ? $current : [];
        $allowed = ['baseUrl', 'webServiceUrl', 'username', 'timeoutSeconds', 'retryCount', 'active', 'useProxy'];

        foreach ($allowed as $key) {
            if (array_key_exists($key, $profile)) {
                $current[$key] = $profile[$key];
            }
        }
        IntegratorSetting::put('connection.profile', $current);

        if ($password !== null && $password !== '') {
            if (! is_string(config('app.key')) || config('app.key') === '') {
                throw new NeoFeederException('APP_KEY belum tersedia; password tidak dapat disimpan dengan aman.', 'UNKNOWN_ERROR');
            }
            IntegratorSetting::put('connection.password_encrypted', Crypt::encryptString($password));
        }

        $this->appendEvent('PROFILE_SAVED', 'success', 'Profil koneksi disimpan. Password tidak dikirim kembali ke browser.');

        return $this->profileDto();
    }

    /** @return array<string,mixed> */
    public function test(): array
    {
        $started = microtime(true);
        $steps = [];
        $profile = $this->client->profile();
        $urlOk = filter_var($profile['webServiceUrl'] ?? null, FILTER_VALIDATE_URL) !== false;
        $credentialsOk = trim((string) ($profile['username'] ?? '')) !== '' && $this->client->password() !== null;
        $steps[] = ['label' => 'Alamat Web Service', 'ok' => $urlOk, 'detail' => $urlOk ? 'URL Web Service tersedia.' : 'Base URL / Web Service URL belum valid.'];
        $steps[] = ['label' => 'Kredensial backend', 'ok' => $credentialsOk, 'detail' => $credentialsOk ? 'Username dan password tersedia di backend.' : 'Kredensial belum dikonfigurasi di backend.'];

        if (! $urlOk || ! $credentialsOk || ! ($profile['active'] ?? false)) {
            $message = 'Koneksi belum siap. Lengkapi konfigurasi backend dan aktifkan integrasi.';
            $this->setStatus('DISCONNECTED', null, 'NOT_CONFIGURED', $message);
            $this->appendEvent('CONNECTION_TEST', 'failed', $message);

            return [
                'status' => 'DISCONNECTED', 'message' => $message, 'latencyMs' => null,
                'serverVersion' => null, 'apiStatus' => 'NOT_CONFIGURED', 'checkedAt' => now()->toISOString(),
                'steps' => $steps,
            ];
        }

        try {
            $this->getOrIssueToken();
            $steps[] = ['label' => 'Autentikasi', 'ok' => true, 'detail' => 'Token diperoleh di backend; nilainya tidak pernah dikirim ke browser.'];
            $probe = $this->callAct('GetProfilPT');
            $steps[] = ['label' => 'Web Service Neo Feeder', 'ok' => true, 'detail' => 'Act GetProfilPT berhasil dipanggil.'];
            $version = $this->extractVersion($probe) ?? (string) config('integrator.neofeeder.version', '');
            $message = 'Koneksi dan autentikasi Neo Feeder berhasil diuji.';
            $this->setStatus('CONNECTED', $version ?: null, 'AVAILABLE', $message);
            $this->appendEvent('CONNECTION_TEST', 'success', $message);

            return [
                'status' => 'CONNECTED', 'message' => $message,
                'latencyMs' => (int) round((microtime(true) - $started) * 1000),
                'serverVersion' => $version ?: null, 'apiStatus' => 'AVAILABLE', 'checkedAt' => now()->toISOString(),
                'steps' => $steps,
            ];
        } catch (NeoFeederException $exception) {
            $steps[] = ['label' => 'Neo Feeder', 'ok' => false, 'detail' => $exception->getMessage()];
            $status = $this->statusForCategory($exception->category);
            $this->setStatus($status, null, $exception->category, $exception->getMessage());
            $this->appendEvent('CONNECTION_TEST', 'failed', $exception->getMessage());

            return [
                'status' => $status, 'message' => $exception->getMessage(),
                'latencyMs' => (int) round((microtime(true) - $started) * 1000),
                'serverVersion' => null, 'apiStatus' => $exception->category, 'checkedAt' => now()->toISOString(),
                'steps' => $steps,
            ];
        }
    }

    /** @return array<string,mixed> */
    public function authenticate(): array
    {
        try {
            $this->issueAndCacheToken();
            $meta = $this->tokenMeta();
            $message = 'Autentikasi Neo Feeder berhasil. Token hanya disimpan pada cache backend.';
            $this->setStatus('CONNECTED', null, 'AUTHENTICATED', $message);
            $this->appendEvent('AUTHENTICATE', 'success', $message);

            return [
                'status' => 'CONNECTED',
                'message' => $message,
                'tokenExpiresAt' => $meta['expiresAt'] ?? null,
                'serverVersion' => $this->statusDto()['serverVersion'],
            ];
        } catch (NeoFeederException $exception) {
            $this->invalidateToken();
            $status = $this->statusForCategory($exception->category);
            $this->setStatus($status, null, $exception->category, $exception->getMessage());
            $this->appendEvent('AUTHENTICATE', 'failed', $exception->getMessage());

            return [
                'status' => $status,
                'message' => $exception->getMessage(),
                'tokenExpiresAt' => null,
                'serverVersion' => null,
            ];
        }
    }

    /** @return array<string,mixed> */
    public function refreshToken(): array
    {
        Cache::forget(self::TOKEN_CACHE_KEY);
        $result = $this->authenticate();
        $this->appendEvent('TOKEN_REFRESH', $result['status'] === 'CONNECTED' ? 'success' : 'failed', (string) $result['message']);

        return $result;
    }

    /** @return array<string,mixed> */
    public function syncDictionary(): array
    {
        try {
            $body = $this->callAct('GetDictionary');
            $rawData = $body['data'] ?? [];
            $actCount = $this->countActs($rawData);
            if ($actCount < 1) {
                throw new NeoFeederException('GetDictionary tidak mengembalikan daftar act yang dapat diverifikasi.', 'PDDIKTI_ERROR', 200, $body['error_code'] ?? null, SensitiveDataSanitizer::sanitize($body));
            }

            $version = $this->extractVersion($body) ?? (string) config('integrator.neofeeder.version', 'unknown');
            $fetchedAt = now()->toISOString();
            IntegratorSetting::put('connection.dictionary', [
                'synced' => true,
                'version' => $version,
                'fetchedAt' => $fetchedAt,
                'actCount' => $actCount,
                'data' => SensitiveDataSanitizer::sanitize($rawData),
            ]);
            $message = "Dictionary Neo Feeder berhasil dibaca ({$actCount} act).";
            $this->appendEvent('DICTIONARY_SYNC', 'success', $message);

            return ['synced' => true, 'version' => $version, 'actCount' => $actCount, 'fetchedAt' => $fetchedAt, 'message' => $message];
        } catch (NeoFeederException $exception) {
            $this->appendEvent('DICTIONARY_SYNC', 'failed', $exception->getMessage());

            return ['synced' => false, 'version' => '', 'actCount' => 0, 'fetchedAt' => now()->toISOString(), 'message' => $exception->getMessage()];
        }
    }

    /** @param array<string,mixed> $parameters
     * @return array<string,mixed>
     */
    public function callAct(string $act, array $parameters = []): array
    {
        return $this->callActWithMeta($act, $parameters)['body'];
    }

    /** @param array<string,mixed> $parameters
     * @return array{body:array<string,mixed>,httpStatus:int,durationMs:int}
     */
    public function callActWithMeta(string $act, array $parameters = []): array
    {
        $token = $this->getOrIssueToken();
        $result = $this->client->callWithToken($act, $token, $parameters);
        $body = $result['body'];
        $code = $body['error_code'] ?? 0;

        if (! is_numeric($code) || (int) $code !== 0) {
            $remoteMessage = is_string($body['error_desc'] ?? null) ? $body['error_desc'] : 'Neo Feeder menolak request.';
            $category = $this->classifyFeederError((string) $code, $remoteMessage);
            $safeMessage = SensitiveDataSanitizer::sanitizeText($remoteMessage, [$token, $this->client->password()]);
            if ($category === 'AUTH_ERROR') {
                $this->invalidateToken();
            }
            throw new NeoFeederException(
                $safeMessage,
                $category,
                $result['httpStatus'],
                is_numeric($code) ? (int) $code : (string) $code,
                SensitiveDataSanitizer::sanitize($body),
            );
        }

        return ['body' => $body, 'httpStatus' => $result['httpStatus'], 'durationMs' => $result['durationMs']];
    }

    public function isActVerified(string $act): bool
    {
        $dictionary = $this->dictionaryMeta();

        return (bool) ($dictionary['synced'] ?? false)
            && $this->containsAct($dictionary['data'] ?? [], $act);
    }

    /** A write is enabled only when the installed dictionary includes every record field. */
    public function arePayloadFieldsVerified(string $act, array $payloadFields): bool
    {
        $dictionary = $this->dictionaryMeta();
        $entry = $this->findActEntry($dictionary['data'] ?? [], $act);
        if ($entry === null) {
            return false;
        }

        $fieldList = $entry['recordFields'] ?? $entry['record_fields'] ?? $entry['fields'] ?? $entry['field'] ?? null;
        if (! is_array($fieldList) || $fieldList === []) {
            return false;
        }
        $known = [];
        foreach ($fieldList as $key => $field) {
            if (is_string($key)) {
                $known[] = $key;
            }
            if (is_string($field)) {
                $known[] = $field;
            } elseif (is_array($field)) {
                foreach (['name', 'field', 'fieldName', 'field_name'] as $candidate) {
                    if (is_string($field[$candidate] ?? null)) {
                        $known[] = $field[$candidate];
                    }
                }
            }
        }
        $known = array_unique($known);

        return array_diff($payloadFields, $known) === [];
    }

    /** @return array<string,mixed>|null */
    private function findActEntry(mixed $value, string $act): ?array
    {
        if (! is_array($value)) {
            return null;
        }
        if (array_key_exists($act, $value) && is_array($value[$act])) {
            return $value[$act];
        }
        if (($value['act'] ?? null) === $act || ($value['name'] ?? null) === $act || ($value['actName'] ?? null) === $act) {
            return $value;
        }
        foreach ($value as $child) {
            $found = $this->findActEntry($child, $act);
            if ($found !== null) {
                return $found;
            }
        }

        return null;
    }

    private function containsAct(mixed $value, string $act): bool
    {
        if (is_string($value)) {
            return $value === $act;
        }
        if (! is_array($value)) {
            return false;
        }
        if (array_key_exists($act, $value)) {
            return true;
        }
        foreach ($value as $child) {
            if ($this->containsAct($child, $act)) {
                return true;
            }
        }

        return false;
    }

    /** @return array<string,mixed> */
    public function statusDto(): array
    {
        $status = IntegratorSetting::get('connection.status', []);
        $status = is_array($status) ? $status : [];

        return [
            'status' => $status['status'] ?? 'DISCONNECTED',
            'serverVersion' => $status['serverVersion'] ?? null,
            'apiStatus' => $status['apiStatus'] ?? null,
            'lastConnectedAt' => $status['lastConnectedAt'] ?? null,
            'lastSuccessfulRequestAt' => $status['lastSuccessfulRequestAt'] ?? null,
            'tokenExpiresAt' => $this->tokenMeta()['expiresAt'] ?? null,
            'message' => $status['message'] ?? null,
        ];
    }

    /** @return array<string,mixed> */
    public function dictionaryMeta(): array
    {
        $dictionary = IntegratorSetting::get('connection.dictionary', []);

        return is_array($dictionary) ? $dictionary : ['synced' => false, 'version' => null, 'fetchedAt' => null, 'actCount' => 0];
    }

    /** @return list<array{at:string,action:string,status:string,message:string}> */
    public function events(): array
    {
        $events = IntegratorSetting::get('connection.events', []);

        return is_array($events) ? array_slice($events, 0, 50) : [];
    }

    private function getOrIssueToken(): string
    {
        $meta = $this->tokenMeta();
        $encrypted = Cache::get(self::TOKEN_CACHE_KEY);
        $expiresAt = isset($meta['expiresAt']) ? strtotime((string) $meta['expiresAt']) : false;
        if (is_string($encrypted) && $encrypted !== '' && $expiresAt !== false && $expiresAt > time() + 60) {
            try {
                return Crypt::decryptString($encrypted);
            } catch (Throwable) {
                Cache::forget(self::TOKEN_CACHE_KEY);
            }
        }

        return $this->issueAndCacheToken();
    }

    private function invalidateToken(): void
    {
        Cache::forget(self::TOKEN_CACHE_KEY);
        $meta = $this->tokenMeta();
        $meta['expiresAt'] = now()->subSecond()->toISOString();
        IntegratorSetting::put('connection.token_meta', $meta);
    }

    private function issueAndCacheToken(): string
    {
        $result = $this->client->requestToken();
        $body = $result['body'];
        $code = $body['error_code'] ?? 0;
        if (! is_numeric($code) || (int) $code !== 0) {
            $remoteMessage = is_string($body['error_desc'] ?? null) ? $body['error_desc'] : 'Autentikasi Neo Feeder ditolak.';
            $message = SensitiveDataSanitizer::sanitizeText($remoteMessage, [$this->client->password()]);
            throw new NeoFeederException($message, $this->classifyFeederError((string) $code, $remoteMessage), $result['httpStatus'], is_numeric($code) ? (int) $code : (string) $code, SensitiveDataSanitizer::sanitize($body));
        }

        $token = $this->findToken($body);
        if ($token === null) {
            throw new NeoFeederException('Respons autentikasi tidak memuat token yang dapat digunakan.', 'AUTH_ERROR', $result['httpStatus'], null, SensitiveDataSanitizer::sanitize($body));
        }

        $expiresIn = max(60, (int) config('integrator.neofeeder.token_ttl', 82800));
        $issuedAt = now();
        $expiresAt = $issuedAt->copy()->addSeconds($expiresIn);
        Cache::put(self::TOKEN_CACHE_KEY, Crypt::encryptString($token), $expiresIn);

        $oldMeta = $this->tokenMeta();
        $refreshHistory = array_values(array_filter($oldMeta['refreshHistory'] ?? [], static fn ($at): bool => is_string($at) && strtotime($at) >= now()->subDay()->timestamp));
        $refreshHistory[] = $issuedAt->toISOString();
        IntegratorSetting::put('connection.token_meta', [
            'issuedAt' => $issuedAt->toISOString(),
            'expiresAt' => $expiresAt->toISOString(),
            'refreshHistory' => $refreshHistory,
        ]);

        return $token;
    }

    private function findToken(array $payload): ?string
    {
        if (isset($payload['token']) && is_string($payload['token']) && $payload['token'] !== '') {
            return $payload['token'];
        }
        $data = $payload['data'] ?? null;
        if (is_array($data) && array_is_list($data)) {
            foreach ($data as $item) {
                if (is_array($item) && is_string($item['token'] ?? null) && $item['token'] !== '') {
                    return $item['token'];
                }
            }
        }
        if (is_array($data) && is_string($data['token'] ?? null) && $data['token'] !== '') {
            return $data['token'];
        }

        return null;
    }

    /** @return array<string,mixed> */
    private function tokenMeta(): array
    {
        $meta = IntegratorSetting::get('connection.token_meta', []);

        return is_array($meta) ? $meta : [];
    }

    private function refreshCountLast24Hours(array $meta): int
    {
        return count(array_filter($meta['refreshHistory'] ?? [], static fn ($at): bool => is_string($at) && strtotime($at) >= now()->subDay()->timestamp));
    }

    private function setStatus(string $status, ?string $version, ?string $apiStatus, string $message): void
    {
        $old = $this->statusDto();
        IntegratorSetting::put('connection.status', [
            'status' => $status,
            'serverVersion' => $version ?? ($old['serverVersion'] ?? null),
            'apiStatus' => $apiStatus,
            'lastConnectedAt' => $status === 'CONNECTED' ? now()->toISOString() : ($old['lastConnectedAt'] ?? null),
            'lastSuccessfulRequestAt' => $status === 'CONNECTED' ? now()->toISOString() : ($old['lastSuccessfulRequestAt'] ?? null),
            'message' => $message,
        ]);
    }

    private function appendEvent(string $action, string $status, string $message): void
    {
        $events = $this->events();
        array_unshift($events, ['at' => now()->toISOString(), 'action' => $action, 'status' => $status, 'message' => $message]);
        IntegratorSetting::put('connection.events', array_slice($events, 0, 50));
    }

    private function statusForCategory(string $category): string
    {
        return match ($category) {
            'TIMEOUT' => 'TIMEOUT',
            'AUTH_ERROR' => 'AUTHENTICATION_FAILED',
            'SERVER_ERROR' => 'SERVER_ERROR',
            default => 'DISCONNECTED',
        };
    }

    private function classifyFeederError(string $code, string $message): string
    {
        $message = strtolower($message);
        if (str_contains($message, 'token') || str_contains($message, 'auth') || str_contains($message, 'password')) {
            return 'AUTH_ERROR';
        }
        if (str_contains($message, 'duplicate') || str_contains($message, 'sudah ada') || str_contains($message, 'conflict')) {
            return 'CONFLICT';
        }
        if (str_contains($message, 'validasi') || str_contains($message, 'required') || str_contains($message, 'tidak valid')) {
            return 'VALIDATION_ERROR';
        }

        return 'PDDIKTI_ERROR';
    }

    /** @param array<string,mixed> $body */
    private function extractVersion(array $body): ?string
    {
        foreach (['version', 'versi', 'server_version'] as $key) {
            if (is_string($body[$key] ?? null)) {
                return $body[$key];
            }
        }
        $data = $body['data'] ?? null;
        if (is_array($data) && is_string($data['version'] ?? null)) {
            return $data['version'];
        }

        return null;
    }

    private function countActs(mixed $data): int
    {
        if (! is_array($data)) {
            return 0;
        }
        if (array_is_list($data)) {
            return count($data);
        }
        foreach (['acts', 'data', 'dictionary', 'result'] as $key) {
            if (isset($data[$key]) && is_array($data[$key])) {
                return $this->countActs($data[$key]);
            }
        }

        return count($data);
    }
}
