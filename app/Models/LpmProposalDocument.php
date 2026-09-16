<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LpmProposalDocument extends Model
{
    protected $fillable = [
        'proposal_id',
        'jenis',
        'nama_file',
        'path',
        'uploaded_by',
    ];

    public function proposal(): BelongsTo
    {
        return $this->belongsTo(LpmProposal::class, 'proposal_id');
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}