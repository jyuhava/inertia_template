<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RakerBorang2NewProgram extends Model
{
    protected $fillable = [
        'submission_id',
        'program_name',
        'main_pillar',
        'supporting_pillar',
        'target_audience',
        'main_output',
        'success_indicator',
        'pic_names',
        'estimated_duration',
        'priority',
        'order_index',
    ];

    protected $casts = [
        'main_pillar' => 'array',
        'supporting_pillar' => 'array',
        'pic_names' => 'array',
    ];

    public function submission(): BelongsTo
    {
        return $this->belongsTo(RakerSubmission::class, 'submission_id');
    }
}