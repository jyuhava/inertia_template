<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MbkmProgram extends Model
{
    protected $fillable = [
        'code', 'name', 'mbkm_program_type_id', 'semester_id', 'mbkm_partner_id', 'prodi_id',
        'registration_start', 'registration_end', 'implementation_start', 'implementation_end',
        'quota', 'credit_limit', 'status', 'requirements', 'created_by',
    ];

    protected $casts = [
        'registration_start' => 'date', 'registration_end' => 'date',
        'implementation_start' => 'date', 'implementation_end' => 'date',
        'requirements' => 'array',
    ];

    public function applications()
    {
        return $this->hasMany(MbkmApplication::class);
    }

    public function targets()
    {
        return $this->hasMany(MbkmProgramTarget::class);
    }

    public function programType()
    {
        return $this->belongsTo(MbkmProgramType::class, 'mbkm_program_type_id');
    }

    public function partner()
    {
        return $this->belongsTo(MbkmPartner::class, 'mbkm_partner_id');
    }

    public function prodi()
    {
        return $this->belongsTo(Prodi::class);
    }

    public function semester()
    {
        return $this->belongsTo(Semester::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function audits()
    {
        return $this->morphMany(MbkmAudit::class, 'auditable')->latest();
    }

    public function isRegistrationOpen(): bool
    {
        return $this->status === 'registration_open' && today()->between($this->registration_start, $this->registration_end);
    }
}
