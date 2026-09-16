<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Ruangan extends Model
{
    protected $fillable = ['kode', 'nama', 'gedung', 'lantai', 'kapasitas', 'tipe', 'status'];

    public function jadwalKelasKuliahs()
    {
        return $this->hasMany(JadwalKelasKuliah::class);
    }

    public function scopeAktif($query)
    {
        return $query->where('status', 'aktif');
    }
}
