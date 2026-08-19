<?php

namespace App\Http\Controllers;

use App\Models\MeetingMinute;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PublicMeetingMinuteController extends Controller
{
    /**
     * Tampilkan notulen publik (tanpa login) via public_token.
     */
    public function show(Request $request, string $token)
    {
        $meetingMinute = MeetingMinute::public()
            ->where('public_token', $token)
            ->with([
                'agendaItems',
                'attachments.uploader:id,name',
                'creator:id,name',
            ])
            ->first();

        if (!$meetingMinute) {
            abort(404, 'Notulen tidak ditemukan.');
        }

        return Inertia::render('Public/MeetingMinutes/Show', [
            'meeting' => $meetingMinute,
        ]);
    }
}