<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Dosen;
use App\Models\DosenHomebaseHistory;
use App\Models\DosenKepegawaian;
use App\Models\DosenStatusHistory;
use App\Models\PddiktiDosenMapping;
use App\Models\Prodi;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class DosenController extends Controller
{
    public function index(Request $request)
    {
        $query = Dosen::with(['user', 'homebaseAktif.prodi', 'pddiktiMapping'])->withoutTrashed();
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(fn ($q) => $q->where('nip', 'like', "%{$search}%")->orWhere('nidn', 'like', "%{$search}%")->orWhere('nama_lengkap', 'like', "%{$search}%")->orWhere('bidang_keahlian', 'like', "%{$search}%"));
        }
        foreach (['status', 'jenis_kelamin', 'status_kepegawaian'] as $filter) {
            if ($request->filled($filter)) {
                $query->where($filter, $request->$filter);
            }
        }
        if ($request->filled('prodi_id')) {
            $query->whereHas('homebaseAktif', fn ($q) => $q->where('prodi_id', $request->prodi_id));
        }
        if ($request->filled('status_pddikti')) {
            $query->where(function ($q) use ($request) {
                $q->whereHas('pddiktiMapping', fn ($mapping) => $mapping->where('status_mapping', $request->status_pddikti));
                if ($request->status_pddikti === 'unmapped') {
                    $q->orWhereDoesntHave('pddiktiMapping');
                }
            });
        }
        $sortBy = in_array($request->get('sort_by'), ['nip', 'nama_lengkap', 'nidn', 'created_at']) ? $request->get('sort_by') : 'created_at';
        $dosens = $query->reorder($sortBy, $request->get('sort_dir') === 'asc' ? 'asc' : 'desc')->paginate(10)->withQueryString();

        return Inertia::render('Admin/Dosen/Index', [
            'dosens' => $dosens,
            'filters' => $request->only(['search', 'status', 'jenis_kelamin', 'status_kepegawaian', 'prodi_id', 'status_pddikti', 'sort_by', 'sort_dir']),
            'prodis' => Prodi::where('status', 'aktif')->orderBy('nama_prodi')->get(['id', 'kode_prodi', 'nama_prodi']),
            'statistics' => ['total' => Dosen::count(), 'aktif' => Dosen::where('status', 'aktif')->count(), 'tetap' => DosenKepegawaian::where('status_dosen', 'tetap')->count(), 'tanpa_pddikti' => Dosen::doesntHave('pddiktiMapping')->count()],
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Dosen/Create', ['prodis' => Prodi::where('status', 'aktif')->orderBy('nama_prodi')->get()]);
    }

    public function store(Request $request)
    {
        $data = $this->validateDosen($request);
        $dosen = DB::transaction(function () use ($data, $request) {
            $user = User::create(['name' => $data['nama_lengkap'], 'email' => $data['email'], 'password' => Hash::make($data['password']), 'role' => 'dosen', 'email_verified_at' => now()]);
            $dosen = Dosen::create($this->dosenAttributes($data) + ['user_id' => $user->id, 'status' => 'aktif']);
            DosenStatusHistory::create(['dosen_id' => $dosen->id, 'status' => 'aktif', 'tanggal_berlaku' => $data['tanggal_mulai_dosen'] ?? now()->toDateString(), 'created_by' => $request->user()->id]);
            if (! empty($data['prodi_id'])) {
                DosenHomebaseHistory::create(['dosen_id' => $dosen->id, 'prodi_id' => $data['prodi_id'], 'tanggal_mulai' => $data['tanggal_mulai_dosen'] ?? now()->toDateString(), 'status' => 'aktif', 'created_by' => $request->user()->id]);
            }
            DosenKepegawaian::create(['dosen_id' => $dosen->id, 'jenis_kepegawaian' => $data['jenis_kepegawaian'] ?? null, 'status_kepegawaian' => $data['status_kepegawaian'] ?? null, 'nomor_pegawai' => $data['nomor_pegawai'] ?? null, 'tanggal_mulai_kerja' => $data['tanggal_mulai_kerja'] ?? null, 'tanggal_mulai_dosen' => $data['tanggal_mulai_dosen'] ?? null, 'status_dosen' => $data['status_dosen'] ?? null, 'status_pns' => $data['status_pns'] ?? null, 'unit_kerja' => $data['unit_kerja'] ?? null]);
            PddiktiDosenMapping::create(['dosen_id' => $dosen->id, 'status_mapping' => 'unmapped']);

            return $dosen;
        });

        return redirect()->route('admin.dosen.show', $dosen)->with('success', 'Dosen beserta data awal berhasil ditambahkan.');
    }

    public function show(Dosen $dosen)
    {
        $dosen->load(['user', 'alamatKtp', 'alamatDomisili', 'kepegawaian', 'statusHistories', 'homebaseHistories.prodi', 'riwayatPendidikans', 'jabatanAkademikHistories', 'pangkatGolongans', 'sertifikasis', 'dokumens', 'pddiktiMapping', 'pddiktiSyncLogs']);

        return Inertia::render('Admin/Dosen/Show', ['dosen' => $dosen, 'prodis' => Prodi::orderBy('nama_prodi')->get(['id', 'kode_prodi', 'nama_prodi'])]);
    }

    public function edit(Dosen $dosen)
    {
        $dosen->load('user', 'kepegawaian', 'homebaseAktif');

        return Inertia::render('Admin/Dosen/Edit', ['dosen' => $dosen, 'prodis' => Prodi::where('status', 'aktif')->orderBy('nama_prodi')->get()]);
    }

    public function update(Request $request, Dosen $dosen)
    {
        $data = $this->validateDosen($request, $dosen);
        DB::transaction(function () use ($data, $dosen) {
            $dosen->user->update(['name' => $data['nama_lengkap'], 'email' => $data['email']]);
            $dosen->update($this->dosenAttributes($data) + ['status' => $data['status']]);
            $dosen->kepegawaian()->updateOrCreate([], collect($data)->only(['jenis_kepegawaian', 'status_kepegawaian', 'nomor_pegawai', 'tanggal_mulai_kerja', 'tanggal_mulai_dosen', 'status_dosen', 'status_pns', 'unit_kerja'])->toArray());
        });

        return redirect()->route('admin.dosen.show', $dosen)->with('success', 'Biodata dosen berhasil diperbarui.');
    }

    public function destroy(Dosen $dosen)
    {
        $dosen->delete();

        return redirect()->route('admin.dosen.index')->with('success', 'Dosen dipindahkan ke arsip.');
    }

    public function restore($id)
    {
        Dosen::withTrashed()->findOrFail($id)->restore();

        return redirect()->route('admin.dosen.index')->with('success', 'Dosen berhasil dipulihkan.');
    }

    public function resetPassword(Request $request, Dosen $dosen)
    {
        $request->validate(['password' => 'required|string|min:8|confirmed']);
        $dosen->user?->update(['password' => Hash::make($request->password)]);

        return back()->with('success', 'Password dosen berhasil direset.');
    }

    /**
     * Export data dosen as CSV.
     * Kolom mengacu pada format push dosen Neo Feeder / PDDikti.
     */
    public function export(Request $request)
    {
        $query = Dosen::with(['user', 'homebaseAktif.prodi', 'kepegawaian', 'pddiktiMapping'])->withoutTrashed();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(fn ($q) => $q->where('nip', 'like', "%{$search}%")->orWhere('nidn', 'like', "%{$search}%")->orWhere('nama_lengkap', 'like', "%{$search}%")->orWhere('bidang_keahlian', 'like', "%{$search}%"));
        }
        foreach (['status', 'jenis_kelamin', 'status_kepegawaian'] as $filter) {
            if ($request->filled($filter)) {
                $query->where($filter, $request->$filter);
            }
        }

        $dosens = $query->orderBy('nama_lengkap')->get();

        $fileName = 'data_dosen_neo_feeder_' . date('Y-m-d_H-i-s') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $fileName . '"',
        ];

        $callback = function () use ($dosens) {
            $file = fopen('php://output', 'w');
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));

            // Header mengacu kolom push dosen Neo Feeder
            fputcsv($file, [
                'nidn', 'nuptk', 'nip', 'nik', 'npwp', 'nama_lengkap', 'gelar_depan', 'gelar_belakang',
                'jenis_kelamin', 'tempat_lahir', 'tanggal_lahir', 'agama', 'kewarganegaraan', 'alamat',
                'no_hp', 'email', 'bidang_keahlian', 'jabatan_akademik', 'status', 'status_kepegawaian',
                'status_dosen', 'status_pns', 'unit_kerja', 'pendidikan_terakhir', 'program_studi_homebase',
                'kode_prodi_homebase', 'pddikti_id', 'id_registrasi_dosen', 'status_mapping_pddikti',
            ]);

            foreach ($dosens as $dosen) {
                fputcsv($file, [
                    $dosen->nidn ?? '',
                    $dosen->nuptk ?? '',
                    $dosen->nip ?? '',
                    $dosen->nik ?? '',
                    $dosen->npwp ?? '',
                    $dosen->nama_lengkap,
                    $dosen->gelar_depan ?? '',
                    $dosen->gelar_belakang ?? '',
                    $dosen->jenis_kelamin, // L / P sesuai format Neo Feeder
                    $dosen->tempat_lahir ?? '',
                    $dosen->tanggal_lahir ? $dosen->tanggal_lahir->format('Y-m-d') : '',
                    $dosen->agama ?? '',
                    $dosen->kewarganegaraan ?? '',
                    $dosen->alamat ?? '',
                    $dosen->no_hp ?? '',
                    $dosen->email ?? ($dosen->user->email ?? ''),
                    $dosen->bidang_keahlian ?? '',
                    $dosen->jabatan_akademik ?? '',
                    $dosen->status ?? '',
                    $dosen->status_kepegawaian ?? ($dosen->kepegawaian?->status_kepegawaian ?? ''),
                    $dosen->kepegawaian?->status_dosen ?? '',
                    $dosen->kepegawaian?->status_pns ?? '',
                    $dosen->kepegawaian?->unit_kerja ?? '',
                    $dosen->pendidikan_terakhir ?? '',
                    $dosen->homebaseAktif?->prodi?->nama_prodi ?? '',
                    $dosen->homebaseAktif?->prodi?->kode_prodi ?? '',
                    $dosen->pddiktiMapping?->pddikti_id ?? '',
                    $dosen->pddiktiMapping?->id_registrasi_dosen ?? '',
                    $dosen->pddiktiMapping?->status_mapping ?? '',
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    private function validateDosen(Request $request, ?Dosen $dosen = null): array
    {
        $ignore = $dosen?->id;

        return $request->validate([
            'nip' => ['required', 'string', 'max:50', Rule::unique('dosens', 'nip')->ignore($ignore)], 'nama_lengkap' => 'required|string|max:255', 'gelar_depan' => 'nullable|string|max:50', 'gelar_belakang' => 'nullable|string|max:100', 'jenis_kelamin' => 'required|in:L,P', 'tempat_lahir' => 'required|string|max:255', 'tanggal_lahir' => 'required|date', 'agama' => 'nullable|string|max:50', 'kewarganegaraan' => 'nullable|string|max:50', 'nik' => ['nullable', 'string', 'max:20', Rule::unique('dosens', 'nik')->ignore($ignore)], 'nidn' => ['nullable', 'string', 'max:20', Rule::unique('dosens', 'nidn')->ignore($ignore)], 'nidk' => ['nullable', 'string', 'max:20', Rule::unique('dosens', 'nidk')->ignore($ignore)], 'nuptk' => ['nullable', 'string', 'max:20', Rule::unique('dosens', 'nuptk')->ignore($ignore)], 'npwp' => 'nullable|string|max:25', 'alamat' => 'required|string', 'no_hp' => 'required|string|max:30', 'telepon' => 'nullable|string|max:30', 'kontak_darurat' => 'nullable|string|max:50', 'email' => ['required', 'email', Rule::unique('users', 'email')->ignore($dosen?->user_id)], 'password' => $dosen ? 'nullable|string|min:8' : 'required|string|min:8', 'bidang_keahlian' => 'required|string|max:255', 'pendidikan_terakhir' => 'nullable|string|max:255', 'jabatan_akademik' => 'nullable|string|max:100', 'status' => $dosen ? 'required|in:aktif,nonaktif,pensiun,mengundurkan_diri,meninggal,pindah' : 'nullable', 'prodi_id' => 'nullable|exists:prodis,id', 'jenis_kepegawaian' => 'nullable|string|max:50', 'status_kepegawaian' => 'nullable|string|max:50', 'nomor_pegawai' => ['nullable', 'string', 'max:50', Rule::unique('dosen_kepegawaians', 'nomor_pegawai')->ignore($dosen?->kepegawaian?->id)], 'tanggal_mulai_kerja' => 'nullable|date', 'tanggal_mulai_dosen' => 'nullable|date', 'status_dosen' => 'nullable|in:tetap,tidak_tetap,luar_biasa', 'status_pns' => 'nullable|in:pns,pppk,non_pns', 'unit_kerja' => 'nullable|string|max:150',
        ]);
    }

    private function dosenAttributes(array $data): array
    {
        $attributes = collect($data)->only(['nip', 'nama_lengkap', 'gelar_depan', 'gelar_belakang', 'jenis_kelamin', 'tempat_lahir', 'tanggal_lahir', 'agama', 'kewarganegaraan', 'nik', 'nidn', 'nidk', 'nuptk', 'npwp', 'alamat', 'no_hp', 'email', 'telepon', 'kontak_darurat', 'bidang_keahlian', 'pendidikan_terakhir', 'jabatan_akademik', 'status_kepegawaian'])->toArray();
        $attributes['pendidikan_terakhir'] = $attributes['pendidikan_terakhir'] ?? 'Belum diisi';

        return $attributes;
    }
}
