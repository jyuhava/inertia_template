<?php

namespace App\Http\Controllers\Mahasiswa;

use App\Http\Controllers\Controller;
use App\Models\LmsAssignment;
use App\Models\LmsAssignmentSubmission;
use App\Models\LmsCourse;
use App\Models\LmsForum;
use App\Models\LmsForumThread;
use App\Models\LmsMaterial;
use App\Models\LmsMaterialProgress;
use App\Services\LmsMaterialAssistantService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LmsStudentController extends Controller
{
    public function index()
    {
        $mahasiswa = auth()->user()->mahasiswa;

        // Get courses from KRS
        $courses = $mahasiswa->krs()
            ->whereIn('status', ['diambil', 'disetujui'])
            ->whereHas('jadwalKuliah.lmsCourse')
            ->with(['jadwalKuliah.mataKuliah', 'jadwalKuliah.dosen', 'jadwalKuliah.lmsCourse'])
            ->get()
            ->map(function ($krs) {
                return [
                    'id' => $krs->jadwalKuliah->lmsCourse->id,
                    'mata_kuliah' => $krs->jadwalKuliah->mataKuliah->nama_mata_kuliah,
                    'kode' => $krs->jadwalKuliah->mataKuliah->kode_mata_kuliah,
                    'dosen' => $krs->jadwalKuliah->dosen->nama_lengkap,
                    'description' => $krs->jadwalKuliah->lmsCourse->description,
                    'thumbnail' => $krs->jadwalKuliah->lmsCourse->thumbnail,
                ];
            });

        return Inertia::render('Mahasiswa/Lms/Index', [
            'courses' => $courses
        ]);
    }

    public function show(LmsCourse $lmsCourse)
    {
        $mahasiswa = auth()->user()->mahasiswa;

        // Verify access
        $hasAccess = $mahasiswa->krs()
            ->whereIn('status', ['diambil', 'disetujui'])
            ->where('jadwal_kuliah_id', $lmsCourse->jadwal_kuliah_id)
            ->exists();

        if (! $hasAccess) {
            abort(403, 'Anda tidak mengambil mata kuliah ini.');
        }

        $lmsCourse->load([
            'jadwalKuliah.mataKuliah',
            'jadwalKuliah.dosen',
            'chapters.materials',
            'chapters.assignments',
            'chapters.forums' => function ($query) {
                $query->withCount('threads');
            },
        ]);

        // Get Progress & Submissions
        $progress = LmsMaterialProgress::where('mahasiswa_id', $mahasiswa->id)
            ->whereIn('lms_material_id', $lmsCourse->chapters->pluck('materials')->flatten()->pluck('id'))
            ->pluck('completed_at', 'lms_material_id');

        $submissions = LmsAssignmentSubmission::where('mahasiswa_id', $mahasiswa->id)
            ->whereIn('lms_assignment_id', $lmsCourse->chapters->pluck('assignments')->flatten()->pluck('id'))
            ->get()
            ->keyBy('lms_assignment_id');

        return Inertia::render('Mahasiswa/Lms/Show', [
            'course' => $lmsCourse,
            'progress' => $progress,
            'submissions' => $submissions,
            'mahasiswaId' => $mahasiswa->id 
        ]);
    }

    public function showMaterial(LmsMaterial $material)
    {
        $mahasiswa = auth()->user()->mahasiswa;

        $material->load([
            'chapter.course.jadwalKuliah.mataKuliah',
            'chapter.course.jadwalKuliah.dosen',
        ]);

        $jadwalKuliahId = $material->chapter?->course?->jadwal_kuliah_id;
        $hasAccess = $mahasiswa->krs()
            ->whereIn('status', ['diambil', 'disetujui'])
            ->where('jadwal_kuliah_id', $jadwalKuliahId)
            ->exists();

        if (! $hasAccess) {
            abort(403, 'Anda tidak memiliki akses ke materi ini.');
        }

        $isCompleted = LmsMaterialProgress::where('mahasiswa_id', $mahasiswa->id)
            ->where('lms_material_id', $material->id)
            ->exists();

        return Inertia::render('Mahasiswa/Lms/MaterialShow', [
            'material' => $material,
            'chapter' => $material->chapter,
            'course' => $material->chapter->course,
            'isCompleted' => $isCompleted,
        ]);
    }

    public function toggleProgress(Request $request, LmsMaterial $material)
    {
        $mahasiswa = auth()->user()->mahasiswa;
        
        $progress = LmsMaterialProgress::where('mahasiswa_id', $mahasiswa->id)
            ->where('lms_material_id', $material->id)
            ->first();

        if ($progress) {
            $progress->delete();
            $message = 'Progress dihapus';
        } else {
            LmsMaterialProgress::create([
                'mahasiswa_id' => $mahasiswa->id,
                'lms_material_id' => $material->id,
                'is_completed' => true,
                'completed_at' => now(),
            ]);
            $message = 'Materi ditandai selesai';
        }

        return back()->with('success', $message);
    }

    public function askMaterialAssistant(Request $request, LmsMaterial $material, LmsMaterialAssistantService $assistantService)
    {
        $request->validate([
            'question' => 'required|string|max:2000',
            'messages' => 'nullable|array|max:20',
            'messages.*.role' => 'required_with:messages|in:user,assistant',
            'messages.*.content' => 'required_with:messages|string|max:4000',
        ]);

        $mahasiswa = auth()->user()->mahasiswa;

        $material->load([
            'chapter.course.jadwalKuliah',
            'chapter.course.jadwalKuliah.mataKuliah',
        ]);

        $jadwalKuliahId = $material->chapter?->course?->jadwal_kuliah_id;
        $hasAccess = $mahasiswa->krs()
            ->whereIn('status', ['diambil', 'disetujui'])
            ->where('jadwal_kuliah_id', $jadwalKuliahId)
            ->exists();

        if (! $hasAccess) {
            abort(403, 'Anda tidak memiliki akses ke materi ini.');
        }

        try {
            $answer = $assistantService->answer(
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

    public function submitAssignment(Request $request, LmsAssignment $assignment)
    {
        $mahasiswa = auth()->user()->mahasiswa;
        $submission = \App\Models\LmsAssignmentSubmission::where('mahasiswa_id', $mahasiswa->id)
            ->where('lms_assignment_id', $assignment->id)
            ->first();

        $hasExistingFile = $submission && $submission->file_path;

        if (!$hasExistingFile) {
            $request->validate([
                'file' => 'nullable|file|max:10240', // 10MB max
                'notes' => 'required_without:file|nullable|string'
            ], [
                'notes.required_without' => 'Teks jawaban atau file lampiran wajib diisi.'
            ]);
        } else {
            $request->validate([
                'file' => 'nullable|file|max:10240', // 10MB max
                'notes' => 'nullable|string'
            ]);
        }

        $path = $request->hasFile('file') ? $request->file('file')->store('assignments', 'public') : ($submission ? $submission->file_path : null);

        \App\Models\LmsAssignmentSubmission::updateOrCreate(
            [
                'mahasiswa_id' => $mahasiswa->id,
                'lms_assignment_id' => $assignment->id
            ],
            [
                'file_path' => $path,
                'notes' => $request->notes,
                'submitted_at' => now() // Update timestamp to show when they last edited
            ]
        );

        return back()->with('success', 'Tugas berhasil disimpan/diubah.');
    }

    public function showForum(LmsForum $forum)
    {
        $mahasiswa = auth()->user()->mahasiswa;

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

        $jadwalKuliahId = $forum->chapter?->course?->jadwal_kuliah_id;
        $hasAccess = $mahasiswa->krs()
            ->whereIn('status', ['diambil', 'disetujui'])
            ->where('jadwal_kuliah_id', $jadwalKuliahId)
            ->exists();

        if (! $hasAccess) {
            abort(403, 'Anda tidak memiliki akses ke forum ini.');
        }

        return Inertia::render('Mahasiswa/Lms/Forum/Show', [
            'forum' => $forum,
            'chapter' => $forum->chapter,
            'course' => $forum->chapter->course,
        ]);
    }

    public function showForumThread(LmsForumThread $thread)
    {
        $mahasiswa = auth()->user()->mahasiswa;

        $thread->load([
            'forum.chapter.course.jadwalKuliah.mataKuliah',
            'forum.chapter.course.jadwalKuliah.dosen',
            'dosen',
            'replies' => function ($query) {
                $query->with(['dosen', 'mahasiswa', 'parentReply.dosen', 'parentReply.mahasiswa'])->orderBy('created_at');
            },
        ]);

        $jadwalKuliahId = $thread->forum?->chapter?->course?->jadwal_kuliah_id;
        $hasAccess = $mahasiswa->krs()
            ->whereIn('status', ['diambil', 'disetujui'])
            ->where('jadwal_kuliah_id', $jadwalKuliahId)
            ->exists();

        if (! $hasAccess) {
            abort(403, 'Anda tidak memiliki akses ke thread ini.');
        }

        return Inertia::render('Mahasiswa/Lms/Forum/ThreadShow', [
            'thread' => $thread,
            'forum' => $thread->forum,
            'chapter' => $thread->forum->chapter,
            'course' => $thread->forum->chapter->course,
        ]);
    }

    public function storeForumReply(Request $request, LmsForumThread $thread)
    {
        $validated = $request->validate([
            'content' => 'required|string',
            'parent_reply_id' => 'nullable|integer|exists:lms_forum_replies,id',
        ]);

        $mahasiswa = auth()->user()->mahasiswa;

        $thread->loadMissing('forum.chapter.course.jadwalKuliah');
        $jadwalKuliahId = $thread->forum?->chapter?->course?->jadwal_kuliah_id;
        $hasAccess = $mahasiswa->krs()
            ->whereIn('status', ['diambil', 'disetujui'])
            ->where('jadwal_kuliah_id', $jadwalKuliahId)
            ->exists();

        if (! $hasAccess) {
            abort(403, 'Anda tidak memiliki akses ke thread ini.');
        }

        $parentReplyId = $validated['parent_reply_id'] ?? null;
        if ($parentReplyId) {
            $isParentInSameThread = \App\Models\LmsForumReply::query()
                ->where('id', $parentReplyId)
                ->where('lms_forum_thread_id', $thread->id)
                ->exists();

            if (! $isParentInSameThread) {
                return back()->with('error', 'Balasan induk tidak valid untuk thread ini.');
            }
        }

        $thread->replies()->create([
            'content' => $validated['content'],
            'mahasiswa_id' => $mahasiswa->id,
            'parent_reply_id' => $parentReplyId,
        ]);

        $thread->update(['last_activity_at' => now()]);

        return back()->with('success', 'Balasan berhasil ditambahkan.');
    }
}
