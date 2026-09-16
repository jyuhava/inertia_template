<?php

namespace App\Http\Controllers\Mahasiswa;

use App\Http\Controllers\Controller;
use App\Models\Absensi;
use App\Models\JadwalKuliah;
use App\Models\Krs;
use App\Models\Mahasiswa;
use App\Models\PeriodeKrs;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AbsensiController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        $mahasiswa = Mahasiswa::with('prodi')->where('user_id', $user->id)->first();
        
        if (!$mahasiswa) {
            return redirect()->route('mahasiswa.dashboard')
                ->with('error', 'Data mahasiswa tidak ditemukan');
        }

        // Get active periode KRS or selected periode
        $selectedPeriodeId = $request->get('periode_krs_id');
        
        if ($selectedPeriodeId) {
            $periodeKrs = PeriodeKrs::with(['tahunAjaran', 'semester'])->find($selectedPeriodeId);
        } else {
            $periodeKrs = PeriodeKrs::with(['tahunAjaran', 'semester'])->where('status', 'aktif')->first();
        }

        // Get all periode KRS for filter
        $periodeKrsList = PeriodeKrs::with(['tahunAjaran', 'semester'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($periode) {
                return [
                    'id' => $periode->id,
                    'label' => $periode->nama_periode ?? (($periode->tahunAjaran ? $periode->tahunAjaran->tahun : 'N/A') . ' - ' . ($periode->semester ? $periode->semester->nama : 'N/A')),
                    'is_active' => $periode->status === 'aktif'
                ];
            });

        // Get KRS data for this mahasiswa and periode
        $krsList = [];
        $statistik = [
            'total_mata_kuliah' => 0,
            'rata_rata_kehadiran' => 0
        ];

        if ($periodeKrs) {
            $krsList = Krs::with([
                'jadwalKuliah.mataKuliah',
                'jadwalKuliah.dosen',
                'jadwalKuliah.semester'
            ])
            ->where('mahasiswa_id', $mahasiswa->id)
            ->where('periode_krs_id', $periodeKrs->id)
            ->whereIn('status', ['disetujui', 'diambil'])
            ->get()
            ->map(function ($krs) use ($mahasiswa, $periodeKrs) {
                $jadwalKuliah = $krs->jadwalKuliah;
                
                // Skip if jadwalKuliah is null
                if (!$jadwalKuliah) {
                    return null;
                }
                
                // Get absensi data for this jadwal
                $absensiData = Absensi::where('mahasiswa_id', $mahasiswa->id)
                    ->where('jadwal_kuliah_id', $jadwalKuliah->id)
                    ->where('periode_krs_id', $periodeKrs->id)
                    ->get();
                
                $totalPertemuan = $absensiData->count();
                $hadir = $absensiData->where('status', 'hadir')->count();
                $tidakHadir = $absensiData->where('status', 'tidak_hadir')->count();
                $izin = $absensiData->where('status', 'izin')->count();
                $sakit = $absensiData->where('status', 'sakit')->count();
                
                $persentaseKehadiran = $totalPertemuan > 0 
                    ? round(($hadir / $totalPertemuan) * 100, 1) 
                    : 0;
                
                return [
                    'id' => $krs->id,
                    'jadwal_kuliah_id' => $jadwalKuliah->id,
                    'kode_mata_kuliah' => $jadwalKuliah->mataKuliah ? $jadwalKuliah->mataKuliah->kode_mata_kuliah : '-',
                    'nama_mata_kuliah' => $jadwalKuliah->mataKuliah ? $jadwalKuliah->mataKuliah->nama_mata_kuliah : '-',
                    'sks' => $jadwalKuliah->mataKuliah ? $jadwalKuliah->mataKuliah->sks : 0,
                    'dosen' => $jadwalKuliah->dosen ? $jadwalKuliah->dosen->nama_lengkap : '-',
                    'hari' => $jadwalKuliah->hari ?? '-',
                    'jam_mulai' => $jadwalKuliah->jam_mulai ? Carbon::parse($jadwalKuliah->jam_mulai)->format('H:i') : '-',
                    'jam_selesai' => $jadwalKuliah->jam_selesai ? Carbon::parse($jadwalKuliah->jam_selesai)->format('H:i') : '-',
                    'ruangan' => $jadwalKuliah->ruangan ?? '-',
                    'total_pertemuan' => $totalPertemuan,
                    'hadir' => $hadir,
                    'tidak_hadir' => $tidakHadir,
                    'izin' => $izin,
                    'sakit' => $sakit,
                    'persentase_kehadiran' => $persentaseKehadiran,
                    'status_kehadiran' => $this->getStatusKehadiran($persentaseKehadiran)
                ];
            })
            ->filter(); // Remove null values

            // Calculate statistics
            $statistik['total_mata_kuliah'] = $krsList->count();
            $statistik['rata_rata_kehadiran'] = $krsList->count() > 0 
                ? round($krsList->avg('persentase_kehadiran'), 1)
                : 0;
        }

        return Inertia::render('Mahasiswa/Absensi/Index', [
            'mahasiswa' => [
                'nim' => $mahasiswa->nim,
                'nama' => $mahasiswa->nama_lengkap,
                'prodi' => $mahasiswa->prodi ? $mahasiswa->prodi->nama_prodi : '-'
            ],
            'periodeKrs' => $periodeKrs ? [
                'id' => $periodeKrs->id,
                'tahun_ajaran' => $periodeKrs->tahunAjaran ? $periodeKrs->tahunAjaran->tahun : 'N/A',
                'semester' => $periodeKrs->semester ? $periodeKrs->semester->nama : 'N/A'
            ] : null,
            'periodeKrsList' => $periodeKrsList,
            'krsList' => $krsList,
            'statistik' => $statistik
        ]);
    }

    /**
     * Show detail absensi for specific jadwal kuliah
     */
    public function show(Request $request, JadwalKuliah $jadwalKuliah)
    {
        $user = auth()->user();
        $mahasiswa = Mahasiswa::with('prodi')->where('user_id', $user->id)->first();
        
        if (!$mahasiswa) {
            return redirect()->route('mahasiswa.dashboard')
                ->with('error', 'Data mahasiswa tidak ditemukan');
        }

        // Get periode KRS
        $periodeKrsId = $request->get('periode_krs_id');
        if (!$periodeKrsId) {
            $periodeKrs = PeriodeKrs::with(['tahunAjaran', 'semester'])->where('status', 'aktif')->first();
            $periodeKrsId = $periodeKrs ? $periodeKrs->id : null;
        } else {
            $periodeKrs = PeriodeKrs::with(['tahunAjaran', 'semester'])->find($periodeKrsId);
        }

        if (!$periodeKrs) {
            return redirect()->route('mahasiswa.absensi.index')
                ->with('error', 'Periode KRS tidak ditemukan');
        }

        // Check if mahasiswa has KRS for this jadwal
        $krs = Krs::where('mahasiswa_id', $mahasiswa->id)
            ->where('jadwal_kuliah_id', $jadwalKuliah->id)
            ->where('periode_krs_id', $periodeKrs->id)
            ->whereIn('status', ['disetujui', 'diambil'])
            ->first();

        if (!$krs) {
            return redirect()->route('mahasiswa.absensi.index')
                ->with('error', 'Anda tidak terdaftar di mata kuliah ini');
        }

        // Load jadwal kuliah with relations
        $jadwalKuliah->load(['mataKuliah', 'dosen', 'semester']);

        // Get all absensi records
        $absensiList = Absensi::where('mahasiswa_id', $mahasiswa->id)
            ->where('jadwal_kuliah_id', $jadwalKuliah->id)
            ->where('periode_krs_id', $periodeKrs->id)
            ->orderBy('tanggal', 'asc')
            ->orderBy('jam_mulai', 'asc')
            ->get()
            ->map(function ($absensi, $index) {
                return [
                    'id' => $absensi->id,
                    'pertemuan_ke' => $index + 1,
                    'tanggal' => $absensi->tanggal->format('Y-m-d'),
                    'tanggal_formatted' => $absensi->tanggal->isoFormat('dddd, D MMMM Y'),
                    'jam_mulai' => $absensi->jam_mulai ? Carbon::parse($absensi->jam_mulai)->format('H:i') : '-',
                    'jam_selesai' => $absensi->jam_selesai ? Carbon::parse($absensi->jam_selesai)->format('H:i') : '-',
                    'status' => $absensi->status,
                    'status_display' => $absensi->status_display,
                    'status_badge_color' => $absensi->status_badge_color,
                    'keterangan' => $absensi->keterangan
                ];
            });

        // Calculate statistics
        $totalPertemuan = $absensiList->count();
        $statistik = [
            'total_pertemuan' => $totalPertemuan,
            'hadir' => $absensiList->where('status', 'hadir')->count(),
            'tidak_hadir' => $absensiList->where('status', 'tidak_hadir')->count(),
            'izin' => $absensiList->where('status', 'izin')->count(),
            'sakit' => $absensiList->where('status', 'sakit')->count(),
            'persentase_kehadiran' => $totalPertemuan > 0 
                ? round(($absensiList->where('status', 'hadir')->count() / $totalPertemuan) * 100, 1)
                : 0
        ];

        return Inertia::render('Mahasiswa/Absensi/Detail', [
            'mahasiswa' => [
                'nim' => $mahasiswa->nim,
                'nama' => $mahasiswa->nama_lengkap,
                'prodi' => $mahasiswa->prodi ? $mahasiswa->prodi->nama_prodi : '-'
            ],
            'jadwalKuliah' => [
                'id' => $jadwalKuliah->id,
                'kode_mata_kuliah' => $jadwalKuliah->mataKuliah ? $jadwalKuliah->mataKuliah->kode_mata_kuliah : '-',
                'nama_mata_kuliah' => $jadwalKuliah->mataKuliah ? $jadwalKuliah->mataKuliah->nama_mata_kuliah : '-',
                'sks' => $jadwalKuliah->mataKuliah ? $jadwalKuliah->mataKuliah->sks : 0,
                'dosen' => $jadwalKuliah->dosen ? $jadwalKuliah->dosen->nama_lengkap : '-',
                'semester' => $jadwalKuliah->semester ? $jadwalKuliah->semester->nama : '-',
                'hari' => $jadwalKuliah->hari,
                'jam_mulai' => $jadwalKuliah->jam_mulai ? Carbon::parse($jadwalKuliah->jam_mulai)->format('H:i') : '-',
                'jam_selesai' => $jadwalKuliah->jam_selesai ? Carbon::parse($jadwalKuliah->jam_selesai)->format('H:i') : '-',
                'ruangan' => $jadwalKuliah->ruangan
            ],
            'periodeKrs' => [
                'id' => $periodeKrs->id,
                'tahun_ajaran' => $periodeKrs->tahunAjaran ? $periodeKrs->tahunAjaran->tahun : 'N/A',
                'semester' => $periodeKrs->semester ? $periodeKrs->semester->nama : 'N/A'
            ],
            'absensiList' => $absensiList,
            'statistik' => $statistik
        ]);
    }

    /**
     * Get status kehadiran based on percentage
     */
    private function getStatusKehadiran($persentase)
    {
        if ($persentase >= 80) {
            return ['label' => 'Baik', 'color' => 'green'];
        } elseif ($persentase >= 70) {
            return ['label' => 'Cukup', 'color' => 'yellow'];
        } else {
            return ['label' => 'Kurang', 'color' => 'red'];
        }
    }

    /**
     * Cetak Rekap Kehadiran Semua Mata Kuliah pada periode tertentu
     */
    public function cetak(Request $request)
    {
        $user = auth()->user();
        $mahasiswa = Mahasiswa::with('prodi')->where('user_id', $user->id)->first();
        
        if (!$mahasiswa) {
            return redirect()->route('dashboard')
                ->with('error', 'Data mahasiswa tidak ditemukan');
        }

        $selectedPeriodeId = $request->get('periode_krs_id');
        if ($selectedPeriodeId) {
            $periodeKrs = PeriodeKrs::with(['tahunAjaran', 'semester'])->find($selectedPeriodeId);
        } else {
            $periodeKrs = PeriodeKrs::with(['tahunAjaran', 'semester'])->where('status', 'aktif')->first();
        }

        if (!$periodeKrs) {
            return redirect()->route('absensi.index')->with('error', 'Periode KRS tidak ditemukan');
        }

        $krsList = Krs::with([
            'jadwalKuliah.mataKuliah',
            'jadwalKuliah.dosen',
            'jadwalKuliah.semester'
        ])
        ->where('mahasiswa_id', $mahasiswa->id)
        ->where('periode_krs_id', $periodeKrs->id)
        ->whereIn('status', ['disetujui', 'diambil'])
        ->get()
        ->map(function ($krs) use ($mahasiswa, $periodeKrs) {
            $jadwalKuliah = $krs->jadwalKuliah;
            if (!$jadwalKuliah) return null;

            $absensiData = Absensi::where('mahasiswa_id', $mahasiswa->id)
                ->where('jadwal_kuliah_id', $jadwalKuliah->id)
                ->where('periode_krs_id', $periodeKrs->id)
                ->get();

            $totalPertemuan = $absensiData->count();
            $hadir = $absensiData->where('status', 'hadir')->count();
            $tidakHadir = $absensiData->where('status', 'tidak_hadir')->count();
            $izin = $absensiData->where('status', 'izin')->count();
            $sakit = $absensiData->where('status', 'sakit')->count();

            $persentaseKehadiran = $totalPertemuan > 0 
                ? round(($hadir / $totalPertemuan) * 100, 1) 
                : 0;

            return [
                'id' => $krs->id,
                'jadwal_kuliah_id' => $jadwalKuliah->id,
                'kode_mata_kuliah' => $jadwalKuliah->mataKuliah ? $jadwalKuliah->mataKuliah->kode_mata_kuliah : '-',
                'nama_mata_kuliah' => $jadwalKuliah->mataKuliah ? $jadwalKuliah->mataKuliah->nama_mata_kuliah : '-',
                'sks' => $jadwalKuliah->mataKuliah ? $jadwalKuliah->mataKuliah->sks : 0,
                'dosen' => $jadwalKuliah->dosen ? $jadwalKuliah->dosen->nama_lengkap : '-',
                'hari' => $jadwalKuliah->hari ?? '-',
                'jam_mulai' => $jadwalKuliah->jam_mulai ? Carbon::parse($jadwalKuliah->jam_mulai)->format('H:i') : '-',
                'jam_selesai' => $jadwalKuliah->jam_selesai ? Carbon::parse($jadwalKuliah->jam_selesai)->format('H:i') : '-',
                'ruangan' => $jadwalKuliah->ruangan ?? '-',
                'total_pertemuan' => $totalPertemuan,
                'hadir' => $hadir,
                'tidak_hadir' => $tidakHadir,
                'izin' => $izin,
                'sakit' => $sakit,
                'persentase_kehadiran' => $persentaseKehadiran,
                'status_kehadiran' => $this->getStatusKehadiran($persentaseKehadiran)
            ];
        })
        ->filter();

        $statistik = [
            'total_mata_kuliah' => $krsList->count(),
            'total_sks' => $krsList->sum('sks'),
            'total_pertemuan' => $krsList->sum('total_pertemuan'),
            'total_hadir' => $krsList->sum('hadir'),
            'total_tidak_hadir' => $krsList->sum('tidak_hadir'),
            'total_izin' => $krsList->sum('izin'),
            'total_sakit' => $krsList->sum('sakit'),
            'rata_rata_kehadiran' => $krsList->count() > 0 
                ? round($krsList->avg('persentase_kehadiran'), 1)
                : 0
        ];

        return Inertia::render('Mahasiswa/Absensi/Cetak', [
            'mahasiswa' => $mahasiswa,
            'periodeKrs' => $periodeKrs,
            'krsList' => $krsList->values(),
            'statistik' => $statistik,
            'tanggalCetak' => now()->format('d/m/Y')
        ]);
    }

    /**
     * Cetak Detail Kehadiran 1 Mata Kuliah
     */
    public function cetakDetail(Request $request, JadwalKuliah $jadwalKuliah)
    {
        $user = auth()->user();
        $mahasiswa = Mahasiswa::with('prodi')->where('user_id', $user->id)->first();
        
        if (!$mahasiswa) {
            return redirect()->route('dashboard')
                ->with('error', 'Data mahasiswa tidak ditemukan');
        }

        $periodeKrsId = $request->get('periode_krs_id');
        if (!$periodeKrsId) {
            $periodeKrs = PeriodeKrs::with(['tahunAjaran', 'semester'])->where('status', 'aktif')->first();
        } else {
            $periodeKrs = PeriodeKrs::with(['tahunAjaran', 'semester'])->find($periodeKrsId);
        }

        if (!$periodeKrs) {
            return redirect()->route('absensi.index')->with('error', 'Periode KRS tidak ditemukan');
        }

        $krs = Krs::where('mahasiswa_id', $mahasiswa->id)
            ->where('jadwal_kuliah_id', $jadwalKuliah->id)
            ->where('periode_krs_id', $periodeKrs->id)
            ->whereIn('status', ['disetujui', 'diambil'])
            ->first();

        if (!$krs) {
            return redirect()->route('absensi.index')->with('error', 'Anda tidak terdaftar di mata kuliah ini');
        }

        $jadwalKuliah->load(['mataKuliah', 'dosen', 'semester']);

        $absensiList = Absensi::where('mahasiswa_id', $mahasiswa->id)
            ->where('jadwal_kuliah_id', $jadwalKuliah->id)
            ->where('periode_krs_id', $periodeKrs->id)
            ->orderBy('tanggal', 'asc')
            ->orderBy('jam_mulai', 'asc')
            ->get()
            ->map(function ($absensi, $index) {
                return [
                    'id' => $absensi->id,
                    'pertemuan_ke' => $index + 1,
                    'tanggal' => $absensi->tanggal->format('Y-m-d'),
                    'tanggal_formatted' => $absensi->tanggal->isoFormat('dddd, D MMMM Y'),
                    'jam_mulai' => $absensi->jam_mulai ? Carbon::parse($absensi->jam_mulai)->format('H:i') : '-',
                    'jam_selesai' => $absensi->jam_selesai ? Carbon::parse($absensi->jam_selesai)->format('H:i') : '-',
                    'status' => $absensi->status,
                    'status_display' => $absensi->status_display,
                    'keterangan' => $absensi->keterangan
                ];
            });

        $totalPertemuan = $absensiList->count();
        $statistik = [
            'total_pertemuan' => $totalPertemuan,
            'hadir' => $absensiList->where('status', 'hadir')->count(),
            'tidak_hadir' => $absensiList->where('status', 'tidak_hadir')->count(),
            'izin' => $absensiList->where('status', 'izin')->count(),
            'sakit' => $absensiList->where('status', 'sakit')->count(),
            'persentase_kehadiran' => $totalPertemuan > 0 
                ? round(($absensiList->where('status', 'hadir')->count() / $totalPertemuan) * 100, 1)
                : 0
        ];

        return Inertia::render('Mahasiswa/Absensi/CetakDetail', [
            'mahasiswa' => $mahasiswa,
            'jadwalKuliah' => [
                'id' => $jadwalKuliah->id,
                'kode_mata_kuliah' => $jadwalKuliah->mataKuliah ? $jadwalKuliah->mataKuliah->kode_mata_kuliah : '-',
                'nama_mata_kuliah' => $jadwalKuliah->mataKuliah ? $jadwalKuliah->mataKuliah->nama_mata_kuliah : '-',
                'sks' => $jadwalKuliah->mataKuliah ? $jadwalKuliah->mataKuliah->sks : 0,
                'dosen' => $jadwalKuliah->dosen ? $jadwalKuliah->dosen->nama_lengkap : '-',
                'semester' => $jadwalKuliah->semester ? $jadwalKuliah->semester->nama : '-',
                'hari' => $jadwalKuliah->hari,
                'jam_mulai' => $jadwalKuliah->jam_mulai ? Carbon::parse($jadwalKuliah->jam_mulai)->format('H:i') : '-',
                'jam_selesai' => $jadwalKuliah->jam_selesai ? Carbon::parse($jadwalKuliah->jam_selesai)->format('H:i') : '-',
                'ruangan' => $jadwalKuliah->ruangan
            ],
            'periodeKrs' => $periodeKrs,
            'absensiList' => $absensiList,
            'statistik' => $statistik,
            'tanggalCetak' => now()->format('d/m/Y')
        ]);
    }
}
