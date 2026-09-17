<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MbkmProgramTarget extends Model
{
    protected $fillable = ['mbkm_program_id', 'prodi_id', 'minimum_semester', 'maximum_semester', 'minimum_gpa', 'minimum_credits', 'student_status'];

    public function program()
    {
        return $this->belongsTo(MbkmProgram::class, 'mbkm_program_id');
    }

    public function prodi()
    {
        return $this->belongsTo(Prodi::class);
    }
}
