<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CourseMeeting extends Model
{
    protected $fillable = ['kelas_kuliah_id', 'jadwal_kelas_kuliah_id', 'meeting_number', 'meeting_date', 'start_time', 'end_time', 'topic', 'description', 'status', 'created_by', 'updated_by'];

    protected $casts = ['meeting_date' => 'date', 'start_time' => 'datetime:H:i', 'end_time' => 'datetime:H:i'];

    public function kelasKuliah()
    {
        return $this->belongsTo(KelasKuliah::class);
    }

    public function attendances()
    {
        return $this->hasMany(Absensi::class, 'course_meeting_id');
    }
}
