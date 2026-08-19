<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Mahasiswa;
use App\Models\Prodi;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class MahasiswaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all prodis
        $prodis = Prodi::where('status', 'aktif')->get();
        
        if ($prodis->isEmpty()) {
            $this->command->error('No active Prodi found. Please run ProdiSeeder first.');
            return;
        }

        $mahasiswaData = [
            // Teknik Informatika - Angkatan 2021
            [
                'nim' => '2021001001',
                'nama_lengkap' => 'Ahmad Rizki Pratama',
                'email' => 'ahmad.rizki@student.siakad.com',
                'jenis_kelamin' => 'L',
                'tempat_lahir' => 'Jakarta',
                'tanggal_lahir' => '2003-05-15',
                'alamat' => 'Jl. Merdeka No. 123, Jakarta Selatan',
                'no_hp' => '081234567890',
                'prodi_kode' => 'TI',
                'angkatan' => '2021',
                'status' => 'aktif'
            ],
            [
                'nim' => '2021001002',
                'nama_lengkap' => 'Siti Nurhaliza',
                'email' => 'siti.nurhaliza@student.siakad.com',
                'jenis_kelamin' => 'P',
                'tempat_lahir' => 'Bandung',
                'tanggal_lahir' => '2003-08-20',
                'alamat' => 'Jl. Dago No. 45, Bandung',
                'no_hp' => '081234567891',
                'prodi_kode' => 'TI',
                'angkatan' => '2021',
                'status' => 'aktif'
            ],
            [
                'nim' => '2021001003',
                'nama_lengkap' => 'Muhammad Fadli Rahman',
                'email' => 'fadli.rahman@student.siakad.com',
                'jenis_kelamin' => 'L',
                'tempat_lahir' => 'Surabaya',
                'tanggal_lahir' => '2003-03-10',
                'alamat' => 'Jl. Darmo No. 78, Surabaya',
                'no_hp' => '081234567892',
                'prodi_kode' => 'TI',
                'angkatan' => '2021',
                'status' => 'aktif'
            ],

            // Sistem Informasi - Angkatan 2021
            [
                'nim' => '2021002001',
                'nama_lengkap' => 'Dewi Kartika Sari',
                'email' => 'dewi.kartika@student.siakad.com',
                'jenis_kelamin' => 'P',
                'tempat_lahir' => 'Yogyakarta',
                'tanggal_lahir' => '2003-06-25',
                'alamat' => 'Jl. Malioboro No. 56, Yogyakarta',
                'no_hp' => '081234567893',
                'prodi_kode' => 'SI',
                'angkatan' => '2021',
                'status' => 'aktif'
            ],
            [
                'nim' => '2021002002',
                'nama_lengkap' => 'Budi Santoso',
                'email' => 'budi.santoso@student.siakad.com',
                'jenis_kelamin' => 'L',
                'tempat_lahir' => 'Semarang',
                'tanggal_lahir' => '2003-04-12',
                'alamat' => 'Jl. Pandanaran No. 89, Semarang',
                'no_hp' => '081234567894',
                'prodi_kode' => 'SI',
                'angkatan' => '2021',
                'status' => 'aktif'
            ],

            // Teknik Informatika - Angkatan 2022
            [
                'nim' => '2022001001',
                'nama_lengkap' => 'Andi Wijaya',
                'email' => 'andi.wijaya@student.siakad.com',
                'jenis_kelamin' => 'L',
                'tempat_lahir' => 'Medan',
                'tanggal_lahir' => '2004-01-15',
                'alamat' => 'Jl. Gatot Subroto No. 234, Medan',
                'no_hp' => '081234567895',
                'prodi_kode' => 'TI',
                'angkatan' => '2022',
                'status' => 'aktif'
            ],
            [
                'nim' => '2022001002',
                'nama_lengkap' => 'Putri Ramadhani',
                'email' => 'putri.ramadhani@student.siakad.com',
                'jenis_kelamin' => 'P',
                'tempat_lahir' => 'Palembang',
                'tanggal_lahir' => '2004-07-30',
                'alamat' => 'Jl. Sudirman No. 167, Palembang',
                'no_hp' => '081234567896',
                'prodi_kode' => 'TI',
                'angkatan' => '2022',
                'status' => 'aktif'
            ],
            [
                'nim' => '2022001003',
                'nama_lengkap' => 'Reza Firmansyah',
                'email' => 'reza.firmansyah@student.siakad.com',
                'jenis_kelamin' => 'L',
                'tempat_lahir' => 'Makassar',
                'tanggal_lahir' => '2004-09-18',
                'alamat' => 'Jl. Pettarani No. 45, Makassar',
                'no_hp' => '081234567897',
                'prodi_kode' => 'TI',
                'angkatan' => '2022',
                'status' => 'aktif'
            ],

            // Sistem Informasi - Angkatan 2022
            [
                'nim' => '2022002001',
                'nama_lengkap' => 'Indah Permata',
                'email' => 'indah.permata@student.siakad.com',
                'jenis_kelamin' => 'P',
                'tempat_lahir' => 'Denpasar',
                'tanggal_lahir' => '2004-02-28',
                'alamat' => 'Jl. Bypass Ngurah Rai No. 78, Denpasar',
                'no_hp' => '081234567898',
                'prodi_kode' => 'SI',
                'angkatan' => '2022',
                'status' => 'aktif'
            ],
            [
                'nim' => '2022002002',
                'nama_lengkap' => 'Yoga Pratama',
                'email' => 'yoga.pratama@student.siakad.com',
                'jenis_kelamin' => 'L',
                'tempat_lahir' => 'Malang',
                'tanggal_lahir' => '2004-05-20',
                'alamat' => 'Jl. Ijen No. 123, Malang',
                'no_hp' => '081234567899',
                'prodi_kode' => 'SI',
                'angkatan' => '2022',
                'status' => 'aktif'
            ],

            // Manajemen Informatika D3 - Angkatan 2022
            [
                'nim' => '2022003001',
                'nama_lengkap' => 'Dian Sastro',
                'email' => 'dian.sastro@student.siakad.com',
                'jenis_kelamin' => 'P',
                'tempat_lahir' => 'Bogor',
                'tanggal_lahir' => '2004-11-05',
                'alamat' => 'Jl. Pajajaran No. 56, Bogor',
                'no_hp' => '081234567900',
                'prodi_kode' => 'MI',
                'angkatan' => '2022',
                'status' => 'aktif'
            ],
            [
                'nim' => '2022003002',
                'nama_lengkap' => 'Eko Prasetyo',
                'email' => 'eko.prasetyo@student.siakad.com',
                'jenis_kelamin' => 'L',
                'tempat_lahir' => 'Solo',
                'tanggal_lahir' => '2004-06-15',
                'alamat' => 'Jl. Slamet Riyadi No. 89, Solo',
                'no_hp' => '081234567901',
                'prodi_kode' => 'MI',
                'angkatan' => '2022',
                'status' => 'aktif'
            ],

            // Teknik Informatika - Angkatan 2023
            [
                'nim' => '2023001001',
                'nama_lengkap' => 'Fajar Nugroho',
                'email' => 'fajar.nugroho@student.siakad.com',
                'jenis_kelamin' => 'L',
                'tempat_lahir' => 'Tangerang',
                'tanggal_lahir' => '2005-03-22',
                'alamat' => 'Jl. BSD Raya No. 45, Tangerang',
                'no_hp' => '081234567902',
                'prodi_kode' => 'TI',
                'angkatan' => '2023',
                'status' => 'aktif'
            ],
            [
                'nim' => '2023001002',
                'nama_lengkap' => 'Rina Wulandari',
                'email' => 'rina.wulandari@student.siakad.com',
                'jenis_kelamin' => 'P',
                'tempat_lahir' => 'Bekasi',
                'tanggal_lahir' => '2005-08-14',
                'alamat' => 'Jl. Ahmad Yani No. 78, Bekasi',
                'no_hp' => '081234567903',
                'prodi_kode' => 'TI',
                'angkatan' => '2023',
                'status' => 'aktif'
            ],
            [
                'nim' => '2023001003',
                'nama_lengkap' => 'Hendra Gunawan',
                'email' => 'hendra.gunawan@student.siakad.com',
                'jenis_kelamin' => 'L',
                'tempat_lahir' => 'Depok',
                'tanggal_lahir' => '2005-12-01',
                'alamat' => 'Jl. Margonda Raya No. 234, Depok',
                'no_hp' => '081234567904',
                'prodi_kode' => 'TI',
                'angkatan' => '2023',
                'status' => 'aktif'
            ],

            // Sistem Informasi - Angkatan 2023
            [
                'nim' => '2023002001',
                'nama_lengkap' => 'Maya Angelina',
                'email' => 'maya.angelina@student.siakad.com',
                'jenis_kelamin' => 'P',
                'tempat_lahir' => 'Cirebon',
                'tanggal_lahir' => '2005-04-18',
                'alamat' => 'Jl. Siliwangi No. 56, Cirebon',
                'no_hp' => '081234567905',
                'prodi_kode' => 'SI',
                'angkatan' => '2023',
                'status' => 'aktif'
            ],
            [
                'nim' => '2023002002',
                'nama_lengkap' => 'Irfan Hakim',
                'email' => 'irfan.hakim@student.siakad.com',
                'jenis_kelamin' => 'L',
                'tempat_lahir' => 'Tasikmalaya',
                'tanggal_lahir' => '2005-10-25',
                'alamat' => 'Jl. Otto Iskandardinata No. 89, Tasikmalaya',
                'no_hp' => '081234567906',
                'prodi_kode' => 'SI',
                'angkatan' => '2023',
                'status' => 'aktif'
            ],

            // Teknik Komputer D4 - Angkatan 2023
            [
                'nim' => '2023004001',
                'nama_lengkap' => 'Surya Dharma',
                'email' => 'surya.dharma@student.siakad.com',
                'jenis_kelamin' => 'L',
                'tempat_lahir' => 'Pontianak',
                'tanggal_lahir' => '2005-07-12',
                'alamat' => 'Jl. Gajah Mada No. 123, Pontianak',
                'no_hp' => '081234567907',
                'prodi_kode' => 'TK',
                'angkatan' => '2023',
                'status' => 'aktif'
            ],
            [
                'nim' => '2023004002',
                'nama_lengkap' => 'Lestari Dewi',
                'email' => 'lestari.dewi@student.siakad.com',
                'jenis_kelamin' => 'P',
                'tempat_lahir' => 'Balikpapan',
                'tanggal_lahir' => '2005-09-30',
                'alamat' => 'Jl. Jenderal Sudirman No. 45, Balikpapan',
                'no_hp' => '081234567908',
                'prodi_kode' => 'TK',
                'angkatan' => '2023',
                'status' => 'aktif'
            ],

            // Mahasiswa Alumni (Lulus)
            [
                'nim' => '2019001001',
                'nama_lengkap' => 'Alumni Pertama',
                'email' => 'alumni.pertama@student.siakad.com',
                'jenis_kelamin' => 'L',
                'tempat_lahir' => 'Jakarta',
                'tanggal_lahir' => '2001-01-01',
                'alamat' => 'Jl. Alumni No. 1, Jakarta',
                'no_hp' => '081234567909',
                'prodi_kode' => 'TI',
                'angkatan' => '2019',
                'status' => 'lulus'
            ],
            [
                'nim' => '2019002001',
                'nama_lengkap' => 'Alumni Kedua',
                'email' => 'alumni.kedua@student.siakad.com',
                'jenis_kelamin' => 'P',
                'tempat_lahir' => 'Bandung',
                'tanggal_lahir' => '2001-02-02',
                'alamat' => 'Jl. Alumni No. 2, Bandung',
                'no_hp' => '081234567910',
                'prodi_kode' => 'SI',
                'angkatan' => '2019',
                'status' => 'lulus'
            ],

            // Mahasiswa Nonaktif
            [
                'nim' => '2020001001',
                'nama_lengkap' => 'Mahasiswa Cuti',
                'email' => 'mahasiswa.cuti@student.siakad.com',
                'jenis_kelamin' => 'L',
                'tempat_lahir' => 'Surabaya',
                'tanggal_lahir' => '2002-05-05',
                'alamat' => 'Jl. Cuti No. 5, Surabaya',
                'no_hp' => '081234567911',
                'prodi_kode' => 'TI',
                'angkatan' => '2020',
                'status' => 'nonaktif'
            ],
        ];

        $createdCount = 0;
        $skippedCount = 0;

        foreach ($mahasiswaData as $data) {
            // Check if user with this email already exists
            $existingUser = User::where('email', $data['email'])->first();
            if ($existingUser) {
                $this->command->warn("User with email {$data['email']} already exists. Skipping...");
                $skippedCount++;
                continue;
            }

            // Check if mahasiswa with this NIM already exists
            $existingMahasiswa = Mahasiswa::where('nim', $data['nim'])->first();
            if ($existingMahasiswa) {
                $this->command->warn("Mahasiswa with NIM {$data['nim']} already exists. Skipping...");
                $skippedCount++;
                continue;
            }

            // Find prodi by kode
            $prodi = $prodis->where('kode_prodi', $data['prodi_kode'])->first();
            
            if (!$prodi) {
                $this->command->warn("Prodi with code {$data['prodi_kode']} not found. Skipping mahasiswa {$data['nama_lengkap']}...");
                $skippedCount++;
                continue;
            }

            // Create user account
            $user = User::create([
                'name' => $data['nama_lengkap'],
                'email' => $data['email'],
                'password' => Hash::make('password123'), // Default password for all students
                'role' => 'mahasiswa',
                'email_verified_at' => now(),
            ]);

            // Create mahasiswa record
            Mahasiswa::create([
                'user_id' => $user->id,
                'nim' => $data['nim'],
                'nama_lengkap' => $data['nama_lengkap'],
                'jenis_kelamin' => $data['jenis_kelamin'],
                'tempat_lahir' => $data['tempat_lahir'],
                'tanggal_lahir' => $data['tanggal_lahir'],
                'alamat' => $data['alamat'],
                'no_hp' => $data['no_hp'],
                'prodi_id' => $prodi->id,
                'program_studi' => $prodi->nama_prodi, // Keep for backward compatibility
                'angkatan' => $data['angkatan'],
                'status' => $data['status'],
            ]);

            $createdCount++;
            $this->command->info("Created mahasiswa: {$data['nama_lengkap']} (NIM: {$data['nim']})");
        }

        $this->command->info("=====================================");
        $this->command->info("Mahasiswa Seeder completed!");
        $this->command->info("Created: {$createdCount} mahasiswa");
        if ($skippedCount > 0) {
            $this->command->warn("Skipped: {$skippedCount} mahasiswa (already exists)");
        }
        $this->command->info("=====================================");
        $this->command->info("Default password for all students: password123");
        $this->command->info("Sample login credentials:");
        $this->command->info("Email: ahmad.rizki@student.siakad.com | Password: password123");
        $this->command->info("Email: siti.nurhaliza@student.siakad.com | Password: password123");
    }
}
