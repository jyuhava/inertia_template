<?php

namespace App\Http\Controllers\Mahasiswa;

use App\Http\Controllers\Controller;
use App\Models\Krs;
use App\Models\Mahasiswa;
use App\Models\Penilaian;
use App\Models\PeriodeKrs;
use App\Models\StudentStudyResult;
use App\Services\Academic\KhsAccessService;
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

        if (! $mahasiswa) {
            return redirect()->route('dashboard')->with('error', 'Data mahasiswa tidak ditemukan.');
        }

        $results = StudentStudyResult::with('periodeKrs.semester', 'periodeKrs.tahunAjaran')
            ->where('mahasiswa_id', $mahasiswa->id)->whereIn('status', ['published', 'locked'])->latest()->get();
        $periodeKrs = $results->pluck('periodeKrs')->filter()->values();
        $ipk = $results->sortByDesc('id')->first()?->cumulative_gpa ?? 0;

        return Inertia::render('Mahasiswa/Khs/Index', [
            'mahasiswa' => $mahasiswa,
            'periodeKrs' => $periodeKrs,
            'ipk' => $ipk,
            'isVisible' => true,
        ]);
    }

    /**
     * Tampilkan detail KHS untuk periode tertentu
     */
    public function show(PeriodeKrs $periodeKrs, KhsAccessService $access)
    {
        $user = auth()->user();
        $mahasiswa = Mahasiswa::where('user_id', $user->id)->first();

        if (! $mahasiswa) {
            return redirect()->route('dashboard')->with('error', 'Data mahasiswa tidak ditemukan.');
        }

        abort_unless($access->canAccess($mahasiswa, $periodeKrs), 403, 'Selesaikan survey wajib sebelum membuka KHS.');
        $result = StudentStudyResult::with('items.mataKuliah')->where(['mahasiswa_id' => $mahasiswa->id, 'periode_krs_id' => $periodeKrs->id])->whereIn('status', ['published', 'locked'])->firstOrFail();
        $krs = $result->items->map(fn ($item) => ['kode_mata_kuliah' => $item->mataKuliah->kode_mata_kuliah, 'nama_mata_kuliah' => $item->mataKuliah->nama_mata_kuliah, 'sks' => $item->credits, 'nilai_angka' => $item->grade_numeric, 'nilai_huruf' => $item->grade, 'bobot' => $item->grade_point, 'mutu' => $item->credits * $item->grade_point]);
        $totalSks = $result->total_credits;
        $totalMutu = $krs->sum('mutu');
        $ips = $result->semester_gpa;
        $ipk = $result->cumulative_gpa;

        $periodeKrs->load('semester', 'tahunAjaran');

        return Inertia::render('Mahasiswa/Khs/Show', [
            'mahasiswa' => $mahasiswa,
            'periodeKrs' => $periodeKrs,
            'krs' => $krs,
            'ips' => $ips,
            'ipk' => $ipk,
            'totalSks' => $totalSks,
            'totalMutu' => $totalMutu,
            'isVisible' => true,
        ]);
    }

    /**
     * Generate PDF KHS
     */
    public function cetakKhs(PeriodeKrs $periodeKrs, KhsAccessService $access)
    {
        $user = auth()->user();
        $mahasiswa = Mahasiswa::where('user_id', $user->id)->first();

        if (! $mahasiswa) {
            return redirect()->route('dashboard')->with('error', 'Data mahasiswa tidak ditemukan.');
        }
        abort_unless($access->canAccess($mahasiswa, $periodeKrs), 403, 'Selesaikan survey wajib sebelum mencetak KHS.');
        StudentStudyResult::where(['mahasiswa_id' => $mahasiswa->id, 'periode_krs_id' => $periodeKrs->id])
            ->whereIn('status', ['published', 'locked'])
            ->firstOrFail();

        // Get data yang sama seperti di show
        $krsList = Krs::with(['jadwalKuliah.mataKuliah'])
            ->where('mahasiswa_id', $mahasiswa->id)
            ->where('periode_krs_id', $periodeKrs->id)
            ->whereIn('status', ['disetujui'])
            ->get();

        $krs = $krsList->map(function ($krs) {
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
            'isVisible' => $this->isVisible,
        ]);
    }

    /**
     * Hitung nilai huruf berdasarkan nilai angka
     */
    private function hitungNilaiHuruf($nilaiAngka)
    {
        if ($nilaiAngka >= 85) {
            return 'A';
        }
        if ($nilaiAngka >= 80) {
            return 'A-';
        }
        if ($nilaiAngka >= 75) {
            return 'B+';
        }
        if ($nilaiAngka >= 70) {
            return 'B';
        }
        if ($nilaiAngka >= 65) {
            return 'B-';
        }
        if ($nilaiAngka >= 60) {
            return 'C+';
        }
        if ($nilaiAngka >= 55) {
            return 'C';
        }
        if ($nilaiAngka >= 50) {
            return 'C-';
        }
        if ($nilaiAngka >= 45) {
            return 'D+';
        }
        if ($nilaiAngka >= 40) {
            return 'D';
        }

        return 'E';
    }

    /**
     * Hitung bobot nilai berdasarkan nilai angka
     */
    private function hitungBobot($nilaiAngka)
    {
        if ($nilaiAngka >= 85) {
            return 4.0;
        }
        if ($nilaiAngka >= 80) {
            return 3.7;
        }
        if ($nilaiAngka >= 75) {
            return 3.3;
        }
        if ($nilaiAngka >= 70) {
            return 3.0;
        }
        if ($nilaiAngka >= 65) {
            return 2.7;
        }
        if ($nilaiAngka >= 60) {
            return 2.3;
        }
        if ($nilaiAngka >= 55) {
            return 2.0;
        }
        if ($nilaiAngka >= 50) {
            return 1.7;
        }
        if ($nilaiAngka >= 45) {
            return 1.3;
        }
        if ($nilaiAngka >= 40) {
            return 1.0;
        }

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
