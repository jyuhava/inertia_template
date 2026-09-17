<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MbkmRecognition extends Model
{
    protected $fillable = ['mbkm_participant_id', 'mata_kuliah_id', 'krs_id', 'study_result_id', 'recognized_credits', 'score', 'grade', 'status', 'approved_by', 'approved_at'];

    protected $casts = ['recognized_credits' => 'decimal:2', 'score' => 'decimal:2', 'approved_at' => 'datetime'];

    public function participant()
    {
        return $this->belongsTo(MbkmParticipant::class, 'mbkm_participant_id');
    }

    public function mataKuliah()
    {
        return $this->belongsTo(MataKuliah::class, 'mata_kuliah_id');
    }

    public function krs()
    {
        return $this->belongsTo(Krs::class);
    }

    public function studyResult()
    {
        return $this->belongsTo(StudentStudyResult::class, 'study_result_id');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
