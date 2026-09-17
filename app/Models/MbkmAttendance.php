<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MbkmAttendance extends Model
{
    protected $fillable = ['mbkm_placement_id', 'attendance_date', 'status', 'check_in_at', 'check_out_at', 'notes'];

    protected $casts = ['attendance_date' => 'date', 'check_in_at' => 'datetime', 'check_out_at' => 'datetime'];

    public function placement()
    {
        return $this->belongsTo(MbkmPlacement::class, 'mbkm_placement_id');
    }
}
