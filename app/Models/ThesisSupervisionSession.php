<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ThesisSupervisionSession extends Model
{
    protected $fillable = ['thesis_id', 'thesis_supervisor_id', 'meeting_date', 'topic', 'discussion', 'student_notes', 'feedback', 'status', 'reviewed_by', 'reviewed_at'];

    protected $casts = ['meeting_date' => 'date', 'reviewed_at' => 'datetime'];

    public function thesis()
    {
        return $this->belongsTo(Thesis::class);
    }

    public function supervisor()
    {
        return $this->belongsTo(ThesisSupervisor::class, 'thesis_supervisor_id');
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
