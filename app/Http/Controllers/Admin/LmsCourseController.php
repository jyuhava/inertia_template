<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LmsCourse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LmsCourseController extends Controller
{
    public function index()
    {
        $courses = LmsCourse::with(['jadwalKuliah.mataKuliah.prodi', 'jadwalKuliah.dosen'])
            ->latest()
            ->get();

        return Inertia::render('Admin/Lms/Index', [
            'courses' => $courses
        ]);
    }

    public function show(LmsCourse $lmsCourse)
    {
        $lmsCourse->load([
            'jadwalKuliah.mataKuliah', 
            'jadwalKuliah.dosen',
            'chapters.materials',
            'chapters.assignments',
            'chapters.forums'
        ]);

        return Inertia::render('Admin/Lms/Show', [
            'course' => $lmsCourse
        ]);
    }
}
