<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JadwalKelasKuliah extends Model
{
    protected $table = 'jadwal_kelas_kuliahs';

    protected $fillable = [
        'kelas_kuliah_id', 'hari', 'jam_mulai', 'jam_selesai',
        'ruangan_id', 'tipe_pertemuan', 'status', 'catatan',
    ];

    protected $casts = [
        'jam_mulai' => 'datetime:H:i',
        'jam_selesai' => 'datetime:H:i',
    ];

    public function kelasKuliah()
    {
        return $this->belongsTo(KelasKuliah::class);
    }

    public function ruangan()
    {
        return $this->belongsTo(Ruangan::class);
    }

    /**
     * Interval-overlap conflict scope: two schedules conflict when
     * existing_start < new_end AND existing_end > new_start on the same day.
     */
    public function scopeOverlapping($query, string $hari, string $jamMulai, string $jamSelesai)
    {
        return $query->where('hari', $hari)
            ->where('jam_mulai', '<', $jamSelesai)
            ->where('jam_selesai', '>', $jamMulai);
    }
}
