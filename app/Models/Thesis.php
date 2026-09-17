<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Thesis extends Model
{
    public const STATUSES = ['draft', 'submitted', 'under_review', 'title_revision', 'title_approved', 'supervisor_assignment', 'proposal', 'proposal_approved', 'seminar_proposal', 'research', 'result_seminar', 'thesis_defense', 'revision', 'revision_verified', 'completed', 'cancelled', 'withdrawn'];

    protected $fillable = ['mahasiswa_id', 'prodi_id', 'semester_id', 'kurikulum_id', 'thesis_type_id', 'title', 'abstract', 'keywords', 'status', 'final_grade', 'final_grade_point', 'grade_locked_at', 'started_at', 'completed_at', 'finalized_at'];

    protected $casts = ['final_grade_point' => 'decimal:2', 'grade_locked_at' => 'datetime', 'started_at' => 'datetime', 'completed_at' => 'datetime', 'finalized_at' => 'datetime'];

    public function mahasiswa()
    {
        return $this->belongsTo(Mahasiswa::class);
    }

    public function prodi()
    {
        return $this->belongsTo(Prodi::class);
    }

    public function semester()
    {
        return $this->belongsTo(Semester::class);
    }

    public function kurikulum()
    {
        return $this->belongsTo(Kurikulum::class);
    }

    public function type()
    {
        return $this->belongsTo(ThesisType::class, 'thesis_type_id');
    }

    public function titleSubmissions()
    {
        return $this->hasMany(ThesisTitleSubmission::class)->orderByDesc('version');
    }

    public function supervisors()
    {
        return $this->hasMany(ThesisSupervisor::class);
    }

    public function activeSupervisors()
    {
        return $this->supervisors()->where('status', 'active');
    }

    public function sessions()
    {
        return $this->hasMany(ThesisSupervisionSession::class)->latest('meeting_date');
    }

    public function documents()
    {
        return $this->hasMany(ThesisDocument::class);
    }

    public function events()
    {
        return $this->hasMany(ThesisEvent::class)->orderBy('scheduled_at');
    }

    public function revisions()
    {
        return $this->hasMany(ThesisRevision::class)->latest();
    }

    public function audits()
    {
        return $this->morphMany(ThesisAudit::class, 'auditable')->latest();
    }
}
