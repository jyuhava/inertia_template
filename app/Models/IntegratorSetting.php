<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Key-value store state modul integrator (override koneksi, cache dictionary,
 * riwayat event). Rahasia hanya boleh disimpan sebagai ciphertext Laravel;
 * Neo Feeder token tidak disimpan pada tabel ini.
 */
class IntegratorSetting extends Model
{
    protected $table = 'integrator_settings';

    protected $fillable = ['key', 'value', 'updated_at'];

    protected $casts = ['value' => 'array', 'updated_at' => 'datetime'];

    public static function get(string $key, mixed $default = null): mixed
    {
        $row = static::query()->where('key', $key)->first();

        return $row?->value ?? $default;
    }

    public static function put(string $key, mixed $value): void
    {
        static::updateOrCreate(['key' => $key], ['value' => $value, 'updated_at' => now()]);
    }

    public static function forget(string $key): void
    {
        static::query()->where('key', $key)->delete();
    }
}
