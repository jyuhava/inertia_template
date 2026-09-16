<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LpmReport extends Model
{
    protected $fillable = [
        'proposal_id',
        'jenis',
        'file_path',
        'catatan',
        'status_validasi',
        'catatan_validasi',
        'tanggal_verifikasi',
        'diverifikasi_oleh',
        'uploaded_by',
    ];

    protected $casts = [
        'tanggal_verifikasi' => 'datetime',
    ];

    public function proposal(): BelongsTo
    {
        return $this->belongsTo(LpmProposal::class, 'proposal_id');
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'diverifikasi_oleh');
    }
}