<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentCourseRegistrationItem extends Model
{
    protected $fillable = [
        'registration_id', 'kelas_kuliah_id', 'mata_kuliah_id',
        'kurikulum_mata_kuliah_id', 'sks_snapshot', 'status',
    ];

    protected $casts = [
        'sks_snapshot' => 'decimal:2',
    ];

    public function registration()
    {
        return $this->belongsTo(StudentCourseRegistration::class, 'registration_id');
    }

    public function kelasKuliah()
    {
        return $this->belongsTo(KelasKuliah::class);
    }

    public function mataKuliah()
    {
        return $this->belongsTo(MataKuliah::class);
    }

    public function kurikulumMataKuliah()
    {
        return $this->belongsTo(KurikulumMataKuliah::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }
}
