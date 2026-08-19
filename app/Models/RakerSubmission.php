<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RakerSubmission extends Model
{
    protected $fillable = [
        'session_id',
        'user_id',
        'unit',
        'jabatan',
        'status',
        'submitted_at',
    ];

    protected function casts(): array
    {
        return [
            'submitted_at' => 'datetime',
        ];
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(RakerSession::class, 'session_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function borang1(): HasMany
    {
        return $this->hasMany(RakerBorang1ExistingProgram::class, 'submission_id');
    }

    public function borang2(): HasMany
    {
        return $this->hasMany(RakerBorang2NewProgram::class, 'submission_id');
    }

    public function borang3(): HasMany
    {
        return $this->hasMany(RakerBorang3Risk::class, 'submission_id');
    }

    public function borang4(): HasMany
    {
        return $this->hasMany(RakerBorang4Timeline::class, 'submission_id');
    }

    public function borang5(): HasMany
    {
        return $this->hasMany(RakerBorang5Need::class, 'submission_id');
    }

    public function borang6(): HasMany
    {
        return $this->hasMany(RakerBorang6Budget::class, 'submission_id');
    }

    public function getCompletionStatsAttribute(): array
    {
        return [
            'borang_1' => $this->borang1()->count(),
            'borang_2' => $this->borang2()->count(),
            'borang_3' => $this->borang3()->count(),
            'borang_4' => $this->borang4()->count(),
            'borang_5' => $this->borang5()->count(),
            'borang_6' => $this->borang6()->count(),
        ];
    }
}