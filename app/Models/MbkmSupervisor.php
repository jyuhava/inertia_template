<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MbkmSupervisor extends Model
{
    protected $fillable = ['mbkm_placement_id', 'dosen_id', 'name', 'email', 'role'];

    public function placement()
    {
        return $this->belongsTo(MbkmPlacement::class, 'mbkm_placement_id');
    }

    public function dosen()
    {
        return $this->belongsTo(Dosen::class);
    }
}
