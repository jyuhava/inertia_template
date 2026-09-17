<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MahasiswaBeasiswa extends Model
{
    use HasFactory;

    protected $table = 'mahasiswa_beasiswas';

    protected $fillable = [
        'mahasiswa_id',
        'jenis_bantuan',
        'nama_bantuan',
        'nomor_bantuan',
        'tanggal_mulai',
        'tanggal_selesai',
        'status',
        'keterangan',
    ];

    protected $casts = [
        'tanggal_mulai' => 'date',
        'tanggal_selesai' => 'date',
    ];

    public function mahasiswa()
    {
        return $this->belongsTo(Mahasiswa::class);
    }
}
