<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LpmReview extends Model
{
    protected $fillable = [
        'proposal_id',
        'reviewer_user_id',
        'scores',
        'total_score',
        'kesimpulan',
        'catatan',
        'status',
    ];

    protected $casts = [
        'scores' => 'array',
        'total_score' => 'decimal:2',
    ];

    public function proposal(): BelongsTo
    {
        return $this->belongsTo(LpmProposal::class, 'proposal_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_user_id');
    }
}