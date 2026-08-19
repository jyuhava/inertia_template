<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RakerBorang5Need extends Model
{
    protected $fillable = [
        'submission_id',
        'program_source_id',
        'program_name',
        'need_type',
        'need_details',
        'main_specifications',
        'quantity',
        'status',
        'pic_names',
        'notes',
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