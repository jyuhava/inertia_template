<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ObeCpl extends Model
{
    protected $table = 'obe_cpl';

    protected $fillable = ['prodi_id', 'kurikulum_id', 'code', 'name', 'description', 'domain', 'sequence', 'status', 'created_by'];

    public function prodi()
    {
        return $this->belongsTo(Prodi::class);
    }

    public function kurikulum()
    {
        return $this->belongsTo(Kurikulum::class);
    }

    public function courseMappings()
    {
        return $this->hasMany(ObeCplCourseMapping::class, 'cpl_id');
    }

    public function cpmkMappings()
    {
        return $this->hasMany(ObeCpmkCplMapping::class, 'cpl_id');
    }

    public function cpmks()
    {
        return $this->belongsToMany(ObeCpmk::class, 'obe_cpmk_cpl_mappings', 'cpl_id', 'cpmk_id')->withPivot('weight');
    }

    public function audits()
    {
        return $this->morphMany(ObeAudit::class, 'auditable');
    }
}
