<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class MeetingMinute extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'division',
        'meeting_date',
        'location',
        'attendees',
        'description',
        'status',
        'is_public',
        'public_token',
        'published_at',
        'published_by',
        'created_by',
    ];

    protected $casts = [
        'attendees' => 'array',
        'meeting_date' => 'date',
        'is_public' => 'boolean',
        'published_at' => 'datetime',
    ];

    /**
     * Accessor yang selalu disertakan saat serialisasi (Inertia).
     */
    protected $appends = [
        'average_progress',
        'public_url',
    ];

    /**
     * Relasi ke user pembuat notulen.
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Relasi ke user yang mempublish.
     */
    public function publisher()
    {
        return $this->belongsTo(User::class, 'published_by');
    }

    /**
     * Agenda items milik notulen ini, urut berdasarkan nomor item.
     */
    public function agendaItems()
    {
        return $this->hasMany(MeetingAgendaItem::class)->orderBy('item_number');
    }

    /**
     * Lampiran notulen.
     */
    public function attachments()
    {
        return $this->hasMany(MeetingMinuteAttachment::class);
    }

    /**
     * Berbagi notulen ke pengguna lain.
     */
    public function shares()
    {
        return $this->hasMany(MeetingMinuteShare::class);
    }

    /**
     * Scope: only public meeting minutes with valid token.
     */
    public function scopePublic($query)
    {
        return $query->where('is_public', true)
            ->whereNotNull('public_token');
    }

    /**
     * Accessor: URL publik jika is_public true.
     */
    public function getPublicUrlAttribute()
    {
        if ($this->is_public && $this->public_token) {
            return url('/public/meeting/' . $this->public_token);
        }

        return null;
    }

    /**
     * Terbitkan ke publik: generate token baru, set waktu & user pemberi.
     */
    public function publishToPublic(int $userId): void
    {
        $this->update([
            'is_public' => true,
            'public_token' => Str::random(64),
            'published_at' => now(),
            'published_by' => $userId,
        ]);
    }

    /**
     * Tarik dari publik & hapus token.
     */
    public function unpublishFromPublic(): void
    {
        $this->update([
            'is_public' => false,
            'public_token' => null,
        ]);
    }

    /**
     * Hitung rata-rata progress seluruh agenda items (0-100).
     */
    public function getAverageProgressAttribute(): int
    {
        $count = $this->agendaItems()->count();

        if ($count === 0) {
            return 0;
        }

        return (int) round($this->agendaItems()->avg('progress_percentage'));
    }
}