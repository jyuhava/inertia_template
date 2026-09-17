<?php

namespace App\Http\Controllers\Admin\Mahasiswa;

use App\Http\Controllers\Controller;
use App\Models\Mahasiswa;
use App\Models\MahasiswaRiwayatPendidikan;
use Illuminate\Http\Request;

class RiwayatPendidikanController extends Controller
{
    public function store(Request $request, Mahasiswa $mahasiswa)
    {
        $validated = $request->validate([
            'jenjang_pendidikan' => 'required|in:SMA,SMK,MA,D1,D2,D3,lainnya',
            'nama_institusi' => 'required|string|max:255',
            'npsn' => 'nullable|string|max:20',
            'program_jurusan' => 'nullable|string|max:255',
            'tanggal_mulai' => 'nullable|date',
            'tanggal_selesai' => 'nullable|date',
            'tanggal_lulus' => 'nullable|date',
            'nomor_ijazah' => 'nullable|string|max:100',
            'nisn' => 'nullable|string|max:20',
        ]);

        $mahasiswa->riwayatPendidikans()->create($validated);

        return back()->with('success', 'Riwayat pendidikan berhasil ditambahkan!');
    }

    public function destroy(Mahasiswa $mahasiswa, MahasiswaRiwayatPendidikan $riwayatPendidikan)
    {
        abort_unless($riwayatPendidikan->mahasiswa_id === $mahasiswa->id, 404);
        $riwayatPendidikan->delete();

        return back()->with('success', 'Riwayat pendidikan berhasil dihapus!');
    }
}
