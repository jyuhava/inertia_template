<?php

namespace App\Http\Controllers\Admin\Mahasiswa;

use App\Http\Controllers\Controller;
use App\Models\Mahasiswa;
use App\Models\MahasiswaKebutuhanKhusus;
use Illuminate\Http\Request;

class KebutuhanKhususController extends Controller
{
    public function store(Request $request, Mahasiswa $mahasiswa)
    {
        $validated = $request->validate([
            'jenis_kebutuhan' => 'required|in:tuna_netra,tuna_rungu,tuna_daksa,tuna_grahita,kesulitan_belajar_spesifik,autis,lainnya',
            'keterangan' => 'nullable|string',
        ]);

        $mahasiswa->kebutuhanKhusus()->updateOrCreate(
            ['mahasiswa_id' => $mahasiswa->id, 'jenis_kebutuhan' => $validated['jenis_kebutuhan']],
            $validated
        );

        return back()->with('success', 'Kebutuhan khusus berhasil disimpan!');
    }

    public function destroy(Mahasiswa $mahasiswa, MahasiswaKebutuhanKhusus $kebutuhanKhusus)
    {
        abort_unless($kebutuhanKhusus->mahasiswa_id === $mahasiswa->id, 404);
        $kebutuhanKhusus->delete();

        return back()->with('success', 'Kebutuhan khusus berhasil dihapus!');
    }
}
