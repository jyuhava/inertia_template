<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\JadwalKelasKuliah;
use App\Models\Prodi;
use App\Models\Ruangan;
use App\Models\Semester;
use Illuminate\Http\Request;
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
            'hariOptions' => ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'],
        ]);
    }
}
