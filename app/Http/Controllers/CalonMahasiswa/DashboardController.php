<?php

namespace App\Http\Controllers\CalonMahasiswa;

use App\Http\Controllers\Controller;
use App\Models\CalonMahasiswa;
use App\Models\DokumenPmb;
use App\Models\UploadDokumenPmb;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class DashboardController extends Controller
{
    /**
     * Show calon mahasiswa dashboard
     */
    public function index()
    {
        $user = auth()->user();
        $calonMahasiswa = CalonMahasiswa::where('user_id', $user->id)
            ->with(['periodePmb', 'prodiPilihan1', 'prodiPilihan2', 'dokumenUploads.dokumenPmb'])
            ->first();

        if (!$calonMahasiswa) {
            return redirect()->route('pmb.index')
                ->with('error', 'Data calon mahasiswa tidak ditemukan.');
        }

        // Get required documents
        $dokumenRequired = DokumenPmb::aktif()->wajib()->ordered()->get();
        $dokumenOptional = DokumenPmb::aktif()->where('wajib', false)->ordered()->get();

        // Check document completion
        $uploadedDocs = $calonMahasiswa->dokumenUploads->keyBy('dokumen_pmb_id');
        $completedDocs = 0;
        $totalRequiredDocs = $dokumenRequired->count();

        foreach ($dokumenRequired as $doc) {
            if (isset($uploadedDocs[$doc->id])) {
                $completedDocs++;
            }
        }

        $progress = $totalRequiredDocs > 0 ? ($completedDocs / $totalRequiredDocs) * 100 : 0;

        // Append accessors to make them available in frontend
        $calonMahasiswa->append(['is_editable', 'can_upload_dokumen']);
        
        // Add status badges and file size attributes to uploaded docs
        $uploadedDocs = $uploadedDocs->map(function ($upload) {
            $upload->append(['status_badge', 'file_size_mb']);
            return $upload;
        });

        return Inertia::render('CalonMahasiswa/Dashboard', [
            'calonMahasiswa' => $calonMahasiswa,
            'dokumenRequired' => $dokumenRequired->map(function($dokumen) {
                // Add max_size_mb attribute for easier frontend usage
                $dokumen->max_size_mb = $dokumen->max_size_kb / 1024;
                return $dokumen;
            }),
            'dokumenOptional' => $dokumenOptional->map(function($dokumen) {
                // Add max_size_mb attribute for easier frontend usage 
                $dokumen->max_size_mb = $dokumen->max_size_kb / 1024;
                return $dokumen;
            }),
            'uploadedDocs' => $uploadedDocs,
            'progress' => round($progress, 1),
            'canSubmit' => $completedDocs === $totalRequiredDocs && $calonMahasiswa->status_pendaftaran === 'draft',
        ]);
    }

    /**
     * Update profile data
     */
    public function updateProfile(Request $request)
    {
        $user = auth()->user();
        $calonMahasiswa = CalonMahasiswa::where('user_id', $user->id)->firstOrFail();

        // Only allow editing if status is draft or submitted
        if (!$calonMahasiswa->isEditable()) {
            return back()->with('error', 'Data tidak dapat diubah karena sudah dalam proses verifikasi.');
        }

        $request->validate([
            // Data Pribadi
            'nama_lengkap' => 'required|string|max:255',
            'jenis_kelamin' => 'required|in:L,P',
            'tempat_lahir' => 'required|string|max:255',
            'tanggal_lahir' => 'required|date',
            'agama' => 'required|string|max:50',
            'alamat' => 'required|string',
            'no_hp' => 'required|string|max:15',
            
            // Data Orang Tua
            'nama_ayah' => 'required|string|max:255',
            'pekerjaan_ayah' => 'required|string|max:255',
            'nama_ibu' => 'required|string|max:255',
            'pekerjaan_ibu' => 'required|string|max:255',
            'no_hp_ortu' => 'required|string|max:15',
            'alamat_ortu' => 'nullable|string',
            
            // Data Pendidikan
            'asal_sekolah' => 'required|string|max:255',
            'tahun_lulus' => 'required|string|size:4',
            'jurusan_sekolah' => 'nullable|string|max:255',
            'nilai_rata_rata' => 'nullable|numeric|between:0,100',
        ]);

        $calonMahasiswa->update($request->all());

        return back()->with('success', 'Data profil berhasil diperbarui!');
    }

    /**
     * Upload document
     */
    public function uploadDokumen(Request $request)
    {
        $user = auth()->user();
        $calonMahasiswa = CalonMahasiswa::where('user_id', $user->id)->firstOrFail();

        if (!$calonMahasiswa->canUploadDokumen()) {
            return back()->with('error', 'Upload dokumen tidak diizinkan pada status saat ini.');
        }

        $request->validate([
            'dokumen_pmb_id' => 'required|exists:dokumen_pmb,id',
            'file' => 'required|file|max:10240', // Max 10MB
        ]);

        $dokumenPmb = DokumenPmb::findOrFail($request->dokumen_pmb_id);
        $file = $request->file('file');

        // Validate file type
        $extension = $file->getClientOriginalExtension();
        if (!$dokumenPmb->isValidFileType($extension)) {
            return back()->with('error', 'Jenis file tidak diizinkan untuk dokumen ini.');
        }

        // Validate file size
        if ($file->getSize() > ($dokumenPmb->max_size_kb * 1024)) {
            return back()->with('error', "Ukuran file terlalu besar. Maksimal {$dokumenPmb->max_size_mb} MB.");
        }

        try {
            // Delete existing upload if any
            $existingUpload = UploadDokumenPmb::where('calon_mahasiswa_id', $calonMahasiswa->id)
                ->where('dokumen_pmb_id', $dokumenPmb->id)
                ->first();

            if ($existingUpload) {
                $existingUpload->deleteFile();
                $existingUpload->delete();
            }

            // Store new file
            $fileName = $calonMahasiswa->no_pendaftaran . '_' . $dokumenPmb->kode_dokumen . '_' . time() . '.' . $extension;
            $filePath = $file->storeAs('pmb/dokumen/' . $calonMahasiswa->no_pendaftaran, $fileName, 'public');

            // Create upload record
            UploadDokumenPmb::create([
                'calon_mahasiswa_id' => $calonMahasiswa->id,
                'dokumen_pmb_id' => $dokumenPmb->id,
                'file_path' => $filePath,
                'original_name' => $file->getClientOriginalName(),
                'file_size' => $file->getSize(),
                'tanggal_upload' => now(),
                'status_verifikasi' => 'pending',
            ]);

            return back()->with('success', 'Dokumen berhasil diupload!');

        } catch (\Exception $e) {
            return back()->with('error', 'Gagal mengupload dokumen: ' . $e->getMessage());
        }
    }

    /**
     * Delete uploaded document
     */
    public function deleteDokumen(UploadDokumenPmb $uploadDokumen)
    {
        $user = auth()->user();
        $calonMahasiswa = CalonMahasiswa::where('user_id', $user->id)->firstOrFail();

        if ($uploadDokumen->calon_mahasiswa_id !== $calonMahasiswa->id) {
            return back()->with('error', 'Unauthorized.');
        }

        if (!$calonMahasiswa->canUploadDokumen()) {
            return back()->with('error', 'Dokumen tidak dapat dihapus pada status saat ini.');
        }

        try {
            $uploadDokumen->deleteFile();
            $uploadDokumen->delete();

            return back()->with('success', 'Dokumen berhasil dihapus!');
        } catch (\Exception $e) {
            return back()->with('error', 'Gagal menghapus dokumen: ' . $e->getMessage());
        }
    }

    /**
     * Submit application
     */
    public function submit()
    {
        $user = auth()->user();
        $calonMahasiswa = CalonMahasiswa::where('user_id', $user->id)->firstOrFail();

        if ($calonMahasiswa->status_pendaftaran !== 'draft') {
            return back()->with('error', 'Pendaftaran sudah disubmit atau sedang diproses.');
        }

        // Check if all required documents are uploaded
        $dokumenRequired = DokumenPmb::aktif()->wajib()->count();
        $dokumenUploaded = $calonMahasiswa->dokumenUploads()->count();

        if ($dokumenUploaded < $dokumenRequired) {
            return back()->with('error', 'Harap upload semua dokumen yang diperlukan terlebih dahulu.');
        }

        $calonMahasiswa->update([
            'status_pendaftaran' => 'submitted',
            'status_berkas' => 'complete',
        ]);

        return back()->with('success', 'Pendaftaran berhasil disubmit! Silakan tunggu proses verifikasi.');
    }

    /**
     * Download uploaded document
     */
    public function downloadDokumen(UploadDokumenPmb $uploadDokumen)
    {
        $user = auth()->user();
        $calonMahasiswa = CalonMahasiswa::where('user_id', $user->id)->firstOrFail();

        if ($uploadDokumen->calon_mahasiswa_id !== $calonMahasiswa->id) {
            return back()->with('error', 'Unauthorized.');
        }

        if (!Storage::disk('public')->exists($uploadDokumen->file_path)) {
            return back()->with('error', 'File tidak ditemukan.');
        }

        return Storage::disk('public')->download($uploadDokumen->file_path, $uploadDokumen->original_name);
    }
}
