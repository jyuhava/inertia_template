<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MahasiswaKontak extends Model
{
    use HasFactory;

    protected $table = 'mahasiswa_kontaks';

    protected $fillable = [
        'mahasiswa_id',
        'jenis',
        'nilai',
        'nama_kontak',
        'is_primary',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
    ];

    public function mahasiswa()
    {
        return $this->belongsTo(Mahasiswa::class);
    }
}
