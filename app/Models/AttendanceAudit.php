<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AttendanceAudit extends Model
{
    protected $fillable = ['absensi_id', 'user_id', 'action', 'before', 'after', 'reason'];

    protected $casts = ['before' => 'array', 'after' => 'array'];
}
