<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RakerBorang4Timeline extends Model
{
    protected $fillable = [
        'submission_id',
        'program_source_id',
        'program_name',
        'jan', 'feb', 'mar', 'apr', 'may', 'jun',
        'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
        'main_milestone',
        'order_index',
    ];

    public function submission(): BelongsTo
    {
        return $this->belongsTo(RakerSubmission::class, 'submission_id');
    }
}