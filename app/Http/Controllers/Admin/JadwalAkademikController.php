<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\JadwalKelasKuliah;
use App\Models\KelasKuliah;
use App\Models\Prodi;
use App\Models\Ruangan;
use App\Models\Semester;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class JadwalAkademikController extends Controller
{
    /**
     * Combined table + weekly-calendar view across all kelas_kuliah
     * schedules, filterable by period, prodi, course, lecturer, room, day.
     */
    public function index(Request $request)
    {
        $query = JadwalKelasKuliah::with(['ruangan', 'kelasKuliah.mataKuliah.prodi', 'kelasKuliah.semester', 'kelasKuliah.pengajars.dosen']);

        if ($request->filled('semester_id')) {
            $query->whereHas('kelasKuliah', fn ($q) => $q->where('semester_id', $request->semester_id));
        }
        if ($request->filled('prodi_id')) {
            $query->whereHas('kelasKuliah.mataKuliah', fn ($q) => $q->where('prodi_id', $request->prodi_id));
        }
        if ($request->filled('mata_kuliah_id')) {
            $query->whereHas('kelasKuliah', fn ($q) => $q->where('mata_kuliah_id', $request->mata_kuliah_id));
        }
        if ($request->filled('dosen_id')) {
            $query->whereHas('kelasKuliah.pengajars', fn ($q) => $q->where('dosen_id', $request->dosen_id));
        }
        if ($request->filled('ruangan_id')) {
            $query->where('ruangan_id', $request->ruangan_id);
        }
        if ($request->filled('hari')) {
            $query->where('hari', $request->hari);
        }

        $jadwals = $query->orderBy('hari')->orderBy('jam_mulai')->get();

        return Inertia::render('Admin/JadwalAkademik/Index', [
            'jadwals' => $jadwals,
            'filters' => $request->only(['semester_id', 'prodi_id', 'mata_kuliah_id', 'dosen_id', 'ruangan_id', 'hari']),
            'semesters' => Semester::with('tahunAjaran')->orderByDesc('created_at')->get(),
            'prodis' => Prodi::orderBy('nama_prodi')->get(['id', 'kode_prodi', 'nama_prodi']),
            'ruangans' => Ruangan::orderBy('kode')->get(['id', 'kode', 'nama']),
            'kelasKuliahs' => KelasKuliah::with('mataKuliah:id,kode_mata_kuliah,nama_mata_kuliah')->where('status', '!=', 'selesai')->orderBy('kode_kelas')->get(['id', 'kode_kelas', 'mata_kuliah_id', 'semester_id']),
            'hariOptions' => ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'],
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validated($request);
        $this->assertNoConflict($data);
        JadwalKelasKuliah::create($data);

        return back()->with('success', 'Jadwal berhasil ditambahkan.');
    }

    public function update(Request $request, JadwalKelasKuliah $jadwalAkademik)
    {
        $data = $this->validated($request);
        $this->assertNoConflict($data, $jadwalAkademik->id);
        $jadwalAkademik->update($data);

        return back()->with('success', 'Jadwal berhasil diperbarui.');
    }

    public function destroy(JadwalKelasKuliah $jadwalAkademik)
    {
        $jadwalAkademik->delete();

        return back()->with('success', 'Jadwal berhasil dihapus.');
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'kelas_kuliah_id' => 'required|exists:kelas_kuliahs,id',
            'hari' => 'required|in:Senin,Selasa,Rabu,Kamis,Jumat,Sabtu,Minggu',
            'jam_mulai' => 'required|date_format:H:i',
            'jam_selesai' => 'required|date_format:H:i|after:jam_mulai',
            'ruangan_id' => 'nullable|exists:ruangans,id',
            'tipe_pertemuan' => 'required|in:tatap_muka,daring,hybrid',
            'status' => 'nullable|in:draft,dipublikasikan,dibatalkan',
        ]);
    }

    /**
     * Room and lecturer interval-overlap checks; same-day only, both
     * directions excluded from the row being updated.
     */
    private function assertNoConflict(array $data, ?int $ignoreId = null): void
    {
        $base = JadwalKelasKuliah::overlapping($data['hari'], $data['jam_mulai'], $data['jam_selesai'])
            ->where('status', '!=', 'dibatalkan')
            ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId));

        if (! empty($data['ruangan_id'])) {
            $roomConflict = (clone $base)->where('ruangan_id', $data['ruangan_id'])->first();
            if ($roomConflict) {
                throw ValidationException::withMessages(['ruangan_id' => 'Ruangan sudah terpakai pada '.$data['hari'].' '.$roomConflict->jam_mulai->format('H:i').'–'.$roomConflict->jam_selesai->format('H:i').'.']);
            }
        }

        $kelas = KelasKuliah::with('pengajars')->findOrFail($data['kelas_kuliah_id']);
        $dosenIds = $kelas->pengajars->pluck('dosen_id')->filter()->all();
        if ($dosenIds !== []) {
            $dosenConflict = (clone $base)->whereHas('kelasKuliah.pengajars', fn ($q) => $q->whereIn('dosen_id', $dosenIds))->first();
            if ($dosenConflict) {
                throw ValidationException::withMessages(['jam_mulai' => 'Dosen pengampu memiliki jadwal lain yang bentrok pada waktu tersebut.']);
            }
        }
    }
}
