<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RakerBorang3Risk extends Model
{
    protected $fillable = [
        'submission_id',
        'program_source_type',
        'program_source_id',
        'program_name',
        'main_risk',
        'cause',
        'impact',
        'risk_level',
        'mitigation_strategy',
        'pic_names',
        'additional_notes',
        'order_index',
    ];

    protected $casts = [
        'pic_names' => 'array',
    ];

    public function submission(): BelongsTo
    {
        return $this->belongsTo(RakerSubmission::class, 'submission_id');
    }
}