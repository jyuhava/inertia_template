<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DosenRiwayatPendidikan extends Model
{
    use HasFactory;

    protected $table = 'dosen_riwayat_pendidikans';

    protected $fillable = ['dosen_id', 'jenjang', 'perguruan_tinggi', 'program_studi', 'gelar', 'nomor_ijazah', 'tahun_masuk', 'tahun_lulus', 'tanggal_lulus', 'negara', 'status_pendidikan'];

    protected $casts = ['tanggal_lulus' => 'date'];

    public function dosen()
    {
        return $this->belongsTo(Dosen::class);
    }
}
