<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KategoriMataKuliah;
use App\Models\MataKuliah;
use App\Models\Prodi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class MataKuliahController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = MataKuliah::with(['prodi', 'kategori'])->withCount('jadwalKuliahs')->withoutTrashed()->orderBy('created_at', 'desc');

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
        return Inertia::render('Admin/MataKuliah/Create', [
            'prodis' => Prodi::where('status', 'aktif')->orderBy('nama_prodi')->get(),
            'kategoris' => KategoriMataKuliah::where('is_active', true)->orderBy('name')->get(),
            'mataKuliahOptions' => MataKuliah::aktif()->orderBy('kode_mata_kuliah')->get(['id', 'kode_mata_kuliah', 'nama_mata_kuliah']),
        ]);
    }

    private function validateMataKuliah(Request $request, ?MataKuliah $mataKuliah = null): array
    {
        $ignore = $mataKuliah?->id;

        return $request->validate([
            'kode_mata_kuliah' => ['required', 'string', 'max:20', Rule::unique('mata_kuliahs', 'kode_mata_kuliah')->ignore($ignore)],
            'nama_mata_kuliah' => 'required|string|max:255',
            'short_name' => 'nullable|string|max:50',
            'english_name' => 'nullable|string|max:255',
            'sks' => 'required|integer|min:1|max:6',
            'theory_credits' => 'nullable|numeric|min:0|max:6',
            'practical_credits' => 'nullable|numeric|min:0|max:6',
            'field_credits' => 'nullable|numeric|min:0|max:6',
            'semester' => 'required|integer|min:1|max:8',
            'prodi_id' => 'required|exists:prodis,id',
            'jenis' => 'required|in:Wajib,Pilihan',
            'course_type' => 'nullable|string|max:30',
            'kategori_mata_kuliah_id' => 'nullable|exists:kategori_mata_kuliahs,id',
            'deskripsi' => 'nullable|string',
            'status' => 'required|in:aktif,nonaktif',
            'prasyarat_ids' => 'nullable|array',
            'prasyarat_ids.*' => ['integer', Rule::exists('mata_kuliahs', 'id')],
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $data = $this->validateMataKuliah($request);

        $mataKuliah = DB::transaction(function () use ($data) {
            $mataKuliah = MataKuliah::create(collect($data)->except('prasyarat_ids')->toArray());
            if (! empty($data['prasyarat_ids'])) {
                $mataKuliah->prasyarats()->sync(array_filter($data['prasyarat_ids'], fn ($id) => $id != $mataKuliah->id));
            }

            return $mataKuliah;
        });

        return redirect()->route('admin.mata-kuliah.show', $mataKuliah)
            ->with('success', 'Mata Kuliah berhasil ditambahkan!');
    }

    /**
     * Display the specified resource.
     */
    public function show(MataKuliah $mataKuliah)
    {
        $mataKuliah->load(['prodi', 'kategori', 'jadwalKuliahs.dosen', 'jadwalKuliahs.semester', 'prasyarats', 'menjadiPrasyaratUntuk', 'kurikulums', 'substansiKuliahs']);

        return Inertia::render('Admin/MataKuliah/Show', [
            'mataKuliah' => $mataKuliah,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(MataKuliah $mataKuliah)
    {
        $mataKuliah->load('prodi', 'prasyarats');

        return Inertia::render('Admin/MataKuliah/Edit', [
            'mataKuliah' => $mataKuliah,
            'prodis' => Prodi::where('status', 'aktif')->orderBy('nama_prodi')->get(),
            'kategoris' => KategoriMataKuliah::where('is_active', true)->orderBy('name')->get(),
            'mataKuliahOptions' => MataKuliah::aktif()->where('id', '!=', $mataKuliah->id)->orderBy('kode_mata_kuliah')->get(['id', 'kode_mata_kuliah', 'nama_mata_kuliah']),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, MataKuliah $mataKuliah)
    {
        $data = $this->validateMataKuliah($request, $mataKuliah);

        DB::transaction(function () use ($data, $mataKuliah) {
            $mataKuliah->update(collect($data)->except('prasyarat_ids')->toArray());
            $mataKuliah->prasyarats()->sync(array_filter($data['prasyarat_ids'] ?? [], fn ($id) => $id != $mataKuliah->id));
        });

        return redirect()->route('admin.mata-kuliah.show', $mataKuliah)
            ->with('success', 'Mata Kuliah berhasil diperbarui!');
    }

    /**
     * Remove the specified resource from storage. Historical academic data
     * (used in curriculum/classes) is preserved via soft delete rather than
     * a hard delete, per the "jangan menghapus mata kuliah lama" rule.
     */
    public function destroy(MataKuliah $mataKuliah)
    {
        if ($mataKuliah->jadwalKuliahs()->count() > 0) {
            return redirect()->route('admin.mata-kuliah.index')
                ->with('error', 'Mata Kuliah tidak dapat diarsipkan karena masih memiliki jadwal!');
        }

        $mataKuliah->update(['status' => 'nonaktif']);
        $mataKuliah->delete();

        return redirect()->route('admin.mata-kuliah.index')
            ->with('success', 'Mata Kuliah berhasil diarsipkan!');
    }

    public function restore($id)
    {
        MataKuliah::withTrashed()->findOrFail($id)->restore();

        return redirect()->route('admin.mata-kuliah.index')->with('success', 'Mata Kuliah berhasil dipulihkan.');
    }
}
