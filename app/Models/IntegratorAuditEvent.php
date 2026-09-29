<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IntegratorAuditEvent extends Model
{
    protected $table = 'integrator_audit_events';

    protected $fillable = [
        'user_id', 'event_type', 'entity', 'local_id',
        'data_count', 'success_count', 'failed_count', 'result',
    ];

    protected $casts = [
        'result' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
