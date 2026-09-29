<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiJob extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'status',
        'input',
        'result',
        'error',
        'started_at',
        'finished_at',
    ];

    protected $casts = [
        'input' => 'array',
        'started_at' => 'datetime',
        'finished_at' => 'datetime',
    ];

    public const TYPE_GENERATE_DRAFT = 'generate-material-draft';

    public function isFinished(): bool
    {
        return in_array($this->status, ['done', 'failed'], true);
    }
}
