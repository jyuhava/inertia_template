<?php

namespace App\Services;

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
use App\Models\StudentCourseRegistration;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AdminDashboardStats
{
    public const CACHE_KEY = 'admin.dashboard.stats';

    public const CACHE_TTL = 600;

    public static function get(): array
    {
        return Cache::remember(self::CACHE_KEY, self::CACHE_TTL, fn () => self::build());
    }

    public static function refresh(): array
    {
        Cache::forget(self::CACHE_KEY);

        return self::get();
    }

    public static function build(): array
    {
        // DB remote berlatensi tinggi (~240ms/query), jadi semua statistik
        // diagregat di SQL (bukan N query count).
        // Mahasiswa per status (1 query)
        $mhsByStatus = Mahasiswa::selectRaw('status, COUNT(*) as c')
            ->groupBy('status')->pluck('c', 'status');

        // Hitungan sederhana
        $totalDosen = Dosen::count();
        $totalProdi = Prodi::count();
        $totalMataKuliah = MataKuliah::count();
        $totalJadwalKuliah = JadwalKuliah::count();
        $totalLmsCourse = LmsCourse::count();
        $totalUsers = User::count();
        $totalCalonMahasiswa = CalonMahasiswa::count();
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

        // Registrasi KRS per status (1 query)
        $enrollmentByStatus = StudentCourseRegistration::selectRaw('status, COUNT(*) as c')
            ->groupBy('status')->pluck('c', 'status');
        $krsEnrollmentStatistics = [
            'total' => $enrollmentByStatus->sum(),
            'draft' => $enrollmentByStatus->get('draft', 0),
            'submitted' => $enrollmentByStatus->get('submitted', 0),
            'revision' => $enrollmentByStatus->get('revision', 0),
            'approved' => $enrollmentByStatus->get('approved', 0),
            'rejected' => $enrollmentByStatus->get('rejected', 0),
            'locked' => $enrollmentByStatus->get('locked', 0),
        ];

        // Periode KRS aktif
        $periodeAktif = PeriodeKrs::aktif()
            ->with(['tahunAjaran', 'semester'])
            ->first();
        $periodeAktifId = $periodeAktif?->id;

        // KRS per status periode aktif (1 query)
        $krsStatistics = null;
        if ($periodeAktif) {
            $krsByStatus = Krs::selectRaw('status, COUNT(*) as c')
                ->where('periode_krs_id', $periodeAktifId)
                ->groupBy('status')->pluck('c', 'status');
            $krsStatistics = [
                'total' => $krsByStatus->sum(),
                'disetujui' => $krsByStatus->get('disetujui', 0),
                'menunggu' => $krsByStatus->get('menunggu_persetujuan', 0),
                'ditolak' => $krsByStatus->get('ditolak', 0),
            ];
        }

        // PMB per status (1 query)
        $pmbByStatus = CalonMahasiswa::selectRaw('status_pendaftaran, COUNT(*) as c')
            ->groupBy('status_pendaftaran')->pluck('c', 'status_pendaftaran');
        $pmbStatistics = [
            'total_calon' => $totalCalonMahasiswa,
            'draft' => $pmbByStatus->get('draft', 0),
            'submitted' => $pmbByStatus->get('submitted', 0),
            'verified' => $pmbByStatus->get('verified', 0),
            'accepted' => $pmbByStatus->get('accepted', 0),
            'rejected' => $pmbByStatus->get('rejected', 0),
        ];

        $periodePmbAktif = PeriodePmb::berlangsung()->first();
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

        // Mahasiswa per prodi & angkatan
        $mahasiswaByProdi = Prodi::withCount('mahasiswas')
            ->orderBy('mahasiswas_count', 'desc')
            ->limit(8)
            ->get()
            ->map(fn ($prodi) => [
                'nama' => $prodi->nama_prodi,
                'jumlah' => $prodi->mahasiswas_count,
            ]);

        $mahasiswaByAngkatan = Mahasiswa::select('angkatan', DB::raw('count(*) as total'))
            ->groupBy('angkatan')
            ->orderBy('angkatan', 'desc')
            ->limit(5)
            ->get()
            ->map(fn ($item) => [
                'angkatan' => $item->angkatan,
                'jumlah' => $item->total,
            ]);

        // Aktivitas KRS terbaru
        $recentKrs = Krs::with(['mahasiswa', 'jadwalKuliah.mataKuliah', 'approvedBy'])
            ->whereIn('status', ['disetujui', 'ditolak'])
            ->whereNotNull('tanggal_approval')
            ->orderBy('tanggal_approval', 'desc')
            ->limit(10)
            ->get()
            ->map(fn ($krs) => [
                'id' => $krs->id,
                'mahasiswa' => $krs->mahasiswa->nama_lengkap,
                'nim' => $krs->mahasiswa->nim,
                'mata_kuliah' => $krs->jadwalKuliah->mataKuliah->nama_mata_kuliah,
                'status' => $krs->status,
                'tanggal' => $krs->tanggal_approval->format('d/m/Y H:i'),
                'approved_by' => $krs->approvedBy ? $krs->approvedBy->name : null,
            ]);

        // Jadwal hari ini
        $hariIni = Str::ucfirst(now()->locale('id')->dayName);
        $jadwalHariIni = JadwalKuliah::with(['mataKuliah', 'dosen', 'semester'])
            ->where('hari', $hariIni)
            ->orderBy('jam_mulai')
            ->limit(5)
            ->get()
            ->map(fn ($jadwal) => [
                'mata_kuliah' => $jadwal->mataKuliah->nama_mata_kuliah,
                'dosen' => $jadwal->dosen->nama_lengkap,
                'waktu' => ($jadwal->jam_mulai?->format('H:i') ?? '-').' - '.($jadwal->jam_selesai?->format('H:i') ?? '-'),
                'ruangan' => $jadwal->ruangan,
                'semester' => $jadwal->semester->nama_semester,
            ]);

        // User per role (1 query)
        $userByRole = User::selectRaw('role, COUNT(*) as c')
            ->groupBy('role')->pluck('c', 'role');

        // Penilaian: status + rata-rata + distribusi (3 query ringan)
        $penilaianBase = Penilaian::query()
            ->when($periodeAktifId, fn ($q) => $q->where('periode_krs_id', $periodeAktifId));
        $penilaianByStatus = (clone $penilaianBase)
            ->selectRaw('status, COUNT(*) as c')->groupBy('status')->pluck('c', 'status');
        $totalPenilaian = $penilaianByStatus->sum();
        $penilaianFinal = $penilaianByStatus->get('final', 0);
        $rataNilaiAkhir = (clone $penilaianBase)->whereNotNull('nilai_akhir')->avg('nilai_akhir');

        $gradeOrder = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'E'];
        $gradeCounts = (clone $penilaianBase)
            ->whereNotNull('nilai_huruf')
            ->select('nilai_huruf', DB::raw('count(*) as jumlah'))
            ->groupBy('nilai_huruf')
            ->pluck('jumlah', 'nilai_huruf');
        $gradeDistribution = collect($gradeOrder)
            ->map(fn ($grade) => ['label' => $grade, 'value' => $gradeCounts->get($grade, 0)])
            ->filter(fn ($item) => $item['value'] > 0)
            ->values();

        // Penilaian per MK — agregat di SQL (1 query)
        $penilaianPerMataKuliah = DB::table('penilaians as p')
            ->leftJoin('jadwal_kuliahs as j', 'j.id', '=', 'p.jadwal_kuliah_id')
            ->leftJoin('mata_kuliahs as m', 'm.id', '=', 'j.mata_kuliah_id')
            ->when($periodeAktifId, fn ($q) => $q->where('p.periode_krs_id', $periodeAktifId))
            ->whereNotNull('p.nilai_akhir')
            ->selectRaw("COALESCE(m.nama_mata_kuliah, 'Tanpa MK') as label, COUNT(*) as value, ROUND(AVG(p.nilai_akhir), 2) as rata_rata")
            ->groupBy('m.nama_mata_kuliah')
            ->orderByDesc('value')
            ->limit(5)
            ->get()
            ->map(fn ($row) => ['label' => $row->label, 'value' => (int) $row->value, 'rata_rata' => (float) $row->rata_rata]);

        // Absensi per status (1 query)
        $absensiByStatus = Absensi::query()
            ->when($periodeAktifId, fn ($q) => $q->where('periode_krs_id', $periodeAktifId))
            ->selectRaw('status, COUNT(*) as c')->groupBy('status')->pluck('c', 'status');
        $totalAbsensi = $absensiByStatus->sum();
        $absensiHadir = $absensiByStatus->get('hadir', 0);
        $absensiIzin = $absensiByStatus->get('izin', 0);
        $absensiSakit = $absensiByStatus->get('sakit', 0);
        $absensiTidakHadir = $absensiByStatus->get('tidak_hadir', 0);
        $tingkatKehadiran = $totalAbsensi > 0
            ? round((($absensiHadir + $absensiIzin + $absensiSakit) / $totalAbsensi) * 100, 1)
            : 0;

        // Kehadiran per MK top 5 — agregat di SQL (1 query)
        $kehadiranPerMataKuliah = DB::table('absensis as a')
            ->leftJoin('jadwal_kuliahs as j', 'j.id', '=', 'a.jadwal_kuliah_id')
            ->leftJoin('mata_kuliahs as m', 'm.id', '=', 'j.mata_kuliah_id')
            ->when($periodeAktifId, fn ($q) => $q->where('a.periode_krs_id', $periodeAktifId))
            ->selectRaw("COALESCE(m.nama_mata_kuliah, 'Tanpa MK') as label, COUNT(*) as value, SUM(a.status = 'hadir') as hadir, ROUND(SUM(a.status IN ('hadir', 'izin', 'sakit')) / COUNT(*) * 100, 1) as tingkat")
            ->groupBy('m.nama_mata_kuliah')
            ->orderByDesc('value')
            ->limit(5)
            ->get()
            ->map(fn ($row) => [
                'label' => $row->label,
                'value' => (int) $row->value,
                'hadir' => (int) $row->hadir,
                'tingkat' => (float) $row->tingkat,
            ]);

        // Dosen per jabatan & status (2 query)
        $dosenByJabatan = Dosen::select('jabatan_akademik', DB::raw('count(*) as jumlah'))
            ->whereNotNull('jabatan_akademik')
            ->groupBy('jabatan_akademik')
            ->orderByDesc('jumlah')
            ->get()
            ->map(fn ($item) => ['label' => $item->jabatan_akademik, 'value' => (int) $item->jumlah]);
        $dosenByStatus = Dosen::selectRaw('status, COUNT(*) as c')
            ->groupBy('status')->pluck('c', 'status');

        // Total SKS disetujui — agregat di SQL (1 query)
        $sksAgg = ['total_krs' => 0, 'total_sks' => 0];
        if ($periodeAktif) {
            $sksAgg = DB::table('krs as k')
                ->join('jadwal_kuliahs as j', 'j.id', '=', 'k.jadwal_kuliah_id')
                ->join('mata_kuliahs as m', 'm.id', '=', 'j.mata_kuliah_id')
                ->where('k.periode_krs_id', $periodeAktifId)
                ->where('k.status', 'disetujui')
                ->selectRaw('COUNT(*) as total_krs, COALESCE(SUM(m.sks), 0) as total_sks')
                ->first();
        }

        // Mahasiswa per jenis kelamin (1 query)
        $mahasiswaByGender = Mahasiswa::select('jenis_kelamin', DB::raw('count(*) as jumlah'))
            ->groupBy('jenis_kelamin')
            ->get()
            ->map(fn ($item) => [
                'label' => $item->jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan',
                'value' => (int) $item->jumlah,
            ]);

        return [
            'statistics' => [
                'mahasiswa' => [
                    'total' => $mhsByStatus->sum(),
                    'aktif' => $mhsByStatus->get('aktif', 0),
                    'lulus' => $mhsByStatus->get('lulus', 0),
                    'nonaktif' => $mhsByStatus->get('nonaktif', 0),
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
            'userByRole' => [
                'admin' => $userByRole->get('admin', 0),
                'dosen' => $userByRole->get('dosen', 0),
                'mahasiswa' => $userByRole->get('mahasiswa', 0),
                'calon_mahasiswa' => $userByRole->get('calon_mahasiswa', 0),
            ],
            'penilaianStatistics' => [
                'total' => $totalPenilaian,
                'final' => $penilaianFinal,
                'draft' => $totalPenilaian - $penilaianFinal,
                'rata_nilai' => $rataNilaiAkhir !== null ? round($rataNilaiAkhir, 2) : null,
                'gradeDistribution' => $gradeDistribution,
                'perMataKuliah' => $penilaianPerMataKuliah,
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
                'aktif' => $dosenByStatus->get('aktif', 0),
                'nonaktif' => $dosenByStatus->get('nonaktif', 0),
                'pensiun' => $dosenByStatus->get('pensiun', 0),
                'byJabatan' => $dosenByJabatan,
            ],
            'krsDetail' => [
                'total_disetujui' => (int) ($sksAgg->total_krs ?? 0),
                'total_sks' => (int) ($sksAgg->total_sks ?? 0),
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
            'krsEnrollmentStatistics' => $krsEnrollmentStatistics,
        ];
    }
}
