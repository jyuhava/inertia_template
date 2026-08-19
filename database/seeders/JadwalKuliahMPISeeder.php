<?php

namespace Database\Seeders;

use App\Models\JadwalKuliah;
use App\Models\MataKuliah;
use App\Models\Dosen;
use App\Models\Semester;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class JadwalKuliahMPISeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Seeder untuk jadwal kuliah semester 1 prodi MPI STIT AL-WAFI BOGOR
     */
    public function run(): void
    {
        // Get semester aktif
        $semester = Semester::where('status', 'aktif')->first();
        if (!$semester) {
            $this->command->error('Semester aktif tidak ditemukan!');
            return;
        }

        $this->command->info("Membuat jadwal untuk semester: {$semester->nama_semester} (ID: {$semester->id})");

        $jadwalKuliahs = [
            // Hari Sabtu
            [
                'mata_kuliah_id' => 1, // Al-Quran & Ulumul Quran
                'dosen_id' => 1, // Ust. Yusuf Abdullah, M.Pd.
                'semester_id' => $semester->id,
                'hari' => 'Sabtu',
                'jam_mulai' => '08:00',
                'jam_selesai' => '10:00',
                'ruangan' => 'Ruang MPI-1',
                'kapasitas' => 40,
                'keterangan' => 'Sesi 1 - Sabtu',
                'status' => 'aktif',
            ],
            [
                'mata_kuliah_id' => 2, // Ilmu Kepesantrenan
                'dosen_id' => 2, // Dr. Ali Saman Hasan, MA
                'semester_id' => $semester->id,
                'hari' => 'Sabtu',
                'jam_mulai' => '10:00',
                'jam_selesai' => '12:00',
                'ruangan' => 'Ruang MPI-1',
                'kapasitas' => 40,
                'keterangan' => 'Sesi 2 - Sabtu',
                'status' => 'aktif',
            ],
            [
                'mata_kuliah_id' => 3, // Filsafat Umum
                'dosen_id' => 3, // Usth. Dr. Ananingtyas
                'semester_id' => $semester->id,
                'hari' => 'Sabtu',
                'jam_mulai' => '13:00',
                'jam_selesai' => '15:00',
                'ruangan' => 'Ruang MPI-1',
                'kapasitas' => 40,
                'keterangan' => 'Sesi 3 - Sabtu',
                'status' => 'aktif',
            ],
            [
                'mata_kuliah_id' => 4, // Ilmu Manajemen
                'dosen_id' => 4, // Usth. Fortin Sri Haryani
                'semester_id' => $semester->id,
                'hari' => 'Sabtu',
                'jam_mulai' => '16:00',
                'jam_selesai' => '18:00',
                'ruangan' => 'Ruang MPI-1',
                'kapasitas' => 40,
                'keterangan' => 'Sesi 4 - Sabtu',
                'status' => 'aktif',
            ],

            // Hari Ahad (Minggu)
            [
                'mata_kuliah_id' => 5, // Ulumul Hadits
                'dosen_id' => 5, // Ust. Muh. Bakri Rahimin, Lc, ME
                'semester_id' => $semester->id,
                'hari' => 'Minggu',
                'jam_mulai' => '08:00',
                'jam_selesai' => '10:00',
                'ruangan' => 'Ruang MPI-1',
                'kapasitas' => 40,
                'keterangan' => 'Sesi 1 - Ahad',
                'status' => 'aktif',
            ],
            [
                'mata_kuliah_id' => 6, // Akidah dan Adab
                'dosen_id' => 6, // Ust. Marullah MZ, M.Ag.
                'semester_id' => $semester->id,
                'hari' => 'Minggu',
                'jam_mulai' => '10:00',
                'jam_selesai' => '12:00',
                'ruangan' => 'Ruang MPI-1',
                'kapasitas' => 40,
                'keterangan' => 'Sesi 2 - Ahad',
                'status' => 'aktif',
            ],
            [
                'mata_kuliah_id' => 7, // Pancasila
                'dosen_id' => 7, // Ust. Zikra Juninawan, Lc, MA
                'semester_id' => $semester->id,
                'hari' => 'Minggu',
                'jam_mulai' => '13:00',
                'jam_selesai' => '15:00',
                'ruangan' => 'Ruang MPI-1',
                'kapasitas' => 40,
                'keterangan' => 'Sesi 3 - Ahad',
                'status' => 'aktif',
            ],
            [
                'mata_kuliah_id' => 8, // Sosiologi dan Antropologi
                'dosen_id' => 8, // Ust. Nandang
                'semester_id' => $semester->id,
                'hari' => 'Minggu',
                'jam_mulai' => '16:00',
                'jam_selesai' => '18:00',
                'ruangan' => 'Ruang MPI-1',
                'kapasitas' => 40,
                'keterangan' => 'Sesi 4 - Ahad',
                'status' => 'aktif',
            ],
        ];

        foreach ($jadwalKuliahs as $jadwalData) {
            // Check if jadwal already exists
            $existing = JadwalKuliah::where([
                'mata_kuliah_id' => $jadwalData['mata_kuliah_id'],
                'semester_id' => $jadwalData['semester_id']
            ])->first();

            if ($existing) {
                $mataKuliah = MataKuliah::find($jadwalData['mata_kuliah_id']);
                $this->command->warn("Jadwal untuk {$mataKuliah->nama_mata_kuliah} sudah ada, skip...");
                continue;
            }

            $jadwal = JadwalKuliah::create($jadwalData);
            $mataKuliah = MataKuliah::find($jadwalData['mata_kuliah_id']);
            $dosen = Dosen::find($jadwalData['dosen_id']);
            
            $this->command->info("✓ Created jadwal: {$mataKuliah->nama_mata_kuliah} - {$dosen->nama_lengkap} ({$jadwalData['hari']} {$jadwalData['jam_mulai']}-{$jadwalData['jam_selesai']})");
        }

        $this->command->info('');
        $this->command->info('🎉 Jadwal kuliah MPI semester 1 berhasil dibuat!');
        $this->command->info('Total: ' . count($jadwalKuliahs) . ' jadwal kuliah');
        $this->command->info('📅 Jadwal: Sabtu (4 mata kuliah) & Minggu (4 mata kuliah)');
    }
}
