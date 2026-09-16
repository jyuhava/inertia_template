<?php

namespace App\Http\Controllers\Admin\Dosen;

use App\Http\Controllers\Controller;
use App\Models\Dosen;
use App\Models\DosenDokumen;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DokumenController extends Controller
{
    public function store(Request $request, Dosen $dosen)
    {
        $data = $request->validate(['jenis' => 'required|in:ktp,ijazah,sk_jabatan,sertifikat,other', 'nama_dokumen' => 'required|string|max:255', 'nomor_dokumen' => 'nullable|string|max:100', 'tanggal_dokumen' => 'nullable|date', 'file' => 'required|file|max:5120']);
        $data['file_path'] = $request->file('file')->store("dosen/{$dosen->id}/dokumen", 'public');
        unset($data['file']);
        $dosen->dokumens()->create($data);

        return back()->with('success', 'Dokumen berhasil diunggah.');
    }

    public function verify(Request $request, Dosen $dosen, DosenDokumen $dokumen)
    {
        abort_unless($dokumen->dosen_id === $dosen->id, 404);
        $data = $request->validate(['status_verifikasi' => 'required|in:approved,rejected']);
        $dokumen->update($data + ['verified_by' => $request->user()->id, 'verified_at' => now()]);

        return back()->with('success', 'Status dokumen diperbarui.');
    }

    public function download(Dosen $dosen, DosenDokumen $dokumen)
    {
        abort_unless($dokumen->dosen_id === $dosen->id, 404);

        return Storage::disk('public')->download($dokumen->file_path, $dokumen->nama_dokumen);
    }

    public function destroy(Dosen $dosen, DosenDokumen $dokumen)
    {
        abort_unless($dokumen->dosen_id === $dosen->id, 404);
        Storage::disk('public')->delete($dokumen->file_path);
        $dokumen->delete();

        return back()->with('success', 'Dokumen berhasil dihapus.');
    }
}
