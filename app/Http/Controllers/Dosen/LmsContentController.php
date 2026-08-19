<?php

namespace App\Http\Controllers\Dosen;

use App\Http\Controllers\Controller;
use App\Models\LmsChapter;
use App\Models\LmsCourse;
use App\Models\LmsMaterial;
use App\Models\LmsAssignment;
use App\Models\LmsAssignmentSubmission;
use App\Models\LmsForum;
use App\Models\LmsForumThread;
use App\Models\LmsForumReply;
use App\Models\Penilaian;
use App\Services\LmsMaterialAssistantService;
use App\Services\LmsPenilaianSyncService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class LmsContentController extends Controller
{
    public function __construct(
        private LmsPenilaianSyncService $penilaianSyncService,
        private LmsMaterialAssistantService $materialAssistantService
    )
    {
    }

    // Chapter Methods
    public function storeChapter(Request $request, LmsCourse $lmsCourse)
    {
        $request->validate(['title' => 'required|string|max:255']);
        
        $lmsCourse->chapters()->create([
            'title' => $request->title,
            'order' => $lmsCourse->chapters()->count() + 1
        ]);

        return back();
    }

    public function updateChapter(Request $request, LmsChapter $chapter)
    {
        $request->validate(['title' => 'required|string|max:255']);
        $chapter->update(['title' => $request->title]);
        return back();
    }

    public function deleteChapter(LmsChapter $chapter)
    {
        $chapter->delete();
        return back();
    }

    // Forum Methods
    public function storeForum(Request $request, LmsChapter $chapter)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'nullable|boolean',
        ]);

        $this->ensureDosenOwnsCourse($chapter->course);

        $chapter->forums()->create([
            'title' => $request->title,
            'description' => $request->description,
            'is_active' => $request->boolean('is_active', true),
            'order' => $chapter->forums()->count() + 1,
        ]);

        return back()->with('success', 'Forum berhasil ditambahkan.');
    }

    public function updateForum(Request $request, LmsForum $forum)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'nullable|boolean',
        ]);

        $forum->loadMissing('chapter.course.jadwalKuliah');
        $this->ensureDosenOwnsCourse($forum->chapter->course);

        $forum->update([
            'title' => $request->title,
            'description' => $request->description,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return back()->with('success', 'Forum berhasil diperbarui.');
    }

    public function deleteForum(LmsForum $forum)
    {
        $forum->loadMissing('chapter.course.jadwalKuliah');
        $this->ensureDosenOwnsCourse($forum->chapter->course);

        $forum->delete();

        return back()->with('success', 'Forum berhasil dihapus.');
    }

    public function showForum(LmsForum $forum)
    {
        $forum->load([
            'chapter.course.jadwalKuliah.mataKuliah',
            'chapter.course.jadwalKuliah.dosen',
            'threads' => function ($query) {
                $query->with(['dosen'])
                    ->withCount('replies')
                    ->orderByDesc('is_pinned')
                    ->orderByDesc('last_activity_at')
                    ->orderByDesc('created_at');
            },
        ]);

        $this->ensureDosenOwnsCourse($forum->chapter->course);

        return Inertia::render('Dosen/Lms/Forum/Show', [
            'forum' => $forum,
            'chapter' => $forum->chapter,
            'course' => $forum->chapter->course,
        ]);
    }

    public function showForumThread(LmsForumThread $thread)
    {
        $thread->load([
            'forum.chapter.course.jadwalKuliah.mataKuliah',
            'forum.chapter.course.jadwalKuliah.dosen',
            'dosen',
            'replies' => function ($query) {
                $query->with(['dosen', 'mahasiswa', 'parentReply'])->orderBy('created_at');
            },
        ]);

        $this->ensureDosenOwnsCourse($thread->forum->chapter->course);

        return Inertia::render('Dosen/Lms/Forum/ThreadShow', [
            'thread' => $thread,
            'forum' => $thread->forum,
            'chapter' => $thread->forum->chapter,
            'course' => $thread->forum->chapter->course,
        ]);
    }

    public function storeForumThread(Request $request, LmsForum $forum)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'is_pinned' => 'nullable|boolean',
            'is_locked' => 'nullable|boolean',
        ]);

        $forum->loadMissing('chapter.course.jadwalKuliah');
        $this->ensureDosenOwnsCourse($forum->chapter->course);

        $forum->threads()->create([
            'title' => $request->title,
            'content' => $request->content,
            'is_pinned' => $request->boolean('is_pinned', false),
            'is_locked' => $request->boolean('is_locked', false),
            'last_activity_at' => now(),
            'dosen_id' => auth()->user()?->dosen?->id,
        ]);

        return back()->with('success', 'Thread forum berhasil dibuat.');
    }

    public function updateForumThread(Request $request, LmsForumThread $thread)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'is_pinned' => 'nullable|boolean',
            'is_locked' => 'nullable|boolean',
        ]);

        $thread->loadMissing('forum.chapter.course.jadwalKuliah');
        $this->ensureDosenOwnsCourse($thread->forum->chapter->course);

        $thread->update([
            'title' => $request->title,
            'content' => $request->content,
            'is_pinned' => $request->boolean('is_pinned', false),
            'is_locked' => $request->boolean('is_locked', false),
            'last_activity_at' => now(),
        ]);

        return back()->with('success', 'Thread forum berhasil diperbarui.');
    }

    public function deleteForumThread(LmsForumThread $thread)
    {
        $thread->loadMissing('forum.chapter.course.jadwalKuliah');
        $this->ensureDosenOwnsCourse($thread->forum->chapter->course);

        $thread->delete();

        return back()->with('success', 'Thread forum berhasil dihapus.');
    }

    public function storeForumReply(Request $request, LmsForumThread $thread)
    {
        $validated = $request->validate([
            'content' => 'required|string',
            'parent_reply_id' => 'nullable|integer|exists:lms_forum_replies,id',
        ]);

        $thread->loadMissing('forum.chapter.course.jadwalKuliah');
        $this->ensureDosenOwnsCourse($thread->forum->chapter->course);

        $parentReplyId = $validated['parent_reply_id'] ?? null;
        if ($parentReplyId) {
            $isParentInSameThread = LmsForumReply::query()
                ->where('id', $parentReplyId)
                ->where('lms_forum_thread_id', $thread->id)
                ->exists();

            if (! $isParentInSameThread) {
                return back()->with('error', 'Balasan induk tidak valid untuk thread ini.');
            }
        }

        $thread->replies()->create([
            'content' => $validated['content'],
            'dosen_id' => auth()->user()?->dosen?->id,
            'parent_reply_id' => $parentReplyId,
        ]);

        $thread->update(['last_activity_at' => now()]);

        return back()->with('success', 'Balasan berhasil ditambahkan.');
    }

    public function updateForumReply(Request $request, LmsForumReply $reply)
    {
        $request->validate([
            'content' => 'required|string',
        ]);

        $reply->loadMissing('thread.forum.chapter.course.jadwalKuliah');
        $this->ensureDosenOwnsCourse($reply->thread->forum->chapter->course);

        $reply->update([
            'content' => $request->content,
        ]);

        $reply->thread->update(['last_activity_at' => now()]);

        return back()->with('success', 'Balasan berhasil diperbarui.');
    }

    public function deleteForumReply(LmsForumReply $reply)
    {
        $reply->loadMissing('thread.forum.chapter.course.jadwalKuliah');
        $this->ensureDosenOwnsCourse($reply->thread->forum->chapter->course);

        $thread = $reply->thread;
        $reply->delete();
        $thread->update(['last_activity_at' => now()]);

        return back()->with('success', 'Balasan berhasil dihapus.');
    }

    // Material Methods
    public function createMaterial(LmsChapter $chapter)
    {
        $chapter->load('course');
        return Inertia::render('Dosen/Lms/Material/Create', [
            'chapter' => $chapter,
            'course' => $chapter->course
        ]);
    }

    public function editMaterial(LmsMaterial $material)
    {
        $material->load(['chapter.course']);
        return Inertia::render('Dosen/Lms/Material/Edit', [
            'material' => $material,
            'chapter' => $material->chapter,
            'course' => $material->chapter->course
        ]);
    }

    public function showMaterial(LmsMaterial $material)
    {
        $material->load([
            'chapter.course.jadwalKuliah.mataKuliah',
            'chapter.course.jadwalKuliah.dosen',
        ]);

        $jadwalKuliah = $material->chapter?->course?->jadwalKuliah;
        $dosenId = auth()->user()?->dosen?->id;
        if (! $jadwalKuliah || ! $dosenId || $jadwalKuliah->dosen_id !== $dosenId) {
            abort(403, 'Unauthorized.');
        }

        return Inertia::render('Dosen/Lms/Material/Show', [
            'material' => $material,
            'chapter' => $material->chapter,
            'course' => $material->chapter->course,
        ]);
    }

    public function storeMaterial(Request $request, LmsChapter $chapter)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'type' => 'required|in:text,file,video',
            'content' => 'nullable|string',
            'file' => 'nullable|file|max:10240', // 10MB
            'video_url' => 'nullable|string', // Added for video link support if needed
        ]);

        $filePath = null;
        if ($request->hasFile('file')) {
            $filePath = $request->file('file')->store('lms-materials', 'public');
        }

        $chapter->materials()->create([
            'title' => $request->title,
            'type' => $request->type,
            'content' => $request->content,
            'file_path' => $filePath,
            'video_url' => $request->video_url, // Assuming we might want this field later, but for now just basic support
            'order' => $chapter->materials()->count() + 1
        ]);

        return redirect()->route('dosen.lms.show', $chapter->lms_course_id)->with('success', 'Materi berhasil ditambahkan');
    }

    public function generateMaterialDraft(Request $request, LmsChapter $chapter)
    {
        @set_time_limit(120);

        $validated = $request->validate([
            'prompt' => 'required|string|max:3000',
        ]);

        $apiKey = config('services.openrouter.api_key');
        if (!$apiKey) {
            return response()->json([
                'message' => 'OPENROUTER_API_KEY belum diatur di environment.',
            ], 422);
        }

        $chapter->loadMissing('course.jadwalKuliah.mataKuliah');
        $courseName = $chapter->course?->jadwalKuliah?->mataKuliah?->nama_mata_kuliah ?? 'Mata Kuliah';

        $systemPrompt = "Kamu adalah asisten dosen untuk membuat materi kuliah berbahasa Indonesia. "
            ."Keluarkan konten dalam format HTML sederhana yang rapi (h2, h3, p, ul, ol, li, blockquote) "
            ."tanpa tag html/body/script. Fokus praktis, terstruktur, akademik, dan siap ditempel ke rich text editor.";

        $userPrompt = "Mata kuliah: {$courseName}\n"
            ."Bab: {$chapter->title}\n"
            ."Permintaan dosen: {$validated['prompt']}\n\n"
            ."Buat: judul materi singkat + isi materi lengkap.";

        try {
            $response = Http::timeout(120)
                ->withHeaders([
                    'Authorization' => 'Bearer '.$apiKey,
                    'Content-Type' => 'application/json',
                    'HTTP-Referer' => config('app.url'),
                    'X-Title' => config('app.name'),
                ])
                ->post('https://openrouter.ai/api/v1/chat/completions', [
                    'model' => 'openai/gpt-oss-120b:free',
                    'messages' => [
                        ['role' => 'system', 'content' => $systemPrompt],
                        ['role' => 'user', 'content' => $userPrompt],
                    ],
                    'reasoning' => [
                        'enabled' => true,
                    ],
                ]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Gagal terhubung ke OpenRouter: '.$e->getMessage(),
            ], 500);
        }

        if (!$response->successful()) {
            return response()->json([
                'message' => 'OpenRouter error.',
                'detail' => $response->json(),
            ], 502);
        }

        $content = data_get($response->json(), 'choices.0.message.content', '');
        if (is_array($content)) {
            $content = collect($content)->pluck('text')->filter()->implode("\n");
        }

        $content = trim((string) $content);
        if ($content === '') {
            return response()->json([
                'message' => 'Model tidak mengembalikan konten.',
            ], 422);
        }

        return response()->json([
            'content' => $content,
        ]);
    }

    public function updateMaterial(Request $request, LmsMaterial $material)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'type' => 'required|in:text,file,video',
            'content' => 'nullable|string',
            'file' => 'nullable|file|max:10240',
        ]);

        $data = [
            'title' => $request->title,
            'type' => $request->type,
            'content' => $request->content,
        ];

        if ($request->hasFile('file')) {
            if ($material->file_path) {
                Storage::disk('public')->delete($material->file_path);
            }
            $data['file_path'] = $request->file('file')->store('lms-materials', 'public');
        }

        $material->update($data);

        return redirect()->route('dosen.lms.show', $material->chapter->lms_course_id)->with('success', 'Materi berhasil diperbarui');
    }

    public function deleteMaterial(LmsMaterial $material)
    {
        if ($material->file_path) {
            Storage::disk('public')->delete($material->file_path);
        }
        $material->delete();
        return back();
    }

    public function askMaterialAssistant(Request $request, LmsMaterial $material)
    {
        $request->validate([
            'question' => 'required|string|max:2000',
            'messages' => 'nullable|array|max:20',
            'messages.*.role' => 'required_with:messages|in:user,assistant',
            'messages.*.content' => 'required_with:messages|string|max:4000',
        ]);

        $material->load([
            'chapter.course.jadwalKuliah',
            'chapter.course.jadwalKuliah.mataKuliah',
        ]);

        $jadwalKuliah = $material->chapter?->course?->jadwalKuliah;
        $dosenId = auth()->user()?->dosen?->id;
        if (! $jadwalKuliah || ! $dosenId || $jadwalKuliah->dosen_id !== $dosenId) {
            abort(403, 'Unauthorized.');
        }

        try {
            $answer = $this->materialAssistantService->answer(
                $material,
                $request->input('question'),
                $request->input('messages', [])
            );
        } catch (\Throwable $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }

        return response()->json([
            'answer' => $answer,
        ]);
    }

    // Assignment Methods
    public function createAssignment(LmsChapter $chapter)
    {
        $chapter->load('course');
        return Inertia::render('Dosen/Lms/Assignment/Create', [
            'chapter' => $chapter,
            'course' => $chapter->course
        ]);
    }

    public function editAssignment(LmsAssignment $assignment)
    {
        $assignment->load(['chapter.course']);
        return Inertia::render('Dosen/Lms/Assignment/Edit', [
            'assignment' => $assignment,
            'chapter' => $assignment->chapter,
            'course' => $assignment->chapter->course
        ]);
    }

    public function storeAssignment(Request $request, LmsChapter $chapter)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'komponen' => 'required|in:harian,uts,uas',
            'bobot_komponen' => 'nullable|numeric|min:0.01|max:100',
            'deadline' => 'nullable|date',
            'file' => 'nullable|file|max:10240',
        ]);

        $filePath = null;
        if ($request->hasFile('file')) {
            $filePath = $request->file('file')->store('lms-assignments', 'public');
        }

        $chapter->assignments()->create([
            'title' => $request->title,
            'description' => $request->description,
            'komponen' => $request->komponen,
            'bobot_komponen' => $request->bobot_komponen ?? 1,
            'deadline' => $request->deadline,
            'file_path' => $filePath,
        ]);

        return redirect()->route('dosen.lms.show', $chapter->lms_course_id)->with('success', 'Tugas berhasil ditambahkan');
    }

    public function updateAssignment(Request $request, LmsAssignment $assignment)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'komponen' => 'required|in:harian,uts,uas',
            'bobot_komponen' => 'nullable|numeric|min:0.01|max:100',
            'deadline' => 'nullable|date',
            'file' => 'nullable|file|max:10240',
        ]);

        $data = [
            'title' => $request->title,
            'description' => $request->description,
            'komponen' => $request->komponen,
            'bobot_komponen' => $request->bobot_komponen ?? 1,
            'deadline' => $request->deadline,
        ];

        if ($request->hasFile('file')) {
            if ($assignment->file_path) {
                Storage::disk('public')->delete($assignment->file_path);
            }
            $data['file_path'] = $request->file('file')->store('lms-assignments', 'public');
        }

        $assignment->update($data);

        return redirect()->route('dosen.lms.show', $assignment->chapter->lms_course_id)->with('success', 'Tugas berhasil diperbarui');
    }

    public function gradingAssignment(LmsAssignment $assignment)
    {
        $assignment->load([
            'chapter.course.jadwalKuliah.mataKuliah',
            'chapter.course.jadwalKuliah.semester',
            'chapter.course.jadwalKuliah.dosen',
            'submissions.mahasiswa.prodi',
        ]);

        $jadwalKuliah = $assignment->chapter?->course?->jadwalKuliah;
        $dosenId = auth()->user()?->dosen?->id;
        if (! $jadwalKuliah || ! $dosenId || $jadwalKuliah->dosen_id !== $dosenId) {
            abort(403, 'Unauthorized.');
        }

        $submissionStats = [
            'total' => $assignment->submissions->count(),
            'graded' => $assignment->submissions->whereNotNull('grade')->count(),
        ];

        return Inertia::render('Dosen/Lms/Assignment/Grading', [
            'assignment' => $assignment,
            'course' => $assignment->chapter->course,
            'chapter' => $assignment->chapter,
            'submissions' => $assignment->submissions->sortBy('mahasiswa.nim')->values(),
            'stats' => $submissionStats,
        ]);
    }

    public function updateSubmissionGrade(Request $request, LmsAssignmentSubmission $submission)
    {
        $request->validate([
            'grade' => 'nullable|numeric|min:0|max:100',
            'feedback' => 'nullable|string|max:5000',
        ]);

        $submission->load('assignment.chapter.course.jadwalKuliah');

        $jadwalKuliah = $submission->assignment?->chapter?->course?->jadwalKuliah;
        $dosenId = auth()->user()?->dosen?->id;
        if (! $jadwalKuliah || ! $dosenId || $jadwalKuliah->dosen_id !== $dosenId) {
            abort(403, 'Unauthorized.');
        }

        $finalPenilaian = Penilaian::query()
            ->where('mahasiswa_id', $submission->mahasiswa_id)
            ->where('jadwal_kuliah_id', $jadwalKuliah->id)
            ->where('status', 'final')
            ->exists();

        if ($finalPenilaian) {
            return back()->with('error', 'Nilai KHS mahasiswa sudah final dan tidak dapat diubah dari LMS.');
        }

        $submission->update([
            'grade' => $request->filled('grade') ? $request->grade : null,
            'feedback' => $request->feedback,
        ]);

        $this->penilaianSyncService->syncForMahasiswa($jadwalKuliah->id, $submission->mahasiswa_id);

        return back()->with('success', 'Nilai tugas disimpan dan disinkronkan ke penilaian KHS.');
    }

    public function deleteAssignment(LmsAssignment $assignment)
    {
        if ($assignment->file_path) {
            Storage::disk('public')->delete($assignment->file_path);
        }
        $assignment->delete();
        return back();
    }

    private function ensureDosenOwnsCourse(LmsCourse $course): void
    {
        $course->loadMissing('jadwalKuliah');

        $jadwalKuliah = $course->jadwalKuliah;
        $dosenId = auth()->user()?->dosen?->id;

        if (! $jadwalKuliah || ! $dosenId || (int) $jadwalKuliah->dosen_id !== (int) $dosenId) {
            abort(403, 'Unauthorized.');
        }
    }
}
