<?php

namespace Database\Seeders;

use App\Models\Dosen;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DosenBaruSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Seeder untuk dosen-dosen baru berdasarkan jadwal perkuliahan MPI STIT AL-WAFI BOGOR
     */
    public function run(): void
    {
        $dosens = [
            [
                'user' => [
                    'name' => 'Ust. Yusuf Abdullah, M.Pd.',
                    'email' => 'yusuf.abdullah@alwafi.ac.id',
                    'password' => Hash::make('password'),
                    'role' => 'dosen',
                ],
                'dosen' => [
                    'nip' => '198001012010011001',
                    'nama_lengkap' => 'Ust. Yusuf Abdullah, M.Pd.',
                    'jenis_kelamin' => 'L',
                    'tempat_lahir' => 'Bogor',
                    'tanggal_lahir' => '1980-01-01',
                    'alamat' => 'Jl. Raya Bogor No. 123, Bogor',
                    'no_hp' => '081234567801',
                    'pendidikan_terakhir' => 'S2 Pendidikan Islam',
                    'bidang_keahlian' => 'Al-Quran & Ulumul Quran',
                    'jabatan_akademik' => 'Asisten Ahli',
                    'status' => 'aktif',
                ]
            ],
            [
                'user' => [
                    'name' => 'Dr. Ali Saman Hasan, MA',
                    'email' => 'ali.saman@alwafi.ac.id',
                    'password' => Hash::make('password'),
                    'role' => 'dosen',
                ],
                'dosen' => [
                    'nip' => '197505152005011002',
                    'nama_lengkap' => 'Dr. Ali Saman Hasan, MA',
                    'jenis_kelamin' => 'L',
                    'tempat_lahir' => 'Jakarta',
                    'tanggal_lahir' => '1975-05-15',
                    'alamat' => 'Jl. Al-Hikmah No. 45, Bogor',
                    'no_hp' => '081234567802',
                    'pendidikan_terakhir' => 'S3 Ilmu Agama Islam',
                    'bidang_keahlian' => 'Ilmu Kepesantrenan',
                    'jabatan_akademik' => 'Lektor',
                    'status' => 'aktif',
                ]
            ],
            [
                'user' => [
                    'name' => 'Usth. Dr. Ananingtyas',
                    'email' => 'ananingtyas@alwafi.ac.id',
                    'password' => Hash::make('password'),
                    'role' => 'dosen',
                ],
                'dosen' => [
                    'nip' => '198203102012032001',
                    'nama_lengkap' => 'Usth. Dr. Ananingtyas',
                    'jenis_kelamin' => 'P',
                    'tempat_lahir' => 'Yogyakarta',
                    'tanggal_lahir' => '1982-03-10',
                    'alamat' => 'Jl. Pesantren No. 67, Bogor',
                    'no_hp' => '081234567803',
                    'pendidikan_terakhir' => 'S3 Filsafat Islam',
                    'bidang_keahlian' => 'Filsafat Umum',
                    'jabatan_akademik' => 'Asisten Ahli',
                    'status' => 'aktif',
                ]
            ],
            [
                'user' => [
                    'name' => 'Usth. Fortin Sri Haryani',
                    'email' => 'fortin.sri@alwafi.ac.id',
                    'password' => Hash::make('password'),
                    'role' => 'dosen',
                ],
                'dosen' => [
                    'nip' => '198507202015032002',
                    'nama_lengkap' => 'Usth. Fortin Sri Haryani',
                    'jenis_kelamin' => 'P',
                    'tempat_lahir' => 'Bandung',
                    'tanggal_lahir' => '1985-07-20',
                    'alamat' => 'Jl. Manajemen No. 89, Bogor',
                    'no_hp' => '081234567804',
                    'pendidikan_terakhir' => 'S2 Manajemen',
                    'bidang_keahlian' => 'Ilmu Manajemen',
                    'jabatan_akademik' => 'Asisten Ahli',
                    'status' => 'aktif',
                ]
            ],
            [
                'user' => [
                    'name' => 'Ust. Muh. Bakri Rahimin, Lc, ME',
                    'email' => 'bakri.rahimin@alwafi.ac.id',
                    'password' => Hash::make('password'),
                    'role' => 'dosen',
                ],
                'dosen' => [
                    'nip' => '197812122008011003',
                    'nama_lengkap' => 'Ust. Muh. Bakri Rahimin, Lc, ME',
                    'jenis_kelamin' => 'L',
                    'tempat_lahir' => 'Makassar',
                    'tanggal_lahir' => '1978-12-12',
                    'alamat' => 'Jl. Hadits No. 34, Bogor',
                    'no_hp' => '081234567805',
                    'pendidikan_terakhir' => 'S2 Ekonomi Islam',
                    'bidang_keahlian' => 'Ulumul Hadits, Ekonomi Islam',
                    'jabatan_akademik' => 'Lektor',
                    'status' => 'aktif',
                ]
            ],
            [
                'user' => [
                    'name' => 'Ust. Marullah MZ, M.Ag.',
                    'email' => 'marullah.mz@alwafi.ac.id',
                    'password' => Hash::make('password'),
                    'role' => 'dosen',
                ],
                'dosen' => [
                    'nip' => '198004152010011004',
                    'nama_lengkap' => 'Ust. Marullah MZ, M.Ag.',
                    'jenis_kelamin' => 'L',
                    'tempat_lahir' => 'Aceh',
                    'tanggal_lahir' => '1980-04-15',
                    'alamat' => 'Jl. Akidah No. 56, Bogor',
                    'no_hp' => '081234567806',
                    'pendidikan_terakhir' => 'S2 Agama Islam',
                    'bidang_keahlian' => 'Akidah dan Adab',
                    'jabatan_akademik' => 'Asisten Ahli',
                    'status' => 'aktif',
                ]
            ],
            [
                'user' => [
                    'name' => 'Ust. Zikra Juninawan, Lc, MA',
                    'email' => 'zikra.juninawan@alwafi.ac.id',
                    'password' => Hash::make('password'),
                    'role' => 'dosen',
                ],
                'dosen' => [
                    'nip' => '198306102013011005',
                    'nama_lengkap' => 'Ust. Zikra Juninawan, Lc, MA',
                    'jenis_kelamin' => 'L',
                    'tempat_lahir' => 'Padang',
                    'tanggal_lahir' => '1983-06-10',
                    'alamat' => 'Jl. Pancasila No. 78, Bogor',
                    'no_hp' => '081234567807',
                    'pendidikan_terakhir' => 'S2 Studi Islam',
                    'bidang_keahlian' => 'Pancasila, Studi Islam',
                    'jabatan_akademik' => 'Asisten Ahli',
                    'status' => 'aktif',
                ]
            ],
            [
                'user' => [
                    'name' => 'Ust. Nandang',
                    'email' => 'nandang@alwafi.ac.id',
                    'password' => Hash::make('password'),
                    'role' => 'dosen',
                ],
                'dosen' => [
                    'nip' => '198509252018011006',
                    'nama_lengkap' => 'Ust. Nandang',
                    'jenis_kelamin' => 'L',
                    'tempat_lahir' => 'Bogor',
                    'tanggal_lahir' => '1985-09-25',
                    'alamat' => 'Jl. Sosiologi No. 90, Bogor',
                    'no_hp' => '081234567808',
                    'pendidikan_terakhir' => 'S1 Sosiologi',
                    'bidang_keahlian' => 'Sosiologi dan Antropologi',
                    'jabatan_akademik' => 'Asisten Ahli',
                    'status' => 'aktif',
                ]
            ],
        ];

        foreach ($dosens as $dosenData) {
            // Check if user already exists
            $existingUser = User::where('email', $dosenData['user']['email'])->first();
            
            if ($existingUser) {
                $this->command->warn("User already exists: {$dosenData['user']['email']}");
                continue;
            }
            
            // Create user account first
            $user = User::create($dosenData['user']);
            
            // Add user_id to dosen data
            $dosenData['dosen']['user_id'] = $user->id;
            
            // Create dosen record
            Dosen::create($dosenData['dosen']);
            
            $this->command->info("Created dosen: {$dosenData['dosen']['nama_lengkap']}");
        }

        $this->command->info('Dosen baru STIT AL-WAFI BOGOR berhasil dibuat!');
        $this->command->info('Total: ' . count($dosens) . ' dosen baru');
        $this->command->info('Password default untuk semua dosen: password');
    }
}
