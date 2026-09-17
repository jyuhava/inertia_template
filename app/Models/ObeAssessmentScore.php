<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ObeAssessmentScore extends Model
{
    protected $fillable = ['assessment_id', 'mahasiswa_id', 'penilaian_id', 'score', 'recorded_by'];

    protected $casts = ['score' => 'float'];

    public function assessment()
    {
        return $this->belongsTo(ObeAssessment::class);
    }

    public function mahasiswa()
    {
        return $this->belongsTo(Mahasiswa::class);
    }

    public function penilaian()
    {
        return $this->belongsTo(Penilaian::class);
    }
}
