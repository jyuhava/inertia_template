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
use Illuminate\Support\Collection;
use Inertia\Inertia;

class ReportController extends Controller
{
    /**
     * Laporan OBE — matriks kontribusi CPL x Mata Kuliah, capaian per CPL, dan
     * gap yang perlu tindak lanjut.
     *
     * Route ini sebelumnya tidak terdaftar sama sekali, sementara sidebar dan
     * tombol "Tampilkan Laporan" di Report.jsx sudah menunjuk ke /admin/obe/report.
     * Akibatnya klik menu tersebut berakhir 404 dan halaman tidak pernah muncul.
     *
     * Halaman ini juga harus mengirim `achievements` dan `gaps`: Report.jsx
     * merender dua panel dari kedua prop itu, dan tanpa keduanya panel
     * "Capaian CPL" serta "Analisis Gap" selalu jatuh ke empty state walau data
     * skor sebenarnya sudah ada.
     */
    public function index(Request $request, ObeAchievementService $achievement)
    {
        $data = $request->validate([
            'kurikulum_id' => ['nullable', 'integer', 'exists:kurikulums,id'],
            'mahasiswa_id' => ['nullable', 'integer', 'exists:mahasiswas,id'],
            'threshold' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ]);

        $kurikulumId = $data['kurikulum_id'] ?? null;
        $threshold = (float) ($data['threshold'] ?? 70);
        $prodiId = $kurikulumId ? Kurikulum::find($kurikulumId)?->prodi_id : null;

        $cpls = collect();
        $mataKuliahs = collect();
        $matrix = collect();
        $achievements = collect();
        $gaps = collect();
        $mahasiswas = collect();

        if ($kurikulumId) {
            $cpls = ObeCpl::with('courseMappings.mataKuliah')
                ->where('kurikulum_id', $kurikulumId)
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

            $mahasiswas = $this->mahasiswaOptions($prodiId);
        }

        // Capaian hanya bisa dihitung untuk satu mahasiswa. Mahasiswa dari prodi
        // lain sengaja diabaikan agar pilihan yang tidak konsisten tidak
        // menghasilkan angka yang menyesatkan.
        $mahasiswa = $mahasiswas->firstWhere('id', (int) ($data['mahasiswa_id'] ?? 0));

        if ($kurikulumId && $mahasiswa) {
            $rows = collect($achievement->gapReport($kurikulumId, $mahasiswa, $threshold))
                ->map(function (array $row) use ($cpls) {
                    $cpl = $cpls->firstWhere('id', $row['cpl_id']);

                    return [
                        'cpl_id' => $row['cpl_id'],
                        'cpl' => $cpl ? [
                            'id' => $cpl->id,
                            'kode' => $cpl->code,
                            'nama' => $cpl->name,
                            'domain' => $cpl->domain,
                        ] : null,
                        'achievement' => $row['achievement'],
                        'target' => $row['threshold'],
                        'achieved' => $row['achieved'],
                        'gap' => $row['gap'],
                        'evidence_count' => $row['evidence_count'] ?? 0,
                        'assessment_count' => $row['assessment_count'] ?? 0,
                        'missing_cpmk_evidence' => $row['missing_cpmk_evidence'] ?? 0,
                    ];
                });

            $achievements = $rows;

            // Gap = CPL yang belum mencapai target, termasuk yang belum punya
            // satu pun evidence karena nilainya null.
            $gaps = $rows->filter(fn (array $row) => ! $row['achieved'])->values()->map(function (array $row) use ($threshold) {
                $sisa = max(0, round($threshold - (float) ($row['achievement'] ?? 0), 2));

                $rekomendasi = ($row['missing_cpmk_evidence'] ?? 0) > 0
                    ? sprintf(
                        'Lengkapi evidence pada %d CPMK yang belum memiliki skor assessment, lalu ulangi perhitungan.',
                        $row['missing_cpmk_evidence']
                    )
                    : sprintf(
                        'Tinjau ulang penilaian assessment CPL ini; capaian masih %.2f%% di bawah target %.2f%%.',
                        $sisa,
                        $threshold
                    );

                return [
                    'cpl_id' => $row['cpl_id'],
                    'cpl' => $row['cpl'],
                    'achievement' => $row['achievement'],
                    'gap' => $row['gap'] ?? $sisa,
                    'rekomendasi' => $rekomendasi,
                ];
            });
        }

        return Inertia::render('Admin/Obe/Report', [
            'kurikulums' => Kurikulum::orderByDesc('kode')->get(),
            'filters' => [
                'kurikulum_id' => $kurikulumId,
                // Balikkan nilai yang benar-benar dipakai, bukan input mentah,
                // supaya dropdown frontend tidak menyeleksi mahasiswa yang
                // tidak ada di daftar.
                'mahasiswa_id' => $mahasiswa?->id,
                'threshold' => $threshold,
            ],
            'cpls' => $cpls,
            'mataKuliahs' => $mataKuliahs,
            'matrix' => $matrix,
            'mahasiswas' => $mahasiswas,
            'achievements' => $achievements,
            'gaps' => $gaps,
            'target' => $threshold,
        ]);
    }

    /**
     * Mahasiswa milik satu prodi untuk dropdown laporan, diurutkan terbaru lebih
     * dulu supaya yang paling mungkin dicari ada di atas.
     */
    private function mahasiswaOptions(?int $prodiId): Collection
    {
        if (! $prodiId) {
            return collect();
        }

        return Mahasiswa::where('prodi_id', $prodiId)
            ->where('status', 'aktif')
            ->orderByDesc('angkatan')
            ->orderBy('nim')
            ->limit(300)
            ->get(['id', 'nim', 'nama_lengkap', 'angkatan']);
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
