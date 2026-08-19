<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DokumenPmb extends Model
{
    use HasFactory;

    protected $table = 'dokumen_pmb';
    
    protected $fillable = [
        'nama_dokumen',
        'kode_dokumen',
        'deskripsi',
        'jenis_file',
        'max_size_kb',
        'wajib',
        'aktif',
        'urutan',
    ];

    protected $casts = [
        'wajib' => 'boolean',
        'aktif' => 'boolean',
    ];

    // Relationships
    public function uploadDokumen()
    {
        return $this->hasMany(UploadDokumenPmb::class);
    }

    // Scopes
    public function scopeAktif($query)
    {
        return $query->where('aktif', true);
    }

    public function scopeWajib($query)
    {
        return $query->where('wajib', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('urutan');
    }

    // Methods
    public function getMaxSizeMbAttribute()
    {
        return round($this->max_size_kb / 1024, 1);
    }

    public function getJenisFileArrayAttribute()
    {
        return explode(',', $this->jenis_file);
    }

    public function isValidFileType($extension)
    {
        $allowedTypes = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'];
        return in_array(strtolower($extension), $allowedTypes);
    }
}
