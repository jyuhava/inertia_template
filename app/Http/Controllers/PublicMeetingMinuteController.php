<?php

namespace App\Http\Controllers;

use App\Models\MeetingMinute;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
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

    /**
     * Unduh dokumen notulensi resmi melalui tautan publik (tanpa login).
     */
    public function downloadOfficialDocument(string $token)
    {
        $meetingMinute = MeetingMinute::public()
            ->where('public_token', $token)
            ->firstOrFail();

        if (!$meetingMinute->official_document_path) {
            abort(404, 'Dokumen notulensi resmi belum tersedia.');
        }

        return Storage::disk('public')->download(
            $meetingMinute->official_document_path,
            $meetingMinute->official_document_name ?: 'dokumen-notulensi.pdf'
        );
    }
}