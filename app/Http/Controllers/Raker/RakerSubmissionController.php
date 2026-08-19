<?php

namespace App\Http\Controllers\Raker;

use App\Http\Controllers\Controller;
use App\Models\RakerSubmission;
use App\Models\RakerSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class RakerSubmissionController extends Controller
{
    private function denyMahasiswa(): void
    {
        if (Auth::user() && Auth::user()->role === 'mahasiswa') {
            abort(403, 'Akses tidak diizinkan.');
        }
    }

    public function sessionList()
    {
        $this->denyMahasiswa();

        $sessions = RakerSession::whereIn('status', ['Aktif', 'Selesai'])
            ->with('submissions')
            ->orderBy('start_date', 'desc')
            ->get()
            ->map(function (RakerSession $session) {
                $session->start_date = $session->start_date->format('Y-m-d');
                $session->end_date = $session->end_date->format('Y-m-d');
                $session->submissions_count = $session->submissions->count();

                $own = $session->submissions->firstWhere('user_id', Auth::id());

                $session->own_submission = $own ? [
                    'id' => $own->id,
                    'status' => $own->status,
                    'submitted_at' => $own->submitted_at?->format('Y-m-d H:i'),
                ] : null;

                $session->unsetRelation('submissions');

                return $session;
            });

        return Inertia::render('Raker/Index', [
            'sessions' => $sessions,
            'isAdmin' => Auth::user()->isAdmin(),
        ]);
    }

    public function getOrCreate(Request $request, RakerSession $session)
    {
        $this->denyMahasiswa();

        $submission = RakerSubmission::firstOrCreate(
            ['session_id' => $session->id, 'user_id' => Auth::id()],
            ['status' => 'draft']
        );

        return Inertia::render('Raker/Submission/Show', $this->submissionPageProps($submission));
    }

    public function show(RakerSubmission $submission)
    {
        $this->denyMahasiswa();

        $user = Auth::user();

        if ($submission->user_id !== $user->id && ! $user->isAdmin()) {
            abort(403, 'Anda tidak memiliki akses ke submission ini.');
        }
        if (! $user->isAdmin() && $submission->status === 'submitted' && $submission->user_id !== $user->id) {
            abort(403, 'Anda tidak memiliki akses ke submission ini.');
        }

        return Inertia::render('Raker/Submission/Show', $this->submissionPageProps($submission));
    }

    public function update(Request $request, RakerSubmission $submission)
    {
        $this->denyMahasiswa();

        $user = Auth::user();

        if ($submission->user_id !== $user->id && ! $user->isAdmin()) {
            abort(403);
        }

        if ($submission->status === 'submitted' && ! $user->isAdmin()) {
            abort(403, 'Submission sudah dikunci dan tidak dapat diubah.');
        }

        $validated = $request->validate([
            'unit' => 'nullable|string|max:255',
            'jabatan' => 'nullable|string|max:255',
        ]);

        $submission->update($validated);

        return back()->with('success', 'Profil pengisi berhasil diperbarui.');
    }

    public function submit(RakerSubmission $submission)
    {
        $this->denyMahasiswa();

        if ($submission->user_id !== Auth::id()) {
            abort(403, 'Hanya pemilik submission yang dapat submit.');
        }

        if ($submission->status === 'submitted') {
            return back()->with('error', 'Submission sudah dikunci.');
        }

        $submission->update(['status' => 'submitted', 'submitted_at' => now()]);

        return back()->with('success', 'Isian Raker berhasil disubmit dan dikunci.');
    }

    private function submissionPageProps(RakerSubmission $submission): array
    {
        $user = Auth::user();
        $isOwner = $submission->user_id === $user->id;

        $submission->load('session', 'user');

        return [
            'session' => $submission->session,
            'submission' => $submission,
            'isOwner' => $isOwner,
            'isAdmin' => $user->isAdmin(),
            'canEdit' => $user->isAdmin() && $isOwner
                ? true
                : ($isOwner && $submission->status === 'draft'),
            'borangs' => [
                'borang1' => $submission->borang1()->orderBy('order_index')->get(),
                'borang2' => $submission->borang2()->orderBy('order_index')->get(),
                'borang3' => $submission->borang3()->orderBy('order_index')->get(),
                'borang4' => $submission->borang4()->orderBy('order_index')->get(),
                'borang5' => $submission->borang5()->orderBy('order_index')->get(),
                'borang6' => $submission->borang6()->orderBy('order_index')->get(),
            ],
            'completion_stats' => $submission->completion_stats,
        ];
    }
}