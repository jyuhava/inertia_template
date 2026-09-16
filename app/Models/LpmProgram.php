<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LpmProgram extends Model
{
    protected $fillable = [
        'nama_program',
        'skema',
        'tahun_anggaran',
        'tanggal_buka',
        'tanggal_tutup',
        'pagu_dana',
        'maksimal_dana',
        'sumber_dana',
        'persyaratan',
        'template_proposal',
        'status',
        'created_by',
    ];

    protected $casts = [
        'tanggal_buka' => 'date',
        'tanggal_tutup' => 'date',
        'pagu_dana' => 'decimal:2',
        'maksimal_dana' => 'decimal:2',
    ];

    public function proposals(): HasMany
    {
        return $this->hasMany(LpmProposal::class, 'program_id');
    }

    public function reviewScheme(): BelongsTo
    {
        return $this->belongsTo(LpmReviewScheme::class, 'id', 'program_id')->where('aktif', true);
    }

    public function scopeAktif($query)
    {
        return $query->where('status', 'aktif');
    }

    public function isTerbuka(): bool
    {
        $today = now()->toDateString();

        return $this->status === 'aktif'
            && $today >= $this->tanggal_buka->toDateString()
            && $today <= $this->tanggal_tutup->toDateString();
    }
}