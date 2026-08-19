<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Mahasiswa;
use App\Models\Prodi;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class MahasiswaMPISeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Seeder untuk mahasiswa MPI STIT AL-WAFI BOGOR
     */
    public function run(): void
    {
        // Check if prodi with id 6 exists
        $prodi = Prodi::find(6);
        if (!$prodi) {
            $this->command->error('Prodi dengan ID 6 tidak ditemukan!');
            return;
        }

        $this->command->info("Menambahkan mahasiswa untuk prodi: {$prodi->nama_prodi} (ID: {$prodi->id})");

        // Mahasiswa Ikhwan (Laki-laki)
        $mahasiswaIkhwan = [
            'Arya Maulana',
            'Muhammad Ersady Rivai',
            'Abdullah Ibnul Mubarak',
            'Daniel Zia Ulhaq',
            'Ahmad Hassaan Sugitahari',
            'Muhammad Lutfir Amin Rahman',
            'Amiruddien Al-Khatamy',
            'Abdul Qowi Fawwaz Al-Atsari',
            'Muhammad',
            'Jalaluddin Hafiz',
            'Muhammad Iqbal Rosady',
            'Tri Deprianto',
            'Muhammad Ridwan',
            'Adi Gunawan',
            'Tariq Azis Ramadhani',
            'Ismail Sayyaf',
            'Hasby Arrasyid',
            'Dimas Umar Al Haitsam',
            'Haidar Fahmi',
            'Muhammad Rafli',
            'Abdullah Yusron',
            'Asadurrahman Zen',
            'Angga Dwi Prasetya',
            'Azzam Abdillah',
            'Agung Prayoga',
            'Nastain',
            'Yusuf Zainal',
            'Yafi Fathan',
            'Drastya Adra',
        ];

        // Mahasiswa Akhwat (Perempuan)
        $mahasiswaAkhwat = [
            'Farah Mayassa Salsabila',
            'Indah Purnamasari',
            'Cut Mutia Silmi Hanif',
            'Octavia Zulkarnaen',
            'Muthia Nabila Husna',
            'Balqis Zerlinda Ciputri',
            'Nafiah',
            'Siti Namira Uqba Hasanah',
            'Amara Revina Natasya',
            'Asiyah',
            'Mudrikah Zain',
            'Rayya Rifkah Falihah',
            'Miftah Nur Azizah',
        ];

        $nimCounter = 1;
        $currentYear = 2024;

        // Helper function to generate email from name
        $generateEmail = function($name) {
            // Remove common titles and clean name
            $cleanName = str_replace(['Muhammad ', 'Siti ', 'Cut '], '', $name);
            $cleanName = Str::slug($cleanName, '.');
            return strtolower($cleanName) . '@alwafi.ac.id';
        };

        // Helper function to generate NIM
        $generateNIM = function($counter, $year) {
            return $year . '006' . str_pad($counter, 3, '0', STR_PAD_LEFT);
        };

        // Process Ikhwan (Laki-laki)
        foreach ($mahasiswaIkhwan as $nama) {
            $email = $generateEmail($nama);
            $nim = $generateNIM($nimCounter++, $currentYear);

            // Check if user already exists
            $existingUser = User::where('email', $email)->first();
            if ($existingUser) {
                $this->command->warn("User already exists: {$email}");
                continue;
            }

            // Check if NIM already exists
            $existingMahasiswa = Mahasiswa::where('nim', $nim)->first();
            if ($existingMahasiswa) {
                $this->command->warn("NIM already exists: {$nim}");
                continue;
            }

            // Create user account
            $user = User::create([
                'name' => $nama,
                'email' => $email,
                'password' => Hash::make('password'),
                'role' => 'mahasiswa',
                'email_verified_at' => now(),
            ]);

            // Create mahasiswa record
            Mahasiswa::create([
                'user_id' => $user->id,
                'nim' => $nim,
                'nama_lengkap' => $nama,
                'jenis_kelamin' => 'L',
                'tempat_lahir' => 'Bogor',
                'tanggal_lahir' => '2005-01-01', // Default birth date
                'alamat' => 'Bogor, Jawa Barat',
                'no_hp' => '0812' . rand(10000000, 99999999),
                'prodi_id' => 6,
                'program_studi' => 'Manajemen Pendidikan Islam', // Required field
                'angkatan' => '2024',
                'status' => 'aktif',
            ]);

            $this->command->info("✓ Created: {$nim} - {$nama} (L)");
        }

        // Process Akhwat (Perempuan)
        foreach ($mahasiswaAkhwat as $nama) {
            $email = $generateEmail($nama);
            $nim = $generateNIM($nimCounter++, $currentYear);

            // Check if user already exists
            $existingUser = User::where('email', $email)->first();
            if ($existingUser) {
                $this->command->warn("User already exists: {$email}");
                continue;
            }

            // Check if NIM already exists
            $existingMahasiswa = Mahasiswa::where('nim', $nim)->first();
            if ($existingMahasiswa) {
                $this->command->warn("NIM already exists: {$nim}");
                continue;
            }

            // Create user account
            $user = User::create([
                'name' => $nama,
                'email' => $email,
                'password' => Hash::make('password'),
                'role' => 'mahasiswa',
                'email_verified_at' => now(),
            ]);

            // Create mahasiswa record
            Mahasiswa::create([
                'user_id' => $user->id,
                'nim' => $nim,
                'nama_lengkap' => $nama,
                'jenis_kelamin' => 'P',
                'tempat_lahir' => 'Bogor',
                'tanggal_lahir' => '2005-01-01', // Default birth date
                'alamat' => 'Bogor, Jawa Barat',
                'no_hp' => '0812' . rand(10000000, 99999999),
                'prodi_id' => 6,
                'program_studi' => 'Manajemen Pendidikan Islam', // Required field
                'angkatan' => '2024',
                'status' => 'aktif',
            ]);

            $this->command->info("✓ Created: {$nim} - {$nama} (P)");
        }

        $totalMahasiswa = count($mahasiswaIkhwan) + count($mahasiswaAkhwat);
        
        $this->command->info('');
        $this->command->info('🎉 Mahasiswa MPI STIT AL-WAFI BOGOR berhasil ditambahkan!');
        $this->command->info("Total: {$totalMahasiswa} mahasiswa");
        $this->command->info("- Ikhwan (Laki-laki): " . count($mahasiswaIkhwan) . " mahasiswa");
        $this->command->info("- Akhwat (Perempuan): " . count($mahasiswaAkhwat) . " mahasiswa");
        $this->command->info("Prodi: {$prodi->nama_prodi} (ID: {$prodi->id})");
        $this->command->info("Angkatan: 2024");
        $this->command->info("Password default untuk semua mahasiswa: password");
        $this->command->info("Domain email: @alwafi.ac.id");
    }
}
