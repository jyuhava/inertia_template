<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KategoriMataKuliah extends Model
{
    protected $fillable = ['code', 'name', 'description', 'is_active'];

    protected $casts = ['is_active' => 'boolean'];

    public function mataKuliahs()
    {
        return $this->hasMany(MataKuliah::class);
    }
}
