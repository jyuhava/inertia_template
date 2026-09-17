<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ThesisTitleSubmission extends Model
{
    protected $fillable = ['thesis_id', 'version', 'title', 'alternate_titles', 'background', 'problem_statement', 'objective', 'topic', 'method', 'description', 'status', 'review_comment', 'reviewed_by', 'reviewed_at'];

    protected $casts = ['alternate_titles' => 'array', 'reviewed_at' => 'datetime'];

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
