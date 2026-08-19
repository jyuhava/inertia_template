<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PeriodeKrs extends Model
{
    protected $table = 'periode_krs';
    
    protected $fillable = [
        'nama_periode',
        'tahun_ajaran_id',
        'semester_id',
        'tanggal_mulai',
        'tanggal_selesai',
        'status',
        'keterangan'
    ];

    protected $casts = [
        'tanggal_mulai' => 'date',
        'tanggal_selesai' => 'date',
    ];

    /**
     * Relasi ke TahunAjaran
     */
    public function tahunAjaran(): BelongsTo
    {
        return $this->belongsTo(TahunAjaran::class);
    }

    /**
     * Relasi ke Semester
     */
    public function semester(): BelongsTo
    {
        return $this->belongsTo(Semester::class);
    }

    /**
     * Relasi ke KRS
     */
    public function krs(): HasMany
    {
        return $this->hasMany(Krs::class);
    }

    /**
     * Scope untuk periode aktif
     */
    public function scopeAktif($query)
    {
        return $query->where('status', 'aktif');
    }

    /**
     * Check apakah periode KRS sedang berlangsung
     */
    public function isBerlangsung(): bool
    {
        $today = now()->toDateString();
        return $this->status === 'aktif' 
            && $today >= $this->tanggal_mulai->toDateString() 
            && $today <= $this->tanggal_selesai->toDateString();
    }
}
