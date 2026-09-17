<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Absensi extends Model
{
    protected $fillable = [
        'jadwal_kuliah_id',
        'mahasiswa_id',
        'periode_krs_id',
        'tanggal',
        'jam_mulai',
        'jam_selesai',
        'status',
        'keterangan',
        'created_by', 'course_meeting_id', 'registration_item_id', 'attendance_status', 'check_in_at', 'check_out_at', 'recorded_by',
    ];

    protected $casts = [
        'tanggal' => 'date',
        'jam_mulai' => 'datetime:H:i',
        'jam_selesai' => 'datetime:H:i',
        'check_in_at' => 'datetime',
        'check_out_at' => 'datetime',
    ];

    /**
     * Relasi ke JadwalKuliah
     */
    public function jadwalKuliah(): BelongsTo
    {
        return $this->belongsTo(JadwalKuliah::class);
    }

    /**
     * Relasi ke Mahasiswa
     */
    public function mahasiswa(): BelongsTo
    {
        return $this->belongsTo(Mahasiswa::class);
    }

    /**
     * Relasi ke PeriodeKrs
     */
    public function periodeKrs(): BelongsTo
    {
        return $this->belongsTo(PeriodeKrs::class);
    }

    /**
     * Relasi ke User (dosen yang input)
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function courseMeeting(): BelongsTo
    {
        return $this->belongsTo(CourseMeeting::class);
    }

    public function registrationItem(): BelongsTo
    {
        return $this->belongsTo(StudentCourseRegistrationItem::class, 'registration_item_id');
    }

    public function audits()
    {
        return $this->hasMany(AttendanceAudit::class, 'absensi_id');
    }

    /**
     * Scope untuk absensi hadir
     */
    public function scopeHadir($query)
    {
        return $query->where('status', 'hadir');
    }

    /**
     * Scope untuk absensi tidak hadir
     */
    public function scopeTidakHadir($query)
    {
        return $query->where('status', 'tidak_hadir');
    }

    /**
     * Scope untuk absensi izin
     */
    public function scopeIzin($query)
    {
        return $query->where('status', 'izin');
    }

    /**
     * Scope untuk absensi sakit
     */
    public function scopeSakit($query)
    {
        return $query->where('status', 'sakit');
    }

    /**
     * Get status display
     */
    public function getStatusDisplayAttribute()
    {
        return match ($this->status) {
            'hadir' => 'Hadir',
            'tidak_hadir' => 'Tidak Hadir',
            'izin' => 'Izin',
            'sakit' => 'Sakit',
            default => 'Unknown'
        };
    }

    /**
     * Get status badge color
     */
    public function getStatusBadgeColorAttribute()
    {
        return match ($this->status) {
            'hadir' => 'green',
            'tidak_hadir' => 'red',
            'izin' => 'yellow',
            'sakit' => 'blue',
            default => 'gray'
        };
    }

    /**
     * Scope by periode dan jadwal
     */
    public function scopeByPeriodeAndJadwal($query, $periodeKrsId, $jadwalKuliahId)
    {
        return $query->where('periode_krs_id', $periodeKrsId)
            ->where('jadwal_kuliah_id', $jadwalKuliahId);
    }

    /**
     * Scope by tanggal range
     */
    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('tanggal', [$startDate, $endDate]);
    }
}
