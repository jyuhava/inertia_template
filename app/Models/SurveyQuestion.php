<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SurveyQuestion extends Model
{
    protected $fillable = ['survey_id', 'question', 'question_type', 'is_required', 'sort_order', 'description'];

    protected $casts = ['is_required' => 'boolean'];

    public function survey()
    {
        return $this->belongsTo(Survey::class);
    }

    public function options()
    {
        return $this->hasMany(SurveyQuestionOption::class)->orderBy('sort_order');
    }
}
