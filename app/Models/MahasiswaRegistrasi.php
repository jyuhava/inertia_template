<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MahasiswaRegistrasi extends Model
{
    use HasFactory;

    protected $fillable = [
        'mahasiswa_id',
        'calon_mahasiswa_id',
        'no_pendaftaran',
        'prodi_id',
        'periode_masuk',
        'tanggal_masuk',
        'jenis_pendaftaran',
        'jalur_masuk',
        'status_awal',
        'asal_mahasiswa',
        'pt_asal',
        'prodi_asal_id',
        'keterangan',
    ];

    protected $casts = [
        'tanggal_masuk' => 'date',
    ];

    public function mahasiswa()
    {
        return $this->belongsTo(Mahasiswa::class);
    }

    public function calonMahasiswa()
    {
        return $this->belongsTo(CalonMahasiswa::class);
    }

    public function prodi()
    {
        return $this->belongsTo(Prodi::class);
    }

    public function prodiAsal()
    {
        return $this->belongsTo(Prodi::class, 'prodi_asal_id');
    }
}
