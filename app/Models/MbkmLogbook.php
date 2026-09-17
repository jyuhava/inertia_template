<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MbkmLogbook extends Model
{
    protected $fillable = ['mbkm_placement_id', 'mbkm_activity_id', 'entry_date', 'content', 'hours', 'status', 'reviewed_by', 'reviewed_at', 'review_note'];

    protected $casts = ['entry_date' => 'date', 'hours' => 'decimal:2', 'reviewed_at' => 'datetime'];

    public function placement()
    {
        return $this->belongsTo(MbkmPlacement::class, 'mbkm_placement_id');
    }

    public function activity()
    {
        return $this->belongsTo(MbkmActivity::class, 'mbkm_activity_id');
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
