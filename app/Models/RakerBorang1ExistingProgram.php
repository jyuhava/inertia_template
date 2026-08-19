<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RakerBorang1ExistingProgram extends Model
{
    protected $fillable = [
        'submission_id',
        'program_name',
        'unit',
        'pic_names',
        'pillars',
        'description',
        'policy_alignment',
        'improvement_notes',
        'order_index',
    ];

    protected $casts = [
        'pic_names' => 'array',
        'pillars' => 'array',
    ];

    public function submission(): BelongsTo
    {
        return $this->belongsTo(RakerSubmission::class, 'submission_id');
    }
}