<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class LpmProposal extends Model
{
    public const STATUSES = [
        'draft' => 'Draft',
        'submitted' => 'Diajukan',
        'returned' => 'Dikembalikan (verifikasi)',
        'revision' => 'Revisi Substansi',
        'under_admin_review' => 'Verifikasi Administrasi',
        'admin_approved' => 'Verifikasi Disetujui',
        'under_substance_review' => 'Review Substansi',
        'passed' => 'Lulus Seleksi',
        'failed' => 'Tidak Lulus',
        'funded' => 'Ditetapkan (Dana)',
        'contracted' => 'Terkontrak',
        'ongoing' => 'Berjalan',
        'progress_report' => 'Laporan Kemajuan',
        'final_report' => 'Laporan Akhir',
        'output_validation' => 'Validasi Luaran',
        'completed' => 'Selesai',
        'rejected' => 'Ditolak',
    ];

    protected $fillable = [
        'program_id',
        'ketua_user_id',
        'judul',
        'ringkasan',
        'mitra',
        'permasalahan',
        'solusi',
        'metode',
        'jadwal',
        'rab',
        'luaran_target',
        'status',
        'versi',
        'alasan_verifikasi',
        'tanggal_submit',
        'created_by',
    ];

    protected $casts = [
        'jadwal' => 'array',
        'rab' => 'array',
        'luaran_target' => 'array',
        'tanggal_submit' => 'datetime',
    ];

    public static function statusLabel(string $status): string
    {
        return self::STATUSES[$status] ?? ucfirst(str_replace('_', ' ', $status));
    }

    public function getStatusDisplayAttribute(): string
    {
        return self::statusLabel($this->status);
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(LpmProgram::class, 'program_id');
    }

    public function ketua(): BelongsTo
    {
        return $this->belongsTo(User::class, 'ketua_user_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function members(): HasMany
    {
        return $this->hasMany(LpmProposalMember::class, 'proposal_id');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(LpmProposalDocument::class, 'proposal_id');
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(LpmReview::class, 'proposal_id');
    }

    public function contract(): HasOne
    {
        return $this->hasOne(LpmContract::class, 'proposal_id');
    }

    public function activities(): HasMany
    {
        return $this->hasMany(LpmActivity::class, 'proposal_id');
    }

    public function reports(): HasMany
    {
        return $this->hasMany(LpmReport::class, 'proposal_id');
    }

    public function outputs(): HasMany
    {
        return $this->hasMany(LpmOutput::class, 'proposal_id');
    }

    public function totalDanaRab(): int
    {
        return collect($this->rab)->sum(fn ($item) => (int) (($item['jumlah'] ?? 0) * ($item['harga_satuan'] ?? 0)));
    }

    public function averageReviewScore(): ?float
    {
        $scores = $this->reviews()->where('status', 'submitted')->whereNotNull('total_score')->pluck('total_score');

        if ($scores->isEmpty()) {
            return null;
        }

        return round($scores->avg(), 2);
    }
}