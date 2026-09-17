<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentStudyResultItem extends Model
{
    protected $fillable = ['study_result_id', 'krs_id', 'registration_item_id', 'penilaian_id', 'mata_kuliah_id', 'kelas_kuliah_id', 'jadwal_kuliah_id', 'credits', 'grade_numeric', 'grade', 'grade_point', 'status'];

    protected $casts = ['credits' => 'decimal:2', 'grade_numeric' => 'decimal:2', 'grade_point' => 'decimal:2'];

    public function mataKuliah()
    {
        return $this->belongsTo(MataKuliah::class);
    }

    public function penilaian()
    {
        return $this->belongsTo(Penilaian::class);
    }
}
