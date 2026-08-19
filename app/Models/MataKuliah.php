<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MataKuliah extends Model
{
    use HasFactory;

    protected $fillable = [
        'kode_mata_kuliah',
        'nama_mata_kuliah',
        'sks',
        'semester',
        'prodi_id',
        'jenis',
        'deskripsi',
        'status',
    ];

    public function prodi()
    {
        return $this->belongsTo(Prodi::class);
    }

    public function jadwalKuliahs()
    {
        return $this->hasMany(JadwalKuliah::class);
    }

    public function getStatusDisplayAttribute()
    {
        return ucfirst($this->status);
    }

    public function getStatusBadgeColorAttribute()
    {
        return match($this->status) {
            'aktif' => 'green',
            'nonaktif' => 'gray',
            default => 'gray'
        };
    }

    public function getJenisBadgeColorAttribute()
    {
        return match($this->jenis) {
            'Wajib' => 'blue',
            'Pilihan' => 'purple',
            default => 'gray'
        };
    }

    public function scopeAktif($query)
    {
        return $query->where('status', 'aktif');
    }

    public function scopeWajib($query)
    {
        return $query->where('jenis', 'Wajib');
    }

    public function scopePilihan($query)
    {
        return $query->where('jenis', 'Pilihan');
    }

    public function scopeBySemester($query, $semester)
    {
        return $query->where('semester', $semester);
    }

    public function scopeByProdi($query, $prodiId)
    {
        return $query->where('prodi_id', $prodiId);
    }
}
