<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Semester extends Model
{
    use HasFactory;

    protected $fillable = [
        'tahun_ajaran_id',
        'nama_semester',
        'tanggal_mulai',
        'tanggal_selesai',
        'status',
        'keterangan',
    ];

    protected $casts = [
        'tanggal_mulai' => 'date',
        'tanggal_selesai' => 'date',
    ];

    public function tahunAjaran()
    {
        return $this->belongsTo(TahunAjaran::class);
    }

    public function getStatusDisplayAttribute()
    {
        return ucfirst($this->status);
    }

    public function getStatusBadgeColorAttribute()
    {
        return match ($this->status) {
            'aktif' => 'green',
            'nonaktif' => 'gray',
            default => 'gray'
        };
    }

    public function getFullNameAttribute()
    {
        return $this->tahunAjaran->nama_tahun_ajaran.' - '.$this->nama_semester;
    }

    public function scopeAktif($query)
    {
        return $query->where('status', 'aktif');
    }

    public function scopeNonaktif($query)
    {
        return $query->where('status', 'nonaktif');
    }

    public function scopeGanjil($query)
    {
        return $query->where('nama_semester', 'Ganjil');
    }

    public function scopeGenap($query)
    {
        return $query->where('nama_semester', 'Genap');
    }

    public function kelasKuliahs()
    {
        return $this->hasMany(KelasKuliah::class);
    }

    public function kurikulumsMulai()
    {
        return $this->hasMany(Kurikulum::class, 'semester_mulai_id');
    }
}
