<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SurveyResponse extends Model
{
    protected $fillable = ['survey_id', 'mahasiswa_id', 'submitted_at'];

    protected $casts = ['submitted_at' => 'datetime'];

    public function survey()
    {
        return $this->belongsTo(Survey::class);
    }

    public function mahasiswa()
    {
        return $this->belongsTo(Mahasiswa::class);
    }

    public function answers()
    {
        return $this->hasMany(SurveyAnswer::class);
    }
}
