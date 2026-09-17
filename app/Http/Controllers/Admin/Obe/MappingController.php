<?php

namespace App\Http\Controllers\Admin\Obe;

use App\Http\Controllers\Controller;
use App\Models\Kurikulum;
use App\Models\MataKuliah;
use App\Models\ObeCpl;
use App\Models\ObeCplCourseMapping;
use App\Models\ObeCpmk;
use App\Models\ObeCpmkCplMapping;
use App\Services\ObeValidationService;
use Illuminate\Http\Request;

class MappingController extends Controller
{
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
