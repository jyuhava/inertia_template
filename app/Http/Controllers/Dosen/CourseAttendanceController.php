<?php

namespace App\Http\Controllers\Dosen;

use App\Http\Controllers\Controller;
use App\Models\CourseMeeting;
use App\Models\Dosen;
use App\Models\KelasKuliah;
use App\Services\Academic\AttendanceService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CourseAttendanceController extends Controller
{
    private function authorizeClass(Request $request, KelasKuliah $class): Dosen
    {
        $dosen = Dosen::where('user_id', $request->user()->id)->firstOrFail();
        abort_unless($class->pengajars()->where('dosen_id', $dosen->id)->where('status', 'aktif')->exists(), 403);

        return $dosen;
    }

    public function index(Request $request, KelasKuliah $class)
    {
        $this->authorizeClass($request, $class);

        return Inertia::render('Dosen/Absensi/KelasKuliah', ['kelas' => $class->load('mataKuliah', 'jadwals.ruangan'), 'meetings' => $class->meetings()->withCount('attendances')->latest('meeting_date')->get()]);
    }

    public function open(Request $request, KelasKuliah $class, AttendanceService $service)
    {
        $this->authorizeClass($request, $class);
        $data = $request->validate(['jadwal_kelas_kuliah_id' => 'nullable|exists:jadwal_kelas_kuliahs,id', 'meeting_number' => 'required|integer|min:1', 'meeting_date' => 'required|date', 'start_time' => 'required|date_format:H:i', 'end_time' => 'required|date_format:H:i|after:start_time', 'topic' => 'nullable|string|max:255', 'description' => 'nullable|string']);
        $service->open($class, $data, $request->user()->id);

        return back()->with('success', 'Pertemuan dibuka dan daftar mahasiswa dimuat.');
    }

    public function show(Request $request, KelasKuliah $class, CourseMeeting $meeting)
    {
        $this->authorizeClass($request, $class);
        abort_unless($meeting->kelas_kuliah_id === $class->id, 404);

        return Inertia::render('Dosen/Absensi/Meeting', ['kelas' => $class->load('mataKuliah'), 'meeting' => $meeting->load('attendances.mahasiswa')]);
    }

    public function record(Request $request, KelasKuliah $class, CourseMeeting $meeting, AttendanceService $service)
    {
        $this->authorizeClass($request, $class);
        abort_unless($meeting->kelas_kuliah_id === $class->id, 404);
        $data = $request->validate(['attendances' => 'required|array', 'attendances.*.mahasiswa_id' => 'required|exists:mahasiswas,id', 'attendances.*.status' => 'required|in:present,late,excused,sick,absent', 'attendances.*.notes' => 'nullable|string|max:255']);
        $service->record($meeting, $data['attendances'], $request->user()->id);

        return back()->with('success', 'Presensi disimpan.');
    }

    public function complete(Request $request, KelasKuliah $class, CourseMeeting $meeting, AttendanceService $service)
    {
        $this->authorizeClass($request, $class);
        abort_unless($meeting->kelas_kuliah_id === $class->id, 404);
        $service->complete($meeting, $request->user()->id);

        return back()->with('success', 'Presensi ditutup.');
    }
}
