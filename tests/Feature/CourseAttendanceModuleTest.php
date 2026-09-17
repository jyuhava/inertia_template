<?php

namespace Tests\Feature;

use App\Models\Dosen;
use App\Models\KelasKuliah;
use App\Models\Mahasiswa;
use App\Models\MataKuliah;
use App\Models\PeriodeKrs;
use App\Models\Prodi;
use App\Models\Semester;
use App\Models\StudentCourseRegistration;
use App\Models\TahunAjaran;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CourseAttendanceModuleTest extends TestCase
{
    use RefreshDatabase;

    public function test_lecturer_can_open_record_and_complete_attendance_for_enrolled_students(): void
    {
        $prodi = Prodi::create(['kode_prodi' => 'TI', 'nama_prodi' => 'TI', 'jenjang' => 'S1', 'status' => 'aktif']);
        $ta = TahunAjaran::create(['nama_tahun_ajaran' => '2026/2027', 'tanggal_mulai' => '2026-08-01', 'tanggal_selesai' => '2027-07-31', 'status' => 'aktif']);
        $semester = Semester::create(['tahun_ajaran_id' => $ta->id, 'nama_semester' => 'Ganjil', 'tanggal_mulai' => '2026-08-01', 'tanggal_selesai' => '2027-01-31', 'status' => 'aktif']);
        $period = PeriodeKrs::create(['nama_periode' => 'KRS', 'tahun_ajaran_id' => $ta->id, 'semester_id' => $semester->id, 'tanggal_mulai' => now(), 'tanggal_selesai' => now()->addDay(), 'status' => 'aktif']);
        $lecturerUser = User::factory()->create(['role' => 'dosen']);
        $lecturer = Dosen::create(['user_id' => $lecturerUser->id, 'nip' => '1980001', 'nama_lengkap' => 'Dosen', 'jenis_kelamin' => 'L', 'tempat_lahir' => 'Bogor', 'tanggal_lahir' => '1980-01-01', 'alamat' => 'A', 'no_hp' => '1', 'pendidikan_terakhir' => 'S2', 'bidang_keahlian' => 'TI']);
        $course = MataKuliah::create(['kode_mata_kuliah' => 'IF1', 'nama_mata_kuliah' => 'Algoritma', 'sks' => 3, 'semester' => 1, 'prodi_id' => $prodi->id, 'jenis' => 'Wajib', 'status' => 'aktif']);
        $class = KelasKuliah::create(['mata_kuliah_id' => $course->id, 'semester_id' => $semester->id, 'kode_kelas' => 'A', 'kapasitas' => 30, 'tipe_kelas' => 'reguler', 'status' => 'dibuka']);
        $class->pengajars()->create(['dosen_id' => $lecturer->id, 'peran' => 'utama', 'status' => 'aktif']);
        $studentUser = User::factory()->create(['role' => 'mahasiswa']);
        $student = Mahasiswa::create(['user_id' => $studentUser->id, 'nim' => '1', 'nama_lengkap' => 'Budi', 'jenis_kelamin' => 'L', 'tempat_lahir' => 'Bogor', 'tanggal_lahir' => '2005-01-01', 'alamat' => 'A', 'no_hp' => '1', 'prodi_id' => $prodi->id, 'program_studi' => 'TI', 'angkatan' => '2026', 'status' => 'aktif']);
        $registration = StudentCourseRegistration::create(['mahasiswa_id' => $student->id, 'periode_krs_id' => $period->id, 'status' => 'approved']);
        $registration->items()->create(['kelas_kuliah_id' => $class->id, 'mata_kuliah_id' => $course->id, 'sks_snapshot' => 3, 'status' => 'active']);
        $this->actingAs($lecturerUser)->post(route('dosen.kelas-absensi.open', $class), ['meeting_number' => 1, 'meeting_date' => now()->toDateString(), 'start_time' => '08:00', 'end_time' => '09:00'])->assertRedirect();
        $meeting = $class->meetings()->first();
        $this->assertSame(1, $meeting->attendances()->count());
        $this->actingAs($lecturerUser)->put(route('dosen.kelas-absensi.record', [$class, $meeting]), ['attendances' => [['mahasiswa_id' => $student->id, 'status' => 'present']]])->assertRedirect();
        $this->actingAs($lecturerUser)->post(route('dosen.kelas-absensi.complete', [$class, $meeting]))->assertRedirect();
        $this->assertSame('completed', $meeting->fresh()->status);
        $this->assertSame('present', $meeting->attendances()->first()->attendance_status);
    }
}
