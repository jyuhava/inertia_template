<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DosenSertifikasi extends Model
{
    use HasFactory;

    protected $table = 'dosen_sertifikasis';

    protected $fillable = ['dosen_id', 'jenis', 'nomor_sertifikat', 'penerbit', 'tanggal_terbit', 'berlaku_sampai', 'file_path'];

    protected $casts = ['tanggal_terbit' => 'date', 'berlaku_sampai' => 'date'];

    public function dosen()
    {
        return $this->belongsTo(Dosen::class);
    }
}
