<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\JadwalKuliah;
use App\Models\MataKuliah;
use App\Models\Dosen;
use App\Models\Semester;
use Illuminate\Http\Request;
use Inertia\Inertia;

class JadwalKuliahController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = JadwalKuliah::with(['mataKuliah.prodi', 'dosen', 'semester.tahunAjaran'])
            ->orderBy('hari')
            ->orderBy('jam_mulai');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('ruangan', 'like', "%{$search}%")
                  ->orWhere('hari', 'like', "%{$search}%")
                  ->orWhereHas('mataKuliah', function ($matkul) use ($search) {
                      $matkul->where('nama_mata_kuliah', 'like', "%{$search}%")
                             ->orWhere('kode_mata_kuliah', 'like', "%{$search}%");
                  })
                  ->orWhereHas('dosen', function ($dosen) use ($search) {
                      $dosen->where('nama_lengkap', 'like', "%{$search}%");
                  });
            });
        }

        // Filter by semester
        if ($request->has('semester_id') && $request->semester_id) {
            $query->where('semester_id', $request->semester_id);
        }

        // Filter by hari
        if ($request->has('hari') && $request->hari) {
            $query->where('hari', $request->hari);
        }

        // Filter by dosen
        if ($request->has('dosen_id') && $request->dosen_id) {
            $query->where('dosen_id', $request->dosen_id);
        }

        $jadwalKuliahs = $query->paginate(10)->withQueryString();
        $semesters = Semester::with('tahunAjaran')->orderBy('created_at', 'desc')->get();
        $dosens = Dosen::orderBy('nama_lengkap')->get();

        return Inertia::render('Admin/JadwalKuliah/Index', [
            'jadwalKuliahs' => $jadwalKuliahs,
            'semesters' => $semesters,
            'dosens' => $dosens,
            'filters' => $request->only(['search', 'semester_id', 'hari', 'dosen_id']),
            'hariOptions' => ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $mataKuliahs = MataKuliah::with('prodi')->where('status', 'aktif')->orderBy('nama_mata_kuliah')->get();
        $dosens = Dosen::where('status', 'aktif')->orderBy('nama_lengkap')->get();
        $semesters = Semester::with('tahunAjaran')->orderBy('created_at', 'desc')->get();

        return Inertia::render('Admin/JadwalKuliah/Create', [
            'mataKuliahs' => $mataKuliahs,
            'dosens' => $dosens,
            'semesters' => $semesters,
            'hariOptions' => ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'mata_kuliah_id' => 'required|exists:mata_kuliahs,id',
            'dosen_id' => 'required|exists:dosens,id',
            'semester_id' => 'required|exists:semesters,id',
            'hari' => 'required|in:Senin,Selasa,Rabu,Kamis,Jumat,Sabtu',
            'jam_mulai' => 'required|date_format:H:i',
            'jam_selesai' => 'required|date_format:H:i|after:jam_mulai',
            'ruangan' => 'required|string|max:50',
            'kapasitas' => 'required|integer|min:1|max:200',
            'keterangan' => 'nullable|string',
            'status' => 'required|in:aktif,nonaktif',
        ]);

        // Check for room conflicts
        $conflict = JadwalKuliah::where('hari', $request->hari)
            ->where('ruangan', $request->ruangan)
            ->where('semester_id', $request->semester_id)
            ->where(function ($query) use ($request) {
                $query->whereBetween('jam_mulai', [$request->jam_mulai, $request->jam_selesai])
                      ->orWhereBetween('jam_selesai', [$request->jam_mulai, $request->jam_selesai])
                      ->orWhere(function ($q) use ($request) {
                          $q->where('jam_mulai', '<=', $request->jam_mulai)
                            ->where('jam_selesai', '>=', $request->jam_selesai);
                      });
            })
            ->exists();

        if ($conflict) {
            return back()->withErrors([
                'ruangan' => 'Ruangan sudah terpakai pada waktu tersebut!'
            ]);
        }

        // Check for lecturer conflicts
        $dosenConflict = JadwalKuliah::where('hari', $request->hari)
            ->where('dosen_id', $request->dosen_id)
            ->where('semester_id', $request->semester_id)
            ->where(function ($query) use ($request) {
                $query->whereBetween('jam_mulai', [$request->jam_mulai, $request->jam_selesai])
                      ->orWhereBetween('jam_selesai', [$request->jam_mulai, $request->jam_selesai])
                      ->orWhere(function ($q) use ($request) {
                          $q->where('jam_mulai', '<=', $request->jam_mulai)
                            ->where('jam_selesai', '>=', $request->jam_selesai);
                      });
            })
            ->exists();

        if ($dosenConflict) {
            return back()->withErrors([
                'dosen_id' => 'Dosen sudah memiliki jadwal lain pada waktu tersebut!'
            ]);
        }

        JadwalKuliah::create([
            'mata_kuliah_id' => $request->mata_kuliah_id,
            'dosen_id' => $request->dosen_id,
            'semester_id' => $request->semester_id,
            'hari' => $request->hari,
            'jam_mulai' => $request->jam_mulai,
            'jam_selesai' => $request->jam_selesai,
            'ruangan' => $request->ruangan,
            'kapasitas' => $request->kapasitas,
            'keterangan' => $request->keterangan,
            'status' => $request->status,
        ]);

        return redirect()->route('admin.jadwal-kuliah.index')
            ->with('success', 'Jadwal Kuliah berhasil ditambahkan!');
    }

    /**
     * Display the specified resource.
     */
    public function show(JadwalKuliah $jadwalKuliah)
    {
        $jadwalKuliah->load(['mataKuliah.prodi', 'dosen', 'semester.tahunAjaran']);

        return Inertia::render('Admin/JadwalKuliah/Show', [
            'jadwalKuliah' => $jadwalKuliah,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(JadwalKuliah $jadwalKuliah)
    {
        $jadwalKuliah->load(['mataKuliah.prodi', 'dosen', 'semester.tahunAjaran']);
        $mataKuliahs = MataKuliah::with('prodi')->where('status', 'aktif')->orderBy('nama_mata_kuliah')->get();
        $dosens = Dosen::where('status', 'aktif')->orderBy('nama_lengkap')->get();
        $semesters = Semester::with('tahunAjaran')->orderBy('created_at', 'desc')->get();

        return Inertia::render('Admin/JadwalKuliah/Edit', [
            'jadwalKuliah' => $jadwalKuliah,
            'mataKuliahs' => $mataKuliahs,
            'dosens' => $dosens,
            'semesters' => $semesters,
            'hariOptions' => ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, JadwalKuliah $jadwalKuliah)
    {
        $request->validate([
            'mata_kuliah_id' => 'required|exists:mata_kuliahs,id',
            'dosen_id' => 'required|exists:dosens,id',
            'semester_id' => 'required|exists:semesters,id',
            'hari' => 'required|in:Senin,Selasa,Rabu,Kamis,Jumat,Sabtu',
            'jam_mulai' => 'required|date_format:H:i',
            'jam_selesai' => 'required|date_format:H:i|after:jam_mulai',
            'ruangan' => 'required|string|max:50',
            'kapasitas' => 'required|integer|min:1|max:200',
            'keterangan' => 'nullable|string',
            'status' => 'required|in:aktif,nonaktif',
        ]);

        // Check for room conflicts (except current schedule)
        $conflict = JadwalKuliah::where('hari', $request->hari)
            ->where('ruangan', $request->ruangan)
            ->where('semester_id', $request->semester_id)
            ->where('id', '!=', $jadwalKuliah->id)
            ->where(function ($query) use ($request) {
                $query->whereBetween('jam_mulai', [$request->jam_mulai, $request->jam_selesai])
                      ->orWhereBetween('jam_selesai', [$request->jam_mulai, $request->jam_selesai])
                      ->orWhere(function ($q) use ($request) {
                          $q->where('jam_mulai', '<=', $request->jam_mulai)
                            ->where('jam_selesai', '>=', $request->jam_selesai);
                      });
            })
            ->exists();

        if ($conflict) {
            return back()->withErrors([
                'ruangan' => 'Ruangan sudah terpakai pada waktu tersebut!'
            ]);
        }

        // Check for lecturer conflicts (except current schedule)
        $dosenConflict = JadwalKuliah::where('hari', $request->hari)
            ->where('dosen_id', $request->dosen_id)
            ->where('semester_id', $request->semester_id)
            ->where('id', '!=', $jadwalKuliah->id)
            ->where(function ($query) use ($request) {
                $query->whereBetween('jam_mulai', [$request->jam_mulai, $request->jam_selesai])
                      ->orWhereBetween('jam_selesai', [$request->jam_mulai, $request->jam_selesai])
                      ->orWhere(function ($q) use ($request) {
                          $q->where('jam_mulai', '<=', $request->jam_mulai)
                            ->where('jam_selesai', '>=', $request->jam_selesai);
                      });
            })
            ->exists();

        if ($dosenConflict) {
            return back()->withErrors([
                'dosen_id' => 'Dosen sudah memiliki jadwal lain pada waktu tersebut!'
            ]);
        }

        $jadwalKuliah->update([
            'mata_kuliah_id' => $request->mata_kuliah_id,
            'dosen_id' => $request->dosen_id,
            'semester_id' => $request->semester_id,
            'hari' => $request->hari,
            'jam_mulai' => $request->jam_mulai,
            'jam_selesai' => $request->jam_selesai,
            'ruangan' => $request->ruangan,
            'kapasitas' => $request->kapasitas,
            'keterangan' => $request->keterangan,
            'status' => $request->status,
        ]);

        return redirect()->route('admin.jadwal-kuliah.index')
            ->with('success', 'Jadwal Kuliah berhasil diperbarui!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(JadwalKuliah $jadwalKuliah)
    {
        $jadwalKuliah->delete();

        return redirect()->route('admin.jadwal-kuliah.index')
            ->with('success', 'Jadwal Kuliah berhasil dihapus!');
    }
}