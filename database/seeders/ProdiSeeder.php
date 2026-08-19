<?php

namespace Database\Seeders;

use App\Models\Prodi;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ProdiSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $prodis = [
            [
                'kode_prodi' => 'TI',
                'nama_prodi' => 'Teknik Informatika',
                'deskripsi' => 'Program studi yang mempelajari teknologi informasi, pemrograman, dan sistem komputer.',
                'jenjang' => 'S1',
                'status' => 'aktif',
            ],
            [
                'kode_prodi' => 'SI',
                'nama_prodi' => 'Sistem Informasi',
                'deskripsi' => 'Program studi yang fokus pada analisis, perancangan, dan implementasi sistem informasi.',
                'jenjang' => 'S1',
                'status' => 'aktif',
            ],
            [
                'kode_prodi' => 'MI',
                'nama_prodi' => 'Manajemen Informatika',
                'deskripsi' => 'Program studi yang menggabungkan ilmu manajemen dengan teknologi informasi.',
                'jenjang' => 'D3',
                'status' => 'aktif',
            ],
            [
                'kode_prodi' => 'TK',
                'nama_prodi' => 'Teknik Komputer',
                'deskripsi' => 'Program studi yang mempelajari perangkat keras komputer dan sistem embedded.',
                'jenjang' => 'D4',
                'status' => 'aktif',
            ],
            [
                'kode_prodi' => 'IF',
                'nama_prodi' => 'Informatika',
                'deskripsi' => 'Program studi magister yang memperdalam ilmu informatika dan teknologi terkini.',
                'jenjang' => 'S2',
                'status' => 'aktif',
            ],
        ];

        foreach ($prodis as $prodi) {
            Prodi::create($prodi);
        }
    }
}
