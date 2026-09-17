<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class MahasiswaDokumen extends Model
{
    use HasFactory;

    protected $table = 'mahasiswa_dokumens';

    protected $fillable = [
        'mahasiswa_id',
        'jenis_dokumen',
        'nomor_dokumen',
        'file_path',
        'original_name',
        'tanggal_terbit',
        'tanggal_kedaluwarsa',
        'status_verifikasi',
        'verified_by',
        'verified_at',
    ];

    protected $casts = [
        'tanggal_terbit' => 'date',
        'tanggal_kedaluwarsa' => 'date',
        'verified_at' => 'datetime',
    ];

    public function mahasiswa()
    {
        return $this->belongsTo(Mahasiswa::class);
    }

    public function verifiedBy()
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function getFileUrl()
    {
        return $this->file_path ? Storage::url($this->file_path) : null;
    }

    public function deleteFile()
    {
        if ($this->file_path && Storage::disk('public')->exists($this->file_path)) {
            Storage::disk('public')->delete($this->file_path);
        }
    }
}
