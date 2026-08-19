<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class UploadDokumenPmb extends Model
{
    use HasFactory;

    protected $table = 'upload_dokumen_pmb';
    
    protected $fillable = [
        'calon_mahasiswa_id',
        'dokumen_pmb_id',
        'file_path',
        'original_name',
        'file_size',
        'status_verifikasi',
        'catatan_verifikasi',
        'tanggal_upload',
        'verified_by',
        'tanggal_verifikasi',
    ];

    protected $casts = [
        'tanggal_upload' => 'datetime',
        'tanggal_verifikasi' => 'datetime',
    ];

    // Relationships
    public function calonMahasiswa()
    {
        return $this->belongsTo(CalonMahasiswa::class);
    }

    public function dokumenPmb()
    {
        return $this->belongsTo(DokumenPmb::class);
    }

    public function verifiedBy()
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    // Scopes
    public function scopeApproved($query)
    {
        return $query->where('status_verifikasi', 'approved');
    }

    public function scopePending($query)
    {
        return $query->where('status_verifikasi', 'pending');
    }

    // Methods
    public function getFileSizeMbAttribute()
    {
        return round($this->file_size / (1024 * 1024), 2);
    }

    public function getFileUrl()
    {
        return Storage::url($this->file_path);
    }

    public function getStatusBadgeAttribute()
    {
        $colors = [
            'pending' => 'bg-yellow-100 text-yellow-800',
            'approved' => 'bg-green-100 text-green-800',
            'rejected' => 'bg-red-100 text-red-800',
        ];

        return $colors[$this->status_verifikasi] ?? 'bg-gray-100 text-gray-800';
    }

    public function deleteFile()
    {
        if (Storage::exists($this->file_path)) {
            Storage::delete($this->file_path);
        }
    }
}
