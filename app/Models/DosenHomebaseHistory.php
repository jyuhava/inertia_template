<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DosenHomebaseHistory extends Model
{
    use HasFactory;

    protected $table = 'dosen_homebase_histories';

    protected $fillable = ['dosen_id', 'prodi_id', 'tanggal_mulai', 'tanggal_selesai', 'status', 'alasan', 'dokumen_pendukung', 'created_by'];

    protected $casts = [
        'tanggal_mulai' => 'date',
        'tanggal_selesai' => 'date',
    ];

    public function prodi()
    {
        return $this->belongsTo(Prodi::class);
    }

    public function dosen()
    {
        return $this->belongsTo(Dosen::class);
    }
}
