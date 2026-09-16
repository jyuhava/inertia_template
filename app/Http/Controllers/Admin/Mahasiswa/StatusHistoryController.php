<?php

namespace App\Http\Controllers\Admin\Mahasiswa;

use App\Http\Controllers\Controller;
use App\Models\Mahasiswa;
use App\Models\MahasiswaStatusHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StatusHistoryController extends Controller
{
    /**
     * Record a new status change. Updates the master status on Mahasiswa as
     * well so list/filter views stay consistent with the latest history entry.
     */
    public function store(Request $request, Mahasiswa $mahasiswa)
    {
        $validated = $request->validate([
            'status' => 'required|in:aktif,cuti,nonaktif,lulus,dropout,mengundurkan_diri,pindah,dikeluarkan',
            'tanggal_berlaku' => 'required|date',
            'tahun_ajaran_id' => 'nullable|exists:tahun_ajarans,id',
            'alasan' => 'nullable|string|max:255',
            'keterangan' => 'nullable|string',
            'dokumen_pendukung' => 'nullable|file|max:5120',
        ]);

        DB::transaction(function () use ($request, $mahasiswa, $validated) {
            if ($request->hasFile('dokumen_pendukung')) {
                $validated['dokumen_pendukung'] = $request->file('dokumen_pendukung')
                    ->store('mahasiswa/status-history', 'public');
            }

            MahasiswaStatusHistory::create([
                ...$validated,
                'mahasiswa_id' => $mahasiswa->id,
                'changed_by' => $request->user()?->id,
            ]);

            $mahasiswa->update(['status' => $validated['status']]);
        });

        return back()->with('success', 'Riwayat status mahasiswa berhasil dicatat!');
    }
}
