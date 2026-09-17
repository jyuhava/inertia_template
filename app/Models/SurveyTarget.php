<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SurveyTarget extends Model
{
    protected $fillable = ['survey_id', 'target_type', 'target_id'];

    public function survey()
    {
        return $this->belongsTo(Survey::class);
    }
}
