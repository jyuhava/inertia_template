<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MahasiswaAlamat extends Model
{
    use HasFactory;

    protected $table = 'mahasiswa_alamats';

    protected $fillable = [
        'mahasiswa_id',
        'jenis',
        'jalan',
        'dusun',
        'rt',
        'rw',
        'kelurahan',
        'kecamatan',
        'kabupaten_kota',
        'provinsi',
        'kode_pos',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function mahasiswa()
    {
        return $this->belongsTo(Mahasiswa::class);
    }
}
