<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Penilaian;
use App\Models\Krs;

class PenilaianSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get semua KRS yang disetujui
        $krsList = Krs::where('status', 'disetujui')->get();

        foreach ($krsList as $krs) {
            // Cek apakah sudah ada penilaian
            $existingPenilaian = Penilaian::where('mahasiswa_id', $krs->mahasiswa_id)
                ->where('jadwal_kuliah_id', $krs->jadwal_kuliah_id)
                ->where('periode_krs_id', $krs->periode_krs_id)
                ->first();

            if (!$existingPenilaian) {
                // Generate nilai random
                $nilaiTugas = rand(70, 95);
                $nilaiUts = rand(65, 90);
                $nilaiUas = rand(70, 95);
                
                // Hitung nilai akhir (30% tugas, 30% UTS, 40% UAS)
                $nilaiAkhir = round(($nilaiTugas * 0.3) + ($nilaiUts * 0.3) + ($nilaiUas * 0.4), 2);
                
                // Tentukan nilai huruf
                $nilaiHuruf = $this->hitungNilaiHuruf($nilaiAkhir);
                
                // Tentukan nilai angka (bobot)
                $nilaiAngka = $this->hitungBobot($nilaiAkhir);

                Penilaian::create([
                    'mahasiswa_id' => $krs->mahasiswa_id,
                    'jadwal_kuliah_id' => $krs->jadwal_kuliah_id,
                    'periode_krs_id' => $krs->periode_krs_id,
                    'nilai_tugas' => $nilaiTugas,
                    'nilai_uts' => $nilaiUts,
                    'nilai_uas' => $nilaiUas,
                    'nilai_akhir' => $nilaiAkhir,
                    'nilai_huruf' => $nilaiHuruf,
                    'nilai_angka' => $nilaiAngka,
                    'status' => 'final',
                    'catatan' => 'Data dummy untuk testing'
                ]);
            }
        }
    }

    /**
     * Hitung nilai huruf berdasarkan nilai akhir
     */
    private function hitungNilaiHuruf($nilaiAkhir)
    {
        if ($nilaiAkhir >= 85) return 'A';
        if ($nilaiAkhir >= 80) return 'A-';
        if ($nilaiAkhir >= 75) return 'B+';
        if ($nilaiAkhir >= 70) return 'B';
        if ($nilaiAkhir >= 65) return 'B-';
        if ($nilaiAkhir >= 60) return 'C+';
        if ($nilaiAkhir >= 55) return 'C';
        if ($nilaiAkhir >= 50) return 'C-';
        if ($nilaiAkhir >= 45) return 'D+';
        if ($nilaiAkhir >= 40) return 'D';
        return 'E';
    }

    /**
     * Hitung bobot nilai berdasarkan nilai akhir
     */
    private function hitungBobot($nilaiAkhir)
    {
        if ($nilaiAkhir >= 85) return 4.0;
        if ($nilaiAkhir >= 80) return 3.7;
        if ($nilaiAkhir >= 75) return 3.3;
        if ($nilaiAkhir >= 70) return 3.0;
        if ($nilaiAkhir >= 65) return 2.7;
        if ($nilaiAkhir >= 60) return 2.3;
        if ($nilaiAkhir >= 55) return 2.0;
        if ($nilaiAkhir >= 50) return 1.7;
        if ($nilaiAkhir >= 45) return 1.3;
        if ($nilaiAkhir >= 40) return 1.0;
        return 0.0;
    }
}
