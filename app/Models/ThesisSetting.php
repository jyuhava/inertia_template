<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ThesisSetting extends Model
{
    protected $fillable = ['prodi_id', 'minimum_credits', 'minimum_gpa', 'supervisor_capacity'];

    protected $casts = ['minimum_credits' => 'decimal:2', 'minimum_gpa' => 'decimal:2'];

    public function prodi()
    {
        return $this->belongsTo(Prodi::class);
    }
}
