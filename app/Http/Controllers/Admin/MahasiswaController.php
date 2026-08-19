<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Mahasiswa;
use App\Models\Prodi;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class MahasiswaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Mahasiswa::with(['user', 'prodi'])->orderBy('created_at', 'desc');

        // Search functionality
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nim', 'like', "%{$search}%")
                  ->orWhere('nama_lengkap', 'like', "%{$search}%")
                  ->orWhere('program_studi', 'like', "%{$search}%")
                  ->orWhereHas('prodi', function ($prodiQuery) use ($search) {
                      $prodiQuery->where('nama_prodi', 'like', "%{$search}%")
                                 ->orWhere('kode_prodi', 'like', "%{$search}%");
                  });
            });
        }

        $mahasiswas = $query->paginate(10)->withQueryString();
        
        // Get total count for info
        $totalMahasiswa = Mahasiswa::count();
        $filteredCount = $query->getQuery()->count();

        return Inertia::render('Admin/Mahasiswa/Index', [
            'mahasiswas' => $mahasiswas,
            'filters' => $request->only(['search']),
            'totalMahasiswa' => $totalMahasiswa,
            'filteredCount' => $filteredCount,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $prodis = Prodi::where('status', 'aktif')->orderBy('nama_prodi')->get();
        
        return Inertia::render('Admin/Mahasiswa/Create', [
            'prodis' => $prodis,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'nim' => 'required|string|max:20|unique:mahasiswas,nim',
            'nama_lengkap' => 'required|string|max:255',
            'jenis_kelamin' => 'required|in:L,P',
            'tempat_lahir' => 'required|string|max:255',
            'tanggal_lahir' => 'required|date',
            'alamat' => 'required|string',
            'no_hp' => 'required|string|max:15',
            'prodi_id' => 'required|exists:prodis,id',
            'program_studi' => 'nullable|string|max:255', // Keep for backward compatibility
            'angkatan' => 'required|string|max:10',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
        ]);

        // Create user first
        $user = User::create([
            'name' => $request->nama_lengkap,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'mahasiswa',
            'email_verified_at' => now(),
        ]);

        // Create mahasiswa record
        $mahasiswa = Mahasiswa::create([
            'user_id' => $user->id,
            'nim' => $request->nim,
            'nama_lengkap' => $request->nama_lengkap,
            'jenis_kelamin' => $request->jenis_kelamin,
            'tempat_lahir' => $request->tempat_lahir,
            'tanggal_lahir' => $request->tanggal_lahir,
            'alamat' => $request->alamat,
            'no_hp' => $request->no_hp,
            'prodi_id' => $request->prodi_id,
            'program_studi' => $request->program_studi, // Keep for backward compatibility
            'angkatan' => $request->angkatan,
            'status' => 'aktif',
        ]);

        return redirect()->route('admin.mahasiswa.index')
            ->with('success', 'Mahasiswa berhasil ditambahkan!');
    }

    /**
     * Display the specified resource.
     */
    public function show(Mahasiswa $mahasiswa)
    {
        $mahasiswa->load(['user', 'prodi']);
        
        return Inertia::render('Admin/Mahasiswa/Show', [
            'mahasiswa' => $mahasiswa,
            'hasUploadedKomitmen' => $mahasiswa->hasUploadedKomitmen(),
            'komitmenUrl' => $mahasiswa->getKomitmenUrl(),
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Mahasiswa $mahasiswa)
    {
        $mahasiswa->load(['user', 'prodi']);
        $prodis = Prodi::where('status', 'aktif')->orderBy('nama_prodi')->get();
        
        return Inertia::render('Admin/Mahasiswa/Edit', [
            'mahasiswa' => $mahasiswa,
            'prodis' => $prodis,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Mahasiswa $mahasiswa)
    {
        $request->validate([
            'nim' => ['required', 'string', 'max:20', Rule::unique('mahasiswas')->ignore($mahasiswa->id)],
            'nama_lengkap' => 'required|string|max:255',
            'jenis_kelamin' => 'required|in:L,P',
            'tempat_lahir' => 'required|string|max:255',
            'tanggal_lahir' => 'required|date',
            'alamat' => 'required|string',
            'no_hp' => 'required|string|max:15',
            'prodi_id' => 'required|exists:prodis,id',
            'program_studi' => 'nullable|string|max:255', // Keep for backward compatibility
            'angkatan' => 'required|string|max:10',
            'status' => 'required|in:aktif,nonaktif,lulus',
            'email' => ['required', 'email', Rule::unique('users')->ignore($mahasiswa->user_id)],
        ]);

        // Update user
        $mahasiswa->user->update([
            'name' => $request->nama_lengkap,
            'email' => $request->email,
        ]);

        // Update mahasiswa
        $mahasiswa->update([
            'nim' => $request->nim,
            'nama_lengkap' => $request->nama_lengkap,
            'jenis_kelamin' => $request->jenis_kelamin,
            'tempat_lahir' => $request->tempat_lahir,
            'tanggal_lahir' => $request->tanggal_lahir,
            'alamat' => $request->alamat,
            'no_hp' => $request->no_hp,
            'prodi_id' => $request->prodi_id,
            'program_studi' => $request->program_studi, // Keep for backward compatibility
            'angkatan' => $request->angkatan,
            'status' => $request->status,
        ]);

        return redirect()->route('admin.mahasiswa.index')
            ->with('success', 'Data mahasiswa berhasil diperbarui!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Mahasiswa $mahasiswa)
    {
        // Delete user (this will cascade delete mahasiswa due to foreign key)
        $mahasiswa->user->delete();

        return redirect()->route('admin.mahasiswa.index')
            ->with('success', 'Mahasiswa berhasil dihapus!');
    }

    /**
     * Export all mahasiswa to CSV
     */
    public function export(Request $request)
    {
        $query = Mahasiswa::with(['user', 'prodi'])->orderBy('nim');

        // Apply search filter if exists
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nim', 'like', "%{$search}%")
                  ->orWhere('nama_lengkap', 'like', "%{$search}%")
                  ->orWhere('program_studi', 'like', "%{$search}%")
                  ->orWhereHas('prodi', function ($prodiQuery) use ($search) {
                      $prodiQuery->where('nama_prodi', 'like', "%{$search}%")
                                 ->orWhere('kode_prodi', 'like', "%{$search}%");
                  });
            });
        }

        $mahasiswas = $query->get();

        $fileName = 'data_mahasiswa_' . date('Y-m-d_H-i-s') . '.csv';
        
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $fileName . '"',
        ];

        $callback = function() use ($mahasiswas) {
            $file = fopen('php://output', 'w');
            
            // Add BOM for Excel compatibility
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));
            
            // CSV header
            fputcsv($file, [
                'NIM',
                'Nama Lengkap',
                'Jenis Kelamin',
                'No KTP',
                'Tempat Lahir',
                'Tanggal Lahir',
                'Alamat',
                'No HP',
                'Email',
                'Program Studi',
                'Kode Prodi',
                'Angkatan',
                'Status',
                'Surat Komitmen',
                'Tanggal Upload Komitmen',
                'Tanggal Dibuat'
            ]);

            // Data rows
            foreach ($mahasiswas as $mahasiswa) {
                fputcsv($file, [
                    $mahasiswa->nim,
                    $mahasiswa->nama_lengkap,
                    $mahasiswa->jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan',
                    $mahasiswa->no_ktp ?? '',
                    $mahasiswa->tempat_lahir,
                    $mahasiswa->tanggal_lahir ? $mahasiswa->tanggal_lahir->format('Y-m-d') : '',
                    $mahasiswa->alamat,
                    $mahasiswa->no_hp,
                    $mahasiswa->user->email,
                    $mahasiswa->prodi ? $mahasiswa->prodi->nama_prodi : $mahasiswa->program_studi,
                    $mahasiswa->prodi ? $mahasiswa->prodi->kode_prodi : '',
                    $mahasiswa->angkatan,
                    ucfirst($mahasiswa->status),
                    $mahasiswa->surat_komitmen ? 'Sudah Upload' : 'Belum Upload',
                    $mahasiswa->komitmen_uploaded_at ? $mahasiswa->komitmen_uploaded_at->format('Y-m-d H:i:s') : '',
                    $mahasiswa->created_at->format('Y-m-d H:i:s')
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Reset password mahasiswa
     */
    public function resetPassword(Request $request, Mahasiswa $mahasiswa)
    {
        $request->validate([
            'password' => 'required|string|min:8|confirmed',
        ]);

        // Update password user
        $mahasiswa->user->update([
            'password' => Hash::make($request->password),
        ]);

        return redirect()->back()
            ->with('success', 'Password mahasiswa berhasil direset!');
    }
}
