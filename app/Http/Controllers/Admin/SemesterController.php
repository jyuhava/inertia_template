<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Semester;
use App\Models\TahunAjaran;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SemesterController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Semester::with('tahunAjaran')->orderBy('created_at', 'desc');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nama_semester', 'like', "%{$search}%")
                  ->orWhere('status', 'like', "%{$search}%")
                  ->orWhereHas('tahunAjaran', function ($tahunQuery) use ($search) {
                      $tahunQuery->where('nama_tahun_ajaran', 'like', "%{$search}%");
                  });
            });
        }

        $semesters = $query->paginate(10)->withQueryString();

        return Inertia::render('Admin/Semester/Index', [
            'semesters' => $semesters,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $tahunAjarans = TahunAjaran::orderBy('nama_tahun_ajaran', 'desc')->get();

        return Inertia::render('Admin/Semester/Create', [
            'tahunAjarans' => $tahunAjarans,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'tahun_ajaran_id' => 'required|exists:tahun_ajarans,id',
            'nama_semester' => 'required|in:Ganjil,Genap',
            'tanggal_mulai' => 'required|date',
            'tanggal_selesai' => 'required|date|after:tanggal_mulai',
            'status' => 'required|in:aktif,nonaktif',
            'keterangan' => 'nullable|string',
        ]);

        // Validate unique semester per academic year
        $existingSemester = Semester::where('tahun_ajaran_id', $request->tahun_ajaran_id)
            ->where('nama_semester', $request->nama_semester)
            ->first();

        if ($existingSemester) {
            return back()->withErrors([
                'nama_semester' => 'Semester ini sudah ada untuk tahun ajaran yang dipilih.'
            ]);
        }

        // If setting as active, deactivate other active semesters
        if ($request->status === 'aktif') {
            Semester::where('status', 'aktif')->update(['status' => 'nonaktif']);
        }

        Semester::create([
            'tahun_ajaran_id' => $request->tahun_ajaran_id,
            'nama_semester' => $request->nama_semester,
            'tanggal_mulai' => $request->tanggal_mulai,
            'tanggal_selesai' => $request->tanggal_selesai,
            'status' => $request->status,
            'keterangan' => $request->keterangan,
        ]);

        return redirect()->route('admin.semester.index')
            ->with('success', 'Semester berhasil ditambahkan!');
    }

    /**
     * Display the specified resource.
     */
    public function show(Semester $semester)
    {
        $semester->load('tahunAjaran');

        return Inertia::render('Admin/Semester/Show', [
            'semester' => $semester,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Semester $semester)
    {
        $semester->load('tahunAjaran');
        $tahunAjarans = TahunAjaran::orderBy('nama_tahun_ajaran', 'desc')->get();

        return Inertia::render('Admin/Semester/Edit', [
            'semester' => $semester,
            'tahunAjarans' => $tahunAjarans,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Semester $semester)
    {
        $request->validate([
            'tahun_ajaran_id' => 'required|exists:tahun_ajarans,id',
            'nama_semester' => 'required|in:Ganjil,Genap',
            'tanggal_mulai' => 'required|date',
            'tanggal_selesai' => 'required|date|after:tanggal_mulai',
            'status' => 'required|in:aktif,nonaktif',
            'keterangan' => 'nullable|string',
        ]);

        // Validate unique semester per academic year (except current semester)
        $existingSemester = Semester::where('tahun_ajaran_id', $request->tahun_ajaran_id)
            ->where('nama_semester', $request->nama_semester)
            ->where('id', '!=', $semester->id)
            ->first();

        if ($existingSemester) {
            return back()->withErrors([
                'nama_semester' => 'Semester ini sudah ada untuk tahun ajaran yang dipilih.'
            ]);
        }

        // If setting as active, deactivate other active semesters
        if ($request->status === 'aktif' && $semester->status !== 'aktif') {
            Semester::where('status', 'aktif')->where('id', '!=', $semester->id)->update(['status' => 'nonaktif']);
        }

        $semester->update([
            'tahun_ajaran_id' => $request->tahun_ajaran_id,
            'nama_semester' => $request->nama_semester,
            'tanggal_mulai' => $request->tanggal_mulai,
            'tanggal_selesai' => $request->tanggal_selesai,
            'status' => $request->status,
            'keterangan' => $request->keterangan,
        ]);

        return redirect()->route('admin.semester.index')
            ->with('success', 'Semester berhasil diperbarui!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Semester $semester)
    {
        $semester->delete();

        return redirect()->route('admin.semester.index')
            ->with('success', 'Semester berhasil dihapus!');
    }
}
