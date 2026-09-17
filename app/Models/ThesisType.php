<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ThesisType extends Model
{
    protected $fillable = ['prodi_id', 'mata_kuliah_id', 'code', 'name', 'description', 'is_active'];

    protected $casts = ['is_active' => 'boolean'];

    public function prodi()
    {
        return $this->belongsTo(Prodi::class);
    }

    public function mataKuliah()
    {
        return $this->belongsTo(MataKuliah::class);
    }

    public function theses()
    {
        return $this->hasMany(Thesis::class);
    }
}
