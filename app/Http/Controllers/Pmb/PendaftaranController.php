<?php

namespace App\Http\Controllers\Pmb;

use App\Http\Controllers\Controller;
use App\Models\PeriodePmb;
use App\Models\CalonMahasiswa;
use App\Models\Prodi;
use App\Models\User;
use App\Models\DokumenPmb;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class PendaftaranController extends Controller
{
    /**
     * Show PMB landing page
     */
    public function index()
    {
        $periodePmb = PeriodePmb::berlangsung()->first();
        $prodis = Prodi::where('status', 'aktif')->orderBy('nama_prodi')->get();

        return Inertia::render('Pmb/Index', [
            'periodePmb' => $periodePmb,
            'prodis' => $prodis,
        ]);
    }

    /**
     * Show registration form
     */
    public function create()
    {
        \Log::info('=== PMB Create method called ===');
        \Log::info('Request URL: ' . request()->fullUrl());
        \Log::info('Request method: ' . request()->method());
        \Log::info('User agent: ' . request()->userAgent());
        
        // Debug: Check all PMB periods
        $allPeriods = PeriodePmb::all();
        \Log::info('All PMB periods in database: ' . $allPeriods->count());
        foreach($allPeriods as $period) {
            \Log::info("Period: {$period->nama_periode}, Status: {$period->status}, Tanggal: {$period->tanggal_buka} - {$period->tanggal_tutup}");
        }
        
        $periodePmb = PeriodePmb::berlangsung()->first();
        \Log::info('Active PMB period found: ' . ($periodePmb ? $periodePmb->nama_periode : 'None'));
        
        if (!$periodePmb) {
            \Log::warning('No active PMB period found, redirecting to index');
            return redirect()->route('pmb.index')
                ->with('error', 'Tidak ada periode PMB yang aktif saat ini.');
        }

        $prodis = Prodi::where('status', 'aktif')->orderBy('nama_prodi')->get();
        \Log::info('Active prodis count: ' . $prodis->count());

        \Log::info('Rendering Pmb/Register page');
        return Inertia::render('Pmb/Register', [
            'periodePmb' => $periodePmb,
            'prodis' => $prodis,
        ]);
    }

    /**
     * Store registration
     */
    public function store(Request $request)
    {
        \Log::info('=== PMB Store method called ===');
        \Log::info('Request data:', $request->all());
        
        $periodePmb = PeriodePmb::berlangsung()->first();
        \Log::info('Active PMB period for store: ' . ($periodePmb ? $periodePmb->nama_periode : 'None'));
        
        if (!$periodePmb) {
            \Log::warning('No active PMB period found in store method');
            return back()->with('error', 'Tidak ada periode PMB yang aktif saat ini.');
        }

        // Check kuota
        if ($periodePmb->calonMahasiswas()->count() >= $periodePmb->kuota_total) {
            return back()->with('error', 'Kuota pendaftaran sudah penuh.');
        }



        Log::info('=== Starting validation ===');
        
        // Validasi request
        $validatedData = $request->validate([
            // Data Pribadi
            'nama_lengkap' => 'required|string|max:255',
            'nik' => 'required|string|size:16|unique:calon_mahasiswas,nik',
            'jenis_kelamin' => 'required|in:L,P',
            'tempat_lahir' => 'required|string|max:255',
            'tanggal_lahir' => 'required|date',
            'agama' => 'required|string|max:50',
            'alamat' => 'required|string',
            'no_hp' => 'required|string|max:15',
            'email' => 'required|email|unique:calon_mahasiswas,email|unique:users,email',
            
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
            
            // Pilihan Prodi
            'prodi_pilihan_1' => 'required|exists:prodis,id',
            'prodi_pilihan_2' => 'nullable|different:prodi_pilihan_1|exists:prodis,id',
            
            // Account
            'password' => 'required|string|min:8|confirmed',
        ]);

        Log::info('Validation passed, validated data keys: ' . json_encode(array_keys($validatedData)));
        
        try {
            Log::info('=== Validation passed, starting database operations ===');
            
            // Generate nomor pendaftaran
            $noPendaftaran = $this->generateNoPendaftaran($periodePmb);
            Log::info('Generated no_pendaftaran: ' . $noPendaftaran);

            // Create user account
            Log::info('=== Creating user account ===');
            $user = User::create([
                'name' => $request->nama_lengkap,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => 'calon_mahasiswa',
                'email_verified_at' => now(),
            ]);
            Log::info('User created with ID: ' . $user->id);

            // Create calon mahasiswa
            Log::info('=== Creating calon mahasiswa ===');
            $calonMahasiswa = CalonMahasiswa::create([
                'no_pendaftaran' => $noPendaftaran,
                'periode_pmb_id' => $periodePmb->id,
                'user_id' => $user->id,
                'prodi_pilihan_1' => $request->prodi_pilihan_1,
                'prodi_pilihan_2' => $request->prodi_pilihan_2,
                'nama_lengkap' => $request->nama_lengkap,
                'nik' => $request->nik,
                'jenis_kelamin' => $request->jenis_kelamin,
                'tempat_lahir' => $request->tempat_lahir,
                'tanggal_lahir' => $request->tanggal_lahir,
                'agama' => $request->agama,
                'alamat' => $request->alamat,
                'no_hp' => $request->no_hp,
                'email' => $request->email,
                'nama_ayah' => $request->nama_ayah,
                'pekerjaan_ayah' => $request->pekerjaan_ayah,
                'nama_ibu' => $request->nama_ibu,
                'pekerjaan_ibu' => $request->pekerjaan_ibu,
                'no_hp_ortu' => $request->no_hp_ortu,
                'alamat_ortu' => $request->alamat_ortu,
                'asal_sekolah' => $request->asal_sekolah,
                'tahun_lulus' => $request->tahun_lulus,
                'jurusan_sekolah' => $request->jurusan_sekolah,
                'nilai_rata_rata' => $request->nilai_rata_rata,
                'tanggal_daftar' => now(),
                'status_pendaftaran' => 'draft',
            ]);
            Log::info('Calon mahasiswa created with ID: ' . $calonMahasiswa->id);

            // Auto login
            Log::info('=== Auto login user ===');
            Auth::login($user);
            Log::info('User logged in successfully');

            Log::info('=== Redirecting to dashboard ===');
            return redirect()->route('calon-mahasiswa.dashboard')
                ->with('success', 'Pendaftaran berhasil! Silakan lengkapi data dan upload dokumen.');

        } catch (\Exception $e) {
            Log::error('=== Error in PMB store ===');
            Log::error('Error message: ' . $e->getMessage());
            Log::error('Error trace: ' . $e->getTraceAsString());
            return back()->with('error', 'Gagal melakukan pendaftaran: ' . $e->getMessage());
        }
    }

    /**
     * Check registration status
     */
    public function checkStatus(Request $request)
    {
        $request->validate([
            'no_pendaftaran' => 'required|string',
            'nik' => 'required|string',
        ]);

        $calonMahasiswa = CalonMahasiswa::where('no_pendaftaran', $request->no_pendaftaran)
            ->where('nik', $request->nik)
            ->with(['periodePmb', 'prodiPilihan1', 'prodiPilihan2'])
            ->first();

        if (!$calonMahasiswa) {
            return back()->with('error', 'Data pendaftaran tidak ditemukan.');
        }

        return Inertia::render('Pmb/Status', [
            'calonMahasiswa' => $calonMahasiswa,
        ]);
    }

    /**
     * Show check status form
     */
    public function showStatusForm()
    {
        return Inertia::render('Pmb/CheckStatus');
    }

    /**
     * Generate nomor pendaftaran
     */
    private function generateNoPendaftaran($periodePmb)
    {
        $tahun = date('Y');
        $urutan = CalonMahasiswa::where('periode_pmb_id', $periodePmb->id)->count() + 1;
        
        return sprintf('PMB%s%04d', $tahun, $urutan);
    }
}
