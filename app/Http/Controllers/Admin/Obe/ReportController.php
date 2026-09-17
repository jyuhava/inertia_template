<?php

namespace App\Http\Controllers\Admin\Obe;

use App\Http\Controllers\Controller;
use App\Models\Kurikulum;
use App\Models\Mahasiswa;
use App\Models\ObeCpl;
use App\Models\ObeCpmk;
use App\Services\ObeAchievementService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReportController extends Controller
{
    public function matrix(Kurikulum $kurikulum)
    {
        abort_unless($kurikulum->exists, 404);

        return Inertia::render('Admin/Obe/Report/Matrix', [
            'kurikulum' => $kurikulum->load('prodi'),
            'cpls' => ObeCpl::with('courseMappings.mataKuliah')->where('kurikulum_id', $kurikulum->id)->orderBy('sequence')->get(),
            'cpmks' => ObeCpmk::with('cplMappings.cpl')->where('kurikulum_id', $kurikulum->id)->orderBy('sequence')->get(),
        ]);
    }

    public function gap(Request $request, Kurikulum $kurikulum, Mahasiswa $mahasiswa, ObeAchievementService $achievement)
    {
        abort_unless($mahasiswa->prodi_id === $kurikulum->prodi_id, 404);
        $data = $request->validate(['threshold' => ['nullable', 'numeric', 'min:0', 'max:100']]);

        return response()->json([
            'kurikulum_id' => $kurikulum->id,
            'mahasiswa_id' => $mahasiswa->id,
            'reports' => $achievement->gapReport($kurikulum->id, $mahasiswa, (float) ($data['threshold'] ?? 70)),
        ]);
    }
}
