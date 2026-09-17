<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ThesisSupervisor extends Model
{
    protected $fillable = ['thesis_id', 'dosen_id', 'role', 'status', 'appointed_at', 'appointed_by', 'ended_at'];

    protected $casts = ['appointed_at' => 'datetime', 'ended_at' => 'datetime'];

    public function thesis()
    {
        return $this->belongsTo(Thesis::class);
    }

    public function dosen()
    {
        return $this->belongsTo(Dosen::class);
    }

    public function appointedBy()
    {
        return $this->belongsTo(User::class, 'appointed_by');
    }

    public function sessions()
    {
        return $this->hasMany(ThesisSupervisionSession::class);
    }

    public function audits()
    {
        return $this->morphMany(ThesisAudit::class, 'auditable')->latest();
    }
}
