<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DosenJabatanAkademikHistory extends Model
{
    use HasFactory;

    protected $table = 'dosen_jabatan_akademik_histories';

    protected $fillable = ['dosen_id', 'jabatan_akademik', 'tanggal_berlaku', 'tanggal_selesai', 'nomor_sk', 'tanggal_sk', 'file_sk', 'created_by'];

    protected $casts = ['tanggal_berlaku' => 'date', 'tanggal_selesai' => 'date', 'tanggal_sk' => 'date'];

    public function dosen()
    {
        return $this->belongsTo(Dosen::class);
    }
}
