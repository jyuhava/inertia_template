<?php

namespace App\Http\Controllers\Admin\Mahasiswa;

use App\Http\Controllers\Controller;
use App\Models\Mahasiswa;
use App\Models\MahasiswaAlamat;
use Illuminate\Http\Request;

class AlamatController extends Controller
{
    public function store(Request $request, Mahasiswa $mahasiswa)
    {
        $validated = $request->validate([
            'jenis' => 'required|in:ktp,domisili',
            'jalan' => 'nullable|string|max:255',
            'dusun' => 'nullable|string|max:255',
            'rt' => 'nullable|string|max:5',
            'rw' => 'nullable|string|max:5',
            'kelurahan' => 'nullable|string|max:255',
            'kecamatan' => 'nullable|string|max:255',
            'kabupaten_kota' => 'nullable|string|max:255',
            'provinsi' => 'nullable|string|max:255',
            'kode_pos' => 'nullable|string|max:10',
        ]);

        MahasiswaAlamat::updateOrCreate(
            ['mahasiswa_id' => $mahasiswa->id, 'jenis' => $validated['jenis']],
            $validated
        );

        return back()->with('success', 'Alamat berhasil disimpan!');
    }

    public function destroy(Mahasiswa $mahasiswa, MahasiswaAlamat $alamat)
    {
        abort_unless($alamat->mahasiswa_id === $mahasiswa->id, 404);
        $alamat->delete();

        return back()->with('success', 'Alamat berhasil dihapus!');
    }
}
