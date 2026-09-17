<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ThesisAudit extends Model
{
    protected $fillable = ['user_id', 'action', 'before', 'after', 'reason'];

    protected $casts = ['before' => 'array', 'after' => 'array'];

    public function auditable()
    {
        return $this->morphTo();
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
