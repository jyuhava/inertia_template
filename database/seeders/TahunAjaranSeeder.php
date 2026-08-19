<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class TahunAjaranSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create academic years
        $tahunAjarans = [
            [
                'nama_tahun_ajaran' => '2023/2024',
                'tanggal_mulai' => '2023-09-01',
                'tanggal_selesai' => '2024-08-31',
                'status' => 'nonaktif',
                'keterangan' => 'Tahun ajaran 2023/2024',
            ],
            [
                'nama_tahun_ajaran' => '2024/2025',
                'tanggal_mulai' => '2024-09-01',
                'tanggal_selesai' => '2025-08-31',
                'status' => 'aktif',
                'keterangan' => 'Tahun ajaran aktif saat ini',
            ],
            [
                'nama_tahun_ajaran' => '2025/2026',
                'tanggal_mulai' => '2025-09-01',
                'tanggal_selesai' => '2026-08-31',
                'status' => 'nonaktif',
                'keterangan' => 'Tahun ajaran mendatang',
            ],
        ];

        foreach ($tahunAjarans as $tahunAjaranData) {
            $tahunAjaran = \App\Models\TahunAjaran::create($tahunAjaranData);
            
            // Create semesters for each academic year
            $semesters = [
                [
                    'tahun_ajaran_id' => $tahunAjaran->id,
                    'nama_semester' => 'Ganjil',
                    'tanggal_mulai' => $tahunAjaran->tanggal_mulai,
                    'tanggal_selesai' => date('Y-m-d', strtotime($tahunAjaran->tanggal_mulai . ' +6 months')),
                    'status' => $tahunAjaran->status === 'aktif' && $tahunAjaran->nama_tahun_ajaran === '2024/2025' ? 'aktif' : 'nonaktif',
                    'keterangan' => 'Semester ganjil tahun ajaran ' . $tahunAjaran->nama_tahun_ajaran,
                ],
                [
                    'tahun_ajaran_id' => $tahunAjaran->id,
                    'nama_semester' => 'Genap',
                    'tanggal_mulai' => date('Y-m-d', strtotime($tahunAjaran->tanggal_mulai . ' +6 months +1 day')),
                    'tanggal_selesai' => $tahunAjaran->tanggal_selesai,
                    'status' => 'nonaktif',
                    'keterangan' => 'Semester genap tahun ajaran ' . $tahunAjaran->nama_tahun_ajaran,
                ],
            ];

            foreach ($semesters as $semesterData) {
                \App\Models\Semester::create($semesterData);
            }
        }
    }
}
