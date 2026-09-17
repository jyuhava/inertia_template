<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KelasKuliah;
use App\Models\Kurikulum;
use App\Models\MataKuliah;
use App\Models\Semester;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class KelasKuliahController extends Controller
{
    public function index(Request $request)
    {
        $query = KelasKuliah::with(['mataKuliah.prodi', 'semester.tahunAjaran', 'dosens'])->withoutTrashed();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where('kode_kelas', 'like', "%{$search}%")
                ->orWhereHas('mataKuliah', fn ($q) => $q->where('nama_mata_kuliah', 'like', "%{$search}%")->orWhere('kode_mata_kuliah', 'like', "%{$search}%"));
        }
        foreach (['semester_id', 'mata_kuliah_id', 'status'] as $filter) {
            if ($request->filled($filter)) {
                $query->where($filter, $request->$filter);
            }
        }

        return Inertia::render('Admin/KelasKuliah/Index', [
            'kelasKuliahs' => $query->orderByDesc('created_at')->paginate(10)->withQueryString(),
            'filters' => $request->only(['search', 'semester_id', 'mata_kuliah_id', 'status']),
            'semesters' => Semester::with('tahunAjaran')->orderByDesc('created_at')->get(),
            'mataKuliahs' => MataKuliah::aktif()->orderBy('kode_mata_kuliah')->get(['id', 'kode_mata_kuliah', 'nama_mata_kuliah']),
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/KelasKuliah/Create', [
            'mataKuliahs' => MataKuliah::aktif()->orderBy('kode_mata_kuliah')->get(),
            'kurikulums' => Kurikulum::aktif()->orderByDesc('created_at')->get(['id', 'kode', 'nama']),
            'semesters' => Semester::with('tahunAjaran')->orderByDesc('created_at')->get(),
        ]);
    }

    private function validateKelas(Request $request, ?KelasKuliah $kelasKuliah = null): array
    {
        return $request->validate([
            'mata_kuliah_id' => 'required|exists:mata_kuliahs,id',
            'kurikulum_id' => 'nullable|exists:kurikulums,id',
            'semester_id' => 'required|exists:semesters,id',
            'kode_kelas' => [
                'required', 'string', 'max:20',
                Rule::unique('kelas_kuliahs', 'kode_kelas')
                    ->where('mata_kuliah_id', $request->mata_kuliah_id)
                    ->where('semester_id', $request->semester_id)
                    ->ignore($kelasKuliah?->id),
            ],
            'nama_kelas' => 'nullable|string|max:255',
            'kapasitas' => 'required|integer|min:1|max:500',
            'tipe_kelas' => 'required|in:reguler,paralel,praktikum,daring,blended',
            'status' => 'required|in:draft,dibuka,ditutup,dibatalkan',
        ]);
    }

    public function store(Request $request)
    {
        $kelasKuliah = KelasKuliah::create($this->validateKelas($request));

        return redirect()->route('admin.kelas-kuliah.show', $kelasKuliah)->with('success', 'Kelas kuliah berhasil dibuat.');
    }

    public function show(KelasKuliah $kelasKuliah)
    {
        $kelasKuliah->load(['mataKuliah', 'kurikulum', 'semester.tahunAjaran', 'pengajars.dosen', 'jadwals.ruangan', 'pddiktiMapping']);

        return Inertia::render('Admin/KelasKuliah/Show', [
            'kelasKuliah' => $kelasKuliah,
            'dosens' => \App\Models\Dosen::where('status', 'aktif')->orderBy('nama_lengkap')->get(['id', 'nama_lengkap']),
            'ruangans' => \App\Models\Ruangan::aktif()->orderBy('kode')->get(['id', 'kode', 'nama']),
        ]);
    }

    public function edit(KelasKuliah $kelasKuliah)
    {
        return Inertia::render('Admin/KelasKuliah/Edit', [
            'kelasKuliah' => $kelasKuliah,
            'mataKuliahs' => MataKuliah::aktif()->orderBy('kode_mata_kuliah')->get(),
            'kurikulums' => Kurikulum::aktif()->orderByDesc('created_at')->get(['id', 'kode', 'nama']),
            'semesters' => Semester::with('tahunAjaran')->orderByDesc('created_at')->get(),
        ]);
    }

    public function update(Request $request, KelasKuliah $kelasKuliah)
    {
        $kelasKuliah->update($this->validateKelas($request, $kelasKuliah));

        return redirect()->route('admin.kelas-kuliah.show', $kelasKuliah)->with('success', 'Kelas kuliah berhasil diperbarui.');
    }

    public function destroy(KelasKuliah $kelasKuliah)
    {
        if ($kelasKuliah->jadwals()->count() > 0) {
            return back()->with('error', 'Kelas kuliah tidak dapat dihapus karena masih memiliki jadwal.');
        }

        $kelasKuliah->delete();

        return redirect()->route('admin.kelas-kuliah.index')->with('success', 'Kelas kuliah berhasil dihapus.');
    }
}
