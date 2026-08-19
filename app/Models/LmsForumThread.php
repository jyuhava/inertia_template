<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LmsForumThread extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'is_pinned' => 'boolean',
        'is_locked' => 'boolean',
        'last_activity_at' => 'datetime',
    ];

    public function forum()
    {
        return $this->belongsTo(LmsForum::class, 'lms_forum_id');
    }

    public function dosen()
    {
        return $this->belongsTo(Dosen::class, 'dosen_id');
    }

    public function replies()
    {
        return $this->hasMany(LmsForumReply::class, 'lms_forum_thread_id');
    }
}

