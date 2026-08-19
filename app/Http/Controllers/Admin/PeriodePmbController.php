<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PeriodePmb;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PeriodePmbController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = PeriodePmb::withCount('calonMahasiswas')->orderBy('created_at', 'desc');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nama_periode', 'like', "%{$search}%")
                  ->orWhere('tahun_akademik', 'like', "%{$search}%")
                  ->orWhere('status', 'like', "%{$search}%");
            });
        }

        $periodePmb = $query->paginate(10)->withQueryString();

        return Inertia::render('Admin/PeriodePmb/Index', [
            'periodePmb' => $periodePmb,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Admin/PeriodePmb/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'nama_periode' => 'required|string|max:255',
            'tahun_akademik' => 'required|string|max:9',
            'tanggal_buka' => 'required|date',
            'tanggal_tutup' => 'required|date|after:tanggal_buka',
            'biaya_pendaftaran' => 'required|numeric|min:0',
            'kuota_total' => 'required|integer|min:1',
            'persyaratan' => 'nullable|string',
            'keterangan' => 'nullable|string',
        ]);

        PeriodePmb::create($request->all());

        return redirect()->route('admin.periode-pmb.index')
            ->with('success', 'Periode PMB berhasil ditambahkan!');
    }

    /**
     * Display the specified resource.
     */
    public function show(PeriodePmb $periodePmb)
    {
        $periodePmb->load('calonMahasiswas.prodiPilihan1');
        
        $statistik = [
            'total_pendaftar' => $periodePmb->calonMahasiswas()->count(),
            'draft' => $periodePmb->calonMahasiswas()->where('status_pendaftaran', 'draft')->count(),
            'submitted' => $periodePmb->calonMahasiswas()->where('status_pendaftaran', 'submitted')->count(),
            'verified' => $periodePmb->calonMahasiswas()->where('status_pendaftaran', 'verified')->count(),
            'accepted' => $periodePmb->calonMahasiswas()->where('status_pendaftaran', 'accepted')->count(),
            'rejected' => $periodePmb->calonMahasiswas()->where('status_pendaftaran', 'rejected')->count(),
            'paid' => $periodePmb->calonMahasiswas()->where('status_pembayaran', 'paid')->count(),
        ];

        return Inertia::render('Admin/PeriodePmb/Show', [
            'periodePmb' => $periodePmb,
            'statistik' => $statistik,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(PeriodePmb $periodePmb)
    {
        return Inertia::render('Admin/PeriodePmb/Edit', [
            'periodePmb' => $periodePmb,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, PeriodePmb $periodePmb)
    {
        $request->validate([
            'nama_periode' => 'required|string|max:255',
            'tahun_akademik' => 'required|string|max:9',
            'tanggal_buka' => 'required|date',
            'tanggal_tutup' => 'required|date|after:tanggal_buka',
            'biaya_pendaftaran' => 'required|numeric|min:0',
            'kuota_total' => 'required|integer|min:1',
            'persyaratan' => 'nullable|string',
            'keterangan' => 'nullable|string',
        ]);

        $periodePmb->update($request->all());

        return redirect()->route('admin.periode-pmb.index')
            ->with('success', 'Periode PMB berhasil diperbarui!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(PeriodePmb $periodePmb)
    {
        try {
            // Check if there are any registrations
            if ($periodePmb->calonMahasiswas()->count() > 0) {
                return back()->with('error', 'Tidak dapat menghapus periode PMB yang sudah memiliki pendaftar!');
            }

            $periodePmb->delete();

            return redirect()->route('admin.periode-pmb.index')
                ->with('success', 'Periode PMB berhasil dihapus!');
        } catch (\Exception $e) {
            return back()->with('error', 'Gagal menghapus periode PMB!');
        }
    }

    /**
     * Activate periode PMB
     */
    public function activate(PeriodePmb $periodePmb)
    {
        // Deactivate all other periods first
        PeriodePmb::where('id', '!=', $periodePmb->id)->update(['status' => 'nonaktif']);
        
        // Activate this period
        $periodePmb->update(['status' => 'aktif']);

        return back()->with('success', 'Periode PMB berhasil diaktifkan!');
    }

    /**
     * Deactivate periode PMB
     */
    public function deactivate(PeriodePmb $periodePmb)
    {
        $periodePmb->update(['status' => 'nonaktif']);

        return back()->with('success', 'Periode PMB berhasil dinonaktifkan!');
    }
}
