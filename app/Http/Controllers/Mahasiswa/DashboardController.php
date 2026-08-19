<?php

namespace App\Http\Controllers\Mahasiswa;

use App\Http\Controllers\Controller;
use App\Models\Absensi;
use App\Models\Krs;
use App\Models\Mahasiswa;
use App\Models\Penilaian;
use App\Models\PeriodeKrs;
use Illuminate\Support\Str;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $mahasiswa = Mahasiswa::with('prodi')->where('user_id', $user->id)->first();

        if (! $mahasiswa) {
            return redirect()->route('dashboard')->with('error', 'Data mahasiswa tidak ditemukan.');
        }

        $periodeAktif = PeriodeKrs::aktif()
            ->with(['tahunAjaran', 'semester'])
            ->first();

        $krsAktif = collect();
        $krsSummary = [
            'disetujui' => 0,
            'menunggu' => 0,
            'ditolak' => 0,
            'dibatalkan' => 0,
        ];
        $todaySchedule = [];
        $attendanceRate = 0;

        if ($periodeAktif) {
            $krsAktif = Krs::with(['jadwalKuliah.mataKuliah', 'jadwalKuliah.dosen', 'jadwalKuliah.lmsCourse'])
                ->where('mahasiswa_id', $mahasiswa->id)
                ->where('periode_krs_id', $periodeAktif->id)
                ->get();

            $krsSummary = [
                'disetujui' => $krsAktif->where('status', 'disetujui')->count(),
                'menunggu' => $krsAktif->where('status', 'menunggu_persetujuan')->count(),
                'ditolak' => $krsAktif->where('status', 'ditolak')->count(),
                'dibatalkan' => $krsAktif->where('status', 'dibatalkan')->count(),
            ];

            $hariIni = Str::ucfirst(now()->locale('id')->dayName);

            $todaySchedule = $krsAktif
                ->filter(function ($krs) use ($hariIni) {
                    return in_array($krs->status, ['disetujui', 'diambil'], true)
                        && $krs->jadwalKuliah
                        && $krs->jadwalKuliah->hari === $hariIni;
                })
                ->sortBy(fn ($krs) => $krs->jadwalKuliah->jam_mulai?->format('H:i') ?? '99:99')
                ->values()
                ->map(function ($krs) {
                    $jadwal = $krs->jadwalKuliah;

                    return [
                        'id' => $krs->id,
                        'mata_kuliah' => $jadwal->mataKuliah->nama_mata_kuliah ?? '-',
                        'kode' => $jadwal->mataKuliah->kode_mata_kuliah ?? '-',
                        'sks' => $jadwal->mataKuliah->sks ?? 0,
                        'dosen' => $jadwal->dosen->nama_lengkap ?? '-',
                        'ruangan' => $jadwal->ruangan ?? '-',
                        'jam_mulai' => $jadwal->jam_mulai?->format('H:i') ?? '-',
                        'jam_selesai' => $jadwal->jam_selesai?->format('H:i') ?? '-',
                    ];
                })
                ->all();

            $attendanceRate = Absensi::where('mahasiswa_id', $mahasiswa->id)
                ->where('periode_krs_id', $periodeAktif->id)
                ->selectRaw("COALESCE(ROUND(AVG(CASE WHEN status = 'hadir' THEN 100 ELSE 0 END), 1), 0) as rate")
                ->value('rate') ?? 0;
        }

        $approvedKrsWithScores = Krs::with(['jadwalKuliah.mataKuliah', 'penilaian'])
            ->where('mahasiswa_id', $mahasiswa->id)
            ->where('status', 'disetujui')
            ->whereHas('penilaian', function ($query) {
                $query->whereNotNull('nilai_akhir');
            })
            ->get();

        $totalSksLulus = $approvedKrsWithScores
            ->filter(function ($krs) {
                return $krs->penilaian && (float) $krs->penilaian->nilai_akhir >= 50;
            })
            ->sum(function ($krs) {
                return $krs->jadwalKuliah->mataKuliah->sks ?? 0;
            });

        $totalSksIpk = 0;
        $totalMutuIpk = 0;
        foreach ($approvedKrsWithScores as $krs) {
            $sks = (int) ($krs->jadwalKuliah->mataKuliah->sks ?? 0);
            $nilaiAkhir = (float) ($krs->penilaian->nilai_akhir ?? 0);
            $bobot = $this->nilaiKeBobot($nilaiAkhir);

            $totalSksIpk += $sks;
            $totalMutuIpk += $bobot * $sks;
        }

        $ipk = $totalSksIpk > 0 ? round($totalMutuIpk / $totalSksIpk, 2) : 0;

        $recentScores = Penilaian::with(['jadwalKuliah.mataKuliah', 'periodeKrs.semester'])
            ->where('mahasiswa_id', $mahasiswa->id)
            ->whereNotNull('nilai_akhir')
            ->latest('updated_at')
            ->limit(5)
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'mata_kuliah' => $item->jadwalKuliah->mataKuliah->nama_mata_kuliah ?? '-',
                    'kode' => $item->jadwalKuliah->mataKuliah->kode_mata_kuliah ?? '-',
                    'nilai_akhir' => $item->nilai_akhir,
                    'nilai_huruf' => $item->nilai_huruf ?: $this->nilaiKeHuruf((float) $item->nilai_akhir),
                    'status' => $item->status,
                    'updated_at' => $item->updated_at?->format('d M Y H:i'),
                ];
            });

        $lmsCount = $krsAktif
            ->filter(function ($krs) {
                return in_array($krs->status, ['disetujui', 'diambil'], true)
                    && $krs->jadwalKuliah
                    && $krs->jadwalKuliah->lmsCourse;
            })
            ->count();

        $activeKrsApprovedOrTaken = $krsAktif->filter(function ($krs) {
            return in_array($krs->status, ['disetujui', 'diambil'], true);
        });

        $totalSksAktif = $activeKrsApprovedOrTaken->sum(function ($krs) {
            return $krs->jadwalKuliah->mataKuliah->sks ?? 0;
        });

        return Inertia::render('Mahasiswa/Dashboard', [
            'profile' => [
                'nama_lengkap' => $mahasiswa->nama_lengkap,
                'nim' => $mahasiswa->nim,
                'angkatan' => $mahasiswa->angkatan,
                'status' => $mahasiswa->status,
                'prodi' => $mahasiswa->prodi?->nama_prodi ?? $mahasiswa->program_studi,
            ],
            'periodeAktif' => $periodeAktif ? [
                'nama' => $periodeAktif->nama_periode,
                'tahun_ajaran' => $periodeAktif->tahunAjaran?->tahun,
                'semester' => $periodeAktif->semester?->nama_semester,
                'tanggal_mulai' => $periodeAktif->tanggal_mulai?->format('d M Y'),
                'tanggal_selesai' => $periodeAktif->tanggal_selesai?->format('d M Y'),
            ] : null,
            'stats' => [
                'total_sks_aktif' => $totalSksAktif,
                'mata_kuliah_aktif' => $activeKrsApprovedOrTaken->count(),
                'total_sks_lulus' => $totalSksLulus,
                'ipk' => $ipk,
                'kehadiran' => (float) $attendanceRate,
                'lms_course_count' => $lmsCount,
            ],
            'krsSummary' => $krsSummary,
            'todaySchedule' => $todaySchedule,
            'recentScores' => $recentScores,
        ]);
    }

    private function nilaiKeBobot(float $nilai): float
    {
        if ($nilai >= 85) {
            return 4.0;
        }
        if ($nilai >= 80) {
            return 3.7;
        }
        if ($nilai >= 75) {
            return 3.3;
        }
        if ($nilai >= 70) {
            return 3.0;
        }
        if ($nilai >= 65) {
            return 2.7;
        }
        if ($nilai >= 60) {
            return 2.3;
        }
        if ($nilai >= 55) {
            return 2.0;
        }
        if ($nilai >= 50) {
            return 1.7;
        }
        if ($nilai >= 45) {
            return 1.3;
        }
        if ($nilai >= 40) {
            return 1.0;
        }
        return 0.0;
    }

    private function nilaiKeHuruf(float $nilai): string
    {
        if ($nilai >= 85) {
            return 'A';
        }
        if ($nilai >= 80) {
            return 'A-';
        }
        if ($nilai >= 75) {
            return 'B+';
        }
        if ($nilai >= 70) {
            return 'B';
        }
        if ($nilai >= 65) {
            return 'B-';
        }
        if ($nilai >= 60) {
            return 'C+';
        }
        if ($nilai >= 55) {
            return 'C';
        }
        if ($nilai >= 50) {
            return 'C-';
        }
        if ($nilai >= 45) {
            return 'D+';
        }
        if ($nilai >= 40) {
            return 'D';
        }
        return 'E';
    }
}
