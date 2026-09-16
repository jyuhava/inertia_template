<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CalonMahasiswa;
use App\Models\PeriodePmb;
use App\Models\Prodi;
use App\Models\User;
use App\Models\Mahasiswa;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class CalonMahasiswaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = CalonMahasiswa::with(['periodePmb', 'prodiPilihan1', 'prodiPilihan2', 'user'])
            ->orderBy('created_at', 'desc');

        // Filter by periode PMB
        if ($request->has('periode_pmb_id') && $request->periode_pmb_id) {
            $query->where('periode_pmb_id', $request->periode_pmb_id);
        }

        // Filter by status pendaftaran 
        if ($request->has('status') && $request->status) {
            $query->where('status_pendaftaran', $request->status);
        }

        // Filter by prodi
        if ($request->has('prodi_id') && $request->prodi_id) {
            $query->where('prodi_pilihan_1', $request->prodi_id);
        }

        // Search functionality
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('no_pendaftaran', 'like', "%{$search}%")
                  ->orWhere('nama_lengkap', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('nik', 'like', "%{$search}%");
            });
        }

        $calonMahasiswas = $query->paginate(15)->withQueryString();

        // Get filter options
        $periodePmbList = PeriodePmb::orderBy('created_at', 'desc')->get(['id', 'nama_periode']);
        $prodis = Prodi::where('status', 'aktif')->orderBy('nama_prodi')->get(['id', 'nama_prodi']);

        $statistik = [
            'total' => CalonMahasiswa::count(),
            'draft' => CalonMahasiswa::where('status_pendaftaran', 'draft')->count(),
            'submitted' => CalonMahasiswa::where('status_pendaftaran', 'submitted')->count(),
            'verified' => CalonMahasiswa::where('status_pendaftaran', 'verified')->count(),
            'accepted' => CalonMahasiswa::where('status_pendaftaran', 'accepted')->count(),
            'rejected' => CalonMahasiswa::where('status_pendaftaran', 'rejected')->count(),
        ];

        // Convert to array to safely add stats and fix null links
        $calonMahasiswaData = $calonMahasiswas->toArray();
        $calonMahasiswaData['stats'] = $statistik;
        
        // Fix null URLs in pagination links to prevent Inertia Link component crash
        if (isset($calonMahasiswaData['links'])) {
            foreach ($calonMahasiswaData['links'] as &$link) {
                if ($link['url'] === null) {
                    $link['url'] = '';
                }
            }
        }
        
        if (array_key_exists('prev_page_url', $calonMahasiswaData) && $calonMahasiswaData['prev_page_url'] === null) {
            $calonMahasiswaData['prev_page_url'] = '';
        }
        if (array_key_exists('next_page_url', $calonMahasiswaData) && $calonMahasiswaData['next_page_url'] === null) {
            $calonMahasiswaData['next_page_url'] = '';
        }

        return Inertia::render('Admin/CalonMahasiswa/Index', [
            'calonMahasiswa' => $calonMahasiswaData,
            'periodePmbList' => $periodePmbList,
            'prodis' => $prodis,
            'filters' => $request->only(['search', 'periode_pmb_id', 'status', 'prodi_id']),
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show(CalonMahasiswa $calonMahasiswa)
    {
        $calonMahasiswa->load([
            'periodePmb',
            'prodiPilihan1',
            'prodiPilihan2',
            'user',
            'verifiedBy',
            'dokumenUploads.dokumenPmb'
        ]);

        // Append computed attributes
        $calonMahasiswa->append(['converted_to_mahasiswa']);

        // Get total required documents
        $totalDokumenWajib = \App\Models\DokumenPmb::where('wajib', true)->where('aktif', true)->count();
        $dokumenUploadedWajib = $calonMahasiswa->dokumenUploads->filter(function($upload) {
            return $upload->dokumenPmb->wajib;
        })->count();

        return Inertia::render('Admin/CalonMahasiswa/Show', [
            'calonMahasiswa' => $calonMahasiswa,
            'dokumenUploads' => $calonMahasiswa->dokumenUploads,
            'totalDokumenWajib' => $totalDokumenWajib,
            'dokumenUploadedWajib' => $dokumenUploadedWajib,
        ]);
    }

    /**
     * Update verification status
     */
    public function updateStatus(Request $request, CalonMahasiswa $calonMahasiswa)
    {
        $request->validate([
            'status_pendaftaran' => 'required|in:draft,submitted,verified,accepted,rejected',
            'catatan_admin' => 'nullable|string',
        ]);

        $data = [
            'status_pendaftaran' => $request->status_pendaftaran,
            'catatan_admin' => $request->catatan_admin,
        ];

        if (in_array($request->status_pendaftaran, ['verified', 'accepted', 'rejected'])) {
            $data['tanggal_verifikasi'] = now();
            $data['verified_by'] = auth()->id();
        }

        $calonMahasiswa->update($data);

        return back()->with('success', 'Status pendaftaran berhasil diperbarui!');
    }

    /**
     * Convert calon mahasiswa to mahasiswa
     */
    public function convertToMahasiswa(Request $request, CalonMahasiswa $calonMahasiswa)
    {
        // Whatever the status, allow conversion
        $prodiId = $request->prodi_id 
            ?: ($calonMahasiswa->prodi_pilihan_1 
                ?: ($calonMahasiswa->prodi_pilihan_2 
                    ?: (Prodi::where('status', 'aktif')->value('id') ?? 1)));

        $angkatan = $request->angkatan ?: (string) now()->year;

        $nim = $request->nim ?: $this->generateNim($prodiId, $angkatan);

        // Ensure NIM uniqueness
        if (Mahasiswa::where('nim', $nim)->exists()) {
            $nim = $this->generateNim($prodiId, $angkatan);
        }

        $prodi = Prodi::find($prodiId);

        try {
            DB::beginTransaction();

            // 1. Create or update user account
            $user = $calonMahasiswa->user;
            $email = $calonMahasiswa->email ?: "{$nim}@student.alwafi.ac.id";

            if (!$user) {
                // Check if user with this email already exists
                $user = User::where('email', $email)->first();
                if (!$user) {
                    $user = User::create([
                        'name' => $calonMahasiswa->nama_lengkap,
                        'email' => $email,
                        'password' => Hash::make('password123'), // Default password
                        'role' => 'mahasiswa',
                        'email_verified_at' => now(),
                    ]);
                } else {
                    $user->update(['role' => 'mahasiswa']);
                }
                $calonMahasiswa->update(['user_id' => $user->id]);
            } else {
                $user->update(['role' => 'mahasiswa']);
            }

            // 2. Check if mahasiswa record already exists for this user
            $mahasiswa = Mahasiswa::where('user_id', $user->id)->first();
            if (!$mahasiswa) {
                $mahasiswa = Mahasiswa::create([
                    'user_id' => $user->id,
                    'nim' => $nim,
                    'nama_lengkap' => $calonMahasiswa->nama_lengkap,
                    'jenis_kelamin' => $calonMahasiswa->jenis_kelamin ?? 'L',
                    'tempat_lahir' => $calonMahasiswa->tempat_lahir ?? '-',
                    'tanggal_lahir' => $calonMahasiswa->tanggal_lahir ?? now()->subYears(18)->format('Y-m-d'),
                    'alamat' => $calonMahasiswa->alamat ?? '-',
                    'no_hp' => $calonMahasiswa->no_hp ?? '-',
                    'prodi_id' => $prodiId,
                    'program_studi' => $prodi?->nama_prodi ?? 'Pendidikan Agama Islam',
                    'angkatan' => $angkatan,
                    'status' => 'aktif',
                ]);
            } else {
                $mahasiswa->update([
                    'prodi_id' => $prodiId,
                    'program_studi' => $prodi?->nama_prodi ?? $mahasiswa->program_studi,
                    'angkatan' => $angkatan,
                    'status' => 'aktif',
                ]);
            }

            // 3. Mark calon mahasiswa as accepted & verified
            $calonMahasiswa->update([
                'status_pendaftaran' => 'accepted',
                'tanggal_verifikasi' => $calonMahasiswa->tanggal_verifikasi ?? now(),
                'verified_by' => $calonMahasiswa->verified_by ?? auth()->id(),
            ]);

            DB::commit();

            return back()->with('success', "Calon mahasiswa berhasil dikonversi menjadi mahasiswa dengan NIM {$mahasiswa->nim}!");
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Gagal mengkonversi calon mahasiswa: ' . $e->getMessage());
        }
    }

    /**
     * Helper to auto-generate unique NIM
     */
    private function generateNim($prodiId, $angkatan)
    {
        $prodi = Prodi::find($prodiId);
        $prodiCode = $prodi ? str_pad($prodi->id, 3, '0', STR_PAD_LEFT) : '001';
        $prefix = $angkatan . $prodiCode;
        
        $lastMahasiswa = Mahasiswa::where('nim', 'like', "{$prefix}%")
            ->orderBy('nim', 'desc')
            ->first();
            
        if ($lastMahasiswa) {
            $lastSequence = (int) substr($lastMahasiswa->nim, -3);
            $newSequence = $lastSequence + 1;
        } else {
            $newSequence = 1;
        }
        
        $nim = $prefix . str_pad($newSequence, 3, '0', STR_PAD_LEFT);
        
        while (Mahasiswa::where('nim', $nim)->exists()) {
            $newSequence++;
            $nim = $prefix . str_pad($newSequence, 3, '0', STR_PAD_LEFT);
        }
        
        return $nim;
    }

    /**
     * Bulk update status
     */
    public function bulkUpdateStatus(Request $request)
    {
        $request->validate([
            'calon_mahasiswa_ids' => 'required|array',
            'calon_mahasiswa_ids.*' => 'exists:calon_mahasiswas,id',
            'status_pendaftaran' => 'required|in:verified,accepted,rejected',
            'catatan_admin' => 'nullable|string',
        ]);

        $data = [
            'status_pendaftaran' => $request->status_pendaftaran,
            'catatan_admin' => $request->catatan_admin,
            'tanggal_verifikasi' => now(),
            'verified_by' => auth()->id(),
        ];

        $updated = CalonMahasiswa::whereIn('id', $request->calon_mahasiswa_ids)
            ->update($data);

        return back()->with('success', "Berhasil memperbarui status {$updated} calon mahasiswa!");
    }

    /**
     * Export calon mahasiswa data
     */
    public function export(Request $request)
    {
        $query = CalonMahasiswa::with(['periodePmb', 'prodiPilihan1', 'prodiPilihan2']);

        // Apply same filters as index
        if ($request->has('periode_pmb_id') && $request->periode_pmb_id) {
            $query->where('periode_pmb_id', $request->periode_pmb_id);
        }

        if ($request->has('status_pendaftaran') && $request->status_pendaftaran) {
            $query->where('status_pendaftaran', $request->status_pendaftaran);
        }

        $calonMahasiswas = $query->orderBy('created_at', 'desc')->get();

        $fileName = 'calon_mahasiswa_' . date('Y-m-d_H-i-s') . '.csv';
        
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $fileName . '"',
        ];

        $callback = function() use ($calonMahasiswas) {
            $file = fopen('php://output', 'w');
            
            // Header CSV
            fputcsv($file, [
                'No Pendaftaran', 'Nama Lengkap', 'NIK', 'Email', 'No HP',
                'Periode PMB', 'Prodi Pilihan 1', 'Prodi Pilihan 2',
                'Status Pendaftaran', 'Status Pembayaran', 'Status Berkas',
                'Asal Sekolah', 'Tahun Lulus', 'Nilai Rata-rata',
                'Tanggal Daftar'
            ]);

            // Data
            foreach ($calonMahasiswas as $calon) {
                fputcsv($file, [
                    $calon->no_pendaftaran,
                    $calon->nama_lengkap,
                    $calon->nik,
                    $calon->email,
                    $calon->no_hp,
                    $calon->periodePmb->nama_periode ?? '',
                    $calon->prodiPilihan1->nama_prodi ?? '',
                    $calon->prodiPilihan2->nama_prodi ?? '',
                    ucfirst($calon->status_pendaftaran),
                    ucfirst($calon->status_pembayaran),
                    ucfirst($calon->status_berkas),
                    $calon->asal_sekolah,
                    $calon->tahun_lulus,
                    $calon->nilai_rata_rata,
                    $calon->tanggal_daftar ? $calon->tanggal_daftar->format('Y-m-d H:i:s') : '',
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Download uploaded document
     */
    public function downloadDokumen($uploadId)
    {
        $uploadDokumen = \App\Models\UploadDokumenPmb::findOrFail($uploadId);
        
        if (!Storage::disk('public')->exists($uploadDokumen->file_path)) {
            return back()->with('error', 'File tidak ditemukan.');
        }

        return Storage::disk('public')->download($uploadDokumen->file_path, $uploadDokumen->original_name);
    }
}
