<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Dosen;
use App\Models\Prodi;
use App\Models\Thesis;
use App\Models\ThesisRevision;
use App\Models\ThesisSetting;
use App\Models\ThesisTitleSubmission;
use App\Models\ThesisType;
use App\Services\Thesis\ThesisService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ThesisController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->validate([
            'status' => 'nullable|string|max:40',
            'search' => 'nullable|string|max:255',
        ]);

        $theses = Thesis::with(['mahasiswa.prodi', 'type', 'activeSupervisors.dosen'])
            ->when($filters['status'] ?? null, fn ($query) => $query->where('status', $filters['status']))
            ->when($filters['search'] ?? null, function ($query, string $search) {
                $query->where(function ($query) use ($search) {
                    $query->where('title', 'like', "%{$search}%")
                        ->orWhereHas('mahasiswa', fn ($query) => $query->where(function ($query) use ($search) {
                            $query->where('nama_lengkap', 'like', "%{$search}%")->orWhere('nim', 'like', "%{$search}%");
                        }));
                });
            })
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/TugasAkhir/Index', [
            'theses' => $theses,
            'capacityOverview' => $this->capacityOverview(),
            'filters' => ['status' => $filters['status'] ?? null, 'search' => $filters['search'] ?? null],
        ]);
    }

    /** Beban bimbing tiap dosen beserta kuota yang ditetapkan per prodi. */
    private function capacityOverview(): array
    {
        return Dosen::where('status', 'aktif')
            ->whereHas('thesisSupervisors', fn ($query) => $query->where('status', 'active'))
            ->withCount(['thesisSupervisors as active_count' => fn ($query) => $query->where('status', 'active')])
            ->with('thesisSupervisors.thesis.prodi.thesisSetting')
            ->orderByDesc('active_count')
            ->take(12)
            ->get()
            ->map(function (Dosen $dosen) {
                $capacity = $dosen->thesisSupervisors
                    ->where('status', 'active')
                    ->pluck('thesis.prodi.thesisSetting.supervisor_capacity')
                    ->filter()
                    ->min();

                return [
                    'id' => $dosen->id,
                    'name' => $dosen->nama_lengkap,
                    'active_count' => (int) $dosen->active_count,
                    'capacity' => $capacity !== null ? (int) $capacity : null,
                ];
            })
            ->values()
            ->all();
    }

    public function show(Thesis $thesis)
    {
        $thesis->load(['mahasiswa.prodi', 'prodi', 'semester', 'type', 'titleSubmissions', 'supervisors.dosen', 'sessions.supervisor.dosen', 'documents', 'events', 'revisions', 'audits.user']);

        return Inertia::render('Admin/TugasAkhir/Show', ['thesis' => $thesis, 'lecturers' => Dosen::where('status', 'aktif')->get(['id', 'nama_lengkap'])]);
    }

    public function reviewTitle(Request $request, ThesisTitleSubmission $submission, ThesisService $service)
    {
        $data = $request->validate(['decision' => 'required|in:approved,revision,rejected', 'comment' => 'nullable|string', 'selected_title' => 'nullable|string|max:255']);
        $service->reviewTitle($submission, $data['decision'], $data['comment'] ?? null, $data['selected_title'] ?? null, $request->user());

        return back()->with('success', 'Pengajuan judul berhasil ditinjau.');
    }

    public function reviewLatestTitle(Request $request, Thesis $thesis, ThesisService $service)
    {
        $data = $request->validate(['status' => 'required|in:title_approved,title_revision', 'selected_title' => 'nullable|string|max:255', 'comment' => 'nullable|string']);
        $submission = $thesis->titleSubmissions()->where('status', 'submitted')->latest('version')->firstOrFail();
        $service->reviewTitle($submission, $data['status'] === 'title_approved' ? 'approved' : 'revision', $data['comment'] ?? null, $data['selected_title'] ?? null, $request->user());

        return back()->with('success', 'Pengajuan judul berhasil ditinjau.');
    }

    public function assignSupervisor(Request $request, Thesis $thesis, ThesisService $service)
    {
        $data = $request->validate([
            'dosen_id' => 'nullable|required_without:primary_supervisor_id|exists:dosens,id',
            'role' => 'nullable|required_with:dosen_id|in:pembimbing_1,pembimbing_2',
            'primary_supervisor_id' => 'nullable|required_without:dosen_id|exists:dosens,id',
            'secondary_supervisor_id' => 'nullable|different:primary_supervisor_id|exists:dosens,id',
        ]);
        DB::transaction(function () use ($data, $service, $thesis, $request) {
            if (! empty($data['dosen_id'])) {
                $service->assignSupervisor($thesis, $data['dosen_id'], $data['role'], $request->user());
            } else {
                $service->assignSupervisor($thesis, $data['primary_supervisor_id'], 'pembimbing_1', $request->user());
                if (! empty($data['secondary_supervisor_id'])) {
                    $service->assignSupervisor($thesis, $data['secondary_supervisor_id'], 'pembimbing_2', $request->user());
                }
            }
        });

        return back()->with('success', 'Pembimbing berhasil ditetapkan.');
    }

    public function assignSupervisors(Request $request, Thesis $thesis, ThesisService $service)
    {
        $data = $request->validate(['primary_supervisor_id' => 'required|exists:dosens,id', 'secondary_supervisor_id' => 'nullable|different:primary_supervisor_id|exists:dosens,id']);
        DB::transaction(function () use ($data, $service, $thesis, $request) {
            $service->assignSupervisor($thesis, $data['primary_supervisor_id'], 'pembimbing_1', $request->user());
            if (! empty($data['secondary_supervisor_id'])) {
                $service->assignSupervisor($thesis, $data['secondary_supervisor_id'], 'pembimbing_2', $request->user());
            }
        });

        return back()->with('success', 'Pembimbing berhasil ditetapkan.');
    }

    public function scheduleEvent(Request $request, Thesis $thesis, ThesisService $service)
    {
        $data = $request->validate(['kind' => 'required|in:seminar_proposal,result_seminar,defense', 'scheduled_at' => 'required|date', 'ends_at' => 'nullable|date|after:scheduled_at', 'examiner_ids' => 'required|array|min:1', 'examiner_ids.*' => 'integer|exists:dosens,id', 'notes' => 'nullable|string']);
        $service->scheduleEvent($thesis, $data['kind'], $data['scheduled_at'], $data['ends_at'] ?? null, $data['examiner_ids'], $request->user());

        return back()->with('success', 'Jadwal seminar/sidang berhasil ditetapkan.');
    }

    public function reviewRevision(Request $request, ThesisRevision $revision, ThesisService $service)
    {
        $data = $request->validate(['decision' => 'required|in:verified,revision', 'comment' => 'nullable|string']);
        $service->reviewRevision($revision, $data['decision'], $data['comment'] ?? null, $request->user());

        return back()->with('success', 'Revisi tugas akhir berhasil ditinjau.');
    }

    public function finalize(Request $request, Thesis $thesis, ThesisService $service)
    {
        $data = $request->validate(['grade' => 'required|string|max:10', 'grade_point' => 'required|numeric|min:0|max:4']);
        $service->finalize($thesis, $data['grade'], (float) $data['grade_point'], $request->user());

        return back()->with('success', 'Tugas akhir dan nilai final berhasil dikunci.');
    }

    public function saveSetting(Request $request, Prodi $prodi)
    {
        $data = $request->validate(['minimum_credits' => 'required|numeric|min:0', 'minimum_gpa' => 'required|numeric|min:0|max:4', 'supervisor_capacity' => 'nullable|integer|min:1']);
        ThesisSetting::updateOrCreate(['prodi_id' => $prodi->id], $data);

        return back()->with('success', 'Persyaratan tugas akhir berhasil disimpan.');
    }

    public function storeType(Request $request)
    {
        $data = $request->validate([
            'prodi_id' => 'nullable|exists:prodis,id',
            'mata_kuliah_id' => 'nullable|exists:mata_kuliahs,id',
            'code' => ['required', 'string', 'max:50', Rule::unique('thesis_types')->where(fn ($query) => $query->where('prodi_id', $request->input('prodi_id')))],
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);
        ThesisType::create($data + ['is_active' => $request->boolean('is_active', true)]);

        return back()->with('success', 'Jenis tugas akhir berhasil ditambahkan.');
    }
}
