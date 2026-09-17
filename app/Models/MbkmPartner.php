<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MbkmPartner extends Model
{
    protected $fillable = [
        'name',
        'partner_type',
        'email',
        'phone',
        'address',
        'city',
        'country',
        'status',
        'notes',
    ];

    public function programs(): HasMany
    {
        return $this->hasMany(MbkmProgram::class);
    }
}
