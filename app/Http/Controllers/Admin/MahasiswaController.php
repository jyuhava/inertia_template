<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Mahasiswa;
use App\Models\MahasiswaRegistrasi;
use App\Models\MahasiswaStatusHistory;
use App\Models\Prodi;
use App\Models\TahunAjaran;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
        $query = Mahasiswa::with(['user', 'prodi', 'statusTerbaru', 'pddiktiMapping'])
            ->withoutTrashed();

        // Search functionality (nama/NIM)
        if ($request->filled('search')) {
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

        // Filter program studi
        if ($request->filled('prodi_id')) {
            $query->where('prodi_id', $request->prodi_id);
        }

        // Filter periode/angkatan
        if ($request->filled('angkatan')) {
            $query->where('angkatan', $request->angkatan);
        }

        // Filter status mahasiswa
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter jenis kelamin
        if ($request->filled('jenis_kelamin')) {
            $query->where('jenis_kelamin', $request->jenis_kelamin);
        }

        // Filter status PDDikti
        if ($request->filled('status_pddikti')) {
            $statusPddikti = $request->status_pddikti;
            $query->whereHas('pddiktiMapping', function ($q) use ($statusPddikti) {
                $q->where('status_mapping', $statusPddikti);
            });
            if ($statusPddikti === 'unmapped') {
                $query->orWhereDoesntHave('pddiktiMapping');
            }
        }

        // Sorting
        $sortBy = in_array($request->get('sort_by'), ['nim', 'nama_lengkap', 'angkatan', 'created_at'])
            ? $request->get('sort_by')
            : 'created_at';
        $sortDir = $request->get('sort_dir') === 'asc' ? 'asc' : 'desc';
        $query->reorder($sortBy, $sortDir);

        $mahasiswas = $query->paginate(10)->withQueryString();
        $mahasiswas->through(function ($m) {
            if (!$m->relationLoaded('user') || !$m->user) {
                $m->setRelation('user', new User(['name' => $m->nama_lengkap ?? '-', 'email' => '-']));
            } elseif (empty($m->user->email)) {
                $m->user->email = '-';
            }
            return $m;
        });

        $totalMahasiswa = Mahasiswa::count();
        $filteredCount = $query->getQuery()->count();

        return Inertia::render('Admin/Mahasiswa/Index', [
            'mahasiswas' => $mahasiswas,
            'filters' => $request->only(['search', 'prodi_id', 'angkatan', 'status', 'jenis_kelamin', 'status_pddikti', 'sort_by', 'sort_dir']),
            'totalMahasiswa' => $totalMahasiswa,
            'filteredCount' => $filteredCount,
            'prodis' => Prodi::orderBy('nama_prodi')->get(['id', 'kode_prodi', 'nama_prodi']),
            'angkatanOptions' => Mahasiswa::select('angkatan')->distinct()->orderByDesc('angkatan')->pluck('angkatan'),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Admin/Mahasiswa/Create', [
            'prodis' => Prodi::where('status', 'aktif')->orderBy('nama_prodi')->get(),
            'tahunAjarans' => TahunAjaran::orderByDesc('tanggal_mulai')->get(['id', 'nama_tahun_ajaran']),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     *
     * Creates the User, Mahasiswa, initial Registrasi, and initial status
     * history entry inside a single transaction so a failure never leaves
     * half-created student data behind.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nim' => 'required|string|max:20|unique:mahasiswas,nim',
            'nama_lengkap' => 'required|string|max:255',
            'jenis_kelamin' => 'required|in:L,P',
            'tempat_lahir' => 'required|string|max:255',
            'tanggal_lahir' => 'required|date',
            'agama' => 'nullable|string|max:50',
            'kewarganegaraan' => 'nullable|string|max:50',
            'no_ktp' => 'nullable|string|max:20|unique:mahasiswas,no_ktp',
            'nisn' => 'nullable|string|max:20',
            'npwp' => 'nullable|string|max:25',
            'alamat' => 'required|string',
            'no_hp' => 'required|string|max:15',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'prodi_id' => 'required|exists:prodis,id',
            'angkatan' => 'required|string|max:10',
            // Registrasi
            'periode_masuk' => 'required|string|max:20',
            'tanggal_masuk' => 'required|date',
            'jenis_pendaftaran' => 'required|in:reguler,transfer,pindahan',
            'jalur_masuk' => 'nullable|string|max:100',
            'asal_mahasiswa' => 'required|in:baru,pindahan,transfer',
            'pt_asal' => 'nullable|string|max:255',
            'prodi_asal_id' => 'nullable|exists:prodis,id',
        ]);

        $mahasiswa = DB::transaction(function () use ($validated, $request) {
            $user = User::create([
                'name' => $validated['nama_lengkap'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role' => 'mahasiswa',
                'email_verified_at' => now(),
            ]);

            $mahasiswa = Mahasiswa::create([
                'user_id' => $user->id,
                'nim' => $validated['nim'],
                'no_ktp' => $validated['no_ktp'] ?? null,
                'nisn' => $validated['nisn'] ?? null,
                'npwp' => $validated['npwp'] ?? null,
                'nama_lengkap' => $validated['nama_lengkap'],
                'jenis_kelamin' => $validated['jenis_kelamin'],
                'tempat_lahir' => $validated['tempat_lahir'],
                'tanggal_lahir' => $validated['tanggal_lahir'],
                'agama' => $validated['agama'] ?? null,
                'kewarganegaraan' => $validated['kewarganegaraan'] ?? 'WNI',
                'alamat' => $validated['alamat'],
                'no_hp' => $validated['no_hp'],
                'email' => $validated['email'],
                'prodi_id' => $validated['prodi_id'],
                'program_studi' => Prodi::find($validated['prodi_id'])->nama_prodi ?? null,
                'angkatan' => $validated['angkatan'],
                'status' => 'aktif',
            ]);

            MahasiswaRegistrasi::create([
                'mahasiswa_id' => $mahasiswa->id,
                'prodi_id' => $validated['prodi_id'],
                'periode_masuk' => $validated['periode_masuk'],
                'tanggal_masuk' => $validated['tanggal_masuk'],
                'jenis_pendaftaran' => $validated['jenis_pendaftaran'],
                'jalur_masuk' => $validated['jalur_masuk'] ?? null,
                'status_awal' => 'aktif',
                'asal_mahasiswa' => $validated['asal_mahasiswa'],
                'pt_asal' => $validated['pt_asal'] ?? null,
                'prodi_asal_id' => $validated['prodi_asal_id'] ?? null,
            ]);

            MahasiswaStatusHistory::create([
                'mahasiswa_id' => $mahasiswa->id,
                'status' => 'aktif',
                'tanggal_berlaku' => $validated['tanggal_masuk'],
                'alasan' => 'Registrasi mahasiswa baru',
                'changed_by' => $request->user()?->id,
            ]);

            $mahasiswa->pddiktiMapping()->create([
                'status_mapping' => 'unmapped',
            ]);

            return $mahasiswa;
        });

        return redirect()->route('admin.mahasiswa.show', $mahasiswa)
            ->with('success', 'Mahasiswa berhasil ditambahkan!');
    }

    /**
     * Display the specified resource with all related sections for the tabs.
     */
    public function show(Mahasiswa $mahasiswa)
    {
        $mahasiswa->load([
            'user',
            'prodi',
            'registrasis.prodi',
            'registrasis.prodiAsal',
            'statusHistories.tahunAjaran',
            'statusHistories.changedBy',
            'alamats',
            'kontaks',
            'ayah',
            'ibu',
            'wali',
            'riwayatPendidikans',
            'kebutuhanKhusus',
            'beasiswas',
            'dokumens.verifiedBy',
            'pddiktiMapping',
            'pddiktiSyncLogs',
        ]);

        if (!$mahasiswa->user) {
            $mahasiswa->setRelation('user', new User(['name' => $mahasiswa->nama_lengkap ?? '-', 'email' => '-']));
        }

        return Inertia::render('Admin/Mahasiswa/Show', [
            'mahasiswa' => $mahasiswa,
            'hasUploadedKomitmen' => $mahasiswa->hasUploadedKomitmen(),
            'komitmenUrl' => $mahasiswa->getKomitmenUrl(),
            'prodis' => Prodi::where('status', 'aktif')->orderBy('nama_prodi')->get(),
            'tahunAjarans' => TahunAjaran::orderByDesc('tanggal_mulai')->get(['id', 'nama_tahun_ajaran']),
        ]);
    }

    /**
     * Show the form for editing the specified resource (biodata only).
     */
    public function edit(Mahasiswa $mahasiswa)
    {
        $mahasiswa->load(['user', 'prodi']);
        if (!$mahasiswa->user) {
            $mahasiswa->setRelation('user', new User(['name' => $mahasiswa->nama_lengkap ?? '-', 'email' => '-']));
        }

        return Inertia::render('Admin/Mahasiswa/Edit', [
            'mahasiswa' => $mahasiswa,
            'prodis' => Prodi::where('status', 'aktif')->orderBy('nama_prodi')->get(),
        ]);
    }

    /**
     * Update the specified resource in storage (biodata section).
     */
    public function update(Request $request, Mahasiswa $mahasiswa)
    {
        $request->validate([
            'nim' => ['required', 'string', 'max:20', Rule::unique('mahasiswas')->ignore($mahasiswa->id)],
            'nama_lengkap' => 'required|string|max:255',
            'jenis_kelamin' => 'required|in:L,P',
            'tempat_lahir' => 'required|string|max:255',
            'tanggal_lahir' => 'required|date',
            'agama' => 'nullable|string|max:50',
            'kewarganegaraan' => 'nullable|string|max:50',
            'no_ktp' => ['nullable', 'string', 'max:20', Rule::unique('mahasiswas', 'no_ktp')->ignore($mahasiswa->id)],
            'nisn' => 'nullable|string|max:20',
            'npwp' => 'nullable|string|max:25',
            'alamat' => 'required|string',
            'no_hp' => 'required|string|max:15',
            'prodi_id' => 'required|exists:prodis,id',
            'angkatan' => 'required|string|max:10',
            'status' => 'required|in:aktif,cuti,nonaktif,lulus,dropout,mengundurkan_diri,pindah,dikeluarkan',
            'email' => ['required', 'email', Rule::unique('users')->ignore($mahasiswa->user_id)],
        ]);

        if ($mahasiswa->user) {
            $mahasiswa->user->update([
                'name' => $request->nama_lengkap,
                'email' => $request->email,
            ]);
        }

        $mahasiswa->update([
            'nim' => $request->nim,
            'no_ktp' => $request->no_ktp,
            'nisn' => $request->nisn,
            'npwp' => $request->npwp,
            'nama_lengkap' => $request->nama_lengkap,
            'jenis_kelamin' => $request->jenis_kelamin,
            'tempat_lahir' => $request->tempat_lahir,
            'tanggal_lahir' => $request->tanggal_lahir,
            'agama' => $request->agama,
            'kewarganegaraan' => $request->kewarganegaraan ?: 'WNI',
            'alamat' => $request->alamat,
            'no_hp' => $request->no_hp,
            'email' => $request->email,
            'prodi_id' => $request->prodi_id,
            'program_studi' => Prodi::find($request->prodi_id)->nama_prodi ?? $mahasiswa->program_studi,
            'angkatan' => $request->angkatan,
            'status' => $request->status,
        ]);

        return redirect()->route('admin.mahasiswa.show', $mahasiswa)
            ->with('success', 'Data mahasiswa berhasil diperbarui!');
    }

    /**
     * Soft delete the specified resource.
     */
    public function destroy(Mahasiswa $mahasiswa)
    {
        $mahasiswa->delete();

        return redirect()->route('admin.mahasiswa.index')
            ->with('success', 'Mahasiswa berhasil dihapus. Data masih dapat dipulihkan.');
    }

    /**
     * Restore a soft-deleted mahasiswa.
     */
    public function restore($id)
    {
        $mahasiswa = Mahasiswa::onlyTrashed()->findOrFail($id);
        $mahasiswa->restore();

        return redirect()->route('admin.mahasiswa.index')
            ->with('success', 'Mahasiswa berhasil dipulihkan!');
    }

    /**
     * Export mahasiswa data as CSV.
     */
    public function export(Request $request)
    {
        $query = Mahasiswa::with(['user', 'prodi', 'pddiktiMapping']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nim', 'like', "%{$search}%")
                  ->orWhere('nama_lengkap', 'like', "%{$search}%");
            });
        }

        $mahasiswas = $query->orderBy('nim')->get();

        $fileName = 'data_mahasiswa_' . date('Y-m-d_H-i-s') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $fileName . '"',
        ];

        $callback = function () use ($mahasiswas) {
            $file = fopen('php://output', 'w');
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));

            fputcsv($file, [
                'NIM', 'Nama Lengkap', 'Jenis Kelamin', 'No KTP/NIK', 'NISN', 'Tempat Lahir',
                'Tanggal Lahir', 'Agama', 'Kewarganegaraan', 'Alamat', 'No HP', 'Email',
                'Program Studi', 'Kode Prodi', 'Angkatan', 'Status', 'Status PDDikti', 'Tanggal Dibuat',
            ]);

            foreach ($mahasiswas as $mahasiswa) {
                fputcsv($file, [
                    $mahasiswa->nim,
                    $mahasiswa->nama_lengkap,
                    $mahasiswa->jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan',
                    $mahasiswa->no_ktp ?? '',
                    $mahasiswa->nisn ?? '',
                    $mahasiswa->tempat_lahir,
                    $mahasiswa->tanggal_lahir ? $mahasiswa->tanggal_lahir->format('Y-m-d') : '',
                    $mahasiswa->agama ?? '',
                    $mahasiswa->kewarganegaraan ?? '',
                    $mahasiswa->alamat,
                    $mahasiswa->no_hp,
                    $mahasiswa->email ?? ($mahasiswa->user->email ?? ''),
                    $mahasiswa->prodi ? $mahasiswa->prodi->nama_prodi : $mahasiswa->program_studi,
                    $mahasiswa->prodi ? $mahasiswa->prodi->kode_prodi : '',
                    $mahasiswa->angkatan,
                    ucfirst($mahasiswa->status),
                    $mahasiswa->pddiktiMapping->status_display ?? 'Belum Terhubung',
                    $mahasiswa->created_at->format('Y-m-d H:i:s'),
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Reset password mahasiswa.
     */
    public function resetPassword(Request $request, Mahasiswa $mahasiswa)
    {
        $request->validate([
            'password' => 'required|string|min:8|confirmed',
        ]);

        if (!$mahasiswa->user) {
            return redirect()->back()->with('error', 'Akun user untuk mahasiswa ini tidak ditemukan!');
        }

        $mahasiswa->user->update([
            'password' => Hash::make($request->password),
        ]);

        return redirect()->back()
            ->with('success', 'Password mahasiswa berhasil direset!');
    }
}
