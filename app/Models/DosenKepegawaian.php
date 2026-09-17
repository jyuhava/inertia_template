<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DosenKepegawaian extends Model
{
    use HasFactory;

    protected $table = 'dosen_kepegawaians';

    protected $fillable = ['dosen_id', 'jenis_kepegawaian', 'status_kepegawaian', 'nomor_pegawai', 'tanggal_mulai_kerja', 'tanggal_mulai_dosen', 'status_dosen', 'status_pns', 'sumber_pembiayaan', 'unit_kerja'];

    protected $casts = [
        'tanggal_mulai_kerja' => 'date',
        'tanggal_mulai_dosen' => 'date',
    ];

    public function dosen()
    {
        return $this->belongsTo(Dosen::class);
    }
}
