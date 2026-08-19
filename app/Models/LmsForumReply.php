<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LmsForumReply extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    public function thread()
    {
        return $this->belongsTo(LmsForumThread::class, 'lms_forum_thread_id');
    }

    public function dosen()
    {
        return $this->belongsTo(Dosen::class, 'dosen_id');
    }

    public function mahasiswa()
    {
        return $this->belongsTo(Mahasiswa::class, 'mahasiswa_id');
    }

    public function parentReply()
    {
        return $this->belongsTo(self::class, 'parent_reply_id');
    }

    public function childReplies()
    {
        return $this->hasMany(self::class, 'parent_reply_id');
    }
}
