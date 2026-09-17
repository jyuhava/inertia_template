<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentCourseRegistrationAudit extends Model
{
    protected $fillable = ['registration_id', 'user_id', 'action', 'before', 'after', 'reason'];

    protected $casts = [
        'before' => 'array',
        'after' => 'array',
    ];

    public function registration()
    {
        return $this->belongsTo(StudentCourseRegistration::class, 'registration_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
