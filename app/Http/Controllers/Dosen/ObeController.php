<?php

namespace App\Http\Controllers\Dosen;

use App\Http\Controllers\Controller;
use App\Models\Dosen;
use App\Models\KelasKuliah;
use App\Models\ObeAssessment;
use App\Models\ObeCpmk;
use App\Services\ObeValidationService;
use Inertia\Inertia;

class ObeController extends Controller
{
    public function class(KelasKuliah $kelasKuliah, ObeValidationService $validation)
    {
        $dosen = Dosen::where('user_id', auth()->id())->firstOrFail();
        $validation->assertDosenCanReadClass($dosen, $kelasKuliah);

        return Inertia::render('Dosen/Obe/Class', [
            'kelasKuliah' => $kelasKuliah->load('mataKuliah', 'kurikulum'),
            'cpmks' => ObeCpmk::with(['subCpmks', 'cpls'])->where('mata_kuliah_id', $kelasKuliah->mata_kuliah_id)->where('kurikulum_id', $kelasKuliah->kurikulum_id)->orderBy('sequence')->get(),
            'assessments' => ObeAssessment::with('mappings')->where('kelas_kuliah_id', $kelasKuliah->id)->get(),
        ]);
    }
}
