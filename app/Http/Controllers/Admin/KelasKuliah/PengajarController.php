<?php

namespace App\Http\Controllers\Admin\KelasKuliah;

use App\Http\Controllers\Controller;
use App\Models\KelasKuliah;
use App\Models\KelasKuliahPengajar;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PengajarController extends Controller
{
    public function store(Request $request, KelasKuliah $kelasKuliah)
    {
        $data = $request->validate([
            'dosen_id' => [
                'required', 'exists:dosens,id',
                Rule::unique('kelas_kuliah_pengajars', 'dosen_id')->where('kelas_kuliah_id', $kelasKuliah->id),
            ],
            'peran' => 'required|in:utama,pendamping,asisten',
            'status' => 'required|in:aktif,nonaktif',
        ]);

        $kelasKuliah->pengajars()->create($data);

        return back()->with('success', 'Dosen pengajar berhasil ditambahkan ke kelas.');
    }

    public function destroy(KelasKuliah $kelasKuliah, KelasKuliahPengajar $pengajar)
    {
        abort_unless($pengajar->kelas_kuliah_id === $kelasKuliah->id, 404);
        $pengajar->delete();

        return back()->with('success', 'Dosen pengajar berhasil dihapus dari kelas.');
    }
}
