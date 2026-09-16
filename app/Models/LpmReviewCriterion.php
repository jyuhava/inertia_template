<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LpmReviewCriterion extends Model
{
    protected $fillable = [
        'scheme_id',
        'nama_kriteria',
        'bobot',
        'urutan',
    ];

    public function scheme(): BelongsTo
    {
        return $this->belongsTo(LpmReviewScheme::class, 'scheme_id');
    }
}