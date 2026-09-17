<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ThesisEvent extends Model
{
    protected $fillable = ['thesis_id', 'kind', 'scheduled_at', 'ends_at', 'examiner_ids', 'status', 'notes', 'scheduled_by'];

    protected $casts = ['scheduled_at' => 'datetime', 'ends_at' => 'datetime', 'examiner_ids' => 'array'];

    public function thesis()
    {
        return $this->belongsTo(Thesis::class);
    }

    public function scheduler()
    {
        return $this->belongsTo(User::class, 'scheduled_by');
    }

    public function audits()
    {
        return $this->morphMany(ThesisAudit::class, 'auditable')->latest();
    }
}
