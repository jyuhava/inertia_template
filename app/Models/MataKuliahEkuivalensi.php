<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MataKuliahEkuivalensi extends Model
{
    protected $fillable = ['mata_kuliah_lama_id', 'mata_kuliah_baru_id', 'kurikulum_id', 'keterangan'];

    public function mataKuliahLama()
    {
        return $this->belongsTo(MataKuliah::class, 'mata_kuliah_lama_id');
    }

    public function mataKuliahBaru()
    {
        return $this->belongsTo(MataKuliah::class, 'mata_kuliah_baru_id');
    }

    public function kurikulum()
    {
        return $this->belongsTo(Kurikulum::class);
    }
}
