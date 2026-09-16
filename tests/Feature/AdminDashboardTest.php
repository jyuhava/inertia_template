<?php

namespace Tests\Feature;

use App\Models\Dosen;
use App\Models\JadwalKuliah;
use App\Models\Krs;
use App\Models\MataKuliah;
use App\Models\Penilaian;
use App\Models\PeriodeKrs;
use App\Models\Prodi;
use App\Models\Semester;
use App\Models\TahunAjaran;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminDashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_dashboard_renders(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->get('/admin/dashboard')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Dashboard')
                ->has('statistics')
                ->has('penilaianStatistics')
                ->has('kehadiranStatistics')
                ->has('dosenStatistics')
                ->has('mahasiswaByAngkatan')
                ->has('mahasiswaByProdi'));
    }

    public function test_admin_dashboard_renders_with_penilaian_and_absensi_data(): void
    {
        $prodi = Prodi::create([
            'kode_prodi' => 'TI',
            'nama_prodi' => 'Teknik Informatika',
            'jenjang' => 'S1',
            'status' => 'aktif',
        ]);

        $tahun = TahunAjaran::create([
            'nama_tahun_ajaran' => '2026/2027',
            'tanggal_mulai' => '2026-08-01',
            'tanggal_selesai' => '2027-07-31',
            'status' => 'aktif',
        ]);

        $semester = Semester::create([
            'tahun_ajaran_id' => $tahun->id,
            'nama_semester' => 'Ganjil',
            'tanggal_mulai' => '2026-08-01',
            'tanggal_selesai' => '2027-01-31',
            'status' => 'aktif',
        ]);

        $periode = PeriodeKrs::create([
            'nama_periode' => 'KRS Ganjil 2026/2027',
            'tahun_ajaran_id' => $tahun->id,
            'semester_id' => $semester->id,
            'tanggal_mulai' => '2026-08-01',
            'tanggal_selesai' => '2026-08-31',
            'status' => 'aktif',
        ]);

        $mhsUser = User::factory()->create(['role' => 'mahasiswa']);
        $mahasiswa = \App\Models\Mahasiswa::create([
            'user_id' => $mhsUser->id,
            'nim' => '2026001',
            'nama_lengkap' => 'Mahasiswa Uji',
            'jenis_kelamin' => 'L',
            'tempat_lahir' => 'Bandung',
            'tanggal_lahir' => '2005-01-01',
            'alamat' => 'Jl. Uji',
            'no_hp' => '081234567',
            'program_studi' => 'Teknik Informatika',
            'angkatan' => '2026',
            'status' => 'aktif',
            'prodi_id' => $prodi->id,
        ]);

        $dosUser = User::factory()->create(['role' => 'dosen']);
        $dosen = Dosen::create([
            'user_id' => $dosUser->id,
            'nip' => '19870099',
            'nama_lengkap' => 'Dosen Uji',
            'jenis_kelamin' => 'L',
            'tempat_lahir' => 'Jakarta',
            'tanggal_lahir' => '1987-01-01',
            'alamat' => 'Jl. Dosen',
            'no_hp' => '0812345678',
            'pendidikan_terakhir' => 'S2',
            'bidang_keahlian' => 'TI',
            'jabatan_akademik' => 'Lektor',
            'status' => 'aktif',
        ]);

        $mataKuliah = MataKuliah::create([
            'kode_mata_kuliah' => 'MK001',
            'nama_mata_kuliah' => 'Algoritma',
            'sks' => 3,
            'semester' => 1,
            'prodi_id' => $prodi->id,
            'jenis' => 'Wajib',
            'status' => 'aktif',
        ]);

        $jadwal = JadwalKuliah::create([
            'mata_kuliah_id' => $mataKuliah->id,
            'dosen_id' => $dosen->id,
            'semester_id' => $semester->id,
            'hari' => 'Senin',
            'jam_mulai' => '08:00:00',
            'jam_selesai' => '10:00:00',
            'ruangan' => 'R.101',
            'kapasitas' => 40,
            'status' => 'aktif',
        ]);

        Penilaian::create([
            'mahasiswa_id' => $mahasiswa->id,
            'jadwal_kuliah_id' => $jadwal->id,
            'periode_krs_id' => $periode->id,
            'nilai_tugas' => 90,
            'nilai_uts' => 85,
            'nilai_uas' => 88,
            'nilai_akhir' => 87.4,
            'nilai_huruf' => 'A',
            'nilai_angka' => 4,
            'status' => 'final',
        ]);

        \App\Models\Absensi::create([
            'jadwal_kuliah_id' => $jadwal->id,
            'mahasiswa_id' => $mahasiswa->id,
            'periode_krs_id' => $periode->id,
            'tanggal' => now()->toDateString(),
            'jam_mulai' => '08:00',
            'jam_selesai' => '10:00',
            'status' => 'hadir',
            'created_by' => $dosUser->id,
        ]);

        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->get('/admin/dashboard')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Dashboard')
                ->where('penilaianStatistics.total', 1)
                ->where('penilaianStatistics.final', 1)
                ->where('penilaianStatistics.rata_nilai', 87.4)
                ->where('kehadiranStatistics.total', 1)
                ->where('kehadiranStatistics.hadir', 1)
                ->where('kehadiranStatistics.tingkat', 100)
                ->where('dosenStatistics.byJabatan', fn ($byJabatan) => count($byJabatan) === 1));
    }
}