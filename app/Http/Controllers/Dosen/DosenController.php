<?php

namespace App\Http\Controllers\Dosen;

use App\Http\Controllers\Controller;
use App\Models\JadwalKuliah;
use App\Models\Dosen;
use App\Models\PeriodeKrs;
use App\Models\Krs;
use App\Models\Penilaian;
use App\Models\Absensi;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class DosenController extends Controller
{
    /**
     * Dashboard dosen
     */
    public function dashboard()
    {
        $user = auth()->user();
        $dosen = Dosen::where('user_id', $user->id)->first();

        if (!$dosen) {
            return redirect()->route('dashboard')->with('error', 'Data dosen tidak ditemukan.');
        }

        $periodeAktif = PeriodeKrs::aktif()
            ->with(['tahunAjaran', 'semester'])
            ->first();

        $jadwalKuliahs = collect();
        $summary = [
            'total_mata_kuliah' => 0,
            'total_mahasiswa' => 0,
            'total_sks' => 0,
            'lms_course_count' => 0,
            'penilaian_final' => 0,
            'penilaian_draft' => 0,
            'kehadiran_hadir_rate' => 0,
        ];
        $todayClasses = [];
        $recentUpdates = [];

        if ($periodeAktif) {
            $jadwalKuliahs = JadwalKuliah::with(['mataKuliah', 'semester', 'lmsCourse'])
                ->where('dosen_id', $dosen->id)
                ->where('semester_id', $periodeAktif->semester_id)
                ->aktif()
                ->orderBy('hari')
                ->orderBy('jam_mulai')
                ->get()
                ->map(function ($jadwal) use ($periodeAktif) {
                    $jumlahMahasiswa = Krs::where('jadwal_kuliah_id', $jadwal->id)
                        ->where('periode_krs_id', $periodeAktif->id)
                        ->where('status', 'disetujui')
                        ->count();

                    $jadwal->jumlah_mahasiswa_aktual = $jumlahMahasiswa;
                    return $jadwal;
                });

            $jadwalIds = $jadwalKuliahs->pluck('id');
            $hariIni = Str::ucfirst(now()->locale('id')->dayName);

            $summary['total_mata_kuliah'] = $jadwalKuliahs->count();
            $summary['total_mahasiswa'] = $jadwalKuliahs->sum('jumlah_mahasiswa_aktual');
            $summary['total_sks'] = $jadwalKuliahs->sum(fn ($j) => $j->mataKuliah->sks ?? 0);
            $summary['lms_course_count'] = $jadwalKuliahs->whereNotNull('lmsCourse')->count();

            $summary['penilaian_final'] = Penilaian::whereIn('jadwal_kuliah_id', $jadwalIds)
                ->where('periode_krs_id', $periodeAktif->id)
                ->where('status', 'final')
                ->count();
            $summary['penilaian_draft'] = Penilaian::whereIn('jadwal_kuliah_id', $jadwalIds)
                ->where('periode_krs_id', $periodeAktif->id)
                ->where('status', 'draft')
                ->count();

            $summary['kehadiran_hadir_rate'] = Absensi::whereIn('jadwal_kuliah_id', $jadwalIds)
                ->where('periode_krs_id', $periodeAktif->id)
                ->selectRaw("COALESCE(ROUND(AVG(CASE WHEN status = 'hadir' THEN 100 ELSE 0 END), 1), 0) as rate")
                ->value('rate') ?? 0;

            $todayClasses = $jadwalKuliahs
                ->filter(fn ($jadwal) => $jadwal->hari === $hariIni)
                ->sortBy(fn ($jadwal) => $jadwal->jam_mulai?->format('H:i') ?? '99:99')
                ->values()
                ->map(function ($jadwal) {
                    return [
                        'id' => $jadwal->id,
                        'mata_kuliah' => $jadwal->mataKuliah->nama_mata_kuliah ?? '-',
                        'kode' => $jadwal->mataKuliah->kode_mata_kuliah ?? '-',
                        'sks' => $jadwal->mataKuliah->sks ?? 0,
                        'ruangan' => $jadwal->ruangan ?? '-',
                        'jam_mulai' => $jadwal->jam_mulai?->format('H:i') ?? '-',
                        'jam_selesai' => $jadwal->jam_selesai?->format('H:i') ?? '-',
                        'jumlah_mahasiswa' => $jadwal->jumlah_mahasiswa_aktual,
                    ];
                });

            $recentUpdates = Penilaian::with(['jadwalKuliah.mataKuliah', 'mahasiswa'])
                ->whereIn('jadwal_kuliah_id', $jadwalIds)
                ->where('periode_krs_id', $periodeAktif->id)
                ->whereNotNull('nilai_akhir')
                ->latest('updated_at')
                ->limit(5)
                ->get()
                ->map(function ($row) {
                    return [
                        'id' => $row->id,
                        'mata_kuliah' => $row->jadwalKuliah->mataKuliah->nama_mata_kuliah ?? '-',
                        'mahasiswa' => $row->mahasiswa->nama_lengkap ?? '-',
                        'nilai_akhir' => $row->nilai_akhir,
                        'status' => $row->status,
                        'updated_at' => $row->updated_at?->format('d M Y H:i'),
                    ];
                });
        }

        return Inertia::render('Dosen/Dashboard', [
            'dosen' => [
                'nama_lengkap' => $dosen->nama_lengkap,
                'nip' => $dosen->nip,
                'jabatan_akademik' => $dosen->jabatan_akademik,
                'bidang_keahlian' => $dosen->bidang_keahlian,
                'status' => $dosen->status,
            ],
            'periodeAktif' => $periodeAktif ? [
                'nama' => $periodeAktif->nama_periode,
                'tahun_ajaran' => $periodeAktif->tahunAjaran?->tahun,
                'semester' => $periodeAktif->semester?->nama_semester,
                'tanggal_mulai' => $periodeAktif->tanggal_mulai?->format('d M Y'),
                'tanggal_selesai' => $periodeAktif->tanggal_selesai?->format('d M Y'),
            ] : null,
            'summary' => $summary,
            'jadwalKuliahs' => $jadwalKuliahs,
            'todayClasses' => $todayClasses,
            'recentUpdates' => $recentUpdates,
        ]);
    }

    /**
     * Jadwal mengajar dosen
     */
    public function jadwal()
    {
        $user = auth()->user();
        $dosen = Dosen::where('user_id', $user->id)->first();

        if (!$dosen) {
            return redirect()->route('dashboard')->with('error', 'Data dosen tidak ditemukan.');
        }

        // Get periode KRS yang aktif
        $periodeAktif = PeriodeKrs::aktif()->first();
        
        $jadwalKuliahs = [];
        if ($periodeAktif) {
            $jadwalKuliahs = JadwalKuliah::with(['mataKuliah', 'semester'])
                ->where('dosen_id', $dosen->id)
                ->where('semester_id', $periodeAktif->semester_id)
                ->aktif()
                ->orderBy('hari')
                ->orderBy('jam_mulai')
                ->get()
                ->map(function ($jadwal) use ($periodeAktif) {
                    $jumlahMahasiswa = Krs::where('jadwal_kuliah_id', $jadwal->id)
                        ->where('periode_krs_id', $periodeAktif->id)
                        ->whereIn('status', ['disetujui'])
                        ->count();
                    
                    $jadwal->jumlah_mahasiswa_aktual = $jumlahMahasiswa;
                    return $jadwal;
                });
        }

        return Inertia::render('Dosen/Jadwal/Index', [
            'dosen' => $dosen,
            'periodeAktif' => $periodeAktif,
            'jadwalKuliahs' => $jadwalKuliahs
        ]);
    }

    /**
     * Daftar mahasiswa per kelas
     */
    public function mahasiswa(JadwalKuliah $jadwalKuliah)
    {
        $user = auth()->user();
        $dosen = Dosen::where('user_id', $user->id)->first();

        // Pastikan jadwal ini milik dosen yang login
        if (!$dosen || $jadwalKuliah->dosen_id !== $dosen->id) {
            return redirect()->route('dosen.jadwal')->with('error', 'Unauthorized.');
        }

        // Get periode KRS yang aktif
        $periodeAktif = PeriodeKrs::aktif()->first();

        if (!$periodeAktif) {
            return redirect()->route('dosen.jadwal')->with('error', 'Tidak ada periode KRS yang aktif.');
        }

        // Get mahasiswa yang mengambil kelas ini
        $mahasiswas = Krs::with(['mahasiswa.prodi', 'mahasiswa.user'])
            ->where('jadwal_kuliah_id', $jadwalKuliah->id)
            ->where('periode_krs_id', $periodeAktif->id)
            ->disetujui()
            ->get()
            ->map(function ($krs) use ($jadwalKuliah, $periodeAktif) {
                // Get penilaian jika ada
                $penilaian = Penilaian::where('mahasiswa_id', $krs->mahasiswa_id)
                    ->where('jadwal_kuliah_id', $jadwalKuliah->id)
                    ->where('periode_krs_id', $periodeAktif->id)
                    ->first();
                
                $krs->mahasiswa->penilaian = $penilaian;
                return $krs->mahasiswa;
            });

        $jadwalKuliah->load(['mataKuliah', 'semester']);

        return Inertia::render('Dosen/Mahasiswa/Index', [
            'dosen' => $dosen,
            'periodeAktif' => $periodeAktif,
            'jadwalKuliah' => $jadwalKuliah,
            'mahasiswas' => $mahasiswas
        ]);
    }

    /**
     * Input penilaian
     */
    public function penilaian(JadwalKuliah $jadwalKuliah)
    {
        $user = auth()->user();
        $dosen = Dosen::where('user_id', $user->id)->first();

        // Pastikan jadwal ini milik dosen yang login
        if (!$dosen || $jadwalKuliah->dosen_id !== $dosen->id) {
            return redirect()->route('dosen.jadwal')->with('error', 'Unauthorized.');
        }

        // Get periode KRS yang aktif
        $periodeAktif = PeriodeKrs::aktif()->first();

        if (!$periodeAktif) {
            return redirect()->route('dosen.jadwal')->with('error', 'Tidak ada periode KRS yang aktif.');
        }

        // Get mahasiswa yang mengambil kelas ini beserta nilai
        $mahasiswas = Krs::with(['mahasiswa.prodi', 'mahasiswa.user'])
            ->where('jadwal_kuliah_id', $jadwalKuliah->id)
            ->where('periode_krs_id', $periodeAktif->id)
            ->whereIn('status', ['disetujui'])
            ->get()
            ->map(function ($krs) use ($jadwalKuliah, $periodeAktif) {
                // Get atau buat penilaian
                $penilaian = Penilaian::firstOrCreate([
                    'mahasiswa_id' => $krs->mahasiswa_id,
                    'jadwal_kuliah_id' => $jadwalKuliah->id,
                    'periode_krs_id' => $periodeAktif->id,
                ]);
                
                $krs->mahasiswa->penilaian = $penilaian;
                return $krs->mahasiswa;
            });

        $jadwalKuliah->load(['mataKuliah', 'semester']);

        return Inertia::render('Dosen/Penilaian/Index', [
            'dosen' => $dosen,
            'periodeAktif' => $periodeAktif,
            'jadwalKuliah' => $jadwalKuliah,
            'mahasiswas' => $mahasiswas
        ]);
    }

    /**
     * Update penilaian
     */
    public function updatePenilaian(Request $request, Penilaian $penilaian)
    {
        $user = auth()->user();
        $dosen = Dosen::where('user_id', $user->id)->first();

        // Pastikan penilaian ini untuk kelas dosen yang login
        $penilaian->load('jadwalKuliah');
        if (!$dosen || $penilaian->jadwalKuliah->dosen_id !== $dosen->id) {
            return back()->with('error', 'Unauthorized.');
        }

        $request->validate([
            'nilai_tugas' => 'nullable|numeric|min:0|max:100',
            'nilai_uts' => 'nullable|numeric|min:0|max:100',
            'nilai_uas' => 'nullable|numeric|min:0|max:100',
            'catatan' => 'nullable|string|max:1000'
        ]);

        $penilaian->update([
            'nilai_tugas' => $request->nilai_tugas,
            'nilai_uts' => $request->nilai_uts,
            'nilai_uas' => $request->nilai_uas,
            'catatan' => $request->catatan
        ]);

        // Hitung nilai akhir otomatis
        $penilaian->updateNilaiAkhir();

        return back()->with('success', 'Penilaian berhasil disimpan.');
    }

    /**
     * Finalisasi nilai
     */
    public function finalisasiNilai(JadwalKuliah $jadwalKuliah)
    {
        $user = auth()->user();
        $dosen = Dosen::where('user_id', $user->id)->first();

        // Pastikan jadwal ini milik dosen yang login
        if (!$dosen || $jadwalKuliah->dosen_id !== $dosen->id) {
            return back()->with('error', 'Unauthorized.');
        }

        // Get periode KRS yang aktif
        $periodeAktif = PeriodeKrs::aktif()->first();

        if (!$periodeAktif) {
            return back()->with('error', 'Tidak ada periode KRS yang aktif.');
        }

        // Finalisasi semua nilai untuk kelas ini
        Penilaian::where('jadwal_kuliah_id', $jadwalKuliah->id)
            ->where('periode_krs_id', $periodeAktif->id)
            ->update(['status' => 'final']);

        return back()->with('success', 'Semua nilai berhasil difinalisasi.');
    }
}
