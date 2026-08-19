<?php

namespace App\Http\Controllers;

use App\Models\MeetingAgendaItem;
use App\Models\MeetingMinute;
use App\Models\MeetingMinuteAttachment;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class MeetingMinuteController extends Controller
{
    /**
     * Daftar notulen rapat yang terlihat oleh user:
     * - yang dibuatnya
     * - sebagai attendee
     * - sebagai PIC pada agenda item
     * - admin melihat semua
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = MeetingMinute::query()
            ->withCount('agendaItems')
            ->with(['creator:id,name'])
            ->orderBy('meeting_date', 'desc');

        // Visibilitas: selain admin hanya melihat notulen terkait dirinya
        if (!$user->isAdmin()) {
            $query->where(function ($q) use ($user) {
                $q->where('created_by', $user->id)
                    ->orWhereJsonContains('attendees', $user->id)
                    ->orWhereHas('agendaItems', function ($agenda) use ($user) {
                        $agenda->whereJsonContains('pic', $user->id);
                    });
            });
        }

        // Search: title / division / location
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('division', 'like', "%{$search}%")
                    ->orWhere('location', 'like', "%{$search}%");
            });
        }

        // Filter status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter division
        if ($request->filled('division')) {
            $query->where('division', $request->division);
        }

        // Filter rentang tanggal
        if ($request->filled('date_from')) {
            $query->whereDate('meeting_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('meeting_date', '<=', $request->date_to);
        }

        $meetings = $query->paginate(10)->withQueryString();

        // Komponen Pagination frontend sudah menangani link null, tidak perlu konversi.

        $employees = User::orderBy('name')
            ->get(['id', 'name']);

        $divisions = MeetingMinute::select('division')
            ->distinct()
            ->orderBy('division')
            ->pluck('division')
            ->values();

        return Inertia::render('MeetingMinutes/Index', [
            'meetings' => $meetings,
            'employees' => $employees,
            'divisions' => $divisions,
            'filters' => $request->only(['search', 'status', 'division', 'date_from', 'date_to']),
        ]);
    }

    /**
     * Tampilkan form buat notulen baru.
     */
    public function create()
    {
        $employees = User::orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('MeetingMinutes/Create', [
            'employees' => $employees,
        ]);
    }

    /**
     * Simpan notulen rapat beserta agenda items.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'division' => 'required|string|max:255',
            'meeting_date' => 'required|date',
            'location' => 'required|string|max:255',
            'description' => 'nullable|string',
            'attendees' => 'required|array',
            'attendees.*' => 'integer|exists:users,id',
            'agenda_items' => 'required|array|min:1',
            'agenda_items.*.discussion' => 'required|string',
            'agenda_items.*.decision' => 'required|string',
            'agenda_items.*.pic' => 'required|array',
            'agenda_items.*.pic.*' => 'integer|exists:users,id',
            'agenda_items.*.deadline' => 'required|date',
        ]);

        $meetingMinute = MeetingMinute::create([
            'title' => $validated['title'],
            'division' => $validated['division'],
            'meeting_date' => $validated['meeting_date'],
            'location' => $validated['location'],
            'description' => $validated['description'] ?? null,
            'attendees' => array_map('intval', $validated['attendees']),
            'status' => 'draft',
            'created_by' => $request->user()->id,
        ]);

        foreach (array_values($validated['agenda_items']) as $index => $item) {
            MeetingAgendaItem::create([
                'meeting_minute_id' => $meetingMinute->id,
                'item_number' => $index + 1,
                'discussion' => $item['discussion'],
                'decision' => $item['decision'],
                'pic' => array_map('intval', $item['pic']),
                'deadline' => $item['deadline'],
                'status' => 'pending',
                'progress_percentage' => 0,
            ]);
        }

        return redirect()
            ->route('meeting-minutes.show', $meetingMinute)
            ->with('success', 'Notulen rapat berhasil dibuat.');
    }

    /**
     * Detail notulen rapat.
     */
    public function show(MeetingMinute $meetingMinute)
    {
        $this->authorizeView($meetingMinute);

        $meetingMinute->load([
            'agendaItems',
            'attachments.uploader:id,name',
            'creator:id,name',
            'shares.sharedTo:id,name',
        ]);

        $employees = User::orderBy('name')->get(['id', 'name']);

        return Inertia::render('MeetingMinutes/Show', [
            'meeting' => $meetingMinute,
            'employees' => $employees,
            'canEdit' => $this->canModify($meetingMinute),
        ]);
    }

    /**
     * Tampilkan form edit notulen.
     */
    public function edit(MeetingMinute $meetingMinute)
    {
        $this->authorizeView($meetingMinute);
        $this->authorizeModify($meetingMinute);

        $meetingMinute->load(['agendaItems']);

        $employees = User::orderBy('name')->get(['id', 'name']);

        return Inertia::render('MeetingMinutes/Edit', [
            'meeting' => $meetingMinute,
            'employees' => $employees,
        ]);
    }

    /**
     * Update header notulen + sync agenda items.
     */
    public function update(Request $request, MeetingMinute $meetingMinute)
    {
        $this->authorizeModify($meetingMinute);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'division' => 'required|string|max:255',
            'meeting_date' => 'required|date',
            'location' => 'required|string|max:255',
            'description' => 'nullable|string',
            'attendees' => 'required|array',
            'attendees.*' => 'integer|exists:users,id',
            'agenda_items' => 'required|array|min:1',
            'agenda_items.*.id' => 'nullable|integer|exists:meeting_agenda_items,id',
            'agenda_items.*.discussion' => 'required|string',
            'agenda_items.*.decision' => 'required|string',
            'agenda_items.*.pic' => 'required|array',
            'agenda_items.*.pic.*' => 'integer|exists:users,id',
            'agenda_items.*.deadline' => 'required|date',
            'agenda_items.*.status' => 'nullable|in:pending,in_progress,completed,overdue',
        ]);

        $meetingMinute->update([
            'title' => $validated['title'],
            'division' => $validated['division'],
            'meeting_date' => $validated['meeting_date'],
            'location' => $validated['location'],
            'description' => $validated['description'] ?? null,
            'attendees' => array_map('intval', $validated['attendees']),
        ]);

        $this->syncAgendaItems($meetingMinute, $validated['agenda_items']);

        return redirect()
            ->route('meeting-minutes.show', $meetingMinute)
            ->with('success', 'Notulen rapat berhasil diperbarui.');
    }

    /**
     * Hapus notulen rapat.
     */
    public function destroy(MeetingMinute $meetingMinute)
    {
        $this->authorizeModify($meetingMinute);

        // Hapus file lampiran dari storage
        foreach ($meetingMinute->attachments as $attachment) {
            Storage::disk('public')->delete($attachment->file_path);
        }

        $meetingMinute->delete();

        return redirect()
            ->route('meeting-minutes.index')
            ->with('success', 'Notulen rapat berhasil dihapus.');
    }

    /**
     * Update status notulen (draft/published/archived).
     */
    public function updateStatus(Request $request, MeetingMinute $meetingMinute)
    {
        $this->authorizeModify($meetingMinute);

        $validated = $request->validate([
            'status' => 'required|in:draft,published,archived',
        ]);

        $data = ['status' => $validated['status']];

        if ($validated['status'] === 'published') {
            $data['published_at'] = now();
            $data['published_by'] = $request->user()->id;
        }

        $meetingMinute->update($data);

        return back()->with('success', 'Status notulen diperbarui menjadi ' . $validated['status'] . '.');
    }

    /**
     * Update progress agenda item (PHP endpoint).
     */
    public function updateProgress(Request $request, MeetingAgendaItem $agendaItem)
    {
        $this->authorizeView($agendaItem->meetingMinute);

        $validated = $request->validate([
            'progress_percentage' => 'required|integer|min:0|max:100',
            'progress_notes' => 'nullable|string',
            'status' => 'nullable|in:pending,in_progress,completed,overdue',
        ]);

        $agendaItem->updateProgress(
            (int) $validated['progress_percentage'],
            $validated['progress_notes'] ?? null,
            $validated['status'] ?? null,
            $request->user()->id
        );

        return back()->with('success', 'Progress agenda item berhasil diperbarui.');
    }

    /**
     * Toggle publish publik (JSON untuk Inertia).
     */
    public function togglePublic(MeetingMinute $meetingMinute)
    {
        $this->authorizeModify($meetingMinute);

        if ($meetingMinute->is_public) {
            $meetingMinute->unpublishFromPublic();
            $isPublic = false;
            $publicUrl = null;
        } else {
            $meetingMinute->publishToPublic(request()->user()->id);
            $isPublic = true;
            $publicUrl = $meetingMinute->public_url;
        }

        return response()->json([
            'success' => true,
            'is_public' => $isPublic,
            'public_url' => $publicUrl,
        ]);
    }

    /**
     * Upload lampiran notulen.
     */
    public function uploadAttachment(Request $request, MeetingMinute $meetingMinute)
    {
        $this->authorizeModify($meetingMinute);

        $request->validate([
            'file' => 'required|file|max:20480', // max 20MB
            'description' => 'nullable|string|max:500',
            'meeting_agenda_item_id' => 'nullable|integer|exists:meeting_agenda_items,id',
        ]);

        $file = $request->file('file');

        $fileName = time() . '_' . str_replace(' ', '_', $file->getClientOriginalName());
        $filePath = $file->storeAs(
            'meeting-attachments',
            $fileName,
            'public'
        );

        $attachment = MeetingMinuteAttachment::create([
            'meeting_minute_id' => $meetingMinute->id,
            'meeting_agenda_item_id' => $request->meeting_agenda_item_id ?? null,
            'uploaded_by' => $request->user()->id,
            'original_name' => $file->getClientOriginalName(),
            'file_name' => $fileName,
            'file_path' => $filePath,
            'file_type' => $this->detectFileType($file),
            'mime_type' => $file->getMimeType(),
            'file_size' => $file->getSize(),
            'description' => $request->description ?? null,
        ]);

        return response()->json([
            'success' => true,
            'attachment' => $attachment,
        ]);
    }

    /**
     * Hapus lampiran.
     */
    public function deleteAttachment(MeetingMinuteAttachment $attachment)
    {
        $this->authorizeModify($attachment->meetingMinute);

        Storage::disk('public')->delete($attachment->file_path);
        $attachment->delete();

        return back()->with('success', 'Lampiran berhasil dihapus.');
    }

    /**
     * Sync agenda items saat update: hapus yang dihapus, update yang ada, insert yang baru.
     */
    private function syncAgendaItems(MeetingMinute $meetingMinute, array $items): void
    {
        $keptIds = [];

        foreach (array_values($items) as $index => $item) {
            $data = [
                'item_number' => $index + 1,
                'discussion' => $item['discussion'],
                'decision' => $item['decision'],
                'pic' => array_map('intval', $item['pic']),
                'deadline' => $item['deadline'],
            ];

            if (!empty($item['id'])) {
                $agendaItem = $meetingMinute->agendaItems()
                    ->find($item['id']);

                if ($agendaItem) {
                    $agendaItem->update($data);

                    if (!empty($item['status'])) {
                        $agendaItem->update(['status' => $item['status']]);
                    }

                    $keptIds[] = $agendaItem->id;
                    continue;
                }
            }

            $newItem = $meetingMinute->agendaItems()->create($data + [
                'status' => 'pending',
                'progress_percentage' => 0,
                'updated_by' => request()->user()->id,
                'last_updated_at' => now(),
            ]);

            $keptIds[] = $newItem->id;
        }

        // Hapus agenda item yang tidak dikirim dari form
        if (!empty($keptIds)) {
            $meetingMinute->agendaItems()
                ->whereNotIn('id', $keptIds)
                ->delete();
        } else {
            $meetingMinute->agendaItems()->delete();
        }
    }

    /**
     * Cek user boleh melihat notulen (creator / attendee / PIC / admin).
     */
    private function authorizeView(MeetingMinute $meetingMinute): void
    {
        $user = request()->user();

        if ($user->isAdmin()) {
            return;
        }

        $isAttendee = in_array($user->id, $meetingMinute->attendees ?? [], true);
        $isPic = $meetingMinute->agendaItems()
            ->whereJsonContains('pic', $user->id)
            ->exists();

        if ($meetingMinute->created_by !== $user->id && !$isAttendee && !$isPic) {
            abort(403, 'Anda tidak memiliki akses ke notulen ini.');
        }
    }

    /**
     * Cek user boleh memodifikasi (hanya creator atau admin).
     */
    private function canModify(MeetingMinute $meetingMinute): bool
    {
        $user = request()->user();

        return $user->isAdmin() || $meetingMinute->created_by === $user->id;
    }

    private function authorizeModify(MeetingMinute $meetingMinute): void
    {
        if (!$this->canModify($meetingMinute)) {
            abort(403, 'Anda tidak berhak memodifikasi notulen ini.');
        }
    }

    /**
     * Deteksi tipe file: image, document, spreadsheet, pdf, lainnya.
     */
    private function detectFileType($file): string
    {
        $mime = $file->getMimeType();
        $ext = strtolower($file->getClientOriginalExtension());

        if (str_starts_with($mime, 'image/')) {
            return 'image';
        }

        if ($mime === 'application/pdf' || $ext === 'pdf') {
            return 'pdf';
        }

        if (in_array($ext, ['xls', 'xlsx', 'csv', 'ods'], true)) {
            return 'spreadsheet';
        }

        if (str_starts_with($mime, 'text/') || in_array($ext, ['doc', 'docx', 'txt', 'rtf', 'md', 'ppt', 'pptx'], true)) {
            return 'document';
        }

        return 'document';
    }
}