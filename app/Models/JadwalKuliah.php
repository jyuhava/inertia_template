<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JadwalKuliah extends Model
{
    use HasFactory;

    protected $fillable = [
        'mata_kuliah_id',
        'dosen_id',
        'semester_id',
        'hari',
        'jam_mulai',
        'jam_selesai',
        'ruangan',
        'kapasitas',
        'keterangan',
        'status',
    ];

    protected $casts = [
        'jam_mulai' => 'datetime:H:i',
        'jam_selesai' => 'datetime:H:i',
    ];

    public function mataKuliah()
    {
        return $this->belongsTo(MataKuliah::class);
    }

    public function dosen()
    {
        return $this->belongsTo(Dosen::class);
    }

    public function semester()
    {
        return $this->belongsTo(Semester::class);
    }

    public function getStatusDisplayAttribute()
    {
        return ucfirst($this->status);
    }

    public function getStatusBadgeColorAttribute()
    {
        return match($this->status) {
            'aktif' => 'green',
            'nonaktif' => 'gray',
            default => 'gray'
        };
    }

    public function getHariBadgeColorAttribute()
    {
        return match($this->hari) {
            'Senin' => 'blue',
            'Selasa' => 'green',
            'Rabu' => 'yellow',
            'Kamis' => 'purple',
            'Jumat' => 'red',
            'Sabtu' => 'gray',
            default => 'gray'
        };
    }

    public function getWaktuDisplayAttribute()
    {
        return $this->jam_mulai->format('H:i') . ' - ' . $this->jam_selesai->format('H:i');
    }

    public function getFullTitleAttribute()
    {
        return $this->mataKuliah->nama_mata_kuliah . ' (' . $this->mataKuliah->kode_mata_kuliah . ')';
    }

    public function scopeAktif($query)
    {
        return $query->where('status', 'aktif');
    }

    public function scopeByHari($query, $hari)
    {
        return $query->where('hari', $hari);
    }

    public function scopeBySemester($query, $semesterId)
    {
        return $query->where('semester_id', $semesterId);
    }

    public function scopeByDosen($query, $dosenId)
    {
        return $query->where('dosen_id', $dosenId);
    }

    public function scopeByRuangan($query, $ruangan)
    {
        return $query->where('ruangan', $ruangan);
    }

    /**
     * Relasi ke KRS
     */
    public function krs()
    {
        return $this->hasMany(Krs::class);
    }

    /**
     * Get jumlah mahasiswa yang mengambil mata kuliah ini
     */
    public function getJumlahMahasiswaAttribute()
    {
        return $this->krs()->diambil()->count();
    }

    /**
     * Check apakah jadwal masih tersedia (belum penuh)
     */
    public function isTersedia(): bool
    {
        return $this->jumlah_mahasiswa < $this->kapasitas;
    }

    /**
     * Relasi ke Penilaian
     */
    public function penilaians()
    {
        return $this->hasMany(Penilaian::class);
    }

    /**
     * Relasi ke Absensi
     */
    public function absensis()
    {
        return $this->hasMany(Absensi::class);
    }

    /**
     * Relasi ke LMS Course
     */
    public function lmsCourse()
    {
        return $this->hasOne(LmsCourse::class);
    }
}
