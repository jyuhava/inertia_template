<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MeetingMinuteAttachment extends Model
{
    use HasFactory;

    protected $fillable = [
        'meeting_minute_id',
        'meeting_agenda_item_id',
        'uploaded_by',
        'original_name',
        'file_name',
        'file_path',
        'file_type',
        'mime_type',
        'file_size',
        'description',
    ];

    /**
     * Relasi ke notulen.
     */
    public function meetingMinute()
    {
        return $this->belongsTo(MeetingMinute::class);
    }

    /**
     * Relasi ke agenda item (optional, lampiran per agenda).
     */
    public function agendaItem()
    {
        return $this->belongsTo(MeetingAgendaItem::class, 'meeting_agenda_item_id');
    }

    /**
     * Relasi ke user yang mengupload.
     */
    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}