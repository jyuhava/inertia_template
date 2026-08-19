<?php

namespace Database\Seeders;

use App\Models\MataKuliah;
use App\Models\Prodi;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class MataKuliahMPISeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Seeder untuk mata kuliah semester 1 prodi MPI STIT AL-WAFI BOGOR
     */
    public function run(): void
    {
        // Check if prodi with id 6 exists
        $prodi = Prodi::find(1);
        if (!$prodi) {
            $this->command->error('Prodi dengan ID 6 tidak ditemukan!');
            return;
        }

        $this->command->info("Menambahkan mata kuliah untuk prodi: {$prodi->nama_prodi} (ID: {$prodi->id})");

        $mataKuliahs = [
            [
                'kode_mata_kuliah' => 'MPI101',
                'nama_mata_kuliah' => 'Al-Quran & Ulumul Quran',
                'sks' => 2,
                'semester' => 1,
                'prodi_id' => 1,
                'jenis' => 'Wajib',
                'deskripsi' => 'Mata kuliah yang mempelajari Al-Quran dan ilmu-ilmu yang berkaitan dengan Al-Quran',
                'status' => 'aktif',
            ],
            [
                'kode_mata_kuliah' => 'MPI102',
                'nama_mata_kuliah' => 'Ilmu Kepesantrenan',
                'sks' => 2,
                'semester' => 1,
                'prodi_id' => 1,
                'jenis' => 'Wajib',
                'deskripsi' => 'Mata kuliah yang mempelajari sistem dan metodologi pendidikan pesantren',
                'status' => 'aktif',
            ],
            [
                'kode_mata_kuliah' => 'MPI103',
                'nama_mata_kuliah' => 'Filsafat Umum',
                'sks' => 2,
                'semester' => 1,
                'prodi_id' => 1,
                'jenis' => 'Wajib',
                'deskripsi' => 'Mata kuliah pengantar filsafat dan pemikiran filosofis',
                'status' => 'aktif',
            ],
            [
                'kode_mata_kuliah' => 'MPI104',
                'nama_mata_kuliah' => 'Ilmu Manajemen',
                'sks' => 2,
                'semester' => 1,
                'prodi_id' => 1,
                'jenis' => 'Wajib',
                'deskripsi' => 'Mata kuliah dasar-dasar ilmu manajemen dan penerapannya',
                'status' => 'aktif',
            ],
            [
                'kode_mata_kuliah' => 'MPI105',
                'nama_mata_kuliah' => 'Ulumul Hadits',
                'sks' => 2,
                'semester' => 1,
                'prodi_id' => 1,
                'jenis' => 'Wajib',
                'deskripsi' => 'Mata kuliah yang mempelajari ilmu hadits dan metodologi pemahaman hadits',
                'status' => 'aktif',
            ],
            [
                'kode_mata_kuliah' => 'MPI106',
                'nama_mata_kuliah' => 'Akidah dan Adab',
                'sks' => 2,
                'semester' => 1,
                'prodi_id' => 1,
                'jenis' => 'Wajib',
                'deskripsi' => 'Mata kuliah yang mempelajari akidah Islam dan adab-adab Islami',
                'status' => 'aktif',
            ],
            [
                'kode_mata_kuliah' => 'MPI107',
                'nama_mata_kuliah' => 'Pancasila',
                'sks' => 2,
                'semester' => 1,
                'prodi_id' => 1,
                'jenis' => 'Wajib',
                'deskripsi' => 'Mata kuliah Pancasila sebagai dasar negara dan ideologi bangsa',
                'status' => 'aktif',
            ],
            [
                'kode_mata_kuliah' => 'MPI108',
                'nama_mata_kuliah' => 'Sosiologi dan Antropologi',
                'sks' => 2,
                'semester' => 1,
                'prodi_id' => 1,
                'jenis' => 'Wajib',
                'deskripsi' => 'Mata kuliah yang mempelajari masyarakat dan budaya dari perspektif sosiologi dan antropologi',
                'status' => 'aktif',
            ],
        ];

        foreach ($mataKuliahs as $mataKuliahData) {
            // Check if mata kuliah with same kode already exists
            $existing = MataKuliah::where('kode_mata_kuliah', $mataKuliahData['kode_mata_kuliah'])->first();
            
            if ($existing) {
                $this->command->warn("Mata kuliah {$mataKuliahData['kode_mata_kuliah']} sudah ada, skip...");
                continue;
            }

            MataKuliah::create($mataKuliahData);
            $this->command->info("✓ Created: {$mataKuliahData['kode_mata_kuliah']} - {$mataKuliahData['nama_mata_kuliah']}");
        }

        $this->command->info('');
        $this->command->info('🎉 Mata kuliah MPI semester 1 berhasil ditambahkan!');
        $this->command->info('Total: ' . count($mataKuliahs) . ' mata kuliah');
        $this->command->info('Prodi: ' . $prodi->nama_prodi . ' (ID: ' . $prodi->id . ')');
    }
}
