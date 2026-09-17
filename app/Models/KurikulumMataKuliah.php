<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KurikulumMataKuliah extends Model
{
    protected $fillable = [
        'kurikulum_id', 'mata_kuliah_id', 'semester', 'kelompok_mata_kuliah_id',
        'is_wajib', 'sks_override', 'sks_teori_override', 'sks_praktik_override',
        'sks_lapangan_override', 'nilai_minimum', 'sort_order',
    ];

    protected $casts = [
        'is_wajib' => 'boolean',
        'sks_override' => 'decimal:2',
        'sks_teori_override' => 'decimal:2',
        'sks_praktik_override' => 'decimal:2',
        'sks_lapangan_override' => 'decimal:2',
    ];

    public function kurikulum()
    {
        return $this->belongsTo(Kurikulum::class);
    }

    public function mataKuliah()
    {
        return $this->belongsTo(MataKuliah::class);
    }

    public function kelompok()
    {
        return $this->belongsTo(KelompokMataKuliah::class, 'kelompok_mata_kuliah_id');
    }

    public function pddiktiMapping()
    {
        return $this->morphOne(PddiktiAkademikMapping::class, 'entity', 'entity_type', 'entity_id')
            ->where('entity_type', self::class);
    }
}
