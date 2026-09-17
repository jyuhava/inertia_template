<?php

namespace App\Http\Controllers\Dosen;

use App\Http\Controllers\Controller;
use App\Models\Dosen;
use App\Models\StudentCourseRegistration;
use App\Services\Krs\KrsRegistrationService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

/**
 * Academic advisor (Dosen PA) review of their advisees' KRS. An advisor can
 * only review students they are assigned to via student_advisors — never
 * the entire KRS pool.
 */
class AdvisorKrsController extends Controller
{
    public function __construct(private KrsRegistrationService $registrationService) {}

    private function currentDosen(Request $request): Dosen
    {
        $dosen = Dosen::where('user_id', $request->user()->id)->first();
        abort_if(! $dosen, 404, 'Data dosen tidak ditemukan.');

        return $dosen;
    }

    public function index(Request $request)
    {
        $dosen = $this->currentDosen($request);
        $adviseeIds = $dosen->advisees()->aktif()->pluck('mahasiswa_id');

        $registrations = StudentCourseRegistration::with(['mahasiswa.prodi', 'periodeKrs.tahunAjaran', 'periodeKrs.semester'])
            ->whereIn('mahasiswa_id', $adviseeIds)
            ->where('status', 'submitted')
            ->orderByDesc('created_at')
            ->paginate(20);

        return Inertia::render('Dosen/KrsAdvisor/Index', ['registrations' => $registrations]);
    }

    private function authorizeAdvisor(Request $request, StudentCourseRegistration $registration): void
    {
        $dosen = $this->currentDosen($request);
        $isAdvisee = $dosen->advisees()->aktif()->where('mahasiswa_id', $registration->mahasiswa_id)->exists();
        abort_unless($isAdvisee, 403, 'Anda bukan pembimbing akademik mahasiswa ini.');
    }

    public function show(Request $request, StudentCourseRegistration $registration)
    {
        $this->authorizeAdvisor($request, $registration);
        $registration->load(['mahasiswa.prodi', 'periodeKrs.tahunAjaran', 'periodeKrs.semester', 'items.kelasKuliah.mataKuliah', 'items.kelasKuliah.jadwals']);

        return Inertia::render('Dosen/KrsAdvisor/Show', ['registration' => $registration]);
    }

    public function approve(Request $request, StudentCourseRegistration $registration)
    {
        $this->authorizeAdvisor($request, $registration);

        try {
            $this->registrationService->approve($registration, $request->user());
        } catch (ValidationException $e) {
            return back()->withErrors($e->errors());
        }

        return back()->with('success', 'KRS mahasiswa bimbingan berhasil disetujui.');
    }

    public function reject(Request $request, StudentCourseRegistration $registration)
    {
        $this->authorizeAdvisor($request, $registration);
        $data = $request->validate(['reason' => 'required|string|max:500']);

        try {
            $this->registrationService->reject($registration, $request->user(), $data['reason']);
        } catch (ValidationException $e) {
            return back()->withErrors($e->errors());
        }

        return back()->with('success', 'KRS mahasiswa bimbingan berhasil ditolak.');
    }

    public function requestRevision(Request $request, StudentCourseRegistration $registration)
    {
        $this->authorizeAdvisor($request, $registration);
        $data = $request->validate(['reason' => 'required|string|max:500']);

        try {
            $this->registrationService->requestRevision($registration, $request->user(), $data['reason']);
        } catch (ValidationException $e) {
            return back()->withErrors($e->errors());
        }

        return back()->with('success', 'Permintaan revisi berhasil dikirim.');
    }
}
