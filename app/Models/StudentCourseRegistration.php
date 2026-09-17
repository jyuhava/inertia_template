<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentCourseRegistration extends Model
{
    protected $fillable = [
        'mahasiswa_id', 'periode_krs_id', 'kurikulum_id', 'status',
        'submitted_at', 'approved_at', 'approved_by',
        'rejected_at', 'rejected_by', 'rejection_reason', 'locked_at',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
        'locked_at' => 'datetime',
    ];

    public function mahasiswa()
    {
        return $this->belongsTo(Mahasiswa::class);
    }

    public function periodeKrs()
    {
        return $this->belongsTo(PeriodeKrs::class, 'periode_krs_id');
    }

    public function kurikulum()
    {
        return $this->belongsTo(Kurikulum::class);
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function rejectedBy()
    {
        return $this->belongsTo(User::class, 'rejected_by');
    }

    public function items()
    {
        return $this->hasMany(StudentCourseRegistrationItem::class, 'registration_id');
    }

    public function activeItems()
    {
        return $this->items()->where('status', 'active');
    }

    public function audits()
    {
        return $this->hasMany(StudentCourseRegistrationAudit::class, 'registration_id')->orderByDesc('created_at');
    }

    public function pddiktiMapping()
    {
        return $this->morphOne(PddiktiAkademikMapping::class, 'entity', 'entity_type', 'entity_id')
            ->where('entity_type', self::class);
    }

    public function getTotalSksAttribute(): float
    {
        return (float) $this->activeItems()->sum('sks_snapshot');
    }

    public function getStatusDisplayAttribute(): string
    {
        return match ($this->status) {
            'draft' => 'Draft',
            'submitted' => 'Diajukan',
            'revision' => 'Perlu Revisi',
            'approved' => 'Disetujui',
            'rejected' => 'Ditolak',
            'locked' => 'Dikunci',
            'cancelled' => 'Dibatalkan',
            default => ucfirst($this->status),
        };
    }

    public function canBeEdited(): bool
    {
        return in_array($this->status, ['draft', 'revision'], true);
    }
}
