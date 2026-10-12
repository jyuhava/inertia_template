<?php

namespace App\Http\Controllers\Admin\Obe;

use App\Http\Controllers\Controller;
use App\Models\Kurikulum;
use App\Models\MataKuliah;
use App\Models\Mahasiswa;
use App\Models\ObeCpl;
use App\Models\ObeCpmk;
use App\Services\ObeAchievementService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReportController extends Controller
{
    /**
     * Laporan OBE — daftar CPL dan matriks kontribusi CPL × Mata Kuliah.
     *
     * Route ini sebelumnya tidak terdaftar sama sekali, sementara sidebar dan
     * tombol "Tampilkan Laporan" di Report.jsx sudah menunjuk ke /admin/obe/report.
     * Akibatnya klik menu tersebut berakhir 404 dan halaman tidak pernah muncul.
     */
    public function index(Request $request)
    {
        $data = $request->validate([
            'kurikulum_id' => ['nullable', 'integer', 'exists:kurikulums,id'],
        ]);

        $cpls = collect();
        $mataKuliahs = collect();
        $matrix = collect();

        if (! empty($data['kurikulum_id'])) {
            $cpls = ObeCpl::with('courseMappings.mataKuliah')
                ->where('kurikulum_id', $data['kurikulum_id'])
                ->orderBy('sequence')
                ->get();

            // Baris matriks disusun datar agar frontend tidak perlu menyusun
            // ulang relasi CPL -> courseMappings yang sudah dimuat.
            $matrix = $cpls->flatMap(fn (ObeCpl $cpl) => $cpl->courseMappings->map(fn ($mapping) => [
                'cpl_id' => $cpl->id,
                'mata_kuliah_id' => $mapping->mata_kuliah_id,
                'weight' => (float) ($mapping->weight ?? 0),
            ]))->values();

            $mataKuliahIds = $matrix->pluck('mata_kuliah_id')->filter()->unique()->values();

            $mataKuliahs = $mataKuliahIds->isEmpty()
                ? collect()
                : MataKuliah::whereIn('id', $mataKuliahs->all())->orderBy('kode_mata_kuliah')->get();
        }

        return Inertia::render('Admin/Obe/Report', [
            'kurikulums' => Kurikulum::orderByDesc('kode')->get(),
            'filters' => ['kurikulum_id' => $data['kurikulum_id'] ?? null],
            'cpls' => $cpls,
            'mataKuliahs' => $mataKuliahs,
            'matrix' => $matrix,
        ]);
    }

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
