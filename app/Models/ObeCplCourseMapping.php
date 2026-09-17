<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ObeCplCourseMapping extends Model
{
    protected $fillable = ['cpl_id', 'mata_kuliah_id', 'kurikulum_id', 'contribution_level', 'weight'];

    protected $casts = ['weight' => 'float'];

    public function cpl()
    {
        return $this->belongsTo(ObeCpl::class, 'cpl_id');
    }

    public function mataKuliah()
    {
        return $this->belongsTo(MataKuliah::class);
    }

    public function kurikulum()
    {
        return $this->belongsTo(Kurikulum::class);
    }
}
