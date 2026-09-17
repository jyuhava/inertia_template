<?php

namespace Tests\Feature;

use App\Models\Dosen;
use App\Models\JadwalKelasKuliah;
use App\Models\KelasKuliah;
use App\Models\MataKuliah;
use App\Models\PddiktiAkademikMapping;
use App\Models\Prodi;
use App\Models\Ruangan;
use App\Models\Semester;
use App\Models\TahunAjaran;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class KelasKuliahJadwalTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }

    private function prodi(): Prodi
    {
        return Prodi::create(['kode_prodi' => 'TI', 'nama_prodi' => 'Teknik Informatika', 'jenjang' => 'S1', 'status' => 'aktif']);
    }

    private function semester(): Semester
    {
        $ta = TahunAjaran::create(['nama_tahun_ajaran' => '2026/2027', 'tanggal_mulai' => '2026-08-01', 'tanggal_selesai' => '2027-07-31', 'status' => 'aktif']);

        return Semester::create(['tahun_ajaran_id' => $ta->id, 'nama_semester' => 'Ganjil', 'tanggal_mulai' => '2026-08-01', 'tanggal_selesai' => '2027-01-31', 'status' => 'aktif']);
    }

    private function mataKuliah(Prodi $prodi): MataKuliah
    {
        return MataKuliah::create(['kode_mata_kuliah' => 'IF101', 'nama_mata_kuliah' => 'Algoritma', 'sks' => 3, 'semester' => 1, 'prodi_id' => $prodi->id, 'jenis' => 'Wajib', 'status' => 'aktif']);
    }

    private function dosen(): Dosen
    {
        $user = User::factory()->create(['role' => 'dosen']);

        return Dosen::create(['user_id' => $user->id, 'nip' => 'D001', 'nama_lengkap' => 'Dr. Budi', 'jenis_kelamin' => 'L', 'tempat_lahir' => 'Bandung', 'tanggal_lahir' => '1980-01-01', 'alamat' => 'Jl. A', 'no_hp' => '0800', 'pendidikan_terakhir' => 'S3', 'bidang_keahlian' => 'Informatika', 'status' => 'aktif']);
    }

    public function test_admin_can_create_class(): void
    {
        $admin = $this->admin();
        $prodi = $this->prodi();
        $semester = $this->semester();
        $mk = $this->mataKuliah($prodi);
        $response = $this->actingAs($admin)->post(route('admin.kelas-kuliah.store'), [
            'mata_kuliah_id' => $mk->id, 'semester_id' => $semester->id, 'kode_kelas' => 'A', 'kapasitas' => 40, 'tipe_kelas' => 'reguler', 'status' => 'draft',
        ]);
        $response->assertRedirect();
        $this->assertEquals(1, KelasKuliah::count());
    }

    public function test_class_capacity_and_period_are_stored_independently_of_krs(): void
    {
        $admin = $this->admin();
        $prodi = $this->prodi();
        $semester = $this->semester();
        $mk = $this->mataKuliah($prodi);
        $this->actingAs($admin)->post(route('admin.kelas-kuliah.store'), ['mata_kuliah_id' => $mk->id, 'semester_id' => $semester->id, 'kode_kelas' => 'A', 'kapasitas' => 25, 'tipe_kelas' => 'reguler', 'status' => 'draft']);
        $kelas = KelasKuliah::first();
        $this->assertEquals(25, $kelas->kapasitas);
        $this->assertEquals($semester->id, $kelas->semester_id);
        $this->assertEquals($mk->id, $kelas->mata_kuliah_id);
    }

    public function test_admin_can_assign_teaching_lecturer_to_class(): void
    {
        $admin = $this->admin();
        $prodi = $this->prodi();
        $semester = $this->semester();
        $mk = $this->mataKuliah($prodi);
        $dosen = $this->dosen();
        $this->actingAs($admin)->post(route('admin.kelas-kuliah.store'), ['mata_kuliah_id' => $mk->id, 'semester_id' => $semester->id, 'kode_kelas' => 'A', 'kapasitas' => 40, 'tipe_kelas' => 'reguler', 'status' => 'draft']);
        $kelas = KelasKuliah::first();

        $this->actingAs($admin)->post(route('admin.kelas-kuliah.pengajar.store', $kelas), ['dosen_id' => $dosen->id, 'peran' => 'utama', 'status' => 'aktif'])->assertRedirect();
        $this->assertEquals(1, $kelas->pengajars()->count());
    }

    public function test_admin_can_create_schedule_with_multiple_sessions(): void
    {
        $admin = $this->admin();
        $prodi = $this->prodi();
        $semester = $this->semester();
        $mk = $this->mataKuliah($prodi);
        $ruangan = Ruangan::create(['kode' => 'R101', 'nama' => 'Ruang 101', 'kapasitas' => 40, 'tipe' => 'kelas', 'status' => 'aktif']);
        $this->actingAs($admin)->post(route('admin.kelas-kuliah.store'), ['mata_kuliah_id' => $mk->id, 'semester_id' => $semester->id, 'kode_kelas' => 'A', 'kapasitas' => 40, 'tipe_kelas' => 'reguler', 'status' => 'draft']);
        $kelas = KelasKuliah::first();

        $this->actingAs($admin)->post(route('admin.kelas-kuliah.jadwal.store', $kelas), ['hari' => 'Senin', 'jam_mulai' => '08:00', 'jam_selesai' => '09:40', 'ruangan_id' => $ruangan->id, 'tipe_pertemuan' => 'tatap_muka', 'status' => 'draft'])->assertRedirect();
        $this->actingAs($admin)->post(route('admin.kelas-kuliah.jadwal.store', $kelas), ['hari' => 'Rabu', 'jam_mulai' => '10:00', 'jam_selesai' => '11:40', 'ruangan_id' => $ruangan->id, 'tipe_pertemuan' => 'tatap_muka', 'status' => 'draft'])->assertRedirect();

        $this->assertEquals(2, $kelas->jadwals()->count());
    }

    public function test_room_conflict_is_detected_with_interval_overlap(): void
    {
        $admin = $this->admin();
        $prodi = $this->prodi();
        $semester = $this->semester();
        $mk = $this->mataKuliah($prodi);
        $ruangan = Ruangan::create(['kode' => 'R101', 'nama' => 'Ruang 101', 'kapasitas' => 40, 'tipe' => 'kelas', 'status' => 'aktif']);
        $this->actingAs($admin)->post(route('admin.kelas-kuliah.store'), ['mata_kuliah_id' => $mk->id, 'semester_id' => $semester->id, 'kode_kelas' => 'A', 'kapasitas' => 40, 'tipe_kelas' => 'reguler', 'status' => 'draft']);
        $kelasA = KelasKuliah::first();
        $this->actingAs($admin)->post(route('admin.kelas-kuliah.store'), ['mata_kuliah_id' => $mk->id, 'semester_id' => $semester->id, 'kode_kelas' => 'B', 'kapasitas' => 40, 'tipe_kelas' => 'reguler', 'status' => 'draft']);
        $kelasB = KelasKuliah::where('kode_kelas', 'B')->first();

        $this->actingAs($admin)->post(route('admin.kelas-kuliah.jadwal.store', $kelasA), ['hari' => 'Senin', 'jam_mulai' => '08:00', 'jam_selesai' => '09:40', 'ruangan_id' => $ruangan->id, 'tipe_pertemuan' => 'tatap_muka', 'status' => 'draft']);

        // Overlapping window: 08:30-10:00 vs existing 08:00-09:40 -> conflict.
        $response = $this->actingAs($admin)->post(route('admin.kelas-kuliah.jadwal.store', $kelasB), ['hari' => 'Senin', 'jam_mulai' => '08:30', 'jam_selesai' => '10:00', 'ruangan_id' => $ruangan->id, 'tipe_pertemuan' => 'tatap_muka', 'status' => 'draft']);
        $response->assertSessionHasErrors('ruangan_id');
        $this->assertEquals(1, JadwalKelasKuliah::count());
    }

    public function test_lecturer_conflict_is_detected_across_classes(): void
    {
        $admin = $this->admin();
        $prodi = $this->prodi();
        $semester = $this->semester();
        $mk = $this->mataKuliah($prodi);
        $dosen = $this->dosen();
        $this->actingAs($admin)->post(route('admin.kelas-kuliah.store'), ['mata_kuliah_id' => $mk->id, 'semester_id' => $semester->id, 'kode_kelas' => 'A', 'kapasitas' => 40, 'tipe_kelas' => 'reguler', 'status' => 'draft']);
        $kelasA = KelasKuliah::first();
        $this->actingAs($admin)->post(route('admin.kelas-kuliah.store'), ['mata_kuliah_id' => $mk->id, 'semester_id' => $semester->id, 'kode_kelas' => 'B', 'kapasitas' => 40, 'tipe_kelas' => 'reguler', 'status' => 'draft']);
        $kelasB = KelasKuliah::where('kode_kelas', 'B')->first();

        $this->actingAs($admin)->post(route('admin.kelas-kuliah.pengajar.store', $kelasA), ['dosen_id' => $dosen->id, 'peran' => 'utama', 'status' => 'aktif']);
        $this->actingAs($admin)->post(route('admin.kelas-kuliah.pengajar.store', $kelasB), ['dosen_id' => $dosen->id, 'peran' => 'utama', 'status' => 'aktif']);

        $this->actingAs($admin)->post(route('admin.kelas-kuliah.jadwal.store', $kelasA), ['hari' => 'Selasa', 'jam_mulai' => '13:00', 'jam_selesai' => '14:40', 'tipe_pertemuan' => 'tatap_muka', 'status' => 'draft']);
        $response = $this->actingAs($admin)->post(route('admin.kelas-kuliah.jadwal.store', $kelasB), ['hari' => 'Selasa', 'jam_mulai' => '14:00', 'jam_selesai' => '15:00', 'tipe_pertemuan' => 'tatap_muka', 'status' => 'draft']);

        $response->assertSessionHasErrors('dosen');
    }

    public function test_class_cannot_have_two_overlapping_schedules(): void
    {
        $admin = $this->admin();
        $prodi = $this->prodi();
        $semester = $this->semester();
        $mk = $this->mataKuliah($prodi);
        $this->actingAs($admin)->post(route('admin.kelas-kuliah.store'), ['mata_kuliah_id' => $mk->id, 'semester_id' => $semester->id, 'kode_kelas' => 'A', 'kapasitas' => 40, 'tipe_kelas' => 'reguler', 'status' => 'draft']);
        $kelas = KelasKuliah::first();

        $this->actingAs($admin)->post(route('admin.kelas-kuliah.jadwal.store', $kelas), ['hari' => 'Kamis', 'jam_mulai' => '08:00', 'jam_selesai' => '09:40', 'tipe_pertemuan' => 'tatap_muka', 'status' => 'draft']);
        $response = $this->actingAs($admin)->post(route('admin.kelas-kuliah.jadwal.store', $kelas), ['hari' => 'Kamis', 'jam_mulai' => '09:00', 'jam_selesai' => '10:00', 'tipe_pertemuan' => 'tatap_muka', 'status' => 'draft']);

        $response->assertSessionHasErrors('hari');
    }

    public function test_end_time_must_be_after_start_time(): void
    {
        $admin = $this->admin();
        $prodi = $this->prodi();
        $semester = $this->semester();
        $mk = $this->mataKuliah($prodi);
        $this->actingAs($admin)->post(route('admin.kelas-kuliah.store'), ['mata_kuliah_id' => $mk->id, 'semester_id' => $semester->id, 'kode_kelas' => 'A', 'kapasitas' => 40, 'tipe_kelas' => 'reguler', 'status' => 'draft']);
        $kelas = KelasKuliah::first();

        $response = $this->actingAs($admin)->post(route('admin.kelas-kuliah.jadwal.store', $kelas), ['hari' => 'Jumat', 'jam_mulai' => '10:00', 'jam_selesai' => '09:00', 'tipe_pertemuan' => 'tatap_muka', 'status' => 'draft']);
        $response->assertSessionHasErrors('jam_selesai');
    }

    public function test_pddikti_sync_for_class_is_honest_when_not_configured(): void
    {
        $admin = $this->admin();
        $prodi = $this->prodi();
        $semester = $this->semester();
        $mk = $this->mataKuliah($prodi);
        $this->actingAs($admin)->post(route('admin.kelas-kuliah.store'), ['mata_kuliah_id' => $mk->id, 'semester_id' => $semester->id, 'kode_kelas' => 'A', 'kapasitas' => 40, 'tipe_kelas' => 'reguler', 'status' => 'draft']);
        $kelas = KelasKuliah::first();

        $this->actingAs($admin)->post(route('admin.kelas-kuliah.pddikti.sync', $kelas))->assertSessionHas('error');
        $mapping = PddiktiAkademikMapping::where('entity_type', KelasKuliah::class)->where('entity_id', $kelas->id)->first();
        $this->assertEquals('failed', $mapping->sync_status);
    }
}
