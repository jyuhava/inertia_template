<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MbkmPlacement extends Model
{
    protected $fillable = ['mbkm_participant_id', 'mbkm_partner_id', 'title', 'status', 'start_date', 'end_date', 'description'];

    protected $casts = ['start_date' => 'date', 'end_date' => 'date'];

    public function participant()
    {
        return $this->belongsTo(MbkmParticipant::class, 'mbkm_participant_id');
    }

    public function partner()
    {
        return $this->belongsTo(MbkmPartner::class, 'mbkm_partner_id');
    }

    public function supervisors()
    {
        return $this->hasMany(MbkmSupervisor::class);
    }

    public function activities()
    {
        return $this->hasMany(MbkmActivity::class);
    }

    public function logbooks()
    {
        return $this->hasMany(MbkmLogbook::class);
    }

    public function attendances()
    {
        return $this->hasMany(MbkmAttendance::class);
    }

    public function assessments()
    {
        return $this->hasMany(MbkmAssessment::class);
    }
}
