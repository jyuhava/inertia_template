<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentStudyResult extends Model
{
    protected $fillable = ['mahasiswa_id', 'periode_krs_id', 'kurikulum_id', 'status', 'total_courses', 'total_credits', 'earned_credits', 'semester_gpa', 'cumulative_gpa', 'published_at', 'published_by', 'locked_at'];

    protected $casts = ['published_at' => 'datetime', 'locked_at' => 'datetime', 'total_credits' => 'decimal:2', 'earned_credits' => 'decimal:2', 'semester_gpa' => 'decimal:2', 'cumulative_gpa' => 'decimal:2'];

    public function mahasiswa()
    {
        return $this->belongsTo(Mahasiswa::class);
    }

    public function periodeKrs()
    {
        return $this->belongsTo(PeriodeKrs::class);
    }

    public function items()
    {
        return $this->hasMany(StudentStudyResultItem::class, 'study_result_id');
    }

    public function publishedBy()
    {
        return $this->belongsTo(User::class, 'published_by');
    }
}
