<?php

namespace Database\Seeders;

use App\Models\Krs;
use App\Models\Mahasiswa;
use App\Models\JadwalKuliah;
use App\Models\PeriodeKrs;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class KrsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Ambil periode KRS yang aktif
        $periodeAktif = PeriodeKrs::where('status', 'aktif')->first();
        
        if (!$periodeAktif) {
            $this->command->info('Tidak ada periode KRS aktif. Membuat periode dummy...');
            return;
        }

        // Ambil beberapa mahasiswa dan jadwal kuliah
        $mahasiswas = Mahasiswa::take(10)->get();
        $jadwalKuliahs = JadwalKuliah::where('semester_id', $periodeAktif->semester_id)
            ->where('status', 'aktif')
            ->take(5)
            ->get();

        $this->command->info('Membuat data KRS dummy...');

        foreach ($mahasiswas as $mahasiswa) {
            // Setiap mahasiswa ambil 3-4 mata kuliah secara random
            $jumlahMatkul = rand(3, 4);
            $selectedJadwal = $jadwalKuliahs->random($jumlahMatkul);

            foreach ($selectedJadwal as $jadwal) {
                // Cek apakah sudah ada KRS untuk kombinasi ini
                $existingKrs = Krs::where('mahasiswa_id', $mahasiswa->id)
                    ->where('jadwal_kuliah_id', $jadwal->id)
                    ->where('periode_krs_id', $periodeAktif->id)
                    ->first();

                if (!$existingKrs) {
                    Krs::create([
                        'mahasiswa_id' => $mahasiswa->id,
                        'jadwal_kuliah_id' => $jadwal->id,
                        'periode_krs_id' => $periodeAktif->id,
                        'status' => 'diambil'
                    ]);
                }
            }
        }

        $this->command->info('Data KRS dummy berhasil dibuat!');
    }
}