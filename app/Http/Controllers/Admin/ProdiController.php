<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Prodi;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ProdiController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Prodi::withCount('mahasiswas')->orderBy('created_at', 'desc');

        // Search functionality
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('kode_prodi', 'like', "%{$search}%")
                  ->orWhere('nama_prodi', 'like', "%{$search}%")
                  ->orWhere('jenjang', 'like', "%{$search}%");
            });
        }

        $prodis = $query->paginate(10)->withQueryString();

        return Inertia::render('Admin/Prodi/Index', [
            'prodis' => $prodis,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Admin/Prodi/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'kode_prodi' => 'required|string|max:10|unique:prodis,kode_prodi',
            'nama_prodi' => 'required|string|max:255',
            'deskripsi' => 'nullable|string',
            'jenjang' => 'required|in:D3,D4,S1,S2,S3',
            'status' => 'required|in:aktif,nonaktif',
        ]);

        Prodi::create([
            'kode_prodi' => $request->kode_prodi,
            'nama_prodi' => $request->nama_prodi,
            'deskripsi' => $request->deskripsi,
            'jenjang' => $request->jenjang,
            'status' => $request->status,
        ]);

        return redirect()->route('admin.prodi.index')
            ->with('success', 'Program Studi berhasil ditambahkan!');
    }

    /**
     * Display the specified resource.
     */
    public function show(Prodi $prodi)
    {
        $prodi->loadCount('mahasiswas');
        
        return Inertia::render('Admin/Prodi/Show', [
            'prodi' => $prodi,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Prodi $prodi)
    {
        return Inertia::render('Admin/Prodi/Edit', [
            'prodi' => $prodi,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Prodi $prodi)
    {
        $request->validate([
            'kode_prodi' => ['required', 'string', 'max:10', Rule::unique('prodis')->ignore($prodi->id)],
            'nama_prodi' => 'required|string|max:255',
            'deskripsi' => 'nullable|string',
            'jenjang' => 'required|in:D3,D4,S1,S2,S3',
            'status' => 'required|in:aktif,nonaktif',
        ]);

        $prodi->update([
            'kode_prodi' => $request->kode_prodi,
            'nama_prodi' => $request->nama_prodi,
            'deskripsi' => $request->deskripsi,
            'jenjang' => $request->jenjang,
            'status' => $request->status,
        ]);

        return redirect()->route('admin.prodi.index')
            ->with('success', 'Program Studi berhasil diperbarui!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Prodi $prodi)
    {
        // Check if prodi has mahasiswas
        if ($prodi->mahasiswas()->count() > 0) {
            return redirect()->route('admin.prodi.index')
                ->with('error', 'Program Studi tidak dapat dihapus karena masih memiliki mahasiswa!');
        }

        $prodi->delete();

        return redirect()->route('admin.prodi.index')
            ->with('success', 'Program Studi berhasil dihapus!');
    }
}
