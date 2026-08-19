<?php

namespace App\Http\Controllers\Dosen;

use App\Http\Controllers\Controller;
use App\Models\Absensi;
use App\Models\JadwalKuliah;
use App\Models\Dosen;
use App\Models\PeriodeKrs;
use App\Models\Krs;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class AbsensiController extends Controller
{
    /**
     * Tampilkan daftar absensi untuk jadwal tertentu
     */
    public function index(JadwalKuliah $jadwalKuliah)
    {
        $user = auth()->user();
        $dosen = Dosen::where('user_id', $user->id)->first();

        // Pastikan jadwal ini milik dosen yang login
        if (!$dosen || $jadwalKuliah->dosen_id !== $dosen->id) {
            return redirect()->route('dosen.jadwal')->with('error', 'Unauthorized.');
        }

        // Get periode KRS yang aktif
        $periodeAktif = PeriodeKrs::aktif()->first();

        if (!$periodeAktif) {
            return redirect()->route('dosen.jadwal')->with('error', 'Tidak ada periode KRS yang aktif.');
        }

        // Get mahasiswa yang mengambil kelas ini
        $mahasiswas = Krs::with(['mahasiswa.prodi'])
            ->where('jadwal_kuliah_id', $jadwalKuliah->id)
            ->where('periode_krs_id', $periodeAktif->id)
            ->whereIn('status', ['disetujui'])
            ->get()
            ->map(function ($krs) {
                return $krs->mahasiswa;
            });

        // Get data absensi untuk periode ini
        $pertemuanList = Absensi::where('jadwal_kuliah_id', $jadwalKuliah->id)
            ->where('periode_krs_id', $periodeAktif->id)
            ->select('tanggal', 'jam_mulai', 'jam_selesai')
            ->distinct()
            ->orderBy('tanggal')
            ->get()
            ->map(function($item) {
                return [
                    'tanggal' => $item->tanggal->format('Y-m-d'),
                    'jam_mulai' => $item->jam_mulai,
                    'jam_selesai' => $item->jam_selesai
                ];
            })
            ->unique('tanggal')
            ->values();

        // Get semua data absensi
        $absensiData = Absensi::with(['mahasiswa'])
            ->where('jadwal_kuliah_id', $jadwalKuliah->id)
            ->where('periode_krs_id', $periodeAktif->id)
            ->get()
            ->groupBy(function($item) {
                return $item->tanggal->format('Y-m-d');
            });

        $jadwalKuliah->load(['mataKuliah', 'semester']);

        return Inertia::render('Dosen/Absensi/Index', [
            'dosen' => $dosen,
            'periodeAktif' => $periodeAktif,
            'jadwalKuliah' => $jadwalKuliah,
            'mahasiswas' => $mahasiswas,
            'pertemuanList' => $pertemuanList,
            'absensiData' => $absensiData
        ]);
    }

    /**
     * Buat pertemuan baru untuk absensi
     */
    public function createPertemuan(Request $request, JadwalKuliah $jadwalKuliah)
    {
        $user = auth()->user();
        $dosen = Dosen::where('user_id', $user->id)->first();

        // Pastikan jadwal ini milik dosen yang login
        if (!$dosen || $jadwalKuliah->dosen_id !== $dosen->id) {
            return back()->with('error', 'Unauthorized.');
        }

        $request->validate([
            'tanggal' => 'required|date',
            'jam_mulai' => 'required|date_format:H:i',
            'jam_selesai' => 'required|date_format:H:i|after:jam_mulai',
        ]);

        $periodeAktif = PeriodeKrs::aktif()->first();

        if (!$periodeAktif) {
            return back()->with('error', 'Tidak ada periode KRS yang aktif.');
        }

        // Check apakah pertemuan untuk tanggal ini sudah ada
        $existingPertemuan = Absensi::where('jadwal_kuliah_id', $jadwalKuliah->id)
            ->where('periode_krs_id', $periodeAktif->id)
            ->where('tanggal', $request->tanggal)
            ->exists();

        if ($existingPertemuan) {
            return back()->with('error', 'Pertemuan untuk tanggal ini sudah ada.');
        }

        // Get mahasiswa yang mengambil kelas ini
        $mahasiswas = Krs::where('jadwal_kuliah_id', $jadwalKuliah->id)
            ->where('periode_krs_id', $periodeAktif->id)
            ->whereIn('status', ['disetujui'])
            ->get();

        // Buat record absensi untuk semua mahasiswa (default tidak hadir)
        foreach ($mahasiswas as $krs) {
            Absensi::create([
                'jadwal_kuliah_id' => $jadwalKuliah->id,
                'mahasiswa_id' => $krs->mahasiswa_id,
                'periode_krs_id' => $periodeAktif->id,
                'tanggal' => $request->tanggal,
                'jam_mulai' => $request->jam_mulai,
                'jam_selesai' => $request->jam_selesai,
                'status' => 'tidak_hadir',
                'created_by' => $user->id
            ]);
        }

        return back()->with('message', 'Pertemuan berhasil dibuat. Silakan input absensi mahasiswa.');
    }

    /**
     * Update absensi mahasiswa
     */
    public function updateAbsensi(Request $request, JadwalKuliah $jadwalKuliah)
    {
        \Log::info('Update Absensi Request Data:', $request->all());
        
        $user = auth()->user();
        $dosen = Dosen::where('user_id', $user->id)->first();

        // Pastikan jadwal ini milik dosen yang login
        if (!$dosen || $jadwalKuliah->dosen_id !== $dosen->id) {
            \Log::error('Unauthorized access attempt', [
                'user_id' => $user->id,
                'dosen_id' => $dosen?->id,
                'jadwal_dosen_id' => $jadwalKuliah->dosen_id
            ]);
            return back()->with('error', 'Unauthorized.');
        }

        try {
            $request->validate([
                'tanggal' => 'required|date',
                'absensi' => 'required|array',
                'absensi.*.mahasiswa_id' => 'required|exists:mahasiswas,id',
                'absensi.*.status' => 'required|in:hadir,tidak_hadir,izin,sakit',
                'absensi.*.keterangan' => 'nullable|string|max:255'
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Validation failed:', $e->errors());
            throw $e;
        }

        $periodeAktif = PeriodeKrs::aktif()->first();

        if (!$periodeAktif) {
            \Log::error('No active periode KRS found');
            return back()->with('error', 'Tidak ada periode KRS yang aktif.');
        }

        \Log::info('Periode aktif:', ['periode_id' => $periodeAktif->id]);

        $updatedCount = 0;
        $notFoundCount = 0;

        foreach ($request->absensi as $absensiData) {
            \Log::info('Processing absensi for mahasiswa:', $absensiData);
            
            // Debug: Log semua parameter pencarian
            \Log::info('Search parameters:', [
                'jadwal_kuliah_id' => $jadwalKuliah->id,
                'mahasiswa_id' => $absensiData['mahasiswa_id'],
                'periode_krs_id' => $periodeAktif->id,
                'tanggal' => $request->tanggal,
                'tanggal_type' => gettype($request->tanggal),
                'tanggal_formatted' => is_string($request->tanggal) ? $request->tanggal : $request->tanggal->format('Y-m-d')
            ]);
            
            // Coba cari dengan berbagai format tanggal
            $absensi = Absensi::where('jadwal_kuliah_id', $jadwalKuliah->id)
                ->where('mahasiswa_id', $absensiData['mahasiswa_id'])
                ->where('periode_krs_id', $periodeAktif->id)
                ->where('tanggal', $request->tanggal)
                ->first();
                
            // Debug: Log hasil pencarian
            \Log::info('Search result:', [
                'found' => $absensi ? true : false,
                'absensi_id' => $absensi?->id
            ]);
            
            // Jika tidak ditemukan, coba cari dengan format date saja
            if (!$absensi) {
                \Log::info('Trying alternative search with date format');
                $tanggalFormatted = is_string($request->tanggal) 
                    ? \Carbon\Carbon::parse($request->tanggal)->format('Y-m-d')
                    : $request->tanggal->format('Y-m-d');
                    
                $absensi = Absensi::where('jadwal_kuliah_id', $jadwalKuliah->id)
                    ->where('mahasiswa_id', $absensiData['mahasiswa_id'])
                    ->where('periode_krs_id', $periodeAktif->id)
                    ->whereDate('tanggal', $tanggalFormatted)
                    ->first();
                    
                \Log::info('Alternative search result:', [
                    'found' => $absensi ? true : false,
                    'absensi_id' => $absensi?->id,
                    'search_date' => $tanggalFormatted
                ]);
            }

            if ($absensi) {
                \Log::info('Found existing absensi, updating:', [
                    'absensi_id' => $absensi->id,
                    'old_status' => $absensi->status,
                    'new_status' => $absensiData['status']
                ]);
                
                $absensi->update([
                    'status' => $absensiData['status'],
                    'keterangan' => $absensiData['keterangan'] ?? null
                ]);
                $updatedCount++;
            } else {
                \Log::warning('Absensi not found for mahasiswa:', [
                    'jadwal_kuliah_id' => $jadwalKuliah->id,
                    'mahasiswa_id' => $absensiData['mahasiswa_id'],
                    'periode_krs_id' => $periodeAktif->id,
                    'tanggal' => $request->tanggal
                ]);
                $notFoundCount++;
            }
        }

        $message = "Absensi {$updatedCount} mahasiswa berhasil diperbarui.";
        if ($notFoundCount > 0) {
            $message .= " {$notFoundCount} data absensi tidak ditemukan.";
        }
        
        \Log::info('Update Absensi Result:', [
            'updated_count' => $updatedCount,
            'not_found_count' => $notFoundCount,
            'message' => $message
        ]);

        return back()->with('message', $message);
    }

    /**
     * Hapus pertemuan absensi
     */
    public function deletePertemuan(Request $request, JadwalKuliah $jadwalKuliah)
    {
        $user = auth()->user();
        $dosen = Dosen::where('user_id', $user->id)->first();

        // Pastikan jadwal ini milik dosen yang login
        if (!$dosen || $jadwalKuliah->dosen_id !== $dosen->id) {
            return back()->with('error', 'Unauthorized.');
        }

        $request->validate([
            'tanggal' => 'required|date'
        ]);

        $periodeAktif = PeriodeKrs::aktif()->first();

        if (!$periodeAktif) {
            return back()->with('error', 'Tidak ada periode KRS yang aktif.');
        }

        $deletedCount = Absensi::where('jadwal_kuliah_id', $jadwalKuliah->id)
            ->where('periode_krs_id', $periodeAktif->id)
            ->where('tanggal', $request->tanggal)
            ->delete();

        return back()->with('message', "Pertemuan tanggal {$request->tanggal} berhasil dihapus ({$deletedCount} record).");
    }

    /**
     * Rekap absensi mahasiswa
     */
    public function rekap(JadwalKuliah $jadwalKuliah)
    {
        $user = auth()->user();
        $dosen = Dosen::where('user_id', $user->id)->first();

        // Pastikan jadwal ini milik dosen yang login
        if (!$dosen || $jadwalKuliah->dosen_id !== $dosen->id) {
            return redirect()->route('dosen.jadwal')->with('error', 'Unauthorized.');
        }

        $periodeAktif = PeriodeKrs::aktif()->first();

        if (!$periodeAktif) {
            return redirect()->route('dosen.jadwal')->with('error', 'Tidak ada periode KRS yang aktif.');
        }

        // Get mahasiswa yang mengambil kelas ini
        $mahasiswas = Krs::with(['mahasiswa.prodi'])
            ->where('jadwal_kuliah_id', $jadwalKuliah->id)
            ->where('periode_krs_id', $periodeAktif->id)
            ->whereIn('status', ['disetujui'])
            ->get()
            ->map(function ($krs) use ($periodeAktif, $jadwalKuliah) {
                $mahasiswa = $krs->mahasiswa;
                
                // Hitung statistik absensi
                $totalPertemuan = Absensi::where('jadwal_kuliah_id', $jadwalKuliah->id)
                    ->where('mahasiswa_id', $mahasiswa->id)
                    ->where('periode_krs_id', $periodeAktif->id)
                    ->count();

                $hadir = Absensi::where('jadwal_kuliah_id', $jadwalKuliah->id)
                    ->where('mahasiswa_id', $mahasiswa->id)
                    ->where('periode_krs_id', $periodeAktif->id)
                    ->where('status', 'hadir')
                    ->count();

                $tidak_hadir = Absensi::where('jadwal_kuliah_id', $jadwalKuliah->id)
                    ->where('mahasiswa_id', $mahasiswa->id)
                    ->where('periode_krs_id', $periodeAktif->id)
                    ->where('status', 'tidak_hadir')
                    ->count();

                $izin = Absensi::where('jadwal_kuliah_id', $jadwalKuliah->id)
                    ->where('mahasiswa_id', $mahasiswa->id)
                    ->where('periode_krs_id', $periodeAktif->id)
                    ->where('status', 'izin')
                    ->count();

                $sakit = Absensi::where('jadwal_kuliah_id', $jadwalKuliah->id)
                    ->where('mahasiswa_id', $mahasiswa->id)
                    ->where('periode_krs_id', $periodeAktif->id)
                    ->where('status', 'sakit')
                    ->count();

                $persentase = $totalPertemuan > 0 ? round(($hadir / $totalPertemuan) * 100, 1) : 0;

                $mahasiswa->absensi_stats = [
                    'total_pertemuan' => $totalPertemuan,
                    'hadir' => $hadir,
                    'tidak_hadir' => $tidak_hadir,
                    'izin' => $izin,
                    'sakit' => $sakit,
                    'persentase' => $persentase
                ];

                // Add nama field for frontend display
                $mahasiswa->nama = $mahasiswa->nama_lengkap;

                return $mahasiswa;
            });

        $jadwalKuliah->load(['mataKuliah', 'semester']);

        return Inertia::render('Dosen/Absensi/Rekap', [
            'dosen' => $dosen,
            'periodeAktif' => $periodeAktif,
            'jadwalKuliah' => $jadwalKuliah,
            'mahasiswas' => $mahasiswas
        ]);
    }
}
