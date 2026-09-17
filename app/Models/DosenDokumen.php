<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DosenDokumen extends Model
{
    use HasFactory;

    protected $table = 'dosen_dokumens';

    protected $fillable = ['dosen_id', 'jenis', 'nama_dokumen', 'nomor_dokumen', 'tanggal_dokumen', 'file_path', 'status_verifikasi', 'verified_by', 'verified_at'];

    protected $casts = ['tanggal_dokumen' => 'date', 'verified_at' => 'datetime'];

    public function dosen()
    {
        return $this->belongsTo(Dosen::class);
    }
}
