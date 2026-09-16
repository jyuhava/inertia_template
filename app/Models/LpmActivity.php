<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LpmActivity extends Model
{
    protected $fillable = [
        'proposal_id',
        'nama_kegiatan',
        'tanggal',
        'deskripsi',
        'dokumentasi',
        'created_by',
    ];

    protected $casts = [
        'tanggal' => 'date',
    ];

    public function proposal(): BelongsTo
    {
        return $this->belongsTo(LpmProposal::class, 'proposal_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}