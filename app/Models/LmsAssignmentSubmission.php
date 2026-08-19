<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LmsAssignmentSubmission extends Model
{
    use \Illuminate\Database\Eloquent\Factories\HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'submitted_at' => 'datetime',
        'grade' => 'decimal:2',
    ];

    public function mahasiswa()
    {
        return $this->belongsTo(Mahasiswa::class);
    }

    public function assignment()
    {
        return $this->belongsTo(LmsAssignment::class, 'lms_assignment_id');
    }
}
