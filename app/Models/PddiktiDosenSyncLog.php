<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PddiktiDosenSyncLog extends Model
{
    use HasFactory;

    protected $table = 'pddikti_dosen_sync_logs';

    protected $fillable = ['dosen_id', 'pddikti_id', 'action', 'payload', 'response', 'status', 'message'];

    protected $casts = ['payload' => 'array', 'response' => 'array'];

    public function dosen()
    {
        return $this->belongsTo(Dosen::class);
    }
}
