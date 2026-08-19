<?php

namespace App\Http\Controllers\Raker;

use App\Http\Controllers\Controller;
use App\Models\RakerSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class RakerSessionController extends Controller
{
    private function requireAdmin(): void
    {
        if (! Auth::user() || ! Auth::user()->isAdmin()) {
            abort(403, 'Hanya admin yang memiliki akses.');
        }
    }

    public function index()
    {
        $this->requireAdmin();

        $sessions = RakerSession::withCount('submissions')
            ->orderBy('start_date', 'desc')
            ->paginate(10);

        return Inertia::render('Raker/Sessions/Index', [
            'sessions' => $sessions,
        ]);
    }

    public function create()
    {
        $this->requireAdmin();

        return Inertia::render('Raker/Sessions/Create');
    }

    public function store(Request $request)
    {
        $this->requireAdmin();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'location' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'status' => 'required|in:Draft,Aktif,Selesai',
        ]);

        $validated['created_by'] = Auth::id();

        RakerSession::create($validated);

        return redirect()->route('raker.sessions.index')
            ->with('success', 'Sesi raker berhasil dibuat.');
    }

    public function show(RakerSession $session)
    {
        $this->requireAdmin();

        $submissions = $session->submissions()
            ->with('user')
            ->withCount(['borang1', 'borang2', 'borang3', 'borang4', 'borang5', 'borang6'])
            ->withSum('borang6 as borang6_total', 'total_price')
            ->orderBy('updated_at', 'desc')
            ->get();

        $grandTotalBudget = $session->submissions()
            ->with('borang6')
            ->get()
            ->sum(fn ($submission) => $submission->borang6->sum('total_price'));

        return Inertia::render('Raker/Sessions/Show', [
            'session' => $session,
            'submissions' => $submissions,
            'stats' => [
                'total' => $submissions->count(),
                'submitted' => $submissions->where('status', 'submitted')->count(),
                'draft' => $submissions->where('status', 'draft')->count(),
            ],
            'grand_total_budget' => $grandTotalBudget,
        ]);
    }

    public function edit(RakerSession $session)
    {
        $this->requireAdmin();

        return Inertia::render('Raker/Sessions/Edit', [
            'session' => $session,
        ]);
    }

    public function update(Request $request, RakerSession $session)
    {
        $this->requireAdmin();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'location' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'status' => 'required|in:Draft,Aktif,Selesai',
        ]);

        $session->update($validated);

        return redirect()->route('raker.sessions.index')
            ->with('success', 'Sesi raker berhasil diperbarui.');
    }

    public function destroy(RakerSession $session)
    {
        $this->requireAdmin();

        $session->delete();

        return redirect()->route('raker.sessions.index')
            ->with('success', 'Sesi raker berhasil dihapus.');
    }
}