<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KelompokMataKuliah extends Model
{
    protected $fillable = ['code', 'name', 'description', 'is_active'];

    protected $casts = ['is_active' => 'boolean'];

    public function kurikulumMataKuliahs()
    {
        return $this->hasMany(KurikulumMataKuliah::class);
    }
}
