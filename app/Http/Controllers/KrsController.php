<?php

namespace App\Http\Controllers;

use App\Models\Krs;
use App\Models\PeriodeKrs;
use App\Models\JadwalKuliah;
use App\Models\Mahasiswa;
use Illuminate\Http\Request;
use Inertia\Inertia;

class KrsController extends Controller
{
    /**
     * Display KRS untuk mahasiswa
     */
    public function index()
    {
        $user = auth()->user();
        $mahasiswa = Mahasiswa::where('user_id', $user->id)->first();

        if (!$mahasiswa) {
            return redirect()->route('dashboard')->with('error', 'Data mahasiswa tidak ditemukan.');
        }

        // Get periode KRS yang aktif
        $periodeAktif = PeriodeKrs::aktif()->first();

        if (!$periodeAktif) {
            return Inertia::render('Mahasiswa/Krs/Index', [
                'periodeAktif' => null,
                'krsData' => [],
                'jadwalTersedia' => [],
                'message' => 'Tidak ada periode KRS yang aktif saat ini.'
            ]);
        }

        // Get KRS mahasiswa untuk periode aktif
        $krsData = Krs::with(['jadwalKuliah.mataKuliah', 'jadwalKuliah.dosen'])
            ->where('mahasiswa_id', $mahasiswa->id)
            ->where('periode_krs_id', $periodeAktif->id)
            ->whereIn('status', ['diambil', 'disetujui', 'menunggu_persetujuan'])
            ->get();

        // Get jadwal kuliah yang tersedia untuk semester yang sama
        $jadwalTersedia = JadwalKuliah::with(['mataKuliah', 'dosen'])
            ->where('semester_id', $periodeAktif->semester_id)
            ->aktif()
            ->whereDoesntHave('krs', function ($query) use ($mahasiswa, $periodeAktif) {
                $query->where('mahasiswa_id', $mahasiswa->id)
                    ->where('periode_krs_id', $periodeAktif->id)
                    ->whereIn('status', ['diambil', 'disetujui', 'menunggu_persetujuan']);
            })
            ->get()
            ->map(function ($jadwal) {
                $jadwal->jumlah_mahasiswa = $jadwal->krs()->diambil()->count();
                $jadwal->tersedia = $jadwal->jumlah_mahasiswa < $jadwal->kapasitas;
                return $jadwal;
            });

        return Inertia::render('Mahasiswa/Krs/Index', [
            'periodeAktif' => $periodeAktif->load(['tahunAjaran', 'semester']),
            'krsData' => $krsData,
            'jadwalTersedia' => $jadwalTersedia,
            'mahasiswa' => $mahasiswa
        ]);
    }

    /**
     * Ambil mata kuliah (tambah ke KRS)
     */
    public function store(Request $request)
    {
        $request->validate([
            'jadwal_kuliah_id' => 'required|exists:jadwal_kuliahs,id'
        ]);

        $user = auth()->user();
        $mahasiswa = Mahasiswa::where('user_id', $user->id)->first();

        if (!$mahasiswa) {
            return back()->with('error', 'Data mahasiswa tidak ditemukan.');
        }

        $periodeAktif = PeriodeKrs::aktif()->first();

        if (!$periodeAktif) {
            return back()->with('error', 'Tidak ada periode KRS yang aktif.');
        }

        // Check apakah periode KRS sedang berlangsung
        if (!$periodeAktif->isBerlangsung()) {
            return back()->with('error', 'Periode KRS tidak sedang berlangsung.');
        }

        $jadwalKuliah = JadwalKuliah::findOrFail($request->jadwal_kuliah_id);

        // Check kapasitas
        $jumlahMahasiswa = $jadwalKuliah->krs()->diambil()->count();
        if ($jumlahMahasiswa >= $jadwalKuliah->kapasitas) {
            return back()->with('error', 'Kapasitas mata kuliah sudah penuh.');
        }

        // Check apakah sudah mengambil mata kuliah ini
        $existingKrs = Krs::where('mahasiswa_id', $mahasiswa->id)
            ->where('jadwal_kuliah_id', $request->jadwal_kuliah_id)
            ->where('periode_krs_id', $periodeAktif->id)
            ->whereIn('status', ['diambil', 'disetujui', 'menunggu_persetujuan'])
            ->first();

        if ($existingKrs) {
            return back()->with('error', 'Anda sudah mengambil mata kuliah ini.');
        }

        // Check konflik jadwal
        $konflikJadwal = $this->checkKonflikJadwal($mahasiswa->id, $periodeAktif->id, $jadwalKuliah);
        if ($konflikJadwal) {
            return back()->with('error', 'Jadwal bertabrakan dengan mata kuliah lain yang sudah diambil.');
        }

        // Tambah ke KRS
        Krs::create([
            'mahasiswa_id' => $mahasiswa->id,
            'jadwal_kuliah_id' => $request->jadwal_kuliah_id,
            'periode_krs_id' => $periodeAktif->id,
            'status' => 'menunggu_persetujuan'
        ]);

        return back()->with('message', 'Mata kuliah berhasil ditambahkan ke KRS dan menunggu persetujuan admin.');
    }

    /**
     * Batalkan mata kuliah (hapus dari KRS)
     */
    public function destroy(Krs $krs)
    {
        $user = auth()->user();
        $mahasiswa = Mahasiswa::where('user_id', $user->id)->first();

        if (!$mahasiswa || $krs->mahasiswa_id !== $mahasiswa->id) {
            return back()->with('error', 'Unauthorized.');
        }

        $periodeAktif = PeriodeKrs::aktif()->first();

        if (!$periodeAktif || !$periodeAktif->isBerlangsung()) {
            return back()->with('error', 'Tidak dapat membatalkan KRS di luar periode yang aktif.');
        }

        $krs->update(['status' => 'dibatalkan']);

        return back()->with('message', 'Mata kuliah berhasil dibatalkan dari KRS.');
    }

    /**
     * Check konflik jadwal
     */
    private function checkKonflikJadwal($mahasiswaId, $periodeKrsId, $jadwalBaru)
    {
        $krsExisting = Krs::with('jadwalKuliah')
            ->where('mahasiswa_id', $mahasiswaId)
            ->where('periode_krs_id', $periodeKrsId)
            ->whereIn('status', ['diambil', 'disetujui', 'menunggu_persetujuan'])
            ->get();

        foreach ($krsExisting as $krs) {
            $jadwalExisting = $krs->jadwalKuliah;
            
            // Check apakah hari sama
            if ($jadwalExisting->hari === $jadwalBaru->hari) {
                // Check apakah waktu bertabrakan
                $mulaiExisting = strtotime($jadwalExisting->jam_mulai->format('H:i'));
                $selesaiExisting = strtotime($jadwalExisting->jam_selesai->format('H:i'));
                $mulaiBaru = strtotime($jadwalBaru->jam_mulai->format('H:i'));
                $selesaiBaru = strtotime($jadwalBaru->jam_selesai->format('H:i'));

                if (($mulaiBaru < $selesaiExisting) && ($selesaiBaru > $mulaiExisting)) {
                    return true; // Ada konflik
                }
            }
        }

        return false; // Tidak ada konflik
    }

    /**
     * Print KRS
     */
    public function print()
    {
        $user = auth()->user();
        $mahasiswa = Mahasiswa::where('user_id', $user->id)->first();

        if (!$mahasiswa) {
            return back()->with('error', 'Data mahasiswa tidak ditemukan.');
        }

        $periodeAktif = PeriodeKrs::aktif()->first();

        if (!$periodeAktif) {
            return back()->with('error', 'Tidak ada periode KRS yang aktif.');
        }

        $krsData = Krs::with(['jadwalKuliah.mataKuliah', 'jadwalKuliah.dosen'])
            ->where('mahasiswa_id', $mahasiswa->id)
            ->where('periode_krs_id', $periodeAktif->id)
            ->whereIn('status', ['diambil', 'disetujui'])
            ->get();

        return Inertia::render('Mahasiswa/Krs/Print', [
            'periodeAktif' => $periodeAktif->load(['tahunAjaran', 'semester']),
            'krsData' => $krsData,
            'mahasiswa' => $mahasiswa->load('prodi')
        ]);
    }
}
