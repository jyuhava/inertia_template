<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentAdvisor extends Model
{
    protected $fillable = ['mahasiswa_id', 'dosen_id', 'tanggal_mulai', 'tanggal_selesai', 'status'];

    protected $casts = [
        'tanggal_mulai' => 'date',
        'tanggal_selesai' => 'date',
    ];

    public function mahasiswa()
    {
        return $this->belongsTo(Mahasiswa::class);
    }

    public function dosen()
    {
        return $this->belongsTo(Dosen::class);
    }

    public function scopeAktif($query)
    {
        return $query->where('status', 'aktif');
    }
}
