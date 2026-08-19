<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RakerSession extends Model
{
    protected $fillable = [
        'name',
        'start_date',
        'end_date',
        'location',
        'description',
        'status',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(RakerSubmission::class, 'session_id');
    }

    public function getSubmissionsCountAttribute(): int
    {
        return $this->submissions()->count();
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'Aktif');
    }
}