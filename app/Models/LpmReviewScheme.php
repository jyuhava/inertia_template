<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LpmReviewScheme extends Model
{
    protected $fillable = [
        'program_id',
        'nama',
        'minimum_score',
        'reviewer_count',
        'aktif',
    ];

    protected $casts = [
        'aktif' => 'boolean',
    ];

    public function program(): BelongsTo
    {
        return $this->belongsTo(LpmProgram::class, 'program_id');
    }

    public function criteria(): HasMany
    {
        return $this->hasMany(LpmReviewCriterion::class, 'scheme_id')->orderBy('urutan');
    }
}