<?php

namespace App\Http\Controllers\Dosen;

use App\Http\Controllers\Controller;
use App\Models\Thesis;
use App\Models\ThesisSupervisionSession;
use App\Models\ThesisSupervisor;
use App\Services\Thesis\ThesisService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ThesisController extends Controller
{
    private function dosen(Request $request)
    {
        return $request->user()->dosen()->firstOrFail();
    }

    public function index(Request $request)
    {
        $dosen = $this->dosen($request);
        $theses = Thesis::whereHas('activeSupervisors', fn ($query) => $query->where('dosen_id', $dosen->id))
            ->with('mahasiswa.prodi')->withCount('sessions')->latest()->get();
        $pendingSessions = ThesisSupervisionSession::where('status', 'submitted')
            ->whereHas('supervisor', fn ($query) => $query->where('dosen_id', $dosen->id)->where('status', 'active'))
            ->with('thesis.mahasiswa')->latest()->get();

        return Inertia::render('Dosen/TugasAkhir/Index', ['theses' => $theses, 'pendingSessions' => $pendingSessions]);
    }

    public function reviewSession(Request $request, ThesisSupervisionSession $session, ThesisService $service)
    {
        $data = $request->validate(['feedback' => 'required|string', 'status' => 'required|in:reviewed,revision']);
        $dosen = $this->dosen($request);
        $session->loadMissing('supervisor');
        abort_unless($session->supervisor?->dosen_id === $dosen->id && $session->supervisor->status === 'active', 403);
        $service->reviewSession($session, $dosen, $data['feedback'], $data['status'], $request->user());

        return back()->with('success', 'Bimbingan berhasil ditinjau.');
    }

    public function approveSupervisor(Request $request, ThesisSupervisor $supervisor, ThesisService $service)
    {
        $service->approveSupervisor($supervisor, $this->dosen($request), $request->user());

        return back()->with('success', 'Usulan pembimbing disetujui.');
    }

    public function reviewProposal(Request $request, Thesis $thesis, ThesisService $service)
    {
        $data = $request->validate(['decision' => 'required|in:approved,revision,rejected', 'comment' => 'nullable|string']);
        $service->reviewProposal($thesis, $this->dosen($request), $data['decision'], $data['comment'] ?? null, $request->user());

        return back()->with('success', 'Proposal berhasil ditinjau.');
    }
}
