<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SubstansiKuliah extends Model
{
    protected $fillable = ['code', 'name', 'description', 'is_active'];

    protected $casts = ['is_active' => 'boolean'];

    public function mataKuliahs()
    {
        return $this->belongsToMany(MataKuliah::class, 'mata_kuliah_substansi');
    }
}
