<?php

namespace App\Http\Controllers\Mahasiswa;

use App\Http\Controllers\Controller;
use App\Models\Mahasiswa;
use App\Models\PeriodeKrs;
use App\Models\Krs;
use App\Models\Penilaian;
use App\Models\Semester;
use Illuminate\Http\Request;
use Inertia\Inertia;

class KhsController extends Controller
{
    /**
     * Kontrol visibilitas nilai
     * Jika false, semua nilai akan dinolkan
     */
    private $isVisible;

    /**
     * Constructor
     */
    public function __construct($isVisible = true)
    {
        $this->isVisible = $isVisible;
    }

    /**
     * Tampilkan daftar KHS mahasiswa
     */
    public function index()
    {
        $user = auth()->user();
        $mahasiswa = Mahasiswa::where('user_id', $user->id)->first();

        if (!$mahasiswa) {
            return redirect()->route('dashboard')->with('error', 'Data mahasiswa tidak ditemukan.');
        }

        // Get semua periode KRS yang pernah diambil mahasiswa
        $periodeKrs = PeriodeKrs::whereHas('krs', function($query) use ($mahasiswa) {
            $query->where('mahasiswa_id', $mahasiswa->id)
                  ->whereIn('status', ['disetujui']);
        })->with('semester', 'tahunAjaran')
          ->orderBy('created_at', 'desc')
          ->get();

        // Hitung IPK keseluruhan
        $ipk = $this->isVisible ? $this->hitungIPK($mahasiswa->id) : 0;

        return Inertia::render('Mahasiswa/Khs/Index', [
            'mahasiswa' => $mahasiswa,
            'periodeKrs' => $periodeKrs,
            'ipk' => $ipk,
            'isVisible' => $this->isVisible
        ]);
    }

    /**
     * Tampilkan detail KHS untuk periode tertentu
     */
    public function show(PeriodeKrs $periodeKrs)
    {
        $user = auth()->user();
        $mahasiswa = Mahasiswa::where('user_id', $user->id)->first();

        if (!$mahasiswa) {
            return redirect()->route('dashboard')->with('error', 'Data mahasiswa tidak ditemukan.');
        }

                // Get mata kuliah yang diambil pada periode ini
        $krsList = Krs::with(['jadwalKuliah.mataKuliah'])
            ->where('mahasiswa_id', $mahasiswa->id)
            ->where('periode_krs_id', $periodeKrs->id)
            ->whereIn('status', ['disetujui'])
            ->get();

        $krs = $krsList->map(function($krs) {
            $mataKuliah = $krs->jadwalKuliah->mataKuliah;
            
            // Get penilaian untuk KRS ini
            $penilaian = Penilaian::where('mahasiswa_id', $krs->mahasiswa_id)
                                 ->where('jadwal_kuliah_id', $krs->jadwal_kuliah_id)
                                 ->where('periode_krs_id', $krs->periode_krs_id)
                                 ->first();
            
            return [
                'kode_mata_kuliah' => $mataKuliah->kode_mata_kuliah,
                'nama_mata_kuliah' => $mataKuliah->nama_mata_kuliah,
                'sks' => $mataKuliah->sks,
                'nilai_angka' => $this->isVisible && $penilaian ? $penilaian->nilai_akhir : null,
                'nilai_huruf' => $this->isVisible && $penilaian ? $this->hitungNilaiHuruf($penilaian->nilai_akhir) : '-',
                'bobot' => $this->isVisible && $penilaian ? $this->hitungBobot($penilaian->nilai_akhir) : 0,
                'mutu' => $this->isVisible && $penilaian ? ($this->hitungBobot($penilaian->nilai_akhir) * $mataKuliah->sks) : 0,
            ];
        });

        // Hitung IPS semester ini
        $totalSks = $krs->sum('sks');
        $totalMutu = $this->isVisible ? $krs->sum('mutu') : 0;
        $ips = $this->isVisible && $totalSks > 0 ? round($totalMutu / $totalSks, 2) : 0;

        // Hitung IPK sampai semester ini
        $ipk = $this->isVisible ? $this->hitungIPK($mahasiswa->id, $periodeKrs->id) : 0;

        $periodeKrs->load('semester', 'tahunAjaran');

        return Inertia::render('Mahasiswa/Khs/Show', [
            'mahasiswa' => $mahasiswa,
            'periodeKrs' => $periodeKrs,
            'krs' => $krs,
            'ips' => $ips,
            'ipk' => $ipk,
            'totalSks' => $totalSks,
            'totalMutu' => $totalMutu,
            'isVisible' => $this->isVisible
        ]);
    }

    /**
     * Generate PDF KHS
     */
    public function cetakKhs(PeriodeKrs $periodeKrs)
    {
        $user = auth()->user();
        $mahasiswa = Mahasiswa::where('user_id', $user->id)->first();

        if (!$mahasiswa) {
            return redirect()->route('dashboard')->with('error', 'Data mahasiswa tidak ditemukan.');
        }

        // Get data yang sama seperti di show
        $krsList = Krs::with(['jadwalKuliah.mataKuliah'])
            ->where('mahasiswa_id', $mahasiswa->id)
            ->where('periode_krs_id', $periodeKrs->id)
            ->whereIn('status', ['disetujui'])
            ->get();

        $krs = $krsList->map(function($krs) {
            $mataKuliah = $krs->jadwalKuliah->mataKuliah;
            
            // Get penilaian untuk KRS ini
            $penilaian = Penilaian::where('mahasiswa_id', $krs->mahasiswa_id)
                                 ->where('jadwal_kuliah_id', $krs->jadwal_kuliah_id)
                                 ->where('periode_krs_id', $krs->periode_krs_id)
                                 ->first();
            
            return [
                'kode_mata_kuliah' => $mataKuliah->kode_mata_kuliah,
                'nama_mata_kuliah' => $mataKuliah->nama_mata_kuliah,
                'sks' => $mataKuliah->sks,
                'nilai_angka' => $this->isVisible && $penilaian ? $penilaian->nilai_akhir : null,
                'nilai_huruf' => $this->isVisible && $penilaian ? $this->hitungNilaiHuruf($penilaian->nilai_akhir) : '-',
                'bobot' => $this->isVisible && $penilaian ? $this->hitungBobot($penilaian->nilai_akhir) : 0,
                'mutu' => $this->isVisible && $penilaian ? ($this->hitungBobot($penilaian->nilai_akhir) * $mataKuliah->sks) : 0,
            ];
        });

        $totalSks = $krs->sum('sks');
        $totalMutu = $this->isVisible ? $krs->sum('mutu') : 0;
        $ips = $this->isVisible && $totalSks > 0 ? round($totalMutu / $totalSks, 2) : 0;
        $ipk = $this->isVisible ? $this->hitungIPK($mahasiswa->id, $periodeKrs->id) : 0;

        $periodeKrs->load('semester', 'tahunAjaran');
        $mahasiswa->load('prodi');

        // For now, return view for PDF. You can integrate with DomPDF or similar later
        return Inertia::render('Mahasiswa/Khs/Cetak', [
            'mahasiswa' => $mahasiswa,
            'periodeKrs' => $periodeKrs,
            'krs' => $krs,
            'ips' => $ips,
            'ipk' => $ipk,
            'totalSks' => $totalSks,
            'totalMutu' => $totalMutu,
            'tanggalCetak' => now()->format('d/m/Y'),
            'isVisible' => $this->isVisible
        ]);
    }

    /**
     * Hitung nilai huruf berdasarkan nilai angka
     */
    private function hitungNilaiHuruf($nilaiAngka)
    {
        if ($nilaiAngka >= 85) return 'A';
        if ($nilaiAngka >= 80) return 'A-';
        if ($nilaiAngka >= 75) return 'B+';
        if ($nilaiAngka >= 70) return 'B';
        if ($nilaiAngka >= 65) return 'B-';
        if ($nilaiAngka >= 60) return 'C+';
        if ($nilaiAngka >= 55) return 'C';
        if ($nilaiAngka >= 50) return 'C-';
        if ($nilaiAngka >= 45) return 'D+';
        if ($nilaiAngka >= 40) return 'D';
        return 'E';
    }

    /**
     * Hitung bobot nilai berdasarkan nilai angka
     */
    private function hitungBobot($nilaiAngka)
    {
        if ($nilaiAngka >= 85) return 4.0;
        if ($nilaiAngka >= 80) return 3.7;
        if ($nilaiAngka >= 75) return 3.3;
        if ($nilaiAngka >= 70) return 3.0;
        if ($nilaiAngka >= 65) return 2.7;
        if ($nilaiAngka >= 60) return 2.3;
        if ($nilaiAngka >= 55) return 2.0;
        if ($nilaiAngka >= 50) return 1.7;
        if ($nilaiAngka >= 45) return 1.3;
        if ($nilaiAngka >= 40) return 1.0;
        return 0.0;
    }

    /**
     * Hitung IPK mahasiswa sampai periode tertentu
     */
    private function hitungIPK($mahasiswaId, $sampaiPeriodeId = null)
    {
        $query = Krs::with(['jadwalKuliah.mataKuliah', 'penilaian'])
            ->where('mahasiswa_id', $mahasiswaId)
            ->whereIn('status', ['disetujui'])
            ->whereHas('penilaian', function($q) {
                $q->whereNotNull('nilai_akhir');
            });

        if ($sampaiPeriodeId) {
            // Get semua periode sampai periode yang ditentukan
            $periodeIds = PeriodeKrs::where('id', '<=', $sampaiPeriodeId)
                ->pluck('id');
            $query->whereIn('periode_krs_id', $periodeIds);
        }

        $allKrs = $query->get();

        $totalSks = 0;
        $totalMutu = 0;

        foreach ($allKrs as $krs) {
            $sks = $krs->jadwalKuliah->mataKuliah->sks;
            $bobot = $this->hitungBobot($krs->penilaian->nilai_akhir);
            
            $totalSks += $sks;
            $totalMutu += ($bobot * $sks);
        }

        return $totalSks > 0 ? round($totalMutu / $totalSks, 2) : 0;
    }
}
