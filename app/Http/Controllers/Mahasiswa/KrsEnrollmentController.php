<?php

namespace App\Http\Controllers\Mahasiswa;

use App\Http\Controllers\Controller;
use App\Models\KelasKuliah;
use App\Models\Mahasiswa;
use App\Models\PeriodeKrs;
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

    private function currentMahasiswa(Request $request): Mahasiswa
    {
        $mahasiswa = Mahasiswa::where('user_id', $request->user()->id)->first();
        abort_if(! $mahasiswa, 404, 'Data mahasiswa tidak ditemukan.');

        return $mahasiswa;
    }

    public function index(Request $request)
    {
        $mahasiswa = $this->currentMahasiswa($request);
        $periode = PeriodeKrs::where('krs_status', 'open')->orderByDesc('tanggal_mulai')->first()
            ?? PeriodeKrs::aktif()->first();

        $registration = null;
        $kelasTersedia = collect();

        if ($periode) {
            $registration = $this->registrationService->getOrCreateDraft($mahasiswa, $periode);
            $registration->load(['items.kelasKuliah.mataKuliah', 'items.kelasKuliah.jadwals.ruangan', 'items.kelasKuliah.pengajars.dosen', 'kurikulum']);

            $kurikulumId = $registration->kurikulum_id;
            $kelasTersedia = KelasKuliah::with(['mataKuliah', 'jadwals.ruangan', 'pengajars.dosen', 'semester'])
                ->where('semester_id', $periode->semester_id)
                ->where('status', 'dibuka')
                ->when($kurikulumId, fn ($q) => $q->where(fn ($qq) => $qq->where('kurikulum_id', $kurikulumId)->orWhereNull('kurikulum_id')))
                ->get()
                ->map(function (KelasKuliah $kelas) {
                    return [
                        'id' => $kelas->id,
                        'kode' => $kelas->nama_lengkap,
                        'mata_kuliah' => $kelas->mataKuliah->nama_mata_kuliah,
                        'sks' => $kelas->mataKuliah->sks,
                        'kapasitas' => $kelas->kapasitas,
                        'terdaftar' => $kelas->jumlah_terdaftar,
                        'sisa' => $kelas->sisa_kapasitas,
                        'jadwals' => $kelas->jadwals->map(fn ($j) => ['hari' => $j->hari, 'jam_mulai' => $j->jam_mulai->format('H:i'), 'jam_selesai' => $j->jam_selesai->format('H:i'), 'ruangan' => $j->ruangan?->nama])->values(),
                        'dosens' => $kelas->pengajars->map(fn ($p) => $p->dosen?->nama_lengkap)->filter()->values(),
                    ];
                });
        }

        $riwayat = StudentCourseRegistration::with('periodeKrs.tahunAjaran', 'periodeKrs.semester')
            ->where('mahasiswa_id', $mahasiswa->id)
            ->whereIn('status', ['approved', 'locked', 'rejected'])
            ->when($registration, fn ($q) => $q->where('id', '!=', $registration->id))
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('Mahasiswa/KrsEnrollment/Index', [
            'periode' => $periode ? $periode->only(['id', 'nama_periode', 'krs_status', 'tanggal_mulai', 'tanggal_selesai', 'revisi_mulai', 'revisi_selesai', 'maksimal_sks', 'minimal_sks']) : null,
            'registration' => $registration,
            'kelasTersedia' => $kelasTersedia,
            'riwayat' => $riwayat,
        ]);
    }

    public function addClass(Request $request)
    {
        $mahasiswa = $this->currentMahasiswa($request);
        $data = $request->validate(['registration_id' => 'required|exists:student_course_registrations,id', 'kelas_kuliah_id' => 'required|exists:kelas_kuliahs,id']);

        $registration = StudentCourseRegistration::where('mahasiswa_id', $mahasiswa->id)->findOrFail($data['registration_id']);

        try {
            $this->registrationService->addClass($registration, $data['kelas_kuliah_id']);
        } catch (ValidationException $e) {
            return back()->withErrors($e->errors());
        }

        return back()->with('success', 'Kelas berhasil ditambahkan ke KRS.');
    }

    public function removeClass(Request $request, StudentCourseRegistration $registration, int $item)
    {
        $mahasiswa = $this->currentMahasiswa($request);
        abort_unless($registration->mahasiswa_id === $mahasiswa->id, 403);

        try {
            $this->registrationService->removeClass($registration, $item);
        } catch (ValidationException $e) {
            return back()->withErrors($e->errors());
        }

        return back()->with('success', 'Kelas berhasil dihapus dari KRS.');
    }

    public function submit(Request $request, StudentCourseRegistration $registration)
    {
        $mahasiswa = $this->currentMahasiswa($request);
        abort_unless($registration->mahasiswa_id === $mahasiswa->id, 403);

        try {
            $this->registrationService->submit($registration);
        } catch (ValidationException $e) {
            return back()->withErrors($e->errors());
        }

        return back()->with('success', 'KRS berhasil diajukan dan menunggu persetujuan.');
    }
}
