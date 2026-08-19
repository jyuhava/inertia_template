<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CalonMahasiswa;
use App\Models\Mahasiswa;
use App\Models\Dosen;
use App\Models\Prodi;
use App\Models\MataKuliah;
use App\Models\JadwalKuliah;
use App\Models\Krs;
use App\Models\LmsCourse;
use App\Models\PeriodeKrs;
use App\Models\PeriodePmb;
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
                    'jumlah' => $prodi->mahasiswas_count
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
                    'jumlah' => $item->total
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
                    'approved_by' => $krs->approvedBy ? $krs->approvedBy->name : null
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
                    'waktu' => ($jadwal->jam_mulai?->format('H:i') ?? '-') . ' - ' . ($jadwal->jam_selesai?->format('H:i') ?? '-'),
                    'ruangan' => $jadwal->ruangan,
                    'semester' => $jadwal->semester->nama_semester
                ];
            });
        
        $userByRole = [
            'admin' => User::where('role', 'admin')->count(),
            'dosen' => User::where('role', 'dosen')->count(),
            'mahasiswa' => User::where('role', 'mahasiswa')->count(),
            'calon_mahasiswa' => User::where('role', 'calon_mahasiswa')->count(),
        ];

        return Inertia::render('Admin/Dashboard', [
            'statistics' => [
                'mahasiswa' => [
                    'total' => $totalMahasiswa,
                    'aktif' => $mahasiswaAktif,
                    'lulus' => $mahasiswaLulus,
                    'nonaktif' => $mahasiswaNonaktif
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
                'tanggal_selesai' => $periodeAktif->tanggal_selesai->format('d/m/Y')
            ] : null,
            'krsStatistics' => $krsStatistics,
            'mahasiswaByProdi' => $mahasiswaByProdi,
            'mahasiswaByAngkatan' => $mahasiswaByAngkatan,
            'recentKrs' => $recentKrs,
            'jadwalHariIni' => $jadwalHariIni,
            'pmbStatistics' => $pmbStatistics,
            'userByRole' => $userByRole,
        ]);
    }
}
