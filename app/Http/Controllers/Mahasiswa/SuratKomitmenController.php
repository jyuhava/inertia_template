<?php

namespace App\Http\Controllers\Mahasiswa;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class SuratKomitmenController extends Controller
{
    public function index()
    {
        $mahasiswa = auth()->user()->mahasiswa;
        
        return Inertia::render('Mahasiswa/SuratKomitmen/Index', [
            'mahasiswa' => $mahasiswa,
            'hasUploaded' => $mahasiswa->hasUploadedKomitmen(),
            'komitmenUrl' => $mahasiswa->getKomitmenUrl(),
        ]);
    }

    public function download()
    {
        $filePath = public_path('komitmen.pdf');
        
        if (!file_exists($filePath)) {
            return back()->with('error', 'File surat komitmen tidak ditemukan.');
        }

        return response()->download($filePath, 'Surat_Komitmen_Mahasiswa.pdf');
    }

    public function upload(Request $request)
    {
        $request->validate([
            'surat_komitmen' => 'required|file|mimes:pdf|max:2048',
        ]);

        $mahasiswa = auth()->user()->mahasiswa;
        
        // Create directory if not exists
        $uploadPath = public_path('uploads/komitmen');
        if (!file_exists($uploadPath)) {
            mkdir($uploadPath, 0755, true);
        }
        
        // Delete old file if exists
        if ($mahasiswa->surat_komitmen) {
            $oldFile = public_path('uploads/komitmen/' . $mahasiswa->surat_komitmen);
            if (file_exists($oldFile)) {
                unlink($oldFile);
            }
        }

        // Store new file
        $fileName = $mahasiswa->nim . '_' . time() . '.pdf';
        $request->file('surat_komitmen')->move($uploadPath, $fileName);

        // Update mahasiswa record
        $mahasiswa->update([
            'surat_komitmen' => $fileName,
            'komitmen_uploaded_at' => now(),
        ]);

        return back()->with('success', 'Surat komitmen berhasil diupload!');
    }

    public function delete()
    {
        $mahasiswa = auth()->user()->mahasiswa;
        
        if ($mahasiswa->surat_komitmen) {
            $file = public_path('uploads/komitmen/' . $mahasiswa->surat_komitmen);
            if (file_exists($file)) {
                unlink($file);
            }
            
            $mahasiswa->update([
                'surat_komitmen' => null,
                'komitmen_uploaded_at' => null,
            ]);
        }

        return back()->with('success', 'Surat komitmen berhasil dihapus!');
    }
}
