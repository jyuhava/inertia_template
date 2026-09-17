<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MbkmApplication;
use App\Models\MbkmPartner;
use App\Models\MbkmProgram;
use App\Models\MbkmProgramType;
use App\Models\MbkmRecognition;
use App\Models\Prodi;
use App\Models\Semester;
use App\Services\Mbkm\MbkmExecutionService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MbkmController extends Controller
{
    public function index(Request $request)
    {
        $programs = MbkmProgram::query()
            ->with(['programType', 'partner', 'semester', 'prodi'])
            ->withCount('applications')
            ->when($request->search, fn ($q) => $q->where(fn ($qq) => $qq->where('name', 'like', "%{$request->search}%")->orWhere('code', 'like', "%{$request->search}%")))
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Admin/Mbkm/Index', [
            'programs' => $programs,
            'filters' => $request->only('search', 'status'),
            'programTypes' => MbkmProgramType::where('is_active', true)->get(['id', 'code', 'name']),
            'semesters' => Semester::latest()->limit(10)->get(['id', 'nama_semester']),
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Mbkm/Create', [
            'programTypes' => MbkmProgramType::where('is_active', true)->get(['id', 'code', 'name']),
            'partners' => MbkmPartner::where('status', 'active')->get(['id', 'name', 'partner_type']),
            'prodis' => Prodi::where('status', 'aktif')->get(['id', 'nama_prodi']),
            'semesters' => Semester::latest()->limit(10)->get(['id', 'nama_semester']),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'code' => 'required|string|max:50|unique:mbkm_programs,code',
            'name' => 'required|string|max:255',
            'mbkm_program_type_id' => 'required|exists:mbkm_program_types,id',
            'semester_id' => 'nullable|exists:semesters,id',
            'mbkm_partner_id' => 'nullable|exists:mbkm_partners,id',
            'prodi_id' => 'nullable|exists:prodis,id',
            'registration_start' => 'required|date',
            'registration_end' => 'required|date|after_or_equal:registration_start',
            'implementation_start' => 'nullable|date',
            'implementation_end' => 'nullable|date|after_or_equal:implementation_start',
            'quota' => 'nullable|integer|min:1',
            'credit_limit' => 'nullable|numeric|min:0|max:100',
            'requirements' => 'nullable|string',
        ]);
        $data['status'] = $request->input('status', 'draft');
        $data['created_by'] = $request->user()->id;
        if (is_string($data['requirements'] ?? null)) {
            $data['requirements'] = array_values(array_filter(array_map('trim', explode("\n", $data['requirements']))));
        }
        MbkmProgram::create($data);

        return redirect()->route('admin.mbkm.programs.index')->with('success', 'Program MBKM dibuat.');
    }

    public function show(MbkmProgram $program)
    {
        $program->load(['programType', 'partner', 'semester', 'prodi', 'targets.prodi']);
        $program->loadCount('applications');
        $applications = $program->applications()->with(['mahasiswa.prodi', 'mahasiswa.user'])->latest()->paginate(20);

        return Inertia::render('Admin/Mbkm/Show', [
            'program' => $program,
            'applications' => $applications,
        ]);
    }

    public function updateStatus(Request $request, MbkmProgram $program)
    {
        $request->validate(['status' => 'required|string|in:draft,published,registration_open,registration_closed,selection,ongoing,completed,cancelled,archived']);
        $before = ['status' => $program->status];
        $program->update(['status' => $request->status]);
        $program->audits()->create(['user_id' => $request->user()->id, 'action' => 'STATUS_CHANGED', 'before' => $before, 'after' => ['status' => $program->status]]);

        return back()->with('success', 'Status program diperbarui.');
    }

    public function applications()
    {
        return response()->json(MbkmApplication::with(['mahasiswa', 'program'])->latest()->paginate());
    }

    public function accept(MbkmApplication $application, MbkmExecutionService $service)
    {
        $service->accept($application, request()->user());

        return back()->with('success', 'Peserta MBKM diterima.');
    }

    public function approveRecognition(MbkmRecognition $recognition, MbkmExecutionService $service)
    {
        $service->approveRecognition($recognition, request()->user());

        return back()->with('success', 'Rekognisi MBKM disetujui.');
    }
}
