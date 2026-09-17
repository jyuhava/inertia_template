<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PddiktiSyncLog extends Model
{
    use HasFactory;

    protected $table = 'pddikti_sync_logs';

    public $timestamps = false;

    protected $fillable = [
        'mahasiswa_id',
        'pddikti_id',
        'action',
        'payload',
        'response',
        'status',
        'message',
        'created_at',
    ];

    protected $casts = [
        'payload' => 'array',
        'response' => 'array',
        'created_at' => 'datetime',
    ];

    public function mahasiswa()
    {
        return $this->belongsTo(Mahasiswa::class);
    }
}
