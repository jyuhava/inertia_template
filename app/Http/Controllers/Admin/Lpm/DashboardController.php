<?php

namespace App\Http\Controllers\Admin\Lpm;

use App\Http\Controllers\Controller;
use App\Models\LpmContract;
use App\Models\LpmOutput;
use App\Models\LpmProgram;
use App\Models\LpmProposal;
use App\Models\LpmReport;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $perStatus = LpmProposal::select('status', DB::raw('count(*) as jumlah'))
            ->groupBy('status')
            ->pluck('jumlah', 'status');

        $programTahun = LpmProgram::select('tahun_anggaran', DB::raw('count(*) as jumlah'))
            ->whereNotNull('tahun_anggaran')
            ->groupBy('tahun_anggaran')
            ->orderByDesc('tahun_anggaran')
            ->pluck('jumlah', 'tahun_anggaran');

        $programNames = LpmProgram::withCount('proposals')
            ->orderByDesc('proposals_count')
            ->take(6)
            ->get()
            ->map(fn ($p) => ['nama' => $p->nama_program, 'jumlah' => $p->proposals_count]);

        $recent = LpmProposal::with(['program', 'ketua'])
            ->orderBy('updated_at', 'desc')
            ->take(8)
            ->get();

        return Inertia::render('Admin/Lpm/Dashboard', [
            'stats' => [
                'program' => LpmProgram::count(),
                'program_aktif' => LpmProgram::aktif()->count(),
                'proposal' => LpmProposal::count(),
                'menunggu_verifikasi' => $perStatus->get('submitted', 0) + $perStatus->get('under_admin_review', 0),
                'review_substansi' => $perStatus->get('under_substance_review', 0),
                'lulus' => $perStatus->get('passed', 0) + $perStatus->get('funded', 0) + $perStatus->get('contracted', 0),
                'kegiatan_berjalan' => $perStatus->get('ongoing', 0)
                    + $perStatus->get('progress_report', 0)
                    + $perStatus->get('final_report', 0)
                    + $perStatus->get('output_validation', 0),
                'selesai' => $perStatus->get('completed', 0),
                'dana_disetujui' => LpmContract::sum('dana_disetujui'),
                'laporan_menunggu' => LpmReport::where('status_validasi', 'menunggu')->count(),
                'luaran_menunggu' => LpmOutput::where('status_validasi', 'menunggu')->count(),
            ],
            'perStatus' => collect(LpmProposal::STATUSES)->map(fn ($label, $key) => [
                'label' => $label,
                'value' => $perStatus->get($key, 0),
            ])->values(),
            'perTahun' => $programTahun,
            'topPrograms' => $programNames,
            'recent' => $recent,
        ]);
    }
}