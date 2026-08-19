<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RakerBorang6Budget extends Model
{
    protected $fillable = [
        'submission_id',
        'program_source_id',
        'program_name',
        'cost_component',
        'volume',
        'unit',
        'unit_price',
        'total_price',
        'funding_source',
        'priority',
        'notes',
        'order_index',
    ];

    public function submission(): BelongsTo
    {
        return $this->belongsTo(RakerSubmission::class, 'submission_id');
    }
}