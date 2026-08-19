<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Dosen extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'nip',
        'nama_lengkap',
        'jenis_kelamin',
        'tempat_lahir',
        'tanggal_lahir',
        'alamat',
        'no_hp',
        'pendidikan_terakhir',
        'bidang_keahlian',
        'jabatan_akademik',
        'status',
    ];

    protected $casts = [
        'tanggal_lahir' => 'date',
    ];

    /**
     * Get the user that owns the dosen.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the jadwal kuliahs for the dosen.
     */
    public function jadwalKuliahs()
    {
        return $this->hasMany(JadwalKuliah::class);
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
            'pensiun' => 'Pensiun',
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
            'pensiun' => 'gray',
            default => 'gray'
        };
    }

    /**
     * Get jabatan akademik badge color
     */
    public function getJabatanBadgeColorAttribute()
    {
        return match($this->jabatan_akademik) {
            'Asisten Ahli' => 'blue',
            'Lektor' => 'green',
            'Lektor Kepala' => 'orange',
            'Profesor' => 'purple',
            default => 'gray'
        };
    }
}
