<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MbkmAssessment extends Model
{
    protected $fillable = ['mbkm_placement_id', 'dosen_id', 'assessment_type', 'score', 'grade', 'feedback', 'status'];

    protected $casts = ['score' => 'decimal:2'];

    public function placement()
    {
        return $this->belongsTo(MbkmPlacement::class, 'mbkm_placement_id');
    }

    public function dosen()
    {
        return $this->belongsTo(Dosen::class);
    }
}
