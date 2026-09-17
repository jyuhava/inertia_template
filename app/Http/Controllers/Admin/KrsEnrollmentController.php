<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PeriodeKrs;
use App\Models\Prodi;
use App\Models\StudentCourseRegistration;
use App\Services\Krs\KrsRegistrationService;
use App\Services\Krs\KrsValidationService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class KrsEnrollmentController extends Controller
{
    public function __construct(
        private KrsRegistrationService $registrationService,
        private KrsValidationService $validationService,
    ) {}

    public function index(Request $request)
    {
        $query = StudentCourseRegistration::with(['mahasiswa.prodi', 'periodeKrs.tahunAjaran', 'periodeKrs.semester']);

        if ($request->filled('periode_krs_id')) {
            $query->where('periode_krs_id', $request->periode_krs_id);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('prodi_id')) {
            $query->whereHas('mahasiswa', fn ($q) => $q->where('prodi_id', $request->prodi_id));
        }
        if ($request->filled('angkatan')) {
            $query->whereHas('mahasiswa', fn ($q) => $q->where('angkatan', $request->angkatan));
        }
        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('mahasiswa', fn ($q) => $q->where('nama_lengkap', 'like', "%{$search}%")->orWhere('nim', 'like', "%{$search}%"));
        }

        $registrations = $query->orderByDesc('created_at')->paginate(20)->withQueryString();

        $periodeId = $request->get('periode_krs_id');
        $stats = $periodeId ? [
            'total' => StudentCourseRegistration::where('periode_krs_id', $periodeId)->count(),
            'draft' => StudentCourseRegistration::where('periode_krs_id', $periodeId)->where('status', 'draft')->count(),
            'submitted' => StudentCourseRegistration::where('periode_krs_id', $periodeId)->where('status', 'submitted')->count(),
            'revision' => StudentCourseRegistration::where('periode_krs_id', $periodeId)->where('status', 'revision')->count(),
            'approved' => StudentCourseRegistration::where('periode_krs_id', $periodeId)->where('status', 'approved')->count(),
            'rejected' => StudentCourseRegistration::where('periode_krs_id', $periodeId)->where('status', 'rejected')->count(),
            'locked' => StudentCourseRegistration::where('periode_krs_id', $periodeId)->where('status', 'locked')->count(),
        ] : null;

        return Inertia::render('Admin/KrsEnrollment/Index', [
            'registrations' => $registrations,
            'filters' => $request->only(['periode_krs_id', 'status', 'prodi_id', 'angkatan', 'search']),
            'periodeKrsList' => PeriodeKrs::with('tahunAjaran', 'semester')->orderByDesc('created_at')->get(),
            'prodis' => Prodi::orderBy('nama_prodi')->get(['id', 'kode_prodi', 'nama_prodi']),
            'stats' => $stats,
        ]);
    }

    public function show(StudentCourseRegistration $registration)
    {
        $registration->load([
            'mahasiswa.prodi', 'periodeKrs.tahunAjaran', 'periodeKrs.semester', 'kurikulum',
            'items.kelasKuliah.mataKuliah', 'items.kelasKuliah.jadwals.ruangan', 'items.kelasKuliah.pengajars.dosen',
            'approvedBy', 'rejectedBy', 'audits.user', 'pddiktiMapping',
        ]);

        return Inertia::render('Admin/KrsEnrollment/Show', ['registration' => $registration]);
    }

    public function approve(StudentCourseRegistration $registration, Request $request)
    {
        try {
            $this->registrationService->approve($registration, $request->user());
        } catch (ValidationException $e) {
            return back()->withErrors($e->errors());
        }

        return back()->with('success', 'KRS berhasil disetujui.');
    }

    public function reject(StudentCourseRegistration $registration, Request $request)
    {
        $data = $request->validate(['reason' => 'required|string|max:500']);

        try {
            $this->registrationService->reject($registration, $request->user(), $data['reason']);
        } catch (ValidationException $e) {
            return back()->withErrors($e->errors());
        }

        return back()->with('success', 'KRS berhasil ditolak.');
    }

    public function requestRevision(StudentCourseRegistration $registration, Request $request)
    {
        $data = $request->validate(['reason' => 'required|string|max:500']);

        try {
            $this->registrationService->requestRevision($registration, $request->user(), $data['reason']);
        } catch (ValidationException $e) {
            return back()->withErrors($e->errors());
        }

        return back()->with('success', 'Permintaan revisi berhasil dikirim ke mahasiswa.');
    }

    public function lock(StudentCourseRegistration $registration, Request $request)
    {
        try {
            $this->registrationService->lock($registration, $request->user());
        } catch (ValidationException $e) {
            return back()->withErrors($e->errors());
        }

        return back()->with('success', 'KRS berhasil dikunci.');
    }

    public function unlock(StudentCourseRegistration $registration, Request $request)
    {
        $data = $request->validate(['reason' => 'required|string|max:500']);
        $this->registrationService->adminOverrideUnlock($registration, $request->user(), $data['reason']);

        return back()->with('success', 'KRS berhasil dibuka kembali untuk perubahan.');
    }

    public function cancel(StudentCourseRegistration $registration, Request $request)
    {
        $data = $request->validate(['reason' => 'nullable|string|max:500']);
        $this->registrationService->cancel($registration, $request->user(), $data['reason'] ?? null);

        return back()->with('success', 'KRS berhasil dibatalkan.');
    }

    /**
     * Bulk approve re-validates every registration individually — never a
     * blind mass UPDATE — and reports exactly how many succeeded/failed
     * and why.
     */
    public function bulkApprove(Request $request)
    {
        $data = $request->validate(['registration_ids' => 'required|array', 'registration_ids.*' => 'exists:student_course_registrations,id']);

        $succeeded = 0;
        $failures = [];

        foreach (StudentCourseRegistration::whereIn('id', $data['registration_ids'])->get() as $registration) {
            try {
                $this->registrationService->approve($registration, $request->user());
                $succeeded++;
            } catch (ValidationException $e) {
                $failures[] = "KRS #{$registration->id}: ".implode('; ', $e->errors()['registration'] ?? ['gagal divalidasi']);
            }
        }

        return back()->with('success', "{$succeeded} KRS berhasil disetujui.")->with('bulkFailures', $failures);
    }
}
