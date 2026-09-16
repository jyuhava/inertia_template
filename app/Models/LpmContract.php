<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LpmContract extends Model
{
    protected $fillable = [
        'proposal_id',
        'nomor_kontrak',
        'tanggal_mulai',
        'tanggal_selesai',
        'dana_disetujui',
        'file_kontrak',
        'kesepakatan',
        'disetujui_oleh',
    ];

    protected $casts = [
        'tanggal_mulai' => 'date',
        'tanggal_selesai' => 'date',
        'dana_disetujui' => 'decimal:2',
    ];

    public function proposal(): BelongsTo
    {
        return $this->belongsTo(LpmProposal::class, 'proposal_id');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'disetujui_oleh');
    }
}