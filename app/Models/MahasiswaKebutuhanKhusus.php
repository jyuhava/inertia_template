<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MahasiswaKebutuhanKhusus extends Model
{
    use HasFactory;

    protected $table = 'mahasiswa_kebutuhan_khusus';

    protected $fillable = [
        'mahasiswa_id',
        'jenis_kebutuhan',
        'keterangan',
    ];

    public function mahasiswa()
    {
        return $this->belongsTo(Mahasiswa::class);
    }
}
