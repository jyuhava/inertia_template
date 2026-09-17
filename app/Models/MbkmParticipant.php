<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MbkmParticipant extends Model
{
    protected $fillable = ['mbkm_application_id', 'mahasiswa_id', 'status', 'accepted_at'];

    protected $casts = ['accepted_at' => 'date'];

    public function application()
    {
        return $this->belongsTo(MbkmApplication::class, 'mbkm_application_id');
    }

    public function mahasiswa()
    {
        return $this->belongsTo(Mahasiswa::class);
    }

    public function program()
    {
        return $this->hasOneThrough(MbkmProgram::class, MbkmApplication::class, 'id', 'id', 'mbkm_application_id', 'mbkm_program_id');
    }

    public function placement()
    {
        return $this->hasOne(MbkmPlacement::class);
    }

    public function recognitions()
    {
        return $this->hasMany(MbkmRecognition::class);
    }
}
