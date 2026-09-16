<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * Generic PDDikti/Neo Feeder mapping boundary shared by the four academic
 * entities Neo Feeder reports separately: mata kuliah, kurikulum, mata
 * kuliah kurikulum, dan kelas kuliah. No external client exists in this
 * repository; see PddiktiAkademikFeederService for the honest boundary.
 */
class PddiktiAkademikMapping extends Model
{
    protected $fillable = [
        'entity_type', 'entity_id', 'external_id', 'sync_status',
        'last_synced_at', 'last_sync_action', 'last_sync_message',
    ];

    protected $casts = ['last_synced_at' => 'datetime'];

    public function entity(): MorphTo
    {
        return $this->morphTo();
    }
}
