<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ThesisRevision extends Model
{
    protected $fillable = ['thesis_id', 'items', 'status', 'review_comment', 'reviewed_by', 'reviewed_at'];

    protected $casts = ['items' => 'array', 'reviewed_at' => 'datetime'];

    public function thesis()
    {
        return $this->belongsTo(Thesis::class);
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function audits()
    {
        return $this->morphMany(ThesisAudit::class, 'auditable')->latest();
    }
}
