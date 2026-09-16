<?php

namespace App\Http\Controllers\Admin\Mahasiswa;

use App\Http\Controllers\Controller;
use App\Models\Mahasiswa;
use App\Models\MahasiswaDokumen;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DokumenController extends Controller
{
    public function store(Request $request, Mahasiswa $mahasiswa)
    {
        $validated = $request->validate([
            'jenis_dokumen' => 'required|in:ktp,kk,ijazah,skl,akta_kelahiran,pas_foto,kartu_kip,dokumen_transfer,surat_pernyataan,lainnya',
            'nomor_dokumen' => 'nullable|string|max:100',
            'file' => 'required|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'tanggal_terbit' => 'nullable|date',
            'tanggal_kedaluwarsa' => 'nullable|date|after_or_equal:tanggal_terbit',
        ]);

        $file = $request->file('file');
        $path = $file->store('mahasiswa/dokumen', 'public');

        $mahasiswa->dokumens()->create([
            'jenis_dokumen' => $validated['jenis_dokumen'],
            'nomor_dokumen' => $validated['nomor_dokumen'] ?? null,
            'file_path' => $path,
            'original_name' => $file->getClientOriginalName(),
            'tanggal_terbit' => $validated['tanggal_terbit'] ?? null,
            'tanggal_kedaluwarsa' => $validated['tanggal_kedaluwarsa'] ?? null,
            'status_verifikasi' => 'pending',
        ]);

        return back()->with('success', 'Dokumen berhasil diunggah!');
    }

    /**
     * Admin verifies or rejects an uploaded document.
     */
    public function verify(Request $request, Mahasiswa $mahasiswa, MahasiswaDokumen $dokumen)
    {
        abort_unless($dokumen->mahasiswa_id === $mahasiswa->id, 404);

        $validated = $request->validate([
            'status_verifikasi' => 'required|in:approved,rejected',
        ]);

        $dokumen->update([
            'status_verifikasi' => $validated['status_verifikasi'],
            'verified_by' => $request->user()?->id,
            'verified_at' => now(),
        ]);

        return back()->with('success', 'Status verifikasi dokumen berhasil diperbarui!');
    }

    public function destroy(Mahasiswa $mahasiswa, MahasiswaDokumen $dokumen)
    {
        abort_unless($dokumen->mahasiswa_id === $mahasiswa->id, 404);

        $dokumen->deleteFile();
        $dokumen->delete();

        return back()->with('success', 'Dokumen berhasil dihapus!');
    }

    public function download(Mahasiswa $mahasiswa, MahasiswaDokumen $dokumen)
    {
        abort_unless($dokumen->mahasiswa_id === $mahasiswa->id, 404);
        abort_unless(Storage::disk('public')->exists($dokumen->file_path), 404);

        return Storage::disk('public')->download($dokumen->file_path, $dokumen->original_name);
    }
}
