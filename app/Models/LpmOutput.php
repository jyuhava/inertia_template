<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LpmOutput extends Model
{
    protected $fillable = [
        'proposal_id',
        'jenis_luaran',
        'judul',
        'deskripsi',
        'bukti_path',
        'status_validasi',
        'catatan_validasi',
        'tanggal_verifikasi',
        'diverifikasi_oleh',
        'created_by',
    ];

    protected $casts = [
        'tanggal_verifikasi' => 'datetime',
    ];

    public function proposal(): BelongsTo
    {
        return $this->belongsTo(LpmProposal::class, 'proposal_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'diverifikasi_oleh');
    }
}