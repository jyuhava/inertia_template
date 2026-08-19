<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Dosen;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class DosenController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Dosen::with('user')->orderBy('created_at', 'desc');

        // Search functionality
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nip', 'like', "%{$search}%")
                  ->orWhere('nama_lengkap', 'like', "%{$search}%")
                  ->orWhere('bidang_keahlian', 'like', "%{$search}%")
                  ->orWhere('jabatan_akademik', 'like', "%{$search}%");
            });
        }

        $dosens = $query->paginate(10)->withQueryString();

        return Inertia::render('Admin/Dosen/Index', [
            'dosens' => $dosens,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Admin/Dosen/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'nip' => 'required|string|max:20|unique:dosens,nip',
            'nama_lengkap' => 'required|string|max:255',
            'jenis_kelamin' => 'required|in:L,P',
            'tempat_lahir' => 'required|string|max:255',
            'tanggal_lahir' => 'required|date',
            'alamat' => 'required|string',
            'no_hp' => 'required|string|max:15',
            'pendidikan_terakhir' => 'required|string|max:255',
            'bidang_keahlian' => 'required|string|max:255',
            'jabatan_akademik' => 'nullable|in:Asisten Ahli,Lektor,Lektor Kepala,Profesor',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
        ]);

        // Create user first
        $user = User::create([
            'name' => $request->nama_lengkap,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'dosen',
            'email_verified_at' => now(),
        ]);

        // Create dosen record
        Dosen::create([
            'user_id' => $user->id,
            'nip' => $request->nip,
            'nama_lengkap' => $request->nama_lengkap,
            'jenis_kelamin' => $request->jenis_kelamin,
            'tempat_lahir' => $request->tempat_lahir,
            'tanggal_lahir' => $request->tanggal_lahir,
            'alamat' => $request->alamat,
            'no_hp' => $request->no_hp,
            'pendidikan_terakhir' => $request->pendidikan_terakhir,
            'bidang_keahlian' => $request->bidang_keahlian,
            'jabatan_akademik' => $request->jabatan_akademik,
            'status' => 'aktif',
        ]);

        return redirect()->route('admin.dosen.index')
            ->with('success', 'Dosen berhasil ditambahkan!');
    }

    /**
     * Display the specified resource.
     */
    public function show(Dosen $dosen)
    {
        $dosen->load('user');
        
        return Inertia::render('Admin/Dosen/Show', [
            'dosen' => $dosen,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Dosen $dosen)
    {
        $dosen->load('user');
        
        return Inertia::render('Admin/Dosen/Edit', [
            'dosen' => $dosen,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Dosen $dosen)
    {
        $request->validate([
            'nip' => ['required', 'string', 'max:20', Rule::unique('dosens')->ignore($dosen->id)],
            'nama_lengkap' => 'required|string|max:255',
            'jenis_kelamin' => 'required|in:L,P',
            'tempat_lahir' => 'required|string|max:255',
            'tanggal_lahir' => 'required|date',
            'alamat' => 'required|string',
            'no_hp' => 'required|string|max:15',
            'pendidikan_terakhir' => 'required|string|max:255',
            'bidang_keahlian' => 'required|string|max:255',
            'jabatan_akademik' => 'nullable|in:Asisten Ahli,Lektor,Lektor Kepala,Profesor',
            'status' => 'required|in:aktif,nonaktif,pensiun',
            'email' => ['required', 'email', Rule::unique('users')->ignore($dosen->user_id)],
        ]);

        // Update user
        $dosen->user->update([
            'name' => $request->nama_lengkap,
            'email' => $request->email,
        ]);

        // Update dosen
        $dosen->update([
            'nip' => $request->nip,
            'nama_lengkap' => $request->nama_lengkap,
            'jenis_kelamin' => $request->jenis_kelamin,
            'tempat_lahir' => $request->tempat_lahir,
            'tanggal_lahir' => $request->tanggal_lahir,
            'alamat' => $request->alamat,
            'no_hp' => $request->no_hp,
            'pendidikan_terakhir' => $request->pendidikan_terakhir,
            'bidang_keahlian' => $request->bidang_keahlian,
            'jabatan_akademik' => $request->jabatan_akademik,
            'status' => $request->status,
        ]);

        return redirect()->route('admin.dosen.index')
            ->with('success', 'Data dosen berhasil diperbarui!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Dosen $dosen)
    {
        // Check if dosen has related jadwal kuliah
        if ($dosen->jadwalKuliahs()->count() > 0) {
            return redirect()->route('admin.dosen.index')
                ->with('error', 'Dosen tidak dapat dihapus karena masih memiliki jadwal kuliah yang aktif!');
        }

        // Check if dosen has other related data (if any)
        // You can add more checks here for other relationships

        try {
            // Delete user (this will cascade delete dosen due to foreign key)
            $dosen->user->delete();

            return redirect()->route('admin.dosen.index')
                ->with('success', 'Dosen berhasil dihapus!');
        } catch (\Exception $e) {
            return redirect()->route('admin.dosen.index')
                ->with('error', 'Dosen tidak dapat dihapus karena masih memiliki data terkait!');
        }
    }

    /**
     * Reset password dosen
     */
    public function resetPassword(Request $request, Dosen $dosen)
    {
        $request->validate([
            'password' => 'required|string|min:8|confirmed',
        ]);

        // Update password user
        $dosen->user->update([
            'password' => Hash::make($request->password),
        ]);

        return redirect()->back()
            ->with('success', 'Password dosen berhasil direset!');
    }
}
