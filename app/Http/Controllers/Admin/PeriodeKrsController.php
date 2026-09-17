<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PeriodeKrs;
use App\Models\Semester;
use App\Models\TahunAjaran;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PeriodeKrsController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $periodeKrs = PeriodeKrs::with(['tahunAjaran', 'semester'])
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return Inertia::render('Admin/PeriodeKrs/Index', [
            'periodeKrs' => $periodeKrs,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $tahunAjarans = TahunAjaran::orderBy('tanggal_mulai', 'desc')->get();
        $semesters = Semester::all();

        return Inertia::render('Admin/PeriodeKrs/Create', [
            'tahunAjarans' => $tahunAjarans,
            'semesters' => $semesters,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'nama_periode' => 'required|string|max:255',
            'tahun_ajaran_id' => 'required|exists:tahun_ajarans,id',
            'semester_id' => 'required|exists:semesters,id',
            'tanggal_mulai' => 'required|date',
            'tanggal_selesai' => 'required|date|after:tanggal_mulai',
            'revisi_mulai' => 'nullable|date|after_or_equal:tanggal_selesai',
            'revisi_selesai' => 'nullable|date|after:revisi_mulai',
            'wajib_persetujuan_pa' => 'boolean',
            'maksimal_sks' => 'nullable|integer|min:1|max:60',
            'minimal_sks' => 'nullable|integer|min:0|max:60',
            'keterangan' => 'nullable|string',
        ]);

        PeriodeKrs::create($request->all());

        return redirect()->route('admin.periode-krs.index')
            ->with('message', 'Periode KRS berhasil ditambahkan.');
    }

    /**
     * Display the specified resource.
     */
    public function show(PeriodeKrs $periodeKrs)
    {
        $periodeKrs->load(['tahunAjaran', 'semester', 'krs.mahasiswa', 'krs.jadwalKuliah.mataKuliah']);

        return Inertia::render('Admin/PeriodeKrs/Show', [
            'periodeKrs' => $periodeKrs,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(PeriodeKrs $periodeKrs)
    {
        $tahunAjarans = TahunAjaran::orderBy('tanggal_mulai', 'desc')->get();
        $semesters = Semester::all();

        return Inertia::render('Admin/PeriodeKrs/Edit', [
            'periodeKrs' => $periodeKrs,
            'tahunAjarans' => $tahunAjarans,
            'semesters' => $semesters,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, PeriodeKrs $periodeKrs)
    {
        $request->validate([
            'nama_periode' => 'required|string|max:255',
            'tahun_ajaran_id' => 'required|exists:tahun_ajarans,id',
            'semester_id' => 'required|exists:semesters,id',
            'tanggal_mulai' => 'required|date',
            'tanggal_selesai' => 'required|date|after:tanggal_mulai',
            'status' => 'required|in:aktif,tidak_aktif',
            'revisi_mulai' => 'nullable|date|after_or_equal:tanggal_selesai',
            'revisi_selesai' => 'nullable|date|after:revisi_mulai',
            'wajib_persetujuan_pa' => 'boolean',
            'maksimal_sks' => 'nullable|integer|min:1|max:60',
            'minimal_sks' => 'nullable|integer|min:0|max:60',
            'keterangan' => 'nullable|string',
        ]);

        $periodeKrs->update($request->all());

        return redirect()->route('admin.periode-krs.index')
            ->with('message', 'Periode KRS berhasil diperbarui.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(PeriodeKrs $periodeKrs)
    {
        $periodeKrs->delete();

        return redirect()->route('admin.periode-krs.index')
            ->with('message', 'Periode KRS berhasil dihapus.');
    }

    /**
     * Activate periode KRS
     */
    public function activate(PeriodeKrs $periodeKrs)
    {
        // Deactivate all other periods first
        PeriodeKrs::where('id', '!=', $periodeKrs->id)->update(['status' => 'tidak_aktif']);

        // Activate selected period
        $periodeKrs->update(['status' => 'aktif']);

        return redirect()->route('admin.periode-krs.index')
            ->with('message', 'Periode KRS berhasil diaktifkan.');
    }

    /**
     * Deactivate periode KRS
     */
    public function deactivate(PeriodeKrs $periodeKrs)
    {
        $periodeKrs->update(['status' => 'tidak_aktif']);

        return redirect()->route('admin.periode-krs.index')
            ->with('message', 'Periode KRS berhasil dinonaktifkan.');
    }

    /**
     * Membuka KRS (student enrollment) baru untuk periode ini. Terpisah
     * dari activate/deactivate lama (yang mengatur modul KRS legacy
     * berbasis jadwal_kuliahs). Validasi: kelas kuliah, kurikulum, dan
     * program studi harus sudah tersedia sebelum KRS dapat dibuka.
     */
    public function openKrs(PeriodeKrs $periodeKrs)
    {
        $problems = [];

        if (! \App\Models\KelasKuliah::where('semester_id', $periodeKrs->semester_id)->exists()) {
            $problems[] = 'Belum ada kelas kuliah untuk periode akademik ini.';
        }
        if (! \App\Models\Kurikulum::where('status', 'aktif')->exists()) {
            $problems[] = 'Belum ada kurikulum aktif yang dapat digunakan.';
        }
        if (! \App\Models\Prodi::where('status', 'aktif')->exists()) {
            $problems[] = 'Belum ada program studi aktif.';
        }

        if (! empty($problems)) {
            return back()->withErrors(['krs_status' => $problems]);
        }

        $periodeKrs->update(['krs_status' => 'open']);

        return back()->with('success', 'KRS berhasil dibuka untuk mahasiswa.');
    }

    public function closeKrs(PeriodeKrs $periodeKrs)
    {
        $periodeKrs->update(['krs_status' => 'closed']);

        return back()->with('success', 'KRS berhasil ditutup.');
    }
}
