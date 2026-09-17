<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ObeSubCpmk extends Model
{
    protected $table = 'obe_sub_cpmk';

    protected $fillable = ['obe_cpmk_id', 'code', 'title', 'description', 'taxonomy_level_id', 'sequence', 'status'];

    public function cpmk()
    {
        return $this->belongsTo(ObeCpmk::class, 'obe_cpmk_id');
    }

    public function taxonomyLevel()
    {
        return $this->belongsTo(ObeTaxonomyLevel::class, 'taxonomy_level_id');
    }

    public function assessmentMappings()
    {
        return $this->hasMany(ObeAssessmentMapping::class, 'sub_cpmk_id');
    }

    public function audits()
    {
        return $this->morphMany(ObeAudit::class, 'auditable');
    }
}
