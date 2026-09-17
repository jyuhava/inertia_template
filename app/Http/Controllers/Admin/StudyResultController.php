<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Mahasiswa;
use App\Models\PeriodeKrs;
use App\Models\StudentStudyResult;
use App\Services\Academic\KhsService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StudyResultController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('Admin/Khs/StudyResults', ['results' => StudentStudyResult::with(['mahasiswa', 'periodeKrs.semester'])->latest()->paginate(20), 'periods' => PeriodeKrs::orderByDesc('id')->get(['id', 'nama_periode'])]);
    }

    public function publish(Request $request, KhsService $service): RedirectResponse
    {
        $data = $request->validate(['mahasiswa_id' => ['required', 'exists:mahasiswas,id'], 'periode_krs_id' => ['required', 'exists:periode_krs,id']]);
        $service->publish(Mahasiswa::findOrFail($data['mahasiswa_id']), PeriodeKrs::findOrFail($data['periode_krs_id']), $request->user()->id);

        return back()->with('success', 'KHS diterbitkan dari nilai final.');
    }

    public function lock(StudentStudyResult $studyResult, KhsService $service): RedirectResponse
    {
        $service->lock($studyResult);

        return back()->with('success', 'KHS dikunci dan snapshot nilai dipertahankan.');
    }
}
