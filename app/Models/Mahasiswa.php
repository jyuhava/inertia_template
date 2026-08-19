<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Mahasiswa extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'nim',
        'no_ktp',
        'nama_lengkap',
        'jenis_kelamin',
        'tempat_lahir',
        'tanggal_lahir',
        'alamat',
        'no_hp',
        'prodi_id',
        'program_studi', // Keep for backward compatibility during migration
        'angkatan',
        'status',
        'surat_komitmen',
        'komitmen_uploaded_at',
    ];

    protected $casts = [
        'tanggal_lahir' => 'date',
        'komitmen_uploaded_at' => 'datetime',
    ];

    /**
     * Get the user that owns the mahasiswa.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the prodi that owns the mahasiswa.
     */
    public function prodi()
    {
        return $this->belongsTo(Prodi::class);
    }

    /**
     * Get the display name for jenis kelamin
     */
    public function getJenisKelaminDisplayAttribute()
    {
        return $this->jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan';
    }

    /**
     * Get the display name for status
     */
    public function getStatusDisplayAttribute()
    {
        return match($this->status) {
            'aktif' => 'Aktif',
            'nonaktif' => 'Nonaktif',
            'lulus' => 'Lulus',
            default => 'Unknown'
        };
    }

    /**
     * Get status badge color
     */
    public function getStatusBadgeColorAttribute()
    {
        return match($this->status) {
            'aktif' => 'green',
            'nonaktif' => 'red',
            'lulus' => 'blue',
            default => 'gray'
        };
    }

    /**
     * Relasi ke KRS
     */
    public function krs()
    {
        return $this->hasMany(Krs::class);
    }

    /**
     * Get KRS untuk periode tertentu
     */
    public function krsForPeriode($periodeKrsId)
    {
        return $this->krs()->where('periode_krs_id', $periodeKrsId)->diambil();
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
     * Get persentase kehadiran untuk periode tertentu
     */
    public function getPersentaseKehadiran($periodeKrsId, $jadwalKuliahId = null)
    {
        $query = $this->absensis()->where('periode_krs_id', $periodeKrsId);
        
        if ($jadwalKuliahId) {
            $query->where('jadwal_kuliah_id', $jadwalKuliahId);
        }
        
        $totalAbsensi = $query->count();
        $hadirCount = $query->where('status', 'hadir')->count();
        
        return $totalAbsensi > 0 ? round(($hadirCount / $totalAbsensi) * 100, 1) : 0;
    }

    /**
     * Check if mahasiswa has uploaded surat komitmen
     */
    public function hasUploadedKomitmen()
    {
        return !empty($this->surat_komitmen) && !empty($this->komitmen_uploaded_at);
    }

    /**
     * Get surat komitmen file path
     */
    public function getKomitmenFilePath()
    {
        return $this->surat_komitmen ? public_path('uploads/komitmen/' . $this->surat_komitmen) : null;
    }

    /**
     * Get surat komitmen URL
     */
    public function getKomitmenUrl()
    {
        return $this->surat_komitmen ? asset('uploads/komitmen/' . $this->surat_komitmen) : null;
    }
}
