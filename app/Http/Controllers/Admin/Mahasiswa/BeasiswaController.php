<?php

namespace App\Http\Controllers\Admin\Mahasiswa;

use App\Http\Controllers\Controller;
use App\Models\Mahasiswa;
use App\Models\MahasiswaBeasiswa;
use Illuminate\Http\Request;

class BeasiswaController extends Controller
{
    public function store(Request $request, Mahasiswa $mahasiswa)
    {
        $validated = $request->validate([
            'jenis_bantuan' => 'required|in:kip_kuliah,beasiswa_internal,beasiswa_eksternal,bantuan_pemerintah,lainnya',
            'nama_bantuan' => 'nullable|string|max:255',
            'nomor_bantuan' => 'nullable|string|max:100',
            'tanggal_mulai' => 'nullable|date',
            'tanggal_selesai' => 'nullable|date|after_or_equal:tanggal_mulai',
            'status' => 'required|in:aktif,selesai,dibatalkan',
            'keterangan' => 'nullable|string',
        ]);

        $mahasiswa->beasiswas()->create($validated);

        return back()->with('success', 'Beasiswa/bantuan berhasil ditambahkan!');
    }

    public function update(Request $request, Mahasiswa $mahasiswa, MahasiswaBeasiswa $beasiswa)
    {
        abort_unless($beasiswa->mahasiswa_id === $mahasiswa->id, 404);

        $validated = $request->validate([
            'jenis_bantuan' => 'required|in:kip_kuliah,beasiswa_internal,beasiswa_eksternal,bantuan_pemerintah,lainnya',
            'nama_bantuan' => 'nullable|string|max:255',
            'nomor_bantuan' => 'nullable|string|max:100',
            'tanggal_mulai' => 'nullable|date',
            'tanggal_selesai' => 'nullable|date|after_or_equal:tanggal_mulai',
            'status' => 'required|in:aktif,selesai,dibatalkan',
            'keterangan' => 'nullable|string',
        ]);

        $beasiswa->update($validated);

        return back()->with('success', 'Beasiswa/bantuan berhasil diperbarui!');
    }

    public function destroy(Mahasiswa $mahasiswa, MahasiswaBeasiswa $beasiswa)
    {
        abort_unless($beasiswa->mahasiswa_id === $mahasiswa->id, 404);
        $beasiswa->delete();

        return back()->with('success', 'Beasiswa/bantuan berhasil dihapus!');
    }
}
