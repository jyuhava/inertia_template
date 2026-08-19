<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LmsChapter extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    public function course()
    {
        return $this->belongsTo(LmsCourse::class, 'lms_course_id');
    }

    public function materials()
    {
        return $this->hasMany(LmsMaterial::class)->orderBy('order');
    }

    public function assignments()
    {
        return $this->hasMany(LmsAssignment::class);
    }

    public function forums()
    {
        return $this->hasMany(LmsForum::class)->orderBy('order');
    }
}
