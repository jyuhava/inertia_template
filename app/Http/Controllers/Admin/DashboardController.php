<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Absensi;
use App\Models\CalonMahasiswa;
use App\Models\Dosen;
use App\Models\JadwalKelasKuliah;
use App\Models\JadwalKuliah;
use App\Models\KelasKuliah;
use App\Models\Krs;
use App\Models\Kurikulum;
use App\Models\LmsCourse;
use App\Models\Mahasiswa;
use App\Models\MataKuliah;
use App\Models\Penilaian;
use App\Models\PeriodeKrs;
use App\Models\PeriodePmb;
use App\Models\Prodi;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        // Get statistics
        $totalMahasiswa = Mahasiswa::count();
        $mahasiswaAktif = Mahasiswa::where('status', 'aktif')->count();
        $mahasiswaLulus = Mahasiswa::where('status', 'lulus')->count();
        $mahasiswaNonaktif = Mahasiswa::where('status', 'nonaktif')->count();

        $totalDosen = Dosen::count();
        $totalProdi = Prodi::count();
        $totalMataKuliah = MataKuliah::count();
        $totalJadwalKuliah = JadwalKuliah::count();
        $totalLmsCourse = LmsCourse::count();
        $totalUsers = User::count();
        $totalCalonMahasiswa = CalonMahasiswa::count();

        // Academic foundation statistics (kurikulum/kelas/jadwal)
        $totalKurikulum = Kurikulum::count();
        $kurikulumAktif = Kurikulum::where('status', 'aktif')->count();
        $totalKelasKuliah = KelasKuliah::count();
        $totalJadwalAkademik = JadwalKelasKuliah::count();
        $mataKuliahBelumPddikti = MataKuliah::doesntHave('pddiktiMapping')->count();
        $kurikulumBelumPddikti = Kurikulum::doesntHave('pddiktiMapping')->count();
        $jadwalConflict = JadwalKelasKuliah::query()
            ->whereNotNull('ruangan_id')
            ->select('ruangan_id', 'hari')
            ->selectRaw('COUNT(*) as jumlah')
            ->groupBy('ruangan_id', 'hari')
            ->havingRaw('COUNT(*) > 1')
            ->get()
            ->count();

        // Get active periode KRS
        $periodeAktif = PeriodeKrs::aktif()
            ->with(['tahunAjaran', 'semester'])
            ->first();

        // KRS Statistics for active period
        $krsStatistics = null;
        if ($periodeAktif) {
            $krsStatistics = [
                'total' => Krs::where('periode_krs_id', $periodeAktif->id)->count(),
                'disetujui' => Krs::where('periode_krs_id', $periodeAktif->id)->where('status', 'disetujui')->count(),
                'menunggu' => Krs::where('periode_krs_id', $periodeAktif->id)->where('status', 'menunggu_persetujuan')->count(),
                'ditolak' => Krs::where('periode_krs_id', $periodeAktif->id)->where('status', 'ditolak')->count(),
            ];
        }

        $periodePmbAktif = PeriodePmb::berlangsung()->first();
        $pmbStatistics = [
            'total_calon' => $totalCalonMahasiswa,
            'draft' => CalonMahasiswa::where('status_pendaftaran', 'draft')->count(),
            'submitted' => CalonMahasiswa::where('status_pendaftaran', 'submitted')->count(),
            'verified' => CalonMahasiswa::where('status_pendaftaran', 'verified')->count(),
            'accepted' => CalonMahasiswa::where('status_pendaftaran', 'accepted')->count(),
            'rejected' => CalonMahasiswa::where('status_pendaftaran', 'rejected')->count(),
        ];

        if ($periodePmbAktif) {
            $pendaftarAktif = CalonMahasiswa::where('periode_pmb_id', $periodePmbAktif->id)->count();
            $pmbStatistics['periode_aktif'] = [
                'nama' => $periodePmbAktif->nama_periode,
                'tahun_akademik' => $periodePmbAktif->tahun_akademik,
                'tanggal_buka' => $periodePmbAktif->tanggal_buka?->format('d/m/Y'),
                'tanggal_tutup' => $periodePmbAktif->tanggal_tutup?->format('d/m/Y'),
                'kuota_total' => $periodePmbAktif->kuota_total,
                'pendaftar' => $pendaftarAktif,
                'sisa_kuota' => max(($periodePmbAktif->kuota_total ?? 0) - $pendaftarAktif, 0),
            ];
        } else {
            $pmbStatistics['periode_aktif'] = null;
        }

        // Get mahasiswa by prodi
        $mahasiswaByProdi = Prodi::withCount('mahasiswas')
            ->orderBy('mahasiswas_count', 'desc')
            ->limit(8)
            ->get()
            ->map(function ($prodi) {
                return [
                    'nama' => $prodi->nama_prodi,
                    'jumlah' => $prodi->mahasiswas_count,
                ];
            });

        // Get mahasiswa by angkatan
        $mahasiswaByAngkatan = Mahasiswa::select('angkatan', DB::raw('count(*) as total'))
            ->groupBy('angkatan')
            ->orderBy('angkatan', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($item) {
                return [
                    'angkatan' => $item->angkatan,
                    'jumlah' => $item->total,
                ];
            });

        // Get recent KRS activities
        $recentKrs = Krs::with(['mahasiswa', 'jadwalKuliah.mataKuliah', 'approvedBy'])
            ->whereIn('status', ['disetujui', 'ditolak'])
            ->whereNotNull('tanggal_approval')
            ->orderBy('tanggal_approval', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($krs) {
                return [
                    'id' => $krs->id,
                    'mahasiswa' => $krs->mahasiswa->nama_lengkap,
                    'nim' => $krs->mahasiswa->nim,
                    'mata_kuliah' => $krs->jadwalKuliah->mataKuliah->nama_mata_kuliah,
                    'status' => $krs->status,
                    'tanggal' => $krs->tanggal_approval->format('d/m/Y H:i'),
                    'approved_by' => $krs->approvedBy ? $krs->approvedBy->name : null,
                ];
            });

        // Get jadwal kuliah today
        $hariIni = Str::ucfirst(now()->locale('id')->dayName);
        $jadwalHariIni = JadwalKuliah::with(['mataKuliah', 'dosen', 'semester'])
            ->where('hari', $hariIni)
            ->orderBy('jam_mulai')
            ->limit(5)
            ->get()
            ->map(function ($jadwal) {
                return [
                    'mata_kuliah' => $jadwal->mataKuliah->nama_mata_kuliah,
                    'dosen' => $jadwal->dosen->nama_lengkap,
                    'waktu' => ($jadwal->jam_mulai?->format('H:i') ?? '-').' - '.($jadwal->jam_selesai?->format('H:i') ?? '-'),
                    'ruangan' => $jadwal->ruangan,
                    'semester' => $jadwal->semester->nama_semester,
                ];
            });

        $userByRole = [
            'admin' => User::where('role', 'admin')->count(),
            'dosen' => User::where('role', 'dosen')->count(),
            'mahasiswa' => User::where('role', 'mahasiswa')->count(),
            'calon_mahasiswa' => User::where('role', 'calon_mahasiswa')->count(),
        ];

        // -------------------------------
        // Penilaian statistics
        // -------------------------------
        $penilaianQuery = Penilaian::query();
        if ($periodeAktif) {
            $penilaianQuery->where('periode_krs_id', $periodeAktif->id);
        }

        $totalPenilaian = (clone $penilaianQuery)->count();
        $penilaianFinal = (clone $penilaianQuery)->where('status', 'final')->count();
        $penilaianDraft = $totalPenilaian - $penilaianFinal;
        $rataNilaiAkhir = (clone $penilaianQuery)->whereNotNull('nilai_akhir')->avg('nilai_akhir');

        $gradeOrder = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'E'];
        $gradeCounts = (clone $penilaianQuery)
            ->whereNotNull('nilai_huruf')
            ->select('nilai_huruf', DB::raw('count(*) as jumlah'))
            ->groupBy('nilai_huruf')
            ->pluck('jumlah', 'nilai_huruf');

        $gradeDistribution = collect($gradeOrder)
            ->map(function ($grade) use ($gradeCounts) {
                return [
                    'label' => $grade,
                    'value' => $gradeCounts->get($grade, 0),
                ];
            })
            ->filter(fn ($item) => $item['value'] > 0)
            ->values();

        $penilaianPerMataKuliah = Penilaian::with(['jadwalKuliah.mataKuliah'])
            ->whereNotNull('nilai_akhir')
            ->when($periodeAktif, fn ($q) => $q->where('periode_krs_id', $periodeAktif->id))
            ->get()
            ->groupBy(fn ($penilaian) => $penilaian->jadwalKuliah?->mataKuliah?->nama_mata_kuliah ?? 'Tanpa MK')
            ->map(function ($group) {
                return [
                    'label' => $group->keys()->first() ?: $group->first()->jadwalKuliah?->mataKuliah?->nama_mata_kuliah ?? 'Tanpa MK',
                    'value' => $group->count(),
                    'rata_rata' => round($group->avg('nilai_akhir') ?? 0, 2),
                ];
            })
            ->sortByDesc('value')
            ->values();

        // -------------------------------
        // Kehadiran (Absensi) statistics
        // -------------------------------
        $absensiQuery = Absensi::query();
        if ($periodeAktif) {
            $absensiQuery->where('periode_krs_id', $periodeAktif->id);
        }

        $totalAbsensi = (clone $absensiQuery)->count();
        $absensiHadir = (clone $absensiQuery)->where('status', 'hadir')->count();
        $absensiIzin = (clone $absensiQuery)->where('status', 'izin')->count();
        $absensiSakit = (clone $absensiQuery)->where('status', 'sakit')->count();
        $absensiTidakHadir = (clone $absensiQuery)->where('status', 'tidak_hadir')->count();

        $tingkatKehadiran = $totalAbsensi > 0
            ? round((($absensiHadir + $absensiIzin + $absensiSakit) / $totalAbsensi) * 100, 1)
            : 0;

        // Kehadiran per mata kuliah (top 5)
        $kehadiranPerMataKuliah = Absensi::with(['jadwalKuliah.mataKuliah'])
            ->when($periodeAktif, fn ($q) => $q->where('periode_krs_id', $periodeAktif->id))
            ->get()
            ->groupBy(fn ($absensi) => $absensi->jadwalKuliah?->mataKuliah?->nama_mata_kuliah ?? 'Tanpa MK')
            ->map(function ($group) {
                $total = $group->count();
                $hadir = $group->where('status', 'hadir')->count();
                $izin = $group->where('status', 'izin')->count();
                $sakit = $group->where('status', 'sakit')->count();

                return [
                    'label' => $group->first()->jadwalKuliah?->mataKuliah?->nama_mata_kuliah ?? 'Tanpa MK',
                    'value' => $total,
                    'hadir' => $hadir,
                    'tingkat' => $total > 0 ? round((($hadir + $izin + $sakit) / $total) * 100, 1) : 0,
                ];
            })
            ->sortByDesc('value')
            ->take(5)
            ->values();

        // -------------------------------
        // Dosen statistics
        // -------------------------------
        $dosenByJabatan = Dosen::select('jabatan_akademik', DB::raw('count(*) as jumlah'))
            ->whereNotNull('jabatan_akademik')
            ->groupBy('jabatan_akademik')
            ->orderByDesc('jumlah')
            ->get()
            ->map(fn ($item) => [
                'label' => $item->jabatan_akademik,
                'value' => (int) $item->jumlah,
            ]);

        $dosenAktif = Dosen::where('status', 'aktif')->count();
        $dosenNonaktif = Dosen::where('status', 'nonaktif')->count();
        $dosenPensiun = Dosen::where('status', 'pensiun')->count();

        // -------------------------------
        // KRS total SKS diambil (periode aktif)
        // -------------------------------
        $totalSksDiambil = 0;
        $totalKrsDisetujui = 0;
        if ($periodeAktif) {
            $totalKrsDisetujui = Krs::where('periode_krs_id', $periodeAktif->id)
                ->where('status', 'disetujui')
                ->count();
            $totalSksDiambil = Krs::with(['jadwalKuliah.mataKuliah'])
                ->where('periode_krs_id', $periodeAktif->id)
                ->where('status', 'disetujui')
                ->get()
                ->sum(fn ($krs) => $krs->jadwalKuliah?->mataKuliah?->sks ?? 0);
        }

        // -------------------------------
        // Mahasiswa per jenis kelamin
        // -------------------------------
        $mahasiswaByGender = Mahasiswa::select('jenis_kelamin', DB::raw('count(*) as jumlah'))
            ->groupBy('jenis_kelamin')
            ->get()
            ->map(fn ($item) => [
                'label' => $item->jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan',
                'value' => (int) $item->jumlah,
            ]);

        return Inertia::render('Admin/Dashboard', [
            'statistics' => [
                'mahasiswa' => [
                    'total' => $totalMahasiswa,
                    'aktif' => $mahasiswaAktif,
                    'lulus' => $mahasiswaLulus,
                    'nonaktif' => $mahasiswaNonaktif,
                ],
                'dosen' => $totalDosen,
                'prodi' => $totalProdi,
                'mataKuliah' => $totalMataKuliah,
                'jadwalKuliah' => $totalJadwalKuliah,
                'lmsCourse' => $totalLmsCourse,
                'users' => $totalUsers,
            ],
            'periodeAktif' => $periodeAktif ? [
                'nama' => $periodeAktif->nama_periode,
                'tahun_ajaran' => $periodeAktif->tahunAjaran->tahun,
                'semester' => $periodeAktif->semester->nama_semester,
                'tanggal_mulai' => $periodeAktif->tanggal_mulai->format('d/m/Y'),
                'tanggal_selesai' => $periodeAktif->tanggal_selesai->format('d/m/Y'),
            ] : null,
            'krsStatistics' => $krsStatistics,
            'mahasiswaByProdi' => $mahasiswaByProdi,
            'mahasiswaByAngkatan' => $mahasiswaByAngkatan,
            'recentKrs' => $recentKrs,
            'jadwalHariIni' => $jadwalHariIni,
            'pmbStatistics' => $pmbStatistics,
            'userByRole' => $userByRole,
            'penilaianStatistics' => [
                'total' => $totalPenilaian,
                'final' => $penilaianFinal,
                'draft' => $penilaianDraft,
                'rata_nilai' => $rataNilaiAkhir !== null ? round($rataNilaiAkhir, 2) : null,
                'gradeDistribution' => $gradeDistribution,
                'perMataKuliah' => $penilaianPerMataKuliah->take(5)->values(),
            ],
            'kehadiranStatistics' => [
                'total' => $totalAbsensi,
                'hadir' => $absensiHadir,
                'izin' => $absensiIzin,
                'sakit' => $absensiSakit,
                'tidak_hadir' => $absensiTidakHadir,
                'tingkat' => $tingkatKehadiran,
                'perMataKuliah' => $kehadiranPerMataKuliah,
            ],
            'dosenStatistics' => [
                'total' => $totalDosen,
                'aktif' => $dosenAktif,
                'nonaktif' => $dosenNonaktif,
                'pensiun' => $dosenPensiun,
                'byJabatan' => $dosenByJabatan,
            ],
            'krsDetail' => [
                'total_disetujui' => $totalKrsDisetujui,
                'total_sks' => $totalSksDiambil,
            ],
            'mahasiswaByGender' => $mahasiswaByGender,
            'akademikStatistics' => [
                'total_mata_kuliah' => $totalMataKuliah,
                'total_kurikulum' => $totalKurikulum,
                'kurikulum_aktif' => $kurikulumAktif,
                'total_kelas' => $totalKelasKuliah,
                'total_jadwal' => $totalJadwalAkademik,
                'jadwal_conflict' => $jadwalConflict,
                'mata_kuliah_belum_pddikti' => $mataKuliahBelumPddikti,
                'kurikulum_belum_pddikti' => $kurikulumBelumPddikti,
            ],
        ]);
    }
}
