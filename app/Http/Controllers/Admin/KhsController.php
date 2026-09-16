<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Mahasiswa;
use App\Models\PeriodeKrs;
use App\Models\Krs;
use App\Models\Penilaian;
use Illuminate\Http\Request;
use Inertia\Inertia;

class KhsController extends Controller
{
    /**
     * Tampilkan daftar mahasiswa untuk melihat KHS
     */
    public function studentList(Request $request)
    {
        $query = Mahasiswa::with(['prodi'])->orderBy('created_at', 'desc');

        // Search functionality
        if ($request->has('search')) {
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

        $mahasiswas = $query->paginate(10)->withQueryString();

        return Inertia::render('Admin/Khs/StudentList', [
            'mahasiswas' => $mahasiswas,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Tampilkan daftar semester/KHS mahasiswa
     */
    public function index(Mahasiswa $mahasiswa)
    {
        $mahasiswa->load('prodi');

        // Get semua periode KRS yang pernah diambil mahasiswa
        $periodeKrs = PeriodeKrs::whereHas('krs', function($query) use ($mahasiswa) {
            $query->where('mahasiswa_id', $mahasiswa->id)
                  ->whereIn('status', ['disetujui']);
        })->with('semester', 'tahunAjaran')
          ->orderBy('created_at', 'desc')
          ->get();

        // Hitung IPK keseluruhan
        $ipk = $this->hitungIPK($mahasiswa->id);

        return Inertia::render('Admin/Khs/Index', [
            'mahasiswa' => $mahasiswa,
            'periodeKrs' => $periodeKrs,
            'ipk' => $ipk,
        ]);
    }

    /**
     * Tampilkan detail KHS untuk periode tertentu
     */
    public function show(Mahasiswa $mahasiswa, PeriodeKrs $periodeKrs)
    {
        $mahasiswa->load('prodi');
        
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
                'nilai_angka' => $penilaian ? $penilaian->nilai_akhir : null,
                'nilai_huruf' => $penilaian ? $this->hitungNilaiHuruf($penilaian->nilai_akhir) : '-',
                'bobot' => $penilaian ? $this->hitungBobot($penilaian->nilai_akhir) : 0,
                'mutu' => $penilaian ? ($this->hitungBobot($penilaian->nilai_akhir) * $mataKuliah->sks) : 0,
            ];
        });

        // Hitung IPS semester ini
        $totalSks = $krs->sum('sks');
        $totalMutu = $krs->sum('mutu');
        $ips = $totalSks > 0 ? round($totalMutu / $totalSks, 2) : 0;

        // Hitung IPK sampai semester ini
        $ipk = $this->hitungIPK($mahasiswa->id, $periodeKrs->id);

        $periodeKrs->load('semester', 'tahunAjaran');

        return Inertia::render('Admin/Khs/Show', [
            'mahasiswa' => $mahasiswa,
            'periodeKrs' => $periodeKrs,
            'krs' => $krs,
            'ips' => $ips,
            'ipk' => $ipk,
            'totalSks' => $totalSks,
            'totalMutu' => $totalMutu,
        ]);
    }

    /**
     * Generate PDF KHS
     */
    public function print(Mahasiswa $mahasiswa, PeriodeKrs $periodeKrs)
    {
        $mahasiswa->load('prodi');
        
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
                'nilai_angka' => $penilaian ? $penilaian->nilai_akhir : null,
                'nilai_huruf' => $penilaian ? $this->hitungNilaiHuruf($penilaian->nilai_akhir) : '-',
                'bobot' => $penilaian ? $this->hitungBobot($penilaian->nilai_akhir) : 0,
                'mutu' => $penilaian ? ($this->hitungBobot($penilaian->nilai_akhir) * $mataKuliah->sks) : 0,
            ];
        });

        $totalSks = $krs->sum('sks');
        $totalMutu = $krs->sum('mutu');
        $ips = $totalSks > 0 ? round($totalMutu / $totalSks, 2) : 0;
        $ipk = $this->hitungIPK($mahasiswa->id, $periodeKrs->id);

        $periodeKrs->load('semester', 'tahunAjaran');

        return Inertia::render('Admin/Khs/Cetak', [
            'mahasiswa' => $mahasiswa,
            'periodeKrs' => $periodeKrs,
            'krs' => $krs,
            'ips' => $ips,
            'ipk' => $ipk,
            'totalSks' => $totalSks,
            'totalMutu' => $totalMutu,
            'tanggalCetak' => now()->format('d/m/Y'),
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
        $query = Krs::with('jadwalKuliah.mataKuliah')
            ->where('mahasiswa_id', $mahasiswaId)
            ->whereIn('status', ['disetujui']);

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
            // Ambil penilaian dengan nilai akhir yang sudah terisi
            $penilaian = Penilaian::where('mahasiswa_id', $krs->mahasiswa_id)
                ->where('jadwal_kuliah_id', $krs->jadwal_kuliah_id)
                ->where('periode_krs_id', $krs->periode_krs_id)
                ->whereNotNull('nilai_akhir')
                ->first();

            if (! $penilaian) {
                continue;
            }

            $sks = (int) ($krs->jadwalKuliah->mataKuliah->sks ?? 0);
            $bobot = $this->hitungBobot($penilaian->nilai_akhir);

            $totalSks += $sks;
            $totalMutu += ($bobot * $sks);
        }

        return $totalSks > 0 ? round($totalMutu / $totalSks, 2) : 0;
    }
}
