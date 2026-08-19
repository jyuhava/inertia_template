<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Krs;
use App\Models\PeriodeKrs;
use App\Models\Mahasiswa;
use App\Models\Prodi;
use Illuminate\Http\Request;
use Inertia\Inertia;

class KrsController extends Controller
{
    /**
     * Display KRS management untuk admin
     */
    public function index(Request $request)
    {
        $filters = $request->only(['search', 'prodi_id', 'status', 'periode_krs_id']);
        
        // Get periode KRS
        $periodeKrsList = PeriodeKrs::with(['tahunAjaran', 'semester'])
            ->orderBy('created_at', 'desc')
            ->get();
            
        // Get prodi list
        $prodis = Prodi::orderBy('nama_prodi')->get();

        // Default ke periode aktif jika tidak ada filter
        $periodeAktif = PeriodeKrs::aktif()->first();
        $selectedPeriode = $filters['periode_krs_id'] ?? ($periodeAktif ? $periodeAktif->id : null);

        $query = Krs::with([
            'mahasiswa.prodi', 
            'mahasiswa.user',
            'jadwalKuliah.mataKuliah', 
            'jadwalKuliah.dosen',
            'periodeKrs.tahunAjaran',
            'periodeKrs.semester',
            'approvedBy'
        ]);

        // Filter berdasarkan periode
        if ($selectedPeriode) {
            $query->where('periode_krs_id', $selectedPeriode);
        }

        // Filter berdasarkan search (nama mahasiswa atau NIM)
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->whereHas('mahasiswa', function($q) use ($search) {
                $q->where('nama_lengkap', 'like', "%{$search}%")
                  ->orWhere('nim', 'like', "%{$search}%");
            });
        }

        // Filter berdasarkan prodi
        if (!empty($filters['prodi_id'])) {
            $query->whereHas('mahasiswa', function($q) use ($filters) {
                $q->where('prodi_id', $filters['prodi_id']);
            });
        }

        // Filter berdasarkan status
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        $krsData = $query->orderBy('created_at', 'desc')->paginate(20);

        // Statistik
        $stats = $this->getKrsStatistics($selectedPeriode);

        return Inertia::render('Admin/Krs/Index', [
            'krsData' => $krsData,
            'filters' => $filters,
            'periodeKrsList' => $periodeKrsList,
            'prodis' => $prodis,
            'selectedPeriode' => $selectedPeriode,
            'stats' => $stats
        ]);
    }

    /**
     * Approve KRS
     */
    public function approve(Request $request, Krs $krs)
    {
        $request->validate([
            'catatan_admin' => 'nullable|string|max:500'
        ]);

        $krs->update([
            'status' => 'disetujui',
            'catatan_admin' => $request->catatan_admin,
            'tanggal_approval' => now(),
            'approved_by' => auth()->id()
        ]);

        return back()->with('message', 'KRS berhasil disetujui.');
    }

    /**
     * Reject KRS
     */
    public function reject(Request $request, Krs $krs)
    {
        $request->validate([
            'catatan_admin' => 'required|string|max:500'
        ]);

        $krs->update([
            'status' => 'ditolak',
            'catatan_admin' => $request->catatan_admin,
            'tanggal_approval' => now(),
            'approved_by' => auth()->id()
        ]);

        return back()->with('message', 'KRS berhasil ditolak.');
    }

    /**
     * Bulk approve KRS
     */
    public function bulkApprove(Request $request)
    {
        $request->validate([
            'krs_ids' => 'required|array',
            'krs_ids.*' => 'exists:krs,id',
            'catatan_admin' => 'nullable|string|max:500'
        ]);

        Krs::whereIn('id', $request->krs_ids)
            ->where('status', 'menunggu_persetujuan')
            ->update([
                'status' => 'disetujui',
                'catatan_admin' => $request->catatan_admin,
                'tanggal_approval' => now(),
                'approved_by' => auth()->id()
            ]);

        $count = count($request->krs_ids);
        return back()->with('message', "{$count} KRS berhasil disetujui secara massal.");
    }

    /**
     * Bulk reject KRS
     */
    public function bulkReject(Request $request)
    {
        $request->validate([
            'krs_ids' => 'required|array',
            'krs_ids.*' => 'exists:krs,id',
            'catatan_admin' => 'required|string|max:500'
        ]);

        Krs::whereIn('id', $request->krs_ids)
            ->where('status', 'menunggu_persetujuan')
            ->update([
                'status' => 'ditolak',
                'catatan_admin' => $request->catatan_admin,
                'tanggal_approval' => now(),
                'approved_by' => auth()->id()
            ]);

        $count = count($request->krs_ids);
        return back()->with('message', "{$count} KRS berhasil ditolak secara massal.");
    }

    /**
     * Show detailed KRS for specific mahasiswa
     */
    public function show(Request $request, $mahasiswaId)
    {
        $mahasiswa = Mahasiswa::with(['prodi', 'user'])->findOrFail($mahasiswaId);
        
        $periodeId = $request->get('periode_krs_id');
        $periodeKrs = $periodeId ? PeriodeKrs::findOrFail($periodeId) : PeriodeKrs::aktif()->first();
        
        if (!$periodeKrs) {
            return back()->with('error', 'Tidak ada periode KRS yang aktif atau dipilih.');
        }

        $krsData = Krs::with([
            'jadwalKuliah.mataKuliah', 
            'jadwalKuliah.dosen',
            'approvedBy'
        ])
        ->where('mahasiswa_id', $mahasiswaId)
        ->where('periode_krs_id', $periodeKrs->id)
        ->get();

        $totalSks = $krsData->where('status', 'disetujui')
            ->sum(function($krs) {
                return $krs->jadwalKuliah->mataKuliah->sks ?? 0;
            });

        return Inertia::render('Admin/Krs/Show', [
            'mahasiswa' => $mahasiswa,
            'periodeKrs' => $periodeKrs->load(['tahunAjaran', 'semester']),
            'krsData' => $krsData,
            'totalSks' => $totalSks
        ]);
    }

    /**
     * Get KRS statistics
     */
    private function getKrsStatistics($periodeKrsId)
    {
        if (!$periodeKrsId) {
            return [
                'total' => 0,
                'menunggu_persetujuan' => 0,
                'disetujui' => 0,
                'ditolak' => 0,
                'dibatalkan' => 0
            ];
        }

        $baseQuery = Krs::where('periode_krs_id', $periodeKrsId);

        return [
            'total' => $baseQuery->count(),
            'menunggu_persetujuan' => (clone $baseQuery)->where('status', 'menunggu_persetujuan')->count(),
            'disetujui' => (clone $baseQuery)->where('status', 'disetujui')->count(),
            'ditolak' => (clone $baseQuery)->where('status', 'ditolak')->count(),
            'dibatalkan' => (clone $baseQuery)->where('status', 'dibatalkan')->count(),
        ];
    }
}
