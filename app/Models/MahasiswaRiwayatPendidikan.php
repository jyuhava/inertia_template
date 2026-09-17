<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MahasiswaRiwayatPendidikan extends Model
{
    use HasFactory;

    protected $table = 'mahasiswa_riwayat_pendidikans';

    protected $fillable = [
        'mahasiswa_id',
        'jenjang_pendidikan',
        'nama_institusi',
        'npsn',
        'program_jurusan',
        'tanggal_mulai',
        'tanggal_selesai',
        'tanggal_lulus',
        'nomor_ijazah',
        'nisn',
    ];

    protected $casts = [
        'tanggal_mulai' => 'date',
        'tanggal_selesai' => 'date',
        'tanggal_lulus' => 'date',
    ];

    public function mahasiswa()
    {
        return $this->belongsTo(Mahasiswa::class);
    }
}
