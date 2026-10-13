<?php

namespace App\Http\Controllers\Admin\Obe;

use App\Http\Controllers\Controller;
use App\Models\Kurikulum;
use App\Models\KurikulumMataKuliah;
use App\Models\MataKuliah;
use App\Models\ObeCpl;
use App\Models\ObeCplCourseMapping;
use App\Models\ObeCpmk;
use App\Models\ObeCpmkCplMapping;
use App\Services\ObeValidationService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MappingController extends Controller
{
    /**
     * Halaman Pemetaan OBE — matriks CPL x Mata Kuliah dan daftar mapping CPMK.
     *
     * Route ini sebelumnya tidak pernah terdaftar sementara Sidebar dan
     * app.jsx sudah menunjuk ke /admin/obe/mapping, sehingga menu tersebut
     * berakhir 404 dan bobot kontribusi tidak pernah bisa diisi. Tanpa bobot
     * ini matriks pada Laporan OBE juga selalu kosong.
     */
    public function index(Request $request)
    {
        $data = $request->validate([
            'kurikulum_id' => ['nullable', 'integer', 'exists:kurikulums,id'],
        ]);

        $kurikulumId = $data['kurikulum_id'] ?? null;

        $cpls = ObeCpl::query()
            ->when($kurikulumId, fn ($query) => $query->where('kurikulum_id', $kurikulumId))
            ->orderBy('kurikulum_id')
            ->orderBy('sequence')
            ->get();

        // Mata kuliah diambil lewat kurikulum_mata_kuliahs supaya setiap baris
        // membawa kurikulum_id-nya. Mapping.jsx memfilter kolom matriks dengan
        // field itu, sedangkan tabel mata_kuliahs sendiri tidak punya kolom
        // tersebut.
        $mataKuliahs = KurikulumMataKuliah::query()
            ->when($kurikulumId, fn ($query) => $query->where('kurikulum_id', $kurikulumId))
            ->with('mataKuliah')
            ->orderBy('semester')
            ->orderBy('sort_order')
            ->get()
            ->map(fn (KurikulumMataKuliah $item) => $item->mataKuliah
                ? $item->mataKuliah->toArray() + ['kurikulum_id' => $item->kurikulum_id]
                : null)
            ->filter()
            ->unique('id')
            ->values();

        $cplCourseMappings = ObeCplCourseMapping::query()
            ->when($kurikulumId, fn ($query) => $query->where('kurikulum_id', $kurikulumId))
            ->orderBy('cpl_id')
            ->get();

        $cpmks = ObeCpmk::query()
            ->when($kurikulumId, fn ($query) => $query->where('kurikulum_id', $kurikulumId))
            ->orderBy('mata_kuliah_id')
            ->orderBy('sequence')
            ->get();

        $cpmkCplMappings = ObeCpmkCplMapping::query()
            ->with('cpmk', 'cpl')
            ->when($kurikulumId, fn ($query) => $query->whereHas('cpmk', fn ($cpmk) => $cpmk->where('kurikulum_id', $kurikulumId)))
            ->orderBy('cpl_id')
            ->get();

        return Inertia::render('Admin/Obe/Mapping', [
            'kurikulums' => Kurikulum::orderByDesc('kode')->get(),
            'filters' => ['kurikulum_id' => $kurikulumId],
            'cpls' => $cpls,
            'mataKuliahs' => $mataKuliahs,
            'cplCourseMappings' => $cplCourseMappings,
            'cpmks' => $cpmks,
            'cpmkCplMappings' => $cpmkCplMappings,
        ]);
    }

    public function storeCplCourse(Request $request, ObeValidationService $validation)
    {
        $data = $request->validate([
            'cpl_id' => ['required', 'exists:obe_cpl,id'], 'mata_kuliah_id' => ['required', 'exists:mata_kuliahs,id'],
            'kurikulum_id' => ['required', 'exists:kurikulums,id'], 'contribution_level' => ['nullable', 'string', 'max:50'],
            'weight' => ['required', 'numeric', 'gt:0', 'max:100'],
        ]);
        $cpl = ObeCpl::findOrFail($data['cpl_id']);
        $mataKuliah = MataKuliah::findOrFail($data['mata_kuliah_id']);
        $kurikulum = Kurikulum::findOrFail($data['kurikulum_id']);
        $validation->assertCplCourseMapping($cpl, $mataKuliah, $kurikulum);

        ObeCplCourseMapping::updateOrCreate(
            ['cpl_id' => $cpl->id, 'mata_kuliah_id' => $mataKuliah->id, 'kurikulum_id' => $kurikulum->id],
            ['contribution_level' => $data['contribution_level'] ?? null, 'weight' => $data['weight']]
        );

        return back()->with('success', 'Mapping CPL dan mata kuliah berhasil disimpan.');
    }

    public function destroyCplCourse(ObeCplCourseMapping $mapping)
    {
        $mapping->delete();

        return back()->with('success', 'Mapping CPL dan mata kuliah berhasil dihapus.');
    }

    public function storeCpmkCpl(Request $request, ObeValidationService $validation)
    {
        $data = $request->validate([
            'cpmk_id' => ['required', 'exists:obe_cpmk,id'], 'cpl_id' => ['required', 'exists:obe_cpl,id'],
            'weight' => ['required', 'numeric', 'gt:0', 'max:100'],
        ]);
        $cpmk = ObeCpmk::findOrFail($data['cpmk_id']);
        $cpl = ObeCpl::findOrFail($data['cpl_id']);
        $validation->assertCpmkCplMapping($cpmk, $cpl);

        ObeCpmkCplMapping::updateOrCreate(['cpmk_id' => $cpmk->id, 'cpl_id' => $cpl->id], ['weight' => $data['weight']]);

        return back()->with('success', 'Mapping CPMK dan CPL berhasil disimpan.');
    }

    public function destroyCpmkCpl(ObeCpmkCplMapping $mapping)
    {
        $mapping->delete();

        return back()->with('success', 'Mapping CPMK dan CPL berhasil dihapus.');
    }
}
