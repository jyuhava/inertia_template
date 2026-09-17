<?php

namespace App\Http\Controllers\Mahasiswa;

use App\Http\Controllers\Controller;
use App\Models\MbkmApplication;
use App\Models\MbkmPlacement;
use App\Models\MbkmProgram;
use App\Services\Mbkm\MbkmApplicationService;
use App\Services\Mbkm\MbkmEligibilityService;
use App\Services\Mbkm\MbkmExecutionService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MbkmController extends Controller
{
    private function mahasiswa(Request $request)
    {
        return $request->user()->mahasiswa()->firstOrFail();
    }

    public function index(Request $request)
    {
        $mahasiswa = $this->mahasiswa($request);
        $programs = MbkmProgram::with(['programType', 'partner'])
            ->where('status', 'registration_open')
            ->orderBy('registration_end')
            ->get();

        return Inertia::render('Mahasiswa/Mbkm/Index', [
            'programs' => $programs,
            'applications' => $mahasiswa->mbkmApplications()->with('program')->latest()->get(),
        ]);
    }

    public function showProgram(Request $request, MbkmProgram $program, MbkmEligibilityService $eligibility)
    {
        $mahasiswa = $this->mahasiswa($request);
        $program->load(['programType', 'partner', 'targets']);

        return Inertia::render('Mahasiswa/Mbkm/Show', [
            'program' => $program,
            'application' => MbkmApplication::where('mbkm_program_id', $program->id)->where('mahasiswa_id', $mahasiswa->id)->first(),
            'eligibilityProblems' => $eligibility->validate($mahasiswa, $program),
        ]);
    }

    public function store(Request $request, MbkmProgram $program, MbkmApplicationService $service)
    {
        $data = $request->validate(['motivation' => 'nullable|string', 'notes' => 'nullable|string']);
        $service->getOrCreateDraft($this->mahasiswa($request), $program, $data, $request->user());

        return redirect()->route('mahasiswa.mbkm.programs.show', $program);
    }

    public function submit(Request $request, MbkmApplication $application, MbkmApplicationService $service)
    {
        abort_unless($application->mahasiswa_id === $this->mahasiswa($request)->id, 403);
        $service->submit($application, $request->user());

        return back()->with('success', 'Pendaftaran MBKM diajukan.');
    }

    public function activities(Request $request)
    {
        $mahasiswa = $this->mahasiswa($request);
        $placements = MbkmPlacement::with(['participant.program', 'activities', 'supervisors.dosen'])
            ->whereHas('participant', fn ($q) => $q->where('mahasiswa_id', $mahasiswa->id))
            ->latest()
            ->get();

        return Inertia::render('Mahasiswa/Mbkm/Activities', ['placements' => $placements]);
    }

    public function storeActivity(Request $request, MbkmPlacement $placement, MbkmExecutionService $service)
    {
        abort_unless($placement->participant->mahasiswa_id === $this->mahasiswa($request)->id, 403);
        $data = $request->validate(['activity_date' => 'required|date', 'title' => 'required|string|max:255', 'description' => 'nullable|string', 'hours' => 'required|numeric|min:0|max:24']);
        $service->submitActivity($placement, $data);

        return back()->with('success', 'Aktivitas MBKM dicatat.');
    }
}
