<?php

namespace App\Services\Integrator;

use App\Models\Dosen;
use App\Models\Mahasiswa;
use App\Models\MahasiswaRegistrasi;
use App\Models\Prodi;
use App\Models\Semester;
use Illuminate\Support\Facades\Cache;
use Throwable;

class IntegratorReferenceService
{
    public function __construct(
        private readonly IntegratorConnectionService $connection,
        private readonly IntegratorMappingService $mappings,
    ) {}

    /** @return list<array<string,mixed>> */
    public function summary(): array
    {
        $summaries = [];
        foreach (IntegratorReferenceRegistry::definitions() as $key => $definition) {
            $items = $this->cachedItems($key);
            $usage = $this->localValues($key);
            $mappedValues = $this->configuredReferenceMap($key);
            $unmapped = count(array_filter($usage, static fn (string $value): bool => ! self::hasLocalMapping($value, $mappedValues)));
            $summaries[] = [
                'key' => $key,
                'label' => $definition['label'],
                'total' => count($items),
                'usedBySiakad' => count($usage),
                'unmappedLocalValues' => $unmapped,
                'lastFetchedAt' => $this->fetchedAt($key),
                'act' => $definition['act'],
            ];
        }

        return $summaries;
    }

    /** @param array<string,mixed> $query
     * @return array<string,mixed>
     */
    public function list(string $key, array $query = []): array
    {
        $definition = IntegratorReferenceRegistry::get($key);
        $dictionaryVerified = $definition['act'] === '' || $this->actIsVerified($definition['act']);
        $rawItems = $definition['act'] === '' ? $this->staticItems($key) : $this->fetchRemoteItems($key, $query);
        $usage = $this->localValues($key);
        $mappedValues = $this->configuredReferenceMap($key);
        $prepared = array_map(function (array $raw) use ($definition): array {
            $id = data_get($raw, $definition['idField']) ?? data_get($raw, 'id') ?? data_get($raw, 'id_ref');
            $name = data_get($raw, $definition['labelField']) ?? data_get($raw, 'nama') ?? data_get($raw, 'name');
            if ($id === null || $name === null) {
                return [];
            }
            $extra = SensitiveDataSanitizer::sanitize($raw);

            return [
                'id' => (string) $id,
                'code' => isset($raw['kode']) ? (string) $raw['kode'] : (isset($raw['kode_program_studi']) ? (string) $raw['kode_program_studi'] : null),
                'name' => (string) $name,
                'description' => isset($raw['keterangan']) ? (string) $raw['keterangan'] : (isset($raw['deskripsi']) ? (string) $raw['deskripsi'] : null),
                'active' => ! in_array(strtolower((string) ($raw['status'] ?? 'aktif')), ['nonaktif', 'inactive', 'false', '0'], true),
                'extra' => is_array($extra) ? $extra : [],
            ];
        }, $rawItems);
        $prepared = array_values(array_filter($prepared, static fn (array $item): bool => $item !== []));

        $usageCounts = [];
        $reverse = $this->reverseMap($mappedValues);
        foreach ($usage as $localValue) {
            $id = $mappedValues[mb_strtoupper(trim($localValue))] ?? null;
            if ($id !== null) {
                $usageCounts[(string) $id] = ($usageCounts[(string) $id] ?? 0) + 1;
            }
        }
        foreach ($prepared as &$item) {
            $localValue = $reverse[mb_strtolower(trim($item['id']))] ?? null;
            $item['localValue'] = $localValue;
            $item['usedBySiakad'] = (int) ($usageCounts[$item['id']] ?? 0);
        }
        unset($item);

        $search = mb_strtolower(trim((string) ($query['search'] ?? '')));
        if ($search !== '') {
            $prepared = array_values(array_filter($prepared, static fn (array $item): bool => str_contains(mb_strtolower($item['name'].' '.($item['code'] ?? '').' '.($item['localValue'] ?? '')), $search)
            ));
        }
        if (filter_var($query['unmappedOnly'] ?? false, FILTER_VALIDATE_BOOLEAN)) {
            $prepared = array_values(array_filter($prepared, static fn (array $item): bool => $item['usedBySiakad'] > 0 && $item['localValue'] === null));
        }

        $page = max(1, (int) ($query['page'] ?? 1));
        $perPage = max(1, min(250, (int) ($query['perPage'] ?? 25)));
        $total = count($prepared);

        return [
            'definition' => $definition,
            'data' => array_slice($prepared, ($page - 1) * $perPage, $perPage),
            'meta' => ['page' => $page, 'perPage' => $perPage, 'total' => $total, 'lastPage' => max(1, (int) ceil($total / $perPage))],
            'dictionaryVerified' => $dictionaryVerified,
            'requiresProdi' => (bool) ($definition['requiresProdi'] ?? false),
        ];
    }

    /** @return list<array<string,mixed>> */
    private function cachedItems(string $key): array
    {
        if ($key === 'jenis-kelamin') {
            return $this->staticItems($key);
        }
        $cacheKey = 'integrator.reference.'.sha1($key.'|');
        $cached = Cache::get($cacheKey);

        return is_array($cached) && is_array($cached['items'] ?? null) ? $cached['items'] : [];
    }

    /** @return list<array<string,mixed>> */
    private function fetchRemoteItems(string $key, array $query): array
    {
        $definition = IntegratorReferenceRegistry::get($key);
        if ($definition['act'] === '' || ! $this->actIsVerified($definition['act'])) {
            return [];
        }

        $cacheKey = 'integrator.reference.'.sha1($key.'|'.(string) ($query['prodiId'] ?? ''));
        $cached = Cache::get($cacheKey);
        if (is_array($cached) && isset($cached['items'])) {
            return is_array($cached['items']) ? $cached['items'] : [];
        }

        $parameters = [];
        if (($definition['requiresProdi'] ?? false) === true) {
            $localProdiId = $query['prodiId'] ?? null;
            if ($localProdiId === null || $localProdiId === '') {
                return [];
            }
            $externalProdiId = $this->mappings->externalIdFor('prodi', (string) $localProdiId);
            if ($externalProdiId === null) {
                return [];
            }
            $safeId = str_replace("'", "''", $externalProdiId);
            $parameters['filter'] = "id_prodi = '{$safeId}'";
        }

        try {
            $body = $this->connection->callAct($definition['act'], $parameters);
            $items = $body['data'] ?? [];
            if (is_array($items) && ! array_is_list($items)) {
                $items = [$items];
            }
            $items = is_array($items) ? array_values(array_filter($items, 'is_array')) : [];
            Cache::put($cacheKey, ['items' => $items], now()->addMinutes(15));
            Cache::put($cacheKey.'.fetched_at', now()->toISOString(), now()->addMinutes(15));

            return $items;
        } catch (NeoFeederException) {
            return [];
        } catch (Throwable) {
            return [];
        }
    }

    private function actIsVerified(string $act): bool
    {
        $dictionary = $this->connection->dictionaryMeta();
        if (! ($dictionary['synced'] ?? false) || empty($dictionary['actCount'])) {
            return false;
        }

        return $this->containsAct($dictionary['data'] ?? [], $act);
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

    /** @return list<array<string,mixed>> */
    private function staticItems(string $key): array
    {
        if ($key !== 'jenis-kelamin') {
            return [];
        }

        return [
            ['id' => 'L', 'kode' => 'L', 'nama' => 'Laki-laki', 'aktif' => true],
            ['id' => 'P', 'kode' => 'P', 'nama' => 'Perempuan', 'aktif' => true],
        ];
    }

    /** @return list<string> */
    private function localValues(string $key): array
    {
        $columns = match ($key) {
            'agama' => [[Mahasiswa::class, 'agama'], [Dosen::class, 'agama']],
            'jenis-kelamin' => [[Mahasiswa::class, 'jenis_kelamin'], [Dosen::class, 'jenis_kelamin']],
            'status-mahasiswa' => [[Mahasiswa::class, 'status']],
            'program-studi' => [[Prodi::class, 'nama_prodi']],
            'semester' => [[Semester::class, 'nama_semester']],
            'jenis-pendaftaran' => [[MahasiswaRegistrasi::class, 'jenis_pendaftaran']],
            'jalur-masuk' => [[MahasiswaRegistrasi::class, 'jalur_masuk']],
            default => [],
        };
        $values = [];
        foreach ($columns as [$model, $column]) {
            try {
                $values = array_merge($values, $model::query()->whereNotNull($column)->distinct()->pluck($column)->filter()->map(static fn ($value): string => (string) $value)->all());
            } catch (Throwable) {
                // A reference may mention a model/column not installed by this SIAKAD version.
            }
        }

        return array_values(array_unique($values));
    }

    /** @return array<string,mixed> */
    private function configuredReferenceMap(string $key): array
    {
        $map = config('integrator.reference_map.'.$key, []);

        return is_array($map) ? $map : [];
    }

    private static function hasLocalMapping(string $localValue, array $map): bool
    {
        $normalized = mb_strtoupper(trim($localValue));
        foreach (array_keys($map) as $key) {
            if (mb_strtoupper(trim((string) $key)) === $normalized) {
                return true;
            }
        }

        return false;
    }

    /** @param array<string,mixed> $map
     * @return array<string,string>
     */
    private function reverseMap(array $map): array
    {
        $reverse = [];
        foreach ($map as $local => $id) {
            if (is_scalar($id)) {
                $reverse[mb_strtolower(trim((string) $id))] = (string) $local;
            }
        }

        return $reverse;
    }

    private function fetchedAt(string $key): ?string
    {
        if ($key === 'jenis-kelamin') {
            return null;
        }
        $cacheKey = 'integrator.reference.'.sha1($key.'|');
        $value = Cache::get($cacheKey.'.fetched_at');

        return is_string($value) ? $value : null;
    }

    private function usageCountFor(string $key, string $id): int
    {
        $map = $this->configuredReferenceMap($key);
        foreach ($map as $local => $mappedId) {
            if ((string) $mappedId === $id) {
                return count(array_filter($this->localValues($key), static fn (string $value): bool => mb_strtoupper(trim($value)) === mb_strtoupper((string) $local)));
            }
        }

        return 0;
    }
}
