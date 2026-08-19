<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LmsMaterialProgress extends Model
{
    use \Illuminate\Database\Eloquent\Factories\HasFactory;

    protected $table = 'lms_material_progress';

    protected $fillable = [
        'mahasiswa_id',
        'lms_material_id',
        'is_completed',
        'completed_at',
    ];

    protected $casts = [
        'is_completed' => 'boolean',
        'completed_at' => 'datetime',
    ];

    public function mahasiswa()
    {
        return $this->belongsTo(Mahasiswa::class);
    }

    public function material()
    {
        return $this->belongsTo(LmsMaterial::class, 'lms_material_id');
    }
}
