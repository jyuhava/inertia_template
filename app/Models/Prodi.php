<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Prodi extends Model
{
    use HasFactory;

    protected $fillable = [
        'kode_prodi',
        'nama_prodi',
        'deskripsi',
        'jenjang',
        'status',
    ];

    /**
     * Get the mahasiswas for the prodi.
     */
    public function mahasiswas()
    {
        return $this->hasMany(Mahasiswa::class);
    }

    public function mataKuliahs()
    {
        return $this->hasMany(MataKuliah::class);
    }

    public function dosenHomebaseHistories()
    {
        return $this->hasMany(DosenHomebaseHistory::class);
    }

    public function kurikulums()
    {
        return $this->hasMany(Kurikulum::class);
    }

    public function thesisSetting()
    {
        return $this->hasOne(ThesisSetting::class);
    }

    public function theses()
    {
        return $this->hasMany(Thesis::class);
    }

    /**
     * Get the display name for status
     */
    public function getStatusDisplayAttribute()
    {
        return $this->status === 'aktif' ? 'Aktif' : 'Nonaktif';
    }

    /**
     * Get status badge color
     */
    public function getStatusBadgeColorAttribute()
    {
        return $this->status === 'aktif' ? 'green' : 'red';
    }
}
