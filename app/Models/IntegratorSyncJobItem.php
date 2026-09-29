<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IntegratorSyncJobItem extends Model
{
    use HasUuids;

    protected $table = 'integrator_sync_job_items';

    protected $fillable = [
        'job_id', 'entity', 'local_id', 'local_label', 'pddikti_id',
        'act', 'action', 'status', 'attempts', 'max_attempts',
        'message', 'error_category', 'duration_ms', 'request_id', 'response_code',
        'payload', 'response', 'started_at', 'finished_at',
    ];

    protected $casts = [
        'payload' => 'array',
        'response' => 'array',
        'started_at' => 'datetime',
        'finished_at' => 'datetime',
    ];

    public function job(): BelongsTo
    {
        return $this->belongsTo(IntegratorSyncJob::class, 'job_id', 'id');
    }

    /** Kategori error yang layak di-retry (bukan error validasi/konflik data). */
    public function isRetryable(): bool
    {
        return in_array($this->error_category, ['NETWORK_ERROR', 'TIMEOUT', 'SERVER_ERROR', 'AUTH_ERROR'], true);
    }
}
