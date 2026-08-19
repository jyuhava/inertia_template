<?php

namespace App\Http\Controllers\Dosen;

use App\Http\Controllers\Controller;
use App\Models\JadwalKuliah;
use App\Models\LmsCourse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LmsCourseController extends Controller
{
    public function index()
    {
        $dosenId = auth()->user()->dosen->id;

        // Get schedules for this dosen, with their LMS course if it exists
        $schedules = JadwalKuliah::where('dosen_id', $dosenId)
            ->with(['mataKuliah.prodi', 'lmsCourse'])
            //->whereHas('semester.tahunAjaran', function($q) {
            //  $q->where('status', 'aktif');
            //})
            ->get();

        return Inertia::render('Dosen/Lms/Index', [
            'schedules' => $schedules
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'jadwal_kuliah_id' => 'required|exists:jadwal_kuliahs,id'
        ]);

        // Ensure Dosen owns this schedule
        $schedule = JadwalKuliah::where('id', $request->jadwal_kuliah_id)
            ->where('dosen_id', auth()->user()->dosen->id)
            ->firstOrFail();

        $course = LmsCourse::firstOrCreate(
            ['jadwal_kuliah_id' => $schedule->id],
            ['description' => 'Selamat datang di kursus ini.']
        );

        return redirect()->route('dosen.lms.show', $course->id);
    }

    public function show(LmsCourse $lmsCourse)
    {
        // Authorization check
        if ($lmsCourse->jadwalKuliah->dosen_id !== auth()->user()->dosen->id) {
            abort(403);
        }

        $lmsCourse->load([
            'jadwalKuliah.mataKuliah',
            'chapters.materials',
            'chapters.assignments',
            'chapters.forums' => function ($query) {
                $query->withCount('threads');
            },
        ]);

        return Inertia::render('Dosen/Lms/Show', [
            'course' => $lmsCourse
        ]);
    }
}
