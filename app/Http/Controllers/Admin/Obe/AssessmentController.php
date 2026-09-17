<?php

namespace App\Http\Controllers\Admin\Obe;

use App\Http\Controllers\Controller;
use App\Models\KelasKuliah;
use App\Models\ObeAssessment;
use App\Models\ObeAssessmentMapping;
use App\Models\ObeAssessmentScore;
use App\Models\ObeCpmk;
use App\Models\ObeSubCpmk;
use App\Models\Penilaian;
use App\Services\ObeValidationService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AssessmentController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('Admin/Obe/Assessment/Index', [
            'assessments' => ObeAssessment::with(['mataKuliah', 'kelasKuliah', 'mappings.cpmk', 'mappings.subCpmk'])->when($request->mata_kuliah_id, fn ($q, $id) => $q->where('mata_kuliah_id', $id))->paginate(15)->withQueryString(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'mata_kuliah_id' => ['required', 'exists:mata_kuliahs,id'], 'kelas_kuliah_id' => ['nullable', 'exists:kelas_kuliahs,id'],
            'type' => ['required', 'string', 'max:50'], 'title' => ['required', 'string', 'max:255'], 'description' => ['nullable', 'string'],
            'max_score' => ['required', 'numeric', 'gt:0', 'max:999999'], 'weight' => ['required', 'numeric', 'gt:0', 'max:100'], 'status' => ['nullable', 'in:aktif,nonaktif'],
        ]);
        if (! empty($data['kelas_kuliah_id']) && KelasKuliah::findOrFail($data['kelas_kuliah_id'])->mata_kuliah_id !== (int) $data['mata_kuliah_id']) {
            abort(422, 'Kelas kuliah harus sesuai dengan mata kuliah assessment.');
        }
        ObeAssessment::create($data + ['created_by' => $request->user()->id]);

        return back()->with('success', 'Assessment berhasil ditambahkan.');
    }

    public function update(Request $request, ObeAssessment $assessment)
    {
        $data = $request->validate([
            'type' => ['required', 'string', 'max:50'], 'title' => ['required', 'string', 'max:255'], 'description' => ['nullable', 'string'],
            'max_score' => ['required', 'numeric', 'gt:0', 'max:999999'], 'weight' => ['required', 'numeric', 'gt:0', 'max:100'], 'status' => ['nullable', 'in:aktif,nonaktif'],
        ]);
        $assessment->update($data);

        return back()->with('success', 'Assessment berhasil diperbarui.');
    }

    public function destroy(ObeAssessment $assessment)
    {
        $assessment->update(['status' => 'nonaktif']);

        return back()->with('success', 'Assessment berhasil dinonaktifkan.');
    }

    public function storeMapping(Request $request, ObeValidationService $validation)
    {
        $data = $request->validate([
            'assessment_id' => ['required', 'exists:obe_assessments,id'], 'cpmk_id' => ['nullable', 'exists:obe_cpmk,id'],
            'sub_cpmk_id' => ['nullable', 'exists:obe_sub_cpmk,id'], 'weight' => ['required', 'numeric', 'gt:0', 'max:100'],
        ]);
        $assessment = ObeAssessment::findOrFail($data['assessment_id']);
        $cpmk = isset($data['cpmk_id']) ? ObeCpmk::find($data['cpmk_id']) : null;
        $subCpmk = isset($data['sub_cpmk_id']) ? ObeSubCpmk::with('cpmk')->find($data['sub_cpmk_id']) : null;
        $validation->assertAssessmentMapping($assessment, $cpmk, $subCpmk);
        ObeAssessmentMapping::updateOrCreate(
            ['assessment_id' => $assessment->id, 'cpmk_id' => $cpmk?->id, 'sub_cpmk_id' => $subCpmk?->id],
            ['weight' => $data['weight']]
        );

        return back()->with('success', 'Mapping assessment berhasil disimpan.');
    }

    public function destroyMapping(ObeAssessmentMapping $mapping)
    {
        $mapping->delete();

        return back()->with('success', 'Mapping assessment berhasil dihapus.');
    }

    public function storeScore(Request $request, ObeAssessment $assessment)
    {
        $data = $request->validate([
            'mahasiswa_id' => ['required', 'exists:mahasiswas,id'], 'score' => ['nullable', 'numeric', 'min:0'],
            'penilaian_id' => ['nullable', 'exists:penilaians,id'],
        ]);
        abort_if(! isset($data['score']) && ! isset($data['penilaian_id']), 422, 'Nilai mandiri atau sumber Penilaian wajib diisi.');
        if (isset($data['score']) && $data['score'] > $assessment->max_score) {
            abort(422, 'Nilai tidak boleh melebihi skor maksimum assessment.');
        }
        if (isset($data['penilaian_id']) && Penilaian::findOrFail($data['penilaian_id'])->mahasiswa_id !== (int) $data['mahasiswa_id']) {
            abort(422, 'Sumber Penilaian harus milik mahasiswa yang sama.');
        }
        ObeAssessmentScore::updateOrCreate(['assessment_id' => $assessment->id, 'mahasiswa_id' => $data['mahasiswa_id']], $data + ['recorded_by' => $request->user()->id]);

        return back()->with('success', 'Evidence nilai berhasil disimpan.');
    }
}
