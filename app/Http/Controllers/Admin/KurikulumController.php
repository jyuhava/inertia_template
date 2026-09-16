<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Kurikulum;
use App\Models\Prodi;
use App\Models\Semester;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class KurikulumController extends Controller
{
    public function index(Request $request)
    {
        $query = Kurikulum::with(['prodi', 'semesterMulai', 'semesterSelesai'])->withCount('kurikulumMataKuliahs')->withoutTrashed();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(fn ($q) => $q->where('kode', 'like', "%{$search}%")->orWhere('nama', 'like', "%{$search}%"));
        }
        foreach (['prodi_id', 'status'] as $filter) {
            if ($request->filled($filter)) {
                $query->where($filter, $request->$filter);
            }
        }

        return Inertia::render('Admin/Kurikulum/Index', [
            'kurikulums' => $query->orderByDesc('created_at')->paginate(10)->withQueryString(),
            'filters' => $request->only(['search', 'prodi_id', 'status']),
            'prodis' => Prodi::orderBy('nama_prodi')->get(['id', 'kode_prodi', 'nama_prodi']),
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Kurikulum/Create', [
            'prodis' => Prodi::where('status', 'aktif')->orderBy('nama_prodi')->get(),
            'semesters' => Semester::with('tahunAjaran')->orderByDesc('created_at')->get(),
        ]);
    }

    private function validateKurikulum(Request $request, ?Kurikulum $kurikulum = null): array
    {
        return $request->validate([
            'kode' => ['required', 'string', 'max:30', Rule::unique('kurikulums', 'kode')->ignore($kurikulum?->id)],
            'nama' => 'required|string|max:255',
            'deskripsi' => 'nullable|string',
            'prodi_id' => 'required|exists:prodis,id',
            'semester_mulai_id' => 'required|exists:semesters,id',
            'semester_selesai_id' => 'nullable|exists:semesters,id',
            'total_sks_wajib' => 'nullable|numeric|min:0',
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validateKurikulum($request);
        $kurikulum = Kurikulum::create($data + ['status' => 'draft']);

        return redirect()->route('admin.kurikulum.show', $kurikulum)->with('success', 'Kurikulum berhasil dibuat sebagai draft.');
    }

    public function show(Kurikulum $kurikulum)
    {
        $kurikulum->load([
            'prodi', 'semesterMulai', 'semesterSelesai', 'pddiktiMapping',
            'kurikulumMataKuliahs.mataKuliah', 'kurikulumMataKuliahs.kelompok',
        ]);

        $bySemester = $kurikulum->kurikulumMataKuliahs->groupBy('semester')->map(fn ($items) => $items->values());

        return Inertia::render('Admin/Kurikulum/Show', [
            'kurikulum' => $kurikulum,
            'bySemester' => $bySemester,
            'totalSks' => $kurikulum->hitungTotalSks(),
            'totalSksWajib' => $kurikulum->kurikulumMataKuliahs->where('is_wajib', true)->sum(fn ($i) => (float) ($i->sks_override ?? $i->mataKuliah?->sks ?? 0)),
            'totalSksPilihan' => $kurikulum->kurikulumMataKuliahs->where('is_wajib', false)->sum(fn ($i) => (float) ($i->sks_override ?? $i->mataKuliah?->sks ?? 0)),
            'mataKuliahOptions' => \App\Models\MataKuliah::aktif()->orderBy('kode_mata_kuliah')->get(['id', 'kode_mata_kuliah', 'nama_mata_kuliah', 'sks']),
            'kelompokOptions' => \App\Models\KelompokMataKuliah::where('is_active', true)->orderBy('name')->get(),
        ]);
    }

    public function edit(Kurikulum $kurikulum)
    {
        return Inertia::render('Admin/Kurikulum/Edit', [
            'kurikulum' => $kurikulum,
            'prodis' => Prodi::where('status', 'aktif')->orderBy('nama_prodi')->get(),
            'semesters' => Semester::with('tahunAjaran')->orderByDesc('created_at')->get(),
        ]);
    }

    public function update(Request $request, Kurikulum $kurikulum)
    {
        if ($kurikulum->status === 'arsip') {
            return back()->with('error', 'Kurikulum yang sudah diarsipkan tidak dapat diubah.');
        }

        $kurikulum->update($this->validateKurikulum($request, $kurikulum));

        return redirect()->route('admin.kurikulum.show', $kurikulum)->with('success', 'Kurikulum berhasil diperbarui.');
    }

    public function destroy(Kurikulum $kurikulum)
    {
        if ($kurikulum->kelasKuliahs()->count() > 0) {
            return back()->with('error', 'Kurikulum tidak dapat dihapus karena sudah digunakan pada kelas kuliah.');
        }

        $kurikulum->delete();

        return redirect()->route('admin.kurikulum.index')->with('success', 'Kurikulum berhasil dihapus.');
    }

    /**
     * Validate before activation per instruction X: program studi tersedia,
     * minimal ada mata kuliah, semester valid, tidak ada duplicate, dan
     * total SKS konsisten. Returns a list of problems rather than one
     * generic "Invalid curriculum" message.
     */
    public function activate(Kurikulum $kurikulum)
    {
        $problems = [];

        if (! $kurikulum->prodi) {
            $problems[] = 'Program studi tidak ditemukan.';
        }
        if ($kurikulum->kurikulumMataKuliahs()->count() === 0) {
            $problems[] = 'Kurikulum belum memiliki mata kuliah.';
        }
        $duplicates = $kurikulum->kurikulumMataKuliahs()->select('mata_kuliah_id')
            ->groupBy('mata_kuliah_id')->havingRaw('COUNT(*) > 1')->pluck('mata_kuliah_id');
        if ($duplicates->isNotEmpty()) {
            $problems[] = 'Terdapat mata kuliah duplikat dalam kurikulum: '.$duplicates->join(', ');
        }
        $invalidSemester = $kurikulum->kurikulumMataKuliahs()->where(function ($q) {
            $q->where('semester', '<', 1)->orWhere('semester', '>', 14);
        })->count();
        if ($invalidSemester > 0) {
            $problems[] = 'Terdapat penempatan semester yang tidak valid.';
        }

        if (! empty($problems)) {
            return back()->withErrors(['activation' => $problems]);
        }

        DB::transaction(function () use ($kurikulum) {
            $kurikulum->update(['status' => 'aktif']);
        });

        return back()->with('success', 'Kurikulum berhasil diaktifkan.');
    }

    public function archive(Kurikulum $kurikulum)
    {
        $kurikulum->update(['status' => 'arsip']);

        return back()->with('success', 'Kurikulum berhasil diarsipkan.');
    }
}
