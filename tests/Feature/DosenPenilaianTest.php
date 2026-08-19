<?php

namespace Tests\Feature;

use App\Models\Dosen;
use App\Models\JadwalKuliah;
use App\Models\Mahasiswa;
use App\Models\MataKuliah;
use App\Models\Penilaian;
use App\Models\PeriodeKrs;
use App\Models\Prodi;
use App\Models\Semester;
use App\Models\TahunAjaran;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DosenPenilaianTest extends TestCase
{
    use RefreshDatabase;

    private function makeDosen(): Dosen
    {
        $user = User::factory()->create(['role' => 'dosen']);

        return Dosen::create([
            'user_id' => $user->id,
            'nip' => '198800'.random_int(1000, 9999),
            'nama_lengkap' => 'Dosen Penguji '.random_int(100, 999),
            'jenis_kelamin' => 'L',
            'tempat_lahir' => 'Jakarta',
            'tanggal_lahir' => '1988-01-01',
            'alamat' => 'Jl. Test No. 1',
            'no_hp' => '081234567890',
            'pendidikan_terakhir' => 'S2',
            'bidang_keahlian' => 'Teknik Informatika',
            'jabatan_akademik' => 'Lektor',
            'status' => 'aktif',
        ]);
    }

    private function makePeriodeAktif(): PeriodeKrs
    {
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

        return PeriodeKrs::create([
            'nama_periode' => 'KRS Ganjil 2026/2027',
            'tahun_ajaran_id' => $tahun->id,
            'semester_id' => $semester->id,
            'tanggal_mulai' => '2026-08-01',
            'tanggal_selesai' => '2026-08-31',
            'status' => 'aktif',
        ]);
    }

    private function makeKelas(Dosen $dosen, PeriodeKrs $periode): array
    {
        $prodi = Prodi::create([
            'kode_prodi' => 'TI',
            'nama_prodi' => 'Teknik Informatika',
            'jenjang' => 'S1',
            'status' => 'aktif',
        ]);

        $mataKuliah = MataKuliah::create([
            'kode_mata_kuliah' => 'TI101',
            'nama_mata_kuliah' => 'Pemrograman Web',
            'sks' => 3,
            'semester' => 1,
            'prodi_id' => $prodi->id,
            'jenis' => 'Wajib',
            'status' => 'aktif',
        ]);

        $jadwal = JadwalKuliah::create([
            'mata_kuliah_id' => $mataKuliah->id,
            'dosen_id' => $dosen->id,
            'semester_id' => $periode->semester_id,
            'hari' => 'Senin',
            'jam_mulai' => '08:00:00',
            'jam_selesai' => '10:00:00',
            'ruangan' => 'R.101',
            'kapasitas' => 40,
            'status' => 'aktif',
        ]);

        $penilaians = [];
        foreach (['2026A', '2026B'] as $i => $nim) {
            $mhsUser = User::factory()->create(['role' => 'mahasiswa']);
            $mahasiswa = Mahasiswa::create([
                'user_id' => $mhsUser->id,
                'nim' => $nim,
                'nama_lengkap' => 'Mahasiswa '.$i,
                'jenis_kelamin' => 'P',
                'tempat_lahir' => 'Bandung',
                'tanggal_lahir' => '2005-01-01',
                'alamat' => 'Jl. Ujian',
                'no_hp' => '0812000'.$i,
                'program_studi' => 'Teknik Informatika',
                'angkatan' => '2026',
                'status' => 'aktif',
                'prodi_id' => $prodi->id,
            ]);

            $penilaians[] = Penilaian::create([
                'mahasiswa_id' => $mahasiswa->id,
                'jadwal_kuliah_id' => $jadwal->id,
                'periode_krs_id' => $periode->id,
                'status' => 'draft',
            ]);
        }

        return [$jadwal, $penilaians];
    }

    public function test_dosen_can_finalisasi_and_unfinalisasi_own_class(): void
    {
        $dosen = $this->makeDosen();
        $periode = $this->makePeriodeAktif();
        [$jadwal, $penilaians] = $this->makeKelas($dosen, $periode);

        $this->actingAs($dosen->user)
            ->post("/dosen/penilaian/{$jadwal->id}/finalisasi")
            ->assertRedirect();

        $this->assertSame('final', $penilaians[0]->refresh()->status);
        $this->assertSame('final', $penilaians[1]->refresh()->status);

        $this->actingAs($dosen->user)
            ->post("/dosen/penilaian/{$jadwal->id}/unfinalisasi")
            ->assertRedirect();

        $this->assertSame('draft', $penilaians[0]->refresh()->status);
        $this->assertSame('draft', $penilaians[1]->refresh()->status);
    }

    public function test_dosen_cannot_finalisasi_or_unfinalisasi_other_class(): void
    {
        $dosen = $this->makeDosen();
        $otherDosen = $this->makeDosen();
        $periode = $this->makePeriodeAktif();
        [$jadwal, $penilaians] = $this->makeKelas($dosen, $periode);

        $this->actingAs($otherDosen->user)
            ->post("/dosen/penilaian/{$jadwal->id}/finalisasi")
            ->assertRedirect()
            ->assertSessionHas('error', 'Unauthorized.');

        $this->actingAs($otherDosen->user)
            ->post("/dosen/penilaian/{$jadwal->id}/unfinalisasi")
            ->assertRedirect()
            ->assertSessionHas('error', 'Unauthorized.');
    }

    public function test_unfinalisasi_requires_active_periode(): void
    {
        $dosen = $this->makeDosen();
        $periode = $this->makePeriodeAktif();
        [$jadwal, $penilaians] = $this->makeKelas($dosen, $periode);

        $periode->update(['status' => 'tidak_aktif']);

        $this->actingAs($dosen->user)
            ->post("/dosen/penilaian/{$jadwal->id}/unfinalisasi")
            ->assertRedirect()
            ->assertSessionHas('error', 'Tidak ada periode KRS yang aktif.');
    }
}