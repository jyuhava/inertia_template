<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MbkmActivity extends Model
{
    protected $fillable = ['mbkm_placement_id', 'activity_date', 'title', 'description', 'hours', 'status', 'approved_by', 'approved_at'];

    protected $casts = ['activity_date' => 'date', 'hours' => 'decimal:2', 'approved_at' => 'datetime'];

    public function placement()
    {
        return $this->belongsTo(MbkmPlacement::class, 'mbkm_placement_id');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function logbooks()
    {
        return $this->hasMany(MbkmLogbook::class);
    }
}
