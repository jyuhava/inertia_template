<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Survey extends Model
{
    protected $fillable = ['title', 'description', 'survey_type', 'periode_krs_id', 'start_at', 'end_at', 'is_required', 'status'];

    protected $casts = ['start_at' => 'datetime', 'end_at' => 'datetime', 'is_required' => 'boolean'];

    public function questions()
    {
        return $this->hasMany(SurveyQuestion::class)->orderBy('sort_order');
    }

    public function targets()
    {
        return $this->hasMany(SurveyTarget::class);
    }

    public function responses()
    {
        return $this->hasMany(SurveyResponse::class);
    }

    public function periodeKrs()
    {
        return $this->belongsTo(PeriodeKrs::class);
    }

    public function isOpen(): bool
    {
        return $this->status === 'published' && (! $this->start_at || $this->start_at->isPast()) && (! $this->end_at || $this->end_at->isFuture());
    }
}
