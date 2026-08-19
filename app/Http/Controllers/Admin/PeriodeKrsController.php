<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PeriodeKrs;
use App\Models\TahunAjaran;
use App\Models\Semester;
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
            'periodeKrs' => $periodeKrs
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
            'semesters' => $semesters
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
            'keterangan' => 'nullable|string'
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
            'periodeKrs' => $periodeKrs
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
            'semesters' => $semesters
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
            'keterangan' => 'nullable|string'
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
}
