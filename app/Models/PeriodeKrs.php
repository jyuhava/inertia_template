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
        'keterangan',
        'krs_status',
        'revisi_mulai',
        'revisi_selesai',
        'wajib_persetujuan_pa',
        'maksimal_sks',
        'minimal_sks',
    ];

    protected $casts = [
        'tanggal_mulai' => 'date',
        'tanggal_selesai' => 'date',
        'revisi_mulai' => 'date',
        'revisi_selesai' => 'date',
        'wajib_persetujuan_pa' => 'boolean',
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

    /**
     * Enrollment (KRS baru) untuk periode ini.
     */
    public function studentCourseRegistrations()
    {
        return $this->hasMany(StudentCourseRegistration::class, 'periode_krs_id');
    }

    /**
     * Apakah pendaftaran KRS baru sedang dibuka (terpisah dari status
     * aktif/tidak_aktif lama yang dipakai modul KRS legacy).
     */
    public function isKrsOpenForRegistration(): bool
    {
        $today = now()->toDateString();

        return $this->krs_status === 'open'
            && $today >= $this->tanggal_mulai->toDateString()
            && $today <= $this->tanggal_selesai->toDateString();
    }

    public function isInRevisionWindow(): bool
    {
        if (! $this->revisi_mulai || ! $this->revisi_selesai) {
            return false;
        }

        $today = now()->toDateString();

        return $today >= $this->revisi_mulai->toDateString() && $today <= $this->revisi_selesai->toDateString();
    }
}
