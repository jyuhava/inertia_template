<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DosenStatusHistory extends Model
{
    use HasFactory;

    protected $table = 'dosen_status_histories';

    protected $fillable = ['dosen_id', 'status', 'tanggal_berlaku', 'tanggal_selesai', 'alasan', 'keterangan', 'dokumen_pendukung', 'created_by'];

    protected $casts = [
        'tanggal_berlaku' => 'date',
        'tanggal_selesai' => 'date',
    ];

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function dosen()
    {
        return $this->belongsTo(Dosen::class);
    }
}
