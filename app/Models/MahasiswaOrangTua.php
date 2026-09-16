<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MahasiswaOrangTua extends Model
{
    use HasFactory;

    protected $table = 'mahasiswa_orang_tuas';

    protected $fillable = [
        'mahasiswa_id',
        'jenis',
        'nama',
        'nik',
        'tanggal_lahir',
        'pendidikan',
        'pekerjaan',
        'penghasilan',
        'kebutuhan_khusus',
        'no_hp',
        'email',
        'alamat',
    ];

    protected $casts = [
        'tanggal_lahir' => 'date',
    ];

    public function mahasiswa()
    {
        return $this->belongsTo(Mahasiswa::class);
    }
}
