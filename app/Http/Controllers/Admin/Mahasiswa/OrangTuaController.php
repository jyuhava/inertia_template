<?php

namespace App\Http\Controllers\Admin\Mahasiswa;

use App\Http\Controllers\Controller;
use App\Models\Mahasiswa;
use Illuminate\Http\Request;

class OrangTuaController extends Controller
{
    public function store(Request $request, Mahasiswa $mahasiswa)
    {
        $validated = $request->validate([
            'jenis' => 'required|in:ayah,ibu,wali',
            'nama' => 'required|string|max:255',
            'nik' => 'nullable|string|max:20',
            'tanggal_lahir' => 'nullable|date',
            'pendidikan' => 'nullable|string|max:100',
            'pekerjaan' => 'nullable|string|max:100',
            'penghasilan' => 'nullable|string|max:100',
            'kebutuhan_khusus' => 'nullable|string|max:255',
            'no_hp' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'alamat' => 'nullable|string',
        ]);

        $mahasiswa->orangTuas()->updateOrCreate(
            ['mahasiswa_id' => $mahasiswa->id, 'jenis' => $validated['jenis']],
            $validated
        );

        return back()->with('success', 'Data orang tua/wali berhasil disimpan!');
    }
}
