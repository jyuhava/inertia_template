<?php

namespace App\Http\Controllers\Admin\Obe;

use App\Http\Controllers\Controller;
use App\Models\Kurikulum;
use App\Models\MataKuliah;
use App\Models\ObeCpmk;
use App\Models\ObeSubCpmk;
use App\Models\ObeTaxonomyLevel;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class CpmkController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('Admin/Obe/Cpmk/Index', [
            'cpmks' => ObeCpmk::with(['mataKuliah', 'kurikulum', 'taxonomyLevel', 'subCpmks'])->when($request->kurikulum_id, fn ($q, $id) => $q->where('kurikulum_id', $id))->orderBy('sequence')->paginate(15)->withQueryString(),
            'taxonomies' => ObeTaxonomyLevel::where('status', 'aktif')->orderBy('sequence')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate($this->cpmkRules($request));
        $this->assertCourseCurriculum($data['mata_kuliah_id'], $data['kurikulum_id']);
        ObeCpmk::create($data + ['created_by' => $request->user()->id]);

        return back()->with('success', 'CPMK berhasil ditambahkan.');
    }

    public function update(Request $request, ObeCpmk $cpmk)
    {
        $data = $request->validate($this->cpmkRules($request, $cpmk));
        $this->assertCourseCurriculum($data['mata_kuliah_id'], $data['kurikulum_id']);
        $cpmk->update($data);

        return back()->with('success', 'CPMK berhasil diperbarui.');
    }

    public function destroy(ObeCpmk $cpmk)
    {
        $cpmk->update(['status' => 'nonaktif']);

        return back()->with('success', 'CPMK berhasil dinonaktifkan.');
    }

    public function storeSubCpmk(Request $request, ObeCpmk $cpmk)
    {
        $data = $request->validate($this->subRules($request, $cpmk));
        $cpmk->subCpmks()->create($data);

        return back()->with('success', 'Sub-CPMK berhasil ditambahkan.');
    }

    public function updateSubCpmk(Request $request, ObeCpmk $cpmk, ObeSubCpmk $subCpmk)
    {
        abort_unless($subCpmk->obe_cpmk_id === $cpmk->id, 404);
        $subCpmk->update($request->validate($this->subRules($request, $cpmk, $subCpmk)));

        return back()->with('success', 'Sub-CPMK berhasil diperbarui.');
    }

    public function destroySubCpmk(ObeCpmk $cpmk, ObeSubCpmk $subCpmk)
    {
        abort_unless($subCpmk->obe_cpmk_id === $cpmk->id, 404);
        $subCpmk->update(['status' => 'nonaktif']);

        return back()->with('success', 'Sub-CPMK berhasil dinonaktifkan.');
    }

    private function cpmkRules(Request $request, ?ObeCpmk $cpmk = null): array
    {
        return [
            'mata_kuliah_id' => ['required', 'exists:mata_kuliahs,id'], 'kurikulum_id' => ['required', 'exists:kurikulums,id'],
            'code' => ['required', 'string', 'max:50', Rule::unique('obe_cpmk')->where(fn ($q) => $q->where('mata_kuliah_id', $request->integer('mata_kuliah_id'))->where('kurikulum_id', $request->integer('kurikulum_id')))->ignore($cpmk?->id)],
            'title' => ['required', 'string', 'max:255'], 'description' => ['nullable', 'string'], 'taxonomy_level_id' => ['nullable', 'exists:obe_taxonomy_levels,id'],
            'sequence' => ['nullable', 'integer', 'min:0'], 'status' => ['nullable', 'in:aktif,nonaktif'],
        ];
    }

    private function subRules(Request $request, ObeCpmk $cpmk, ?ObeSubCpmk $subCpmk = null): array
    {
        return [
            'code' => ['required', 'string', 'max:50', Rule::unique('obe_sub_cpmk')->where(fn ($q) => $q->where('obe_cpmk_id', $cpmk->id))->ignore($subCpmk?->id)],
            'title' => ['required', 'string', 'max:255'], 'description' => ['nullable', 'string'], 'taxonomy_level_id' => ['nullable', 'exists:obe_taxonomy_levels,id'],
            'sequence' => ['nullable', 'integer', 'min:0'], 'status' => ['nullable', 'in:aktif,nonaktif'],
        ];
    }

    private function assertCourseCurriculum(int $mataKuliahId, int $kurikulumId): void
    {
        $mataKuliah = MataKuliah::findOrFail($mataKuliahId);
        $kurikulum = Kurikulum::findOrFail($kurikulumId);
        abort_if($mataKuliah->prodi_id !== $kurikulum->prodi_id || ! $kurikulum->kurikulumMataKuliahs()->where('mata_kuliah_id', $mataKuliahId)->exists(), 422, 'CPMK harus menggunakan mata kuliah yang ada pada kurikulum dan program studi yang sama.');
    }
}
