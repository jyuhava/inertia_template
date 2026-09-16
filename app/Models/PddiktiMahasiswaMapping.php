<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PddiktiMahasiswaMapping extends Model
{
    use HasFactory;

    protected $table = 'pddikti_mahasiswa_mappings';

    protected $fillable = [
        'mahasiswa_id',
        'pddikti_id',
        'pddikti_nim',
        'status_mapping',
        'last_synced_at',
        'last_action',
        'last_message',
    ];

    protected $casts = [
        'last_synced_at' => 'datetime',
    ];

    public function mahasiswa()
    {
        return $this->belongsTo(Mahasiswa::class);
    }

    public function getStatusDisplayAttribute()
    {
        return match ($this->status_mapping) {
            'mapped' => 'Terhubung',
            'pending' => 'Menunggu',
            'error' => 'Gagal',
            default => 'Belum Terhubung',
        };
    }
}
