<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class IntegratorSyncJob extends Model
{
    use HasUuids;

    protected $table = 'integrator_sync_jobs';

    protected $fillable = [
        'entity', 'status', 'dry_run',
        'period_id', 'period_label', 'prodi_id', 'prodi_label',
        'user_id', 'created_by_name',
        'total', 'processed', 'success', 'failed', 'skipped', 'invalid',
        'cancel_requested', 'started_at', 'finished_at', 'notes',
    ];

    protected $casts = [
        'dry_run' => 'boolean',
        'cancel_requested' => 'boolean',
        'started_at' => 'datetime',
        'finished_at' => 'datetime',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(IntegratorSyncJobItem::class, 'job_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
