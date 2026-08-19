<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LmsForum extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    public function chapter()
    {
        return $this->belongsTo(LmsChapter::class, 'lms_chapter_id');
    }

    public function threads()
    {
        return $this->hasMany(LmsForumThread::class, 'lms_forum_id');
    }
}

