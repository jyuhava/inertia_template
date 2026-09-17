<?php

namespace App\Http\Controllers\Mahasiswa;

use App\Http\Controllers\Controller;
use App\Models\Thesis;
use App\Models\ThesisType;
use App\Services\Thesis\ThesisEligibilityService;
use App\Services\Thesis\ThesisService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class ThesisController extends Controller
{
    private function mahasiswa(Request $request)
    {
        return $request->user()->mahasiswa()->firstOrFail();
    }

    public function index(Request $request, ThesisEligibilityService $eligibility)
    {
        $mahasiswa = $this->mahasiswa($request);
        $thesis = $mahasiswa->theses()->with(['type', 'titleSubmissions', 'activeSupervisors.dosen', 'documents', 'events', 'revisions'])->latest()->first();
        $problems = $eligibility->validate($mahasiswa);

        return Inertia::render('Mahasiswa/TugasAkhir/Index', [
            'thesis' => $thesis,
            'titleSubmissions' => $thesis?->titleSubmissions ?? [],
            'history' => $thesis?->audits ?? [],
            'thesisTypes' => ThesisType::where('is_active', true)->where(fn ($query) => $query->whereNull('prodi_id')->orWhere('prodi_id', $mahasiswa->prodi_id))->get(),
            'eligibility' => ['eligible' => $problems === [], 'requirements' => $problems, 'summary' => $eligibility->academicSummary($mahasiswa)],
        ]);
    }

    public function submitTitle(Request $request, ThesisService $service)
    {
        $data = $request->validate([
            'thesis_type_id' => 'required|exists:thesis_types,id',
            'semester_id' => 'nullable|exists:semesters,id',
            'kurikulum_id' => 'nullable|exists:kurikulums,id',
            'title' => 'required|string|max:255',
            'alternate_titles' => 'nullable|array|max:3',
            'alternate_titles.*' => 'nullable|string|max:255',
            'background' => 'nullable|string', 'problem_statement' => 'nullable|string', 'objective' => 'nullable|string',
            'topic' => 'nullable|string|max:255', 'method' => 'nullable|string|max:255', 'description' => 'nullable|string',
        ]);
        $mahasiswa = $this->mahasiswa($request);
        $thesis = $mahasiswa->theses()->whereNotIn('status', ['completed', 'cancelled', 'withdrawn'])->latest()->first()
            ?? $service->create($mahasiswa, ThesisType::findOrFail($data['thesis_type_id']), $data['semester_id'] ?? null, $data['kurikulum_id'] ?? null, $request->user());
        if ($thesis->thesis_type_id !== (int) $data['thesis_type_id']) {
            throw ValidationException::withMessages(['thesis_type_id' => 'Jenis tugas akhir tidak dapat diubah pada pengajuan yang sedang berjalan.']);
        }
        $submission = $service->submitTitle($thesis, collect($data)->except(['thesis_type_id', 'semester_id', 'kurikulum_id'])->all(), $request->user());
        $similar = $service->similarTitles($thesis, $submission->title);

        return back()->with('success', 'Judul tugas akhir berhasil diajukan.')->with('warning', $similar ? 'Terdapat judul serupa untuk ditinjau prodi.' : null);
    }

    public function sessions(Request $request)
    {
        $thesis = $this->mahasiswa($request)->theses()->with(['sessions.supervisor.dosen', 'activeSupervisors.dosen'])->latest()->first();

        return Inertia::render('Mahasiswa/TugasAkhir/Sessions', ['thesis' => $thesis, 'sessions' => $thesis?->sessions ?? []]);
    }

    public function storeSession(Request $request, Thesis $thesis, ThesisService $service)
    {
        $data = $request->validate(['thesis_supervisor_id' => 'required|exists:thesis_supervisors,id', 'meeting_date' => 'required|date', 'topic' => 'required|string|max:255', 'discussion' => 'nullable|string', 'student_notes' => 'nullable|string']);
        $mahasiswa = $this->mahasiswa($request);
        abort_unless($thesis->mahasiswa_id === $mahasiswa->id, 403);
        $service->submitSession($thesis, $mahasiswa, $data['thesis_supervisor_id'], $data, $request->user());

        return back()->with('success', 'Catatan bimbingan berhasil diajukan.');
    }

    public function uploadDocument(Request $request, Thesis $thesis, ThesisService $service)
    {
        abort_unless($thesis->mahasiswa_id === $this->mahasiswa($request)->id, 403);
        $data = $request->validate(['type' => 'required|in:proposal,final,attachment,instrument', 'document' => 'required|file|mimes:pdf,doc,docx|max:10240']);
        $file = $data['document'];
        $service->uploadDocument($thesis, $data['type'], $file->store("theses/{$thesis->id}", 'public'), $file->getClientOriginalName(), $request->user());

        return back()->with('success', 'Dokumen berhasil diunggah.');
    }
}
