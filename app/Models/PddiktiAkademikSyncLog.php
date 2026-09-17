<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PddiktiAkademikSyncLog extends Model
{
    protected $fillable = [
        'entity_type', 'entity_id', 'external_id', 'action',
        'request_payload', 'response_payload', 'status', 'message', 'synced_at',
    ];

    protected $casts = [
        'request_payload' => 'array',
        'response_payload' => 'array',
        'synced_at' => 'datetime',
    ];

    public function entity()
    {
        return $this->morphTo('entity', 'entity_type', 'entity_id');
    }
}
