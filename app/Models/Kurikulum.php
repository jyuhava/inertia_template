<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Kurikulum extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'kode', 'nama', 'deskripsi', 'prodi_id',
        'semester_mulai_id', 'semester_selesai_id',
        'total_sks_wajib', 'status',
    ];

    protected $casts = [
        'total_sks_wajib' => 'decimal:2',
    ];

    public function prodi()
    {
        return $this->belongsTo(Prodi::class);
    }

    public function semesterMulai()
    {
        return $this->belongsTo(Semester::class, 'semester_mulai_id');
    }

    public function semesterSelesai()
    {
        return $this->belongsTo(Semester::class, 'semester_selesai_id');
    }

    public function kurikulumMataKuliahs()
    {
        return $this->hasMany(KurikulumMataKuliah::class)->orderBy('semester')->orderBy('sort_order');
    }

    public function mataKuliahs()
    {
        return $this->belongsToMany(MataKuliah::class, 'kurikulum_mata_kuliahs')->withPivot([
            'semester', 'is_wajib', 'sks_override', 'sks_teori_override',
            'sks_praktik_override', 'sks_lapangan_override', 'nilai_minimum', 'sort_order',
        ]);
    }

    public function kelasKuliahs()
    {
        return $this->hasMany(KelasKuliah::class);
    }

    public function ekuivalensis()
    {
        return $this->hasMany(MataKuliahEkuivalensi::class);
    }

    public function pddiktiMapping()
    {
        return $this->morphOne(PddiktiAkademikMapping::class, 'entity', 'entity_type', 'entity_id')
            ->where('entity_type', self::class);
    }

    public function getStatusDisplayAttribute()
    {
        return match ($this->status) {
            'draft' => 'Draft',
            'aktif' => 'Aktif',
            'arsip' => 'Arsip',
            default => ucfirst($this->status),
        };
    }

    public function getStatusBadgeColorAttribute()
    {
        return match ($this->status) {
            'aktif' => 'green',
            'draft' => 'amber',
            'arsip' => 'gray',
            default => 'gray',
        };
    }

    public function scopeAktif($query)
    {
        return $query->where('status', 'aktif');
    }

    /**
     * Sum of SKS actually attached via curriculum_courses (using overrides
     * where set), grouped by semester — the source of truth, not a bare
     * denormalized total unless recomputed here.
     */
    public function hitungTotalSks(): float
    {
        return $this->kurikulumMataKuliahs->sum(function (KurikulumMataKuliah $item) {
            return (float) ($item->sks_override ?? $item->mataKuliah?->sks ?? 0);
        });
    }
}
