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
        $krsList = $mahasiswa->krs()
            ->whereIn('status', ['diambil', 'disetujui'])
            ->whereHas('jadwalKuliah.lmsCourse')
            ->with([
                'jadwalKuliah.mataKuliah',
                'jadwalKuliah.dosen',
                'jadwalKuliah.lmsCourse.chapters.materials',
                'jadwalKuliah.lmsCourse.chapters.assignments',
                'jadwalKuliah.lmsCourse.chapters.forums',
            ])
            ->get();

        // Kumpulkan id materi & tugas dari seluruh kelas untuk query progress sekali jalan
        $materialIds = $krsList
            ->flatMap(fn ($krs) => $krs->jadwalKuliah->lmsCourse->chapters->flatMap->materials->pluck('id'))
            ->unique();

        $assignmentIds = $krsList
            ->flatMap(fn ($krs) => $krs->jadwalKuliah->lmsCourse->chapters->flatMap->assignments->pluck('id'))
            ->unique();

        $completedMaterialIds = LmsMaterialProgress::where('mahasiswa_id', $mahasiswa->id)
            ->whereIn('lms_material_id', $materialIds)
            ->pluck('lms_material_id')
            ->flip();

        $submittedAssignmentIds = LmsAssignmentSubmission::where('mahasiswa_id', $mahasiswa->id)
            ->whereIn('lms_assignment_id', $assignmentIds)
            ->pluck('lms_assignment_id')
            ->flip();

        $courses = $krsList->map(function ($krs) use ($completedMaterialIds, $submittedAssignmentIds) {
            $jadwal = $krs->jadwalKuliah;
            $course = $jadwal->lmsCourse;
            $chapters = $course->chapters;

            $materials = $chapters->flatMap->materials;
            $assignments = $chapters->flatMap->assignments;

            $totalMaterials = $materials->count();
            $completedMaterials = $materials->filter(fn ($m) => $completedMaterialIds->has($m->id))->count();
            $totalAssignments = $assignments->count();
            $submittedAssignments = $assignments->filter(fn ($a) => $submittedAssignmentIds->has($a->id))->count();

            return [
                'id' => $course->id,
                'mata_kuliah' => $jadwal->mataKuliah->nama_mata_kuliah,
                'kode' => $jadwal->mataKuliah->kode_mata_kuliah,
                'sks' => $jadwal->mataKuliah->sks,
                'semester' => $jadwal->mataKuliah->semester,
                'dosen' => $jadwal->dosen->nama_lengkap,
                'hari' => $jadwal->hari,
                'jam_mulai' => optional($jadwal->jam_mulai)->format('H:i'),
                'jam_selesai' => optional($jadwal->jam_selesai)->format('H:i'),
                'ruangan' => $jadwal->ruangan,
                'description' => $course->description,
                'thumbnail' => $course->thumbnail,
                'chapters_count' => $chapters->count(),
                'materials_count' => $totalMaterials,
                'completed_materials' => $completedMaterials,
                'assignments_count' => $totalAssignments,
                'submitted_assignments' => $submittedAssignments,
                'forums_count' => $chapters->flatMap->forums->count(),
                'progress_percent' => $totalMaterials > 0
                    ? (int) round($completedMaterials / $totalMaterials * 100)
                    : 0,
            ];
        })->values();

        $summary = [
            'courses' => $courses->count(),
            'materials' => $courses->sum('materials_count'),
            'completed_materials' => $courses->sum('completed_materials'),
            'assignments' => $courses->sum('assignments_count'),
            'submitted_assignments' => $courses->sum('submitted_assignments'),
            'pending_assignments' => $courses->sum('assignments_count') - $courses->sum('submitted_assignments'),
            'forums' => $courses->sum('forums_count'),
        ];

        return Inertia::render('Mahasiswa/Lms/Index', [
            'courses' => $courses,
            'summary' => $summary,
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
