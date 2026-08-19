<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LmsAssignment extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'deadline' => 'datetime',
        'bobot_komponen' => 'decimal:2',
    ];

    public function chapter()
    {
        return $this->belongsTo(LmsChapter::class, 'lms_chapter_id');
    }

    public function submissions()
    {
        return $this->hasMany(LmsAssignmentSubmission::class, 'lms_assignment_id');
    }
}
