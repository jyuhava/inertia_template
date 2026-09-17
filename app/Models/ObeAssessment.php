<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ObeAssessment extends Model
{
    protected $fillable = ['mata_kuliah_id', 'kelas_kuliah_id', 'type', 'title', 'description', 'max_score', 'weight', 'status', 'created_by'];

    protected $casts = ['max_score' => 'float', 'weight' => 'float'];

    public function mataKuliah()
    {
        return $this->belongsTo(MataKuliah::class);
    }

    public function kelasKuliah()
    {
        return $this->belongsTo(KelasKuliah::class);
    }

    public function mappings()
    {
        return $this->hasMany(ObeAssessmentMapping::class, 'assessment_id');
    }

    public function scores()
    {
        return $this->hasMany(ObeAssessmentScore::class, 'assessment_id');
    }

    public function audits()
    {
        return $this->morphMany(ObeAudit::class, 'auditable');
    }
}
