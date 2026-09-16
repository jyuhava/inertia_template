<?php

namespace App\Http\Controllers\Admin\Mahasiswa;

use App\Http\Controllers\Controller;
use App\Models\Mahasiswa;
use App\Models\MahasiswaKontak;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class KontakController extends Controller
{
    public function store(Request $request, Mahasiswa $mahasiswa)
    {
        $validated = $request->validate([
            'jenis' => 'required|in:email,hp,telepon,whatsapp,darurat',
            'nilai' => 'required|string|max:255',
            'nama_kontak' => 'nullable|string|max:255',
            'is_primary' => 'nullable|boolean',
        ]);
        $validated['is_primary'] = $request->boolean('is_primary');

        DB::transaction(function () use ($mahasiswa, $validated) {
            if ($validated['is_primary']) {
                $mahasiswa->kontaks()->where('jenis', $validated['jenis'])->update(['is_primary' => false]);
            }
            $mahasiswa->kontaks()->create($validated);
        });

        return back()->with('success', 'Kontak berhasil ditambahkan!');
    }

    public function destroy(Mahasiswa $mahasiswa, MahasiswaKontak $kontak)
    {
        abort_unless($kontak->mahasiswa_id === $mahasiswa->id, 404);
        $kontak->delete();

        return back()->with('success', 'Kontak berhasil dihapus!');
    }
}
