<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MahasiswaStatusHistory extends Model
{
    use HasFactory;

    protected $table = 'mahasiswa_status_histories';

    protected $fillable = [
        'mahasiswa_id',
        'status',
        'tanggal_berlaku',
        'tahun_ajaran_id',
        'alasan',
        'keterangan',
        'dokumen_pendukung',
        'changed_by',
    ];

    protected $casts = [
        'tanggal_berlaku' => 'date',
    ];

    public function mahasiswa()
    {
        return $this->belongsTo(Mahasiswa::class);
    }

    public function tahunAjaran()
    {
        return $this->belongsTo(TahunAjaran::class);
    }

    public function changedBy()
    {
        return $this->belongsTo(User::class, 'changed_by');
    }

    public function getStatusDisplayAttribute()
    {
        return match ($this->status) {
            'aktif' => 'Aktif',
            'cuti' => 'Cuti',
            'nonaktif' => 'Nonaktif',
            'lulus' => 'Lulus',
            'dropout' => 'Dropout',
            'mengundurkan_diri' => 'Mengundurkan Diri',
            'pindah' => 'Pindah/Transfer',
            'dikeluarkan' => 'Dikeluarkan',
            default => ucfirst($this->status),
        };
    }
}
