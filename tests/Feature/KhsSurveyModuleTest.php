<?php

namespace Tests\Feature;

use App\Models\Dosen;
use App\Models\GradeScale;
use App\Models\JadwalKuliah;
use App\Models\Krs;
use App\Models\Mahasiswa;
use App\Models\MataKuliah;
use App\Models\Penilaian;
use App\Models\PeriodeKrs;
use App\Models\Prodi;
use App\Models\Semester;
use App\Models\Survey;
use App\Models\TahunAjaran;
use App\Models\User;
use App\Services\Academic\KhsAccessService;
use App\Services\Academic\KhsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class KhsSurveyModuleTest extends TestCase
{
    use RefreshDatabase;

    private function context(): array
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $user = User::factory()->create(['role' => 'mahasiswa']);
        $prodi = Prodi::create(['kode_prodi' => 'TI', 'nama_prodi' => 'Teknik Informatika', 'jenjang' => 'S1', 'status' => 'aktif']);
        $ta = TahunAjaran::create(['nama_tahun_ajaran' => '2026/2027', 'tanggal_mulai' => '2026-08-01', 'tanggal_selesai' => '2027-07-31', 'status' => 'aktif']);
        $semester = Semester::create(['tahun_ajaran_id' => $ta->id, 'nama_semester' => 'Ganjil', 'tanggal_mulai' => '2026-08-01', 'tanggal_selesai' => '2027-01-31', 'status' => 'aktif']);
        $period = PeriodeKrs::create(['nama_periode' => 'KRS Ganjil', 'tahun_ajaran_id' => $ta->id, 'semester_id' => $semester->id, 'tanggal_mulai' => now()->subDay(), 'tanggal_selesai' => now()->addDay(), 'status' => 'aktif']);
        $student = Mahasiswa::create(['user_id' => $user->id, 'nim' => '20260001', 'nama_lengkap' => 'Budi', 'jenis_kelamin' => 'L', 'tempat_lahir' => 'Bogor', 'tanggal_lahir' => '2005-01-01', 'alamat' => 'Jl. A', 'no_hp' => '0800', 'prodi_id' => $prodi->id, 'program_studi' => $prodi->nama_prodi, 'angkatan' => '2026', 'status' => 'aktif', 'surat_komitmen' => 'test.pdf', 'komitmen_uploaded_at' => now()]);
        $course = MataKuliah::create(['kode_mata_kuliah' => 'IF101', 'nama_mata_kuliah' => 'Algoritma', 'sks' => 3, 'semester' => 1, 'prodi_id' => $prodi->id, 'jenis' => 'Wajib', 'status' => 'aktif']);
        $lecturerUser = User::factory()->create(['role' => 'dosen']);
        $lecturer = Dosen::create(['user_id' => $lecturerUser->id, 'nip' => '198001010001', 'nama_lengkap' => 'Dosen A', 'jenis_kelamin' => 'L', 'tempat_lahir' => 'Bogor', 'tanggal_lahir' => '1980-01-01', 'alamat' => 'Jl. A', 'no_hp' => '0802', 'pendidikan_terakhir' => 'S2', 'bidang_keahlian' => 'Informatika']);
        $schedule = JadwalKuliah::create(['mata_kuliah_id' => $course->id, 'semester_id' => $semester->id, 'dosen_id' => $lecturer->id, 'hari' => 'Senin', 'jam_mulai' => '08:00', 'jam_selesai' => '09:40', 'ruangan' => 'A', 'kapasitas' => 30, 'status' => 'aktif']);
        $krs = Krs::create(['mahasiswa_id' => $student->id, 'jadwal_kuliah_id' => $schedule->id, 'periode_krs_id' => $period->id, 'status' => 'disetujui']);
        GradeScale::create(['code' => 'A', 'name' => 'Sangat Baik', 'minimum_score' => 85, 'maximum_score' => 100, 'grade_point' => 4, 'is_passing' => true, 'is_active' => true]);
        Penilaian::create(['mahasiswa_id' => $student->id, 'jadwal_kuliah_id' => $schedule->id, 'periode_krs_id' => $period->id, 'nilai_akhir' => 90, 'nilai_huruf' => 'A', 'nilai_angka' => 4, 'status' => 'final']);

        return compact('admin', 'user', 'student', 'period', 'krs');
    }

    public function test_admin_publishes_snapshot_from_final_grade_and_can_lock_it(): void
    {
        extract($this->context());
        $result = app(KhsService::class)->publish($student, $period, $admin->id);
        $this->assertSame('published', $result->status);
        $this->assertSame(1, $result->items()->count());
        $this->assertEquals(4, $result->semester_gpa);
        app(KhsService::class)->lock($result);
        $this->assertSame('locked', $result->fresh()->status);
    }

    public function test_required_survey_blocks_khs_until_response_is_submitted(): void
    {
        extract($this->context());
        app(KhsService::class)->publish($student, $period, $admin->id);
        $survey = Survey::create(['title' => 'Evaluasi', 'survey_type' => 'academic_evaluation', 'periode_krs_id' => $period->id, 'is_required' => true, 'status' => 'published']);
        $question = $survey->questions()->create(['question' => 'Bagaimana kelas ini?', 'question_type' => 'text', 'is_required' => true]);
        $this->assertFalse(app(KhsAccessService::class)->canAccess($student, $period));
        $this->actingAs($user)->post(route('mahasiswa.surveys.submit', $survey), ['answers' => [$question->id => 'Baik']])->assertRedirect(route('mahasiswa.surveys.index'));
        $this->assertTrue(app(KhsAccessService::class)->canAccess($student, $period));
        $this->actingAs($user)->get(route('mahasiswa.khs.show', $period))->assertOk();
    }

    public function test_student_cannot_open_unpublished_khs(): void
    {
        extract($this->context());
        $this->actingAs($user)->get(route('mahasiswa.khs.show', $period))->assertNotFound();
    }
}
