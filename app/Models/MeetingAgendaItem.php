<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

class MeetingAgendaItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'meeting_minute_id',
        'item_number',
        'discussion',
        'decision',
        'pic',
        'deadline',
        'status',
        'progress_percentage',
        'progress_notes',
        'last_updated_at',
        'updated_by',
    ];

    protected $casts = [
        'deadline' => 'date',
        'pic' => 'array',
        'last_updated_at' => 'datetime',
        'progress_percentage' => 'integer',
    ];

    /**
     * Accessor yang selalu disertakan saat serialisasi (Inertia).
     */
    protected $appends = [
        'is_overdue',
        'status_label',
        'progress_color',
    ];

    /**
     * Relasi ke notulen.
     */
    public function meetingMinute()
    {
        return $this->belongsTo(MeetingMinute::class);
    }

    /**
     * Relasi ke user yang terakhir mengupdate progress.
     */
    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Accessor: item sudah lewat deadline dan belum selesai.
     */
    public function getIsOverdueAttribute(): bool
    {
        return $this->deadline && $this->deadline->isPast()
            && $this->status !== 'completed';
    }

    /**
     * Accessor: label status Bahasa Indonesia.
     */
    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            'pending' => 'Menunggu',
            'in_progress' => 'Dalam Progress',
            'completed' => 'Selesai',
            'overdue' => 'Terlambat',
            default => ucfirst((string) $this->status),
        };
    }

    /**
     * Accessor: class warna Tailwind berdasarkan persentase progress.
     */
    public function getProgressColorAttribute(): string
    {
        $percentage = (int) $this->progress_percentage;

        if ($percentage >= 100) {
            return 'bg-green-500';
        }

        if ($percentage >= 75) {
            return 'bg-blue-500';
        }

        if ($percentage >= 50) {
            return 'bg-yellow-500';
        }

        if ($percentage >= 25) {
            return 'bg-orange-500';
        }

        return 'bg-red-500';
    }

    /**
     * Accessor: nama-nama PIC dari tabel users berdasarkan array pic IDs.
     */
    public function getPicNamesAttribute(): array
    {
        $ids = is_array($this->pic) ? array_filter($this->pic) : [];

        if (empty($ids)) {
            return [];
        }

        return User::whereIn('id', $ids)
            ->pluck('name')
            ->values()
            ->all();
    }

    /**
     * Update progress + auto-update status.
     * progress >= 100   -> completed
     * progress > 0      -> in_progress (jika masih pending)
     */
    public function updateProgress(int $percentage, ?string $notes, ?string $status, int $userId): void
    {
        $percentage = max(0, min(100, $percentage));

        $autoStatus = $this->status;
        if ($percentage >= 100) {
            $autoStatus = 'completed';
        } elseif ($percentage > 0 && $autoStatus === 'pending') {
            $autoStatus = 'in_progress';
        }

        $finalStatus = !empty($status) ? $status : $autoStatus;

        // Pastikan status overdue tidak menimpa status lain kecuali selesai
        if ($this->status === 'overdue' && $finalStatus === 'overdue') {
            $finalStatus = $autoStatus;
        }

        $this->update([
            'progress_percentage' => $percentage,
            'progress_notes' => $notes,
            'status' => $finalStatus,
            'last_updated_at' => now(),
            'updated_by' => $userId,
        ]);
    }
}