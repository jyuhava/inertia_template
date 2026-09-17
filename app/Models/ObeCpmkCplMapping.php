<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ObeCpmkCplMapping extends Model
{
    protected $fillable = ['cpmk_id', 'cpl_id', 'weight'];

    protected $casts = ['weight' => 'float'];

    public function cpmk()
    {
        return $this->belongsTo(ObeCpmk::class, 'cpmk_id');
    }

    public function cpl()
    {
        return $this->belongsTo(ObeCpl::class, 'cpl_id');
    }
}
