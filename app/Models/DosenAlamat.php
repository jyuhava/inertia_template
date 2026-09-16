<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DosenAlamat extends Model
{
    use HasFactory;

    protected $table = 'dosen_alamats';

    protected $fillable = ['dosen_id', 'jenis', 'jalan', 'dusun', 'rt', 'rw', 'kelurahan', 'kecamatan', 'kabupaten_kota', 'provinsi', 'kode_pos', 'wilayah_id'];

    public function dosen()
    {
        return $this->belongsTo(Dosen::class);
    }
}
