<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KelasKuliahPengajar extends Model
{
    protected $fillable = ['kelas_kuliah_id', 'dosen_id', 'peran', 'status'];

    public function kelasKuliah()
    {
        return $this->belongsTo(KelasKuliah::class);
    }

    public function dosen()
    {
        return $this->belongsTo(Dosen::class);
    }
}
