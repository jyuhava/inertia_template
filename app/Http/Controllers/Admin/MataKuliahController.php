<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MataKuliah;
use App\Models\Prodi;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MataKuliahController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = MataKuliah::with(['prodi'])->withCount('jadwalKuliahs')->orderBy('created_at', 'desc');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('kode_mata_kuliah', 'like', "%{$search}%")
                  ->orWhere('nama_mata_kuliah', 'like', "%{$search}%")
                  ->orWhere('jenis', 'like', "%{$search}%")
                  ->orWhereHas('prodi', function ($prodiQuery) use ($search) {
                      $prodiQuery->where('nama_prodi', 'like', "%{$search}%")
                                 ->orWhere('kode_prodi', 'like', "%{$search}%");
                  });
            });
        }

        // Filter by prodi
        if ($request->has('prodi_id') && $request->prodi_id) {
            $query->where('prodi_id', $request->prodi_id);
        }

        // Filter by semester
        if ($request->has('semester') && $request->semester) {
            $query->where('semester', $request->semester);
        }

        // Filter by jenis
        if ($request->has('jenis') && $request->jenis) {
            $query->where('jenis', $request->jenis);
        }

        $mataKuliahs = $query->paginate(10)->withQueryString();
        $prodis = Prodi::orderBy('nama_prodi')->get();

        return Inertia::render('Admin/MataKuliah/Index', [
            'mataKuliahs' => $mataKuliahs,
            'prodis' => $prodis,
            'filters' => $request->only(['search', 'prodi_id', 'semester', 'jenis']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $prodis = Prodi::where('status', 'aktif')->orderBy('nama_prodi')->get();

        return Inertia::render('Admin/MataKuliah/Create', [
            'prodis' => $prodis,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'kode_mata_kuliah' => 'required|string|max:20|unique:mata_kuliahs',
            'nama_mata_kuliah' => 'required|string|max:255',
            'sks' => 'required|integer|min:1|max:6',
            'semester' => 'required|integer|min:1|max:8',
            'prodi_id' => 'required|exists:prodis,id',
            'jenis' => 'required|in:Wajib,Pilihan',
            'deskripsi' => 'nullable|string',
            'status' => 'required|in:aktif,nonaktif',
        ]);

        MataKuliah::create([
            'kode_mata_kuliah' => $request->kode_mata_kuliah,
            'nama_mata_kuliah' => $request->nama_mata_kuliah,
            'sks' => $request->sks,
            'semester' => $request->semester,
            'prodi_id' => $request->prodi_id,
            'jenis' => $request->jenis,
            'deskripsi' => $request->deskripsi,
            'status' => $request->status,
        ]);

        return redirect()->route('admin.mata-kuliah.index')
            ->with('success', 'Mata Kuliah berhasil ditambahkan!');
    }

    /**
     * Display the specified resource.
     */
    public function show(MataKuliah $mataKuliah)
    {
        $mataKuliah->load(['prodi', 'jadwalKuliahs.dosen', 'jadwalKuliahs.semester']);

        return Inertia::render('Admin/MataKuliah/Show', [
            'mataKuliah' => $mataKuliah,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(MataKuliah $mataKuliah)
    {
        $mataKuliah->load('prodi');
        $prodis = Prodi::where('status', 'aktif')->orderBy('nama_prodi')->get();

        return Inertia::render('Admin/MataKuliah/Edit', [
            'mataKuliah' => $mataKuliah,
            'prodis' => $prodis,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, MataKuliah $mataKuliah)
    {
        $request->validate([
            'kode_mata_kuliah' => 'required|string|max:20|unique:mata_kuliahs,kode_mata_kuliah,' . $mataKuliah->id,
            'nama_mata_kuliah' => 'required|string|max:255',
            'sks' => 'required|integer|min:1|max:6',
            'semester' => 'required|integer|min:1|max:8',
            'prodi_id' => 'required|exists:prodis,id',
            'jenis' => 'required|in:Wajib,Pilihan',
            'deskripsi' => 'nullable|string',
            'status' => 'required|in:aktif,nonaktif',
        ]);

        $mataKuliah->update([
            'kode_mata_kuliah' => $request->kode_mata_kuliah,
            'nama_mata_kuliah' => $request->nama_mata_kuliah,
            'sks' => $request->sks,
            'semester' => $request->semester,
            'prodi_id' => $request->prodi_id,
            'jenis' => $request->jenis,
            'deskripsi' => $request->deskripsi,
            'status' => $request->status,
        ]);

        return redirect()->route('admin.mata-kuliah.index')
            ->with('success', 'Mata Kuliah berhasil diperbarui!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(MataKuliah $mataKuliah)
    {
        // Check if there are schedules associated with this subject
        if ($mataKuliah->jadwalKuliahs()->count() > 0) {
            return redirect()->route('admin.mata-kuliah.index')
                ->with('error', 'Mata Kuliah tidak dapat dihapus karena masih memiliki jadwal!');
        }

        $mataKuliah->delete();

        return redirect()->route('admin.mata-kuliah.index')
            ->with('success', 'Mata Kuliah berhasil dihapus!');
    }
}
