<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MeetingMinuteShare extends Model
{
    use HasFactory;

    protected $fillable = [
        'meeting_minute_id',
        'shared_by',
        'shared_to',
        'shared_at',
        'viewed_at',
        'message',
        'is_active',
    ];

    protected $casts = [
        'shared_at' => 'datetime',
        'viewed_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    /**
     * Relasi ke notulen.
     */
    public function meetingMinute()
    {
        return $this->belongsTo(MeetingMinute::class);
    }

    /**
     * Relasi ke user yang membagikan.
     */
    public function sharer()
    {
        return $this->belongsTo(User::class, 'shared_by');
    }

    /**
     * Relasi ke user penerima.
     */
    public function sharedTo()
    {
        return $this->belongsTo(User::class, 'shared_to');
    }
}