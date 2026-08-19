<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class MataKuliahSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get prodi IDs
        $prodiTI = \App\Models\Prodi::where('kode_prodi', 'TI')->first();
        $prodiSI = \App\Models\Prodi::where('kode_prodi', 'SI')->first();
        $prodiTK = \App\Models\Prodi::where('kode_prodi', 'TK')->first();

        if (!$prodiTI || !$prodiSI || !$prodiTK) {
            $this->command->warn('Prodi data not found. Please run ProdiSeeder first.');
            return;
        }

        $mataKuliahs = [
            // Mata Kuliah untuk Teknik Informatika
            [
                'kode_mata_kuliah' => 'TI101',
                'nama_mata_kuliah' => 'Algoritma dan Pemrograman',
                'sks' => 3,
                'semester' => 1,
                'prodi_id' => $prodiTI->id,
                'jenis' => 'Wajib',
                'deskripsi' => 'Mata kuliah dasar algoritma dan pemrograman',
                'status' => 'aktif',
            ],
            [
                'kode_mata_kuliah' => 'TI102',
                'nama_mata_kuliah' => 'Matematika Diskrit',
                'sks' => 3,
                'semester' => 1,
                'prodi_id' => $prodiTI->id,
                'jenis' => 'Wajib',
                'deskripsi' => 'Mata kuliah matematika diskrit untuk informatika',
                'status' => 'aktif',
            ],
            [
                'kode_mata_kuliah' => 'TI201',
                'nama_mata_kuliah' => 'Struktur Data',
                'sks' => 3,
                'semester' => 2,
                'prodi_id' => $prodiTI->id,
                'jenis' => 'Wajib',
                'deskripsi' => 'Mata kuliah tentang struktur data dan algoritma',
                'status' => 'aktif',
            ],
            [
                'kode_mata_kuliah' => 'TI301',
                'nama_mata_kuliah' => 'Basis Data',
                'sks' => 3,
                'semester' => 3,
                'prodi_id' => $prodiTI->id,
                'jenis' => 'Wajib',
                'deskripsi' => 'Mata kuliah tentang sistem basis data',
                'status' => 'aktif',
            ],
            [
                'kode_mata_kuliah' => 'TI401',
                'nama_mata_kuliah' => 'Rekayasa Perangkat Lunak',
                'sks' => 3,
                'semester' => 4,
                'prodi_id' => $prodiTI->id,
                'jenis' => 'Wajib',
                'deskripsi' => 'Mata kuliah tentang pengembangan perangkat lunak',
                'status' => 'aktif',
            ],
            [
                'kode_mata_kuliah' => 'TI501',
                'nama_mata_kuliah' => 'Kecerdasan Buatan',
                'sks' => 3,
                'semester' => 5,
                'prodi_id' => $prodiTI->id,
                'jenis' => 'Pilihan',
                'deskripsi' => 'Mata kuliah tentang AI dan machine learning',
                'status' => 'aktif',
            ],

            // Mata Kuliah untuk Sistem Informasi
            [
                'kode_mata_kuliah' => 'SI101',
                'nama_mata_kuliah' => 'Pengantar Sistem Informasi',
                'sks' => 3,
                'semester' => 1,
                'prodi_id' => $prodiSI->id,
                'jenis' => 'Wajib',
                'deskripsi' => 'Mata kuliah pengantar sistem informasi',
                'status' => 'aktif',
            ],
            [
                'kode_mata_kuliah' => 'SI201',
                'nama_mata_kuliah' => 'Analisis dan Perancangan Sistem',
                'sks' => 3,
                'semester' => 2,
                'prodi_id' => $prodiSI->id,
                'jenis' => 'Wajib',
                'deskripsi' => 'Mata kuliah tentang analisis dan perancangan sistem',
                'status' => 'aktif',
            ],
            [
                'kode_mata_kuliah' => 'SI301',
                'nama_mata_kuliah' => 'Manajemen Proyek TI',
                'sks' => 3,
                'semester' => 3,
                'prodi_id' => $prodiSI->id,
                'jenis' => 'Wajib',
                'deskripsi' => 'Mata kuliah tentang manajemen proyek teknologi informasi',
                'status' => 'aktif',
            ],

            // Mata Kuliah untuk Teknik Komputer
            [
                'kode_mata_kuliah' => 'TK101',
                'nama_mata_kuliah' => 'Elektronika Dasar',
                'sks' => 3,
                'semester' => 1,
                'prodi_id' => $prodiTK->id,
                'jenis' => 'Wajib',
                'deskripsi' => 'Mata kuliah dasar elektronika',
                'status' => 'aktif',
            ],
            [
                'kode_mata_kuliah' => 'TK201',
                'nama_mata_kuliah' => 'Arsitektur Komputer',
                'sks' => 3,
                'semester' => 2,
                'prodi_id' => $prodiTK->id,
                'jenis' => 'Wajib',
                'deskripsi' => 'Mata kuliah tentang arsitektur komputer',
                'status' => 'aktif',
            ],

            // Mata Kuliah Umum
            [
                'kode_mata_kuliah' => 'MKU101',
                'nama_mata_kuliah' => 'Bahasa Indonesia',
                'sks' => 2,
                'semester' => 1,
                'prodi_id' => $prodiTI->id,
                'jenis' => 'Wajib',
                'deskripsi' => 'Mata kuliah bahasa Indonesia',
                'status' => 'aktif',
            ],
            [
                'kode_mata_kuliah' => 'MKU102',
                'nama_mata_kuliah' => 'Pancasila',
                'sks' => 2,
                'semester' => 1,
                'prodi_id' => $prodiTI->id,
                'jenis' => 'Wajib',
                'deskripsi' => 'Mata kuliah pendidikan Pancasila',
                'status' => 'aktif',
            ],
        ];

        foreach ($mataKuliahs as $matkul) {
            \App\Models\MataKuliah::create($matkul);
        }
    }
}
