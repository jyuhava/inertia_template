<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ObeCpmk extends Model
{
    protected $table = 'obe_cpmk';

    protected $fillable = ['mata_kuliah_id', 'kurikulum_id', 'code', 'title', 'description', 'taxonomy_level_id', 'sequence', 'status', 'created_by'];

    public function mataKuliah()
    {
        return $this->belongsTo(MataKuliah::class);
    }

    public function kurikulum()
    {
        return $this->belongsTo(Kurikulum::class);
    }

    public function taxonomyLevel()
    {
        return $this->belongsTo(ObeTaxonomyLevel::class, 'taxonomy_level_id');
    }

    public function subCpmks()
    {
        return $this->hasMany(ObeSubCpmk::class, 'obe_cpmk_id')->orderBy('sequence');
    }

    public function cplMappings()
    {
        return $this->hasMany(ObeCpmkCplMapping::class, 'cpmk_id');
    }

    public function cpls()
    {
        return $this->belongsToMany(ObeCpl::class, 'obe_cpmk_cpl_mappings', 'cpmk_id', 'cpl_id')->withPivot('weight');
    }

    public function assessmentMappings()
    {
        return $this->hasMany(ObeAssessmentMapping::class, 'cpmk_id');
    }

    public function audits()
    {
        return $this->morphMany(ObeAudit::class, 'auditable');
    }
}
