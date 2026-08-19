<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\JadwalKuliah;
use App\Models\MataKuliah;
use App\Models\Dosen;
use App\Models\Semester;

class JadwalKuliahSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get semester ganjil
        $semesterGanjil = Semester::where('nama_semester', 'Ganjil')->first();
        
        if (!$semesterGanjil) {
            $this->command->error('Semester Ganjil tidak ditemukan. Pastikan seeder Semester sudah dijalankan.');
            return;
        }

        // Get mata kuliah dan dosen yang sudah ada
        $mataKuliahs = MataKuliah::all();
        $dosens = Dosen::all();

        if ($mataKuliahs->isEmpty() || $dosens->isEmpty()) {
            $this->command->error('Pastikan data mata kuliah dan dosen sudah ada sebelum menjalankan seeder ini.');
            return;
        }

        $jadwalData = [
            [
                'mata_kuliah_id' => $mataKuliahs->first()->id,
                'dosen_id' => $dosens->first()->id,
                'semester_id' => $semesterGanjil->id,
                'hari' => 'Senin',
                'jam_mulai' => '08:00',
                'jam_selesai' => '10:00',
                'ruangan' => 'A101',
                'kapasitas' => 40,
                'keterangan' => 'Kelas reguler',
                'status' => 'aktif',
            ],
            [
                'mata_kuliah_id' => $mataKuliahs->skip(1)->first()->id ?? $mataKuliahs->first()->id,
                'dosen_id' => $dosens->skip(1)->first()->id ?? $dosens->first()->id,
                'semester_id' => $semesterGanjil->id,
                'hari' => 'Selasa',
                'jam_mulai' => '10:00',
                'jam_selesai' => '12:00',
                'ruangan' => 'A102',
                'kapasitas' => 35,
                'keterangan' => 'Kelas reguler',
                'status' => 'aktif',
            ],
            [
                'mata_kuliah_id' => $mataKuliahs->skip(2)->first()->id ?? $mataKuliahs->first()->id,
                'dosen_id' => $dosens->skip(2)->first()->id ?? $dosens->first()->id,
                'semester_id' => $semesterGanjil->id,
                'hari' => 'Rabu',
                'jam_mulai' => '13:00',
                'jam_selesai' => '15:00',
                'ruangan' => 'A103',
                'kapasitas' => 30,
                'keterangan' => 'Kelas reguler',
                'status' => 'aktif',
            ],
            [
                'mata_kuliah_id' => $mataKuliahs->skip(3)->first()->id ?? $mataKuliahs->first()->id,
                'dosen_id' => $dosens->skip(3)->first()->id ?? $dosens->first()->id,
                'semester_id' => $semesterGanjil->id,
                'hari' => 'Kamis',
                'jam_mulai' => '08:00',
                'jam_selesai' => '10:00',
                'ruangan' => 'A104',
                'kapasitas' => 25,
                'keterangan' => 'Kelas praktikum',
                'status' => 'aktif',
            ],
            [
                'mata_kuliah_id' => $mataKuliahs->skip(4)->first()->id ?? $mataKuliahs->first()->id,
                'dosen_id' => $dosens->skip(4)->first()->id ?? $dosens->first()->id,
                'semester_id' => $semesterGanjil->id,
                'hari' => 'Jumat',
                'jam_mulai' => '09:00',
                'jam_selesai' => '11:00',
                'ruangan' => 'A105',
                'kapasitas' => 45,
                'keterangan' => 'Kelas reguler',
                'status' => 'aktif',
            ]
        ];

        foreach ($jadwalData as $jadwal) {
            JadwalKuliah::create($jadwal);
        }

        $this->command->info('Jadwal kuliah seeder berhasil dijalankan!');
        $this->command->info('Dibuat ' . count($jadwalData) . ' jadwal kuliah untuk semester ganjil.');
    }
}
