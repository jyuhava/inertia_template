<?php

namespace Database\Seeders;

use App\Models\Dosen;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DosenSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $dosens = [
            [
                'user' => [
                    'name' => 'Dr. Ahmad Fauzi, M.Kom',
                    'email' => 'ahmad.fauzi@university.ac.id',
                    'password' => Hash::make('password'),
                    'role' => 'dosen',
                ],
                'dosen' => [
                    'nip' => '197501012000031001',
                    'nama_lengkap' => 'Dr. Ahmad Fauzi, M.Kom',
                    'jenis_kelamin' => 'L',
                    'tempat_lahir' => 'Jakarta',
                    'tanggal_lahir' => '1975-01-01',
                    'alamat' => 'Jl. Raya No. 123, Jakarta',
                    'no_hp' => '081234567890',
                    'pendidikan_terakhir' => 'S3 Ilmu Komputer',
                    'bidang_keahlian' => 'Machine Learning, Artificial Intelligence',
                    'jabatan_akademik' => 'Lektor Kepala',
                    'status' => 'aktif',
                ]
            ],
            [
                'user' => [
                    'name' => 'Prof. Siti Aminah, Ph.D',
                    'email' => 'siti.aminah@university.ac.id',
                    'password' => Hash::make('password'),
                    'role' => 'dosen',
                ],
                'dosen' => [
                    'nip' => '196803152000032001',
                    'nama_lengkap' => 'Prof. Siti Aminah, Ph.D',
                    'jenis_kelamin' => 'P',
                    'tempat_lahir' => 'Bandung',
                    'tanggal_lahir' => '1968-03-15',
                    'alamat' => 'Jl. Sudirman No. 456, Bandung',
                    'no_hp' => '081298765432',
                    'pendidikan_terakhir' => 'S3 Computer Science',
                    'bidang_keahlian' => 'Software Engineering, Database Systems',
                    'jabatan_akademik' => 'Profesor',
                    'status' => 'aktif',
                ]
            ],
            [
                'user' => [
                    'name' => 'Budi Santoso, M.T',
                    'email' => 'budi.santoso@university.ac.id',
                    'password' => Hash::make('password'),
                    'role' => 'dosen',
                ],
                'dosen' => [
                    'nip' => '198505102010031002',
                    'nama_lengkap' => 'Budi Santoso, M.T',
                    'jenis_kelamin' => 'L',
                    'tempat_lahir' => 'Surabaya',
                    'tanggal_lahir' => '1985-05-10',
                    'alamat' => 'Jl. Merdeka No. 789, Surabaya',
                    'no_hp' => '081345678901',
                    'pendidikan_terakhir' => 'S2 Teknik Informatika',
                    'bidang_keahlian' => 'Web Development, Mobile Programming',
                    'jabatan_akademik' => 'Lektor',
                    'status' => 'aktif',
                ]
            ],
            [
                'user' => [
                    'name' => 'Dra. Maria Kristina, M.Si',
                    'email' => 'maria.kristina@university.ac.id',
                    'password' => Hash::make('password'),
                    'role' => 'dosen',
                ],
                'dosen' => [
                    'nip' => '197912201999032001',
                    'nama_lengkap' => 'Dra. Maria Kristina, M.Si',
                    'jenis_kelamin' => 'P',
                    'tempat_lahir' => 'Yogyakarta',
                    'tanggal_lahir' => '1979-12-20',
                    'alamat' => 'Jl. Malioboro No. 321, Yogyakarta',
                    'no_hp' => '081456789012',
                    'pendidikan_terakhir' => 'S2 Sistem Informasi',
                    'bidang_keahlian' => 'Information Systems, Business Intelligence',
                    'jabatan_akademik' => 'Asisten Ahli',
                    'status' => 'aktif',
                ]
            ],
            [
                'user' => [
                    'name' => 'Ir. Wahyu Pratama, M.Kom',
                    'email' => 'wahyu.pratama@university.ac.id',
                    'password' => Hash::make('password'),
                    'role' => 'dosen',
                ],
                'dosen' => [
                    'nip' => '198001052005031003',
                    'nama_lengkap' => 'Ir. Wahyu Pratama, M.Kom',
                    'jenis_kelamin' => 'L',
                    'tempat_lahir' => 'Medan',
                    'tanggal_lahir' => '1980-01-05',
                    'alamat' => 'Jl. Ahmad Yani No. 654, Medan',
                    'no_hp' => '081567890123',
                    'pendidikan_terakhir' => 'S2 Ilmu Komputer',
                    'bidang_keahlian' => 'Network Security, Cloud Computing',
                    'jabatan_akademik' => null,
                    'status' => 'aktif',
                ]
            ],
        ];

        foreach ($dosens as $dosenData) {
            // Create user first
            $user = User::create([
                'name' => $dosenData['user']['name'],
                'email' => $dosenData['user']['email'],
                'password' => $dosenData['user']['password'],
                'role' => $dosenData['user']['role'],
                'email_verified_at' => now(),
            ]);

            // Create dosen record
            Dosen::create([
                'user_id' => $user->id,
                'nip' => $dosenData['dosen']['nip'],
                'nama_lengkap' => $dosenData['dosen']['nama_lengkap'],
                'jenis_kelamin' => $dosenData['dosen']['jenis_kelamin'],
                'tempat_lahir' => $dosenData['dosen']['tempat_lahir'],
                'tanggal_lahir' => $dosenData['dosen']['tanggal_lahir'],
                'alamat' => $dosenData['dosen']['alamat'],
                'no_hp' => $dosenData['dosen']['no_hp'],
                'pendidikan_terakhir' => $dosenData['dosen']['pendidikan_terakhir'],
                'bidang_keahlian' => $dosenData['dosen']['bidang_keahlian'],
                'jabatan_akademik' => $dosenData['dosen']['jabatan_akademik'],
                'status' => $dosenData['dosen']['status'],
            ]);
        }
    }
}
