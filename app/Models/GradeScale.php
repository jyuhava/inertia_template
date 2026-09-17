<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GradeScale extends Model
{
    protected $fillable = ['code', 'name', 'minimum_score', 'maximum_score', 'grade_point', 'is_passing', 'is_active'];

    protected $casts = ['minimum_score' => 'decimal:2', 'maximum_score' => 'decimal:2', 'grade_point' => 'decimal:2', 'is_passing' => 'boolean', 'is_active' => 'boolean'];
}
