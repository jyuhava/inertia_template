<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            AdminSeeder::class,
            ProdiSeeder::class,
            DosenSeeder::class,
            DosenBaruSeeder::class, // Dosen baru STIT AL-WAFI BOGOR
            MahasiswaSeeder::class, // Added MahasiswaSeeder
            TahunAjaranSeeder::class,
            MataKuliahSeeder::class,
            PmbSeeder::class, // PMB system
            AkademikLengkapSeeder::class,
        ]);
    }
}
