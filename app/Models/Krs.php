<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Krs extends Model
{
    protected $table = 'krs';
    
    protected $fillable = [
        'mahasiswa_id',
        'jadwal_kuliah_id',
        'periode_krs_id',
        'status',
        'catatan_admin',
        'tanggal_approval',
        'approved_by'
    ];

    protected $casts = [
        'tanggal_approval' => 'datetime',
    ];

    /**
     * Relasi ke Mahasiswa
     */
    public function mahasiswa(): BelongsTo
    {
        return $this->belongsTo(Mahasiswa::class);
    }

    /**
     * Relasi ke JadwalKuliah
     */
    public function jadwalKuliah(): BelongsTo
    {
        return $this->belongsTo(JadwalKuliah::class);
    }

    /**
     * Relasi ke PeriodeKrs
     */
    public function periodeKrs(): BelongsTo
    {
        return $this->belongsTo(PeriodeKrs::class);
    }

    /**
     * Relasi ke Penilaian
     */
    public function penilaian(): HasOne
    {
        return $this->hasOne(Penilaian::class, 'mahasiswa_id', 'mahasiswa_id')
                    ->where('jadwal_kuliah_id', $this->jadwal_kuliah_id)
                    ->where('periode_krs_id', $this->periode_krs_id);
    }

    /**
     * Get the penilaian for this KRS
     */
    public function getPenilaianAttribute()
    {
        return Penilaian::where('mahasiswa_id', $this->mahasiswa_id)
                       ->where('jadwal_kuliah_id', $this->jadwal_kuliah_id)
                       ->where('periode_krs_id', $this->periode_krs_id)
                       ->first();
    }

    /**
     * Relasi ke User (admin yang approve)
     */
    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Scope untuk KRS yang diambil
     */
    public function scopeDiambil($query)
    {
        return $query->where('status', 'diambil');
    }

    /**
     * Scope untuk KRS yang dibatalkan
     */
    public function scopeDibatalkan($query)
    {
        return $query->where('status', 'dibatalkan');
    }

    /**
     * Scope untuk KRS yang disetujui
     */
    public function scopeDisetujui($query)
    {
        return $query->where('status', 'disetujui');
    }

    /**
     * Scope untuk KRS yang ditolak
     */
    public function scopeDitolak($query)
    {
        return $query->where('status', 'ditolak');
    }

    /**
     * Scope untuk KRS yang menunggu persetujuan
     */
    public function scopeMenungguPersetujuan($query)
    {
        return $query->where('status', 'menunggu_persetujuan');
    }

    /**
     * Get status display
     */
    public function getStatusDisplayAttribute()
    {
        return match($this->status) {
            'diambil' => 'Diambil',
            'dibatalkan' => 'Dibatalkan',
            'disetujui' => 'Disetujui',
            'ditolak' => 'Ditolak',
            'menunggu_persetujuan' => 'Menunggu Persetujuan',
            default => 'Unknown'
        };
    }

    /**
     * Get status badge color
     */
    public function getStatusBadgeColorAttribute()
    {
        return match($this->status) {
            'diambil' => 'blue',
            'dibatalkan' => 'gray',
            'disetujui' => 'green',
            'ditolak' => 'red',
            'menunggu_persetujuan' => 'yellow',
            default => 'gray'
        };
    }
}
