<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Ruangan;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class RuanganController extends Controller
{
    public function index(Request $request)
    {
        $query = Ruangan::query();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(fn ($q) => $q->where('kode', 'like', "%{$search}%")->orWhere('nama', 'like', "%{$search}%")->orWhere('gedung', 'like', "%{$search}%"));
        }
        if ($request->filled('tipe')) {
            $query->where('tipe', $request->tipe);
        }

        return Inertia::render('Admin/Ruangan/Index', [
            'ruangans' => $query->orderBy('kode')->paginate(15)->withQueryString(),
            'filters' => $request->only(['search', 'tipe']),
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Ruangan/Create');
    }

    private function validateRuangan(Request $request, ?Ruangan $ruangan = null): array
    {
        return $request->validate([
            'kode' => ['required', 'string', 'max:30', Rule::unique('ruangans', 'kode')->ignore($ruangan?->id)],
            'nama' => 'required|string|max:255',
            'gedung' => 'nullable|string|max:100',
            'lantai' => 'nullable|string|max:20',
            'kapasitas' => 'required|integer|min:0',
            'tipe' => 'required|in:kelas,laboratorium,auditorium,online',
            'status' => 'required|in:aktif,nonaktif',
        ]);
    }

    public function store(Request $request)
    {
        Ruangan::create($this->validateRuangan($request));

        return redirect()->route('admin.ruangan.index')->with('success', 'Ruangan berhasil ditambahkan.');
    }

    public function show(Ruangan $ruangan)
    {
        $ruangan->load('jadwalKelasKuliahs.kelasKuliah.mataKuliah');

        return Inertia::render('Admin/Ruangan/Show', ['ruangan' => $ruangan]);
    }

    public function edit(Ruangan $ruangan)
    {
        return Inertia::render('Admin/Ruangan/Edit', ['ruangan' => $ruangan]);
    }

    public function update(Request $request, Ruangan $ruangan)
    {
        $ruangan->update($this->validateRuangan($request, $ruangan));

        return redirect()->route('admin.ruangan.index')->with('success', 'Ruangan berhasil diperbarui.');
    }

    public function destroy(Ruangan $ruangan)
    {
        if ($ruangan->jadwalKelasKuliahs()->count() > 0) {
            return back()->with('error', 'Ruangan tidak dapat dihapus karena masih memiliki jadwal.');
        }

        $ruangan->delete();

        return redirect()->route('admin.ruangan.index')->with('success', 'Ruangan berhasil dihapus.');
    }
}
