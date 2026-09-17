<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ObeAssessmentMapping extends Model
{
    protected $fillable = ['assessment_id', 'cpmk_id', 'sub_cpmk_id', 'weight'];

    protected $casts = ['weight' => 'float'];

    public function assessment()
    {
        return $this->belongsTo(ObeAssessment::class);
    }

    public function cpmk()
    {
        return $this->belongsTo(ObeCpmk::class, 'cpmk_id');
    }

    public function subCpmk()
    {
        return $this->belongsTo(ObeSubCpmk::class, 'sub_cpmk_id');
    }
}
