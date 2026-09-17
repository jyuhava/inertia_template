<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ObeTaxonomyLevel extends Model
{
    protected $fillable = ['code', 'name', 'category', 'description', 'sequence', 'status'];

    public function cpmks()
    {
        return $this->hasMany(ObeCpmk::class, 'taxonomy_level_id');
    }
}
