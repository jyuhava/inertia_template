<?php

namespace App\Http\Controllers\Mahasiswa;

use App\Http\Controllers\Controller;
use App\Models\Mahasiswa;
use App\Models\PeriodeKrs;
use App\Models\Krs;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class SuratAktifController extends Controller
{
    /**
     * Display Surat Keterangan Mahasiswa Aktif overview page
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        $mahasiswa = Mahasiswa::with('prodi')->where('user_id', $user->id)->first();

        if (!$mahasiswa) {
            return redirect()->route('dashboard')->with('error', 'Data mahasiswa tidak ditemukan.');
        }

        // Get active periode KRS
        $periodeAktif = PeriodeKrs::with(['tahunAjaran', 'semester'])->where('status', 'aktif')->first();

        if (!$periodeAktif) {
            $periodeAktif = PeriodeKrs::with(['tahunAjaran', 'semester'])->orderBy('created_at', 'desc')->first();
        }

        // Check active KRS in this period
        $krsList = [];
        $totalSks = 0;
        if ($periodeAktif) {
            $krsList = Krs::with(['jadwalKuliah.mataKuliah'])
                ->where('mahasiswa_id', $mahasiswa->id)
                ->where('periode_krs_id', $periodeAktif->id)
                ->whereIn('status', ['disetujui', 'diambil'])
                ->get();
            
            $totalSks = $krsList->sum(function($k) {
                return $k->jadwalKuliah && $k->jadwalKuliah->mataKuliah ? $k->jadwalKuliah->mataKuliah->sks : 0;
            });
        }

        $nomorSurat = $this->generateNomorSurat($mahasiswa, $periodeAktif);

        return Inertia::render('Mahasiswa/SuratAktif/Index', [
            'mahasiswa' => $mahasiswa,
            'periodeAktif' => $periodeAktif,
            'totalSks' => $totalSks,
            'nomorSurat' => $nomorSurat,
            'tanggalHariIni' => Carbon::now()->isoFormat('D MMMM Y'),
        ]);
    }

    /**
     * Printable view of Surat Keterangan Mahasiswa Aktif
     */
    public function cetak(Request $request)
    {
        $user = auth()->user();
        $mahasiswa = Mahasiswa::with('prodi')->where('user_id', $user->id)->first();

        if (!$mahasiswa) {
            return redirect()->route('dashboard')->with('error', 'Data mahasiswa tidak ditemukan.');
        }

        $periodeAktif = PeriodeKrs::with(['tahunAjaran', 'semester'])->where('status', 'aktif')->first();
        if (!$periodeAktif) {
            $periodeAktif = PeriodeKrs::with(['tahunAjaran', 'semester'])->orderBy('created_at', 'desc')->first();
        }

        $keperluan = $request->get('keperluan', 'Persyaratan Kelengkapan Administrasi dan Akademik');
        $nomorSurat = $this->generateNomorSurat($mahasiswa, $periodeAktif);

        return Inertia::render('Mahasiswa/SuratAktif/Cetak', [
            'mahasiswa' => $mahasiswa,
            'periodeAktif' => $periodeAktif,
            'nomorSurat' => $nomorSurat,
            'keperluan' => $keperluan,
            'tanggalCetak' => now()->format('d/m/Y'),
        ]);
    }

    /**
     * Generate standard document number
     */
    private function generateNomorSurat($mahasiswa, $periodeAktif)
    {
        $bulanRomawi = [
            1 => 'I', 2 => 'II', 3 => 'III', 4 => 'IV',
            5 => 'V', 6 => 'VI', 7 => 'VII', 8 => 'VIII',
            9 => 'IX', 10 => 'X', 11 => 'XI', 12 => 'XII'
        ];

        $bulan = $bulanRomawi[now()->month] ?? 'VIII';
        $tahun = now()->year;
        $suffix = substr($mahasiswa->nim, -4) ?: '0001';

        return "421.4/STIT-AW/AKD-KM/{$suffix}/{$bulan}/{$tahun}";
    }
}

