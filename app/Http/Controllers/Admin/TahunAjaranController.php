<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TahunAjaran;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TahunAjaranController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = TahunAjaran::withCount('semesters')->orderBy('created_at', 'desc');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nama_tahun_ajaran', 'like', "%{$search}%")
                  ->orWhere('status', 'like', "%{$search}%");
            });
        }

        $tahunAjarans = $query->paginate(10)->withQueryString();

        return Inertia::render('Admin/TahunAjaran/Index', [
            'tahunAjarans' => $tahunAjarans,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Admin/TahunAjaran/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'nama_tahun_ajaran' => 'required|string|max:255|unique:tahun_ajarans',
            'tanggal_mulai' => 'required|date',
            'tanggal_selesai' => 'required|date|after:tanggal_mulai',
            'status' => 'required|in:aktif,nonaktif',
            'keterangan' => 'nullable|string',
        ]);

        // If setting as active, deactivate other active academic years
        if ($request->status === 'aktif') {
            TahunAjaran::where('status', 'aktif')->update(['status' => 'nonaktif']);
        }

        TahunAjaran::create([
            'nama_tahun_ajaran' => $request->nama_tahun_ajaran,
            'tanggal_mulai' => $request->tanggal_mulai,
            'tanggal_selesai' => $request->tanggal_selesai,
            'status' => $request->status,
            'keterangan' => $request->keterangan,
        ]);

        return redirect()->route('admin.tahun-ajaran.index')
            ->with('success', 'Tahun Ajaran berhasil ditambahkan!');
    }

    /**
     * Display the specified resource.
     */
    public function show(TahunAjaran $tahunAjaran)
    {
        $tahunAjaran->load(['semesters' => function ($query) {
            $query->orderBy('nama_semester');
        }]);

        return Inertia::render('Admin/TahunAjaran/Show', [
            'tahunAjaran' => $tahunAjaran,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(TahunAjaran $tahunAjaran)
    {
        return Inertia::render('Admin/TahunAjaran/Edit', [
            'tahunAjaran' => $tahunAjaran,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, TahunAjaran $tahunAjaran)
    {
        $request->validate([
            'nama_tahun_ajaran' => 'required|string|max:255|unique:tahun_ajarans,nama_tahun_ajaran,' . $tahunAjaran->id,
            'tanggal_mulai' => 'required|date',
            'tanggal_selesai' => 'required|date|after:tanggal_mulai',
            'status' => 'required|in:aktif,nonaktif',
            'keterangan' => 'nullable|string',
        ]);

        // If setting as active, deactivate other active academic years
        if ($request->status === 'aktif' && $tahunAjaran->status !== 'aktif') {
            TahunAjaran::where('status', 'aktif')->where('id', '!=', $tahunAjaran->id)->update(['status' => 'nonaktif']);
        }

        $tahunAjaran->update([
            'nama_tahun_ajaran' => $request->nama_tahun_ajaran,
            'tanggal_mulai' => $request->tanggal_mulai,
            'tanggal_selesai' => $request->tanggal_selesai,
            'status' => $request->status,
            'keterangan' => $request->keterangan,
        ]);

        return redirect()->route('admin.tahun-ajaran.index')
            ->with('success', 'Tahun Ajaran berhasil diperbarui!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(TahunAjaran $tahunAjaran)
    {
        // Check if there are semesters associated with this academic year
        if ($tahunAjaran->semesters()->count() > 0) {
            return redirect()->route('admin.tahun-ajaran.index')
                ->with('error', 'Tahun Ajaran tidak dapat dihapus karena masih memiliki semester!');
        }

        $tahunAjaran->delete();

        return redirect()->route('admin.tahun-ajaran.index')
            ->with('success', 'Tahun Ajaran berhasil dihapus!');
    }
}
