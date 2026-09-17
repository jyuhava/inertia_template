<?php

namespace Tests\Feature;

use App\Models\Dosen;
use App\Models\KelasKuliah;
use App\Models\Kurikulum;
use App\Models\Mahasiswa;
use App\Models\MataKuliah;
use App\Models\PeriodeKrs;
use App\Models\Prodi;
use App\Models\Semester;
use App\Models\StudentCourseRegistration;
use App\Models\StudentStudyResult;
use App\Models\TahunAjaran;
use App\Models\ThesisSetting;
use App\Models\ThesisType;
use App\Models\User;
use App\Services\Thesis\ThesisEligibilityService;
use App\Services\Thesis\ThesisService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class ThesisModuleTest extends TestCase
{
    use RefreshDatabase;

    private function context(): array
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $studentUser = User::factory()->create(['role' => 'mahasiswa']);
        $student2User = User::factory()->create(['role' => 'mahasiswa']);
        $lecturerUser = User::factory()->create(['role' => 'dosen']);
        $otherLecturerUser = User::factory()->create(['role' => 'dosen']);
        $prodi = Prodi::create(['kode_prodi' => 'TI', 'nama_prodi' => 'Teknik Informatika', 'jenjang' => 'S1', 'status' => 'aktif']);
        $year = TahunAjaran::create(['nama_tahun_ajaran' => '2026/2027', 'tanggal_mulai' => '2026-08-01', 'tanggal_selesai' => '2027-07-31', 'status' => 'aktif']);
        $semester = Semester::create(['tahun_ajaran_id' => $year->id, 'nama_semester' => 'Ganjil', 'tanggal_mulai' => '2026-08-01', 'tanggal_selesai' => '2027-01-31', 'status' => 'aktif']);
        $period = PeriodeKrs::create(['nama_periode' => 'KRS Ganjil', 'tahun_ajaran_id' => $year->id, 'semester_id' => $semester->id, 'tanggal_mulai' => now()->subDay(), 'tanggal_selesai' => now()->addDay(), 'status' => 'aktif']);
        $curriculum = Kurikulum::create(['kode' => 'TI26', 'nama' => 'Kurikulum TI', 'prodi_id' => $prodi->id, 'semester_mulai_id' => $semester->id, 'total_sks_wajib' => 144, 'status' => 'aktif']);
        $student = $this->student($studentUser, $prodi, '20260001');
        $student2 = $this->student($student2User, $prodi, '20260002');
        $lecturer = $this->lecturer($lecturerUser, '198001010001');
        $otherLecturer = $this->lecturer($otherLecturerUser, '198001010002');
        $course = MataKuliah::create(['kode_mata_kuliah' => 'TA001', 'nama_mata_kuliah' => 'Skripsi', 'sks' => 6, 'semester' => 8, 'prodi_id' => $prodi->id, 'jenis' => 'Wajib', 'status' => 'aktif']);
        $type = ThesisType::create(['prodi_id' => $prodi->id, 'mata_kuliah_id' => $course->id, 'code' => 'SKRIPSI', 'name' => 'Skripsi']);

        return compact('admin', 'studentUser', 'student2User', 'lecturerUser', 'otherLecturerUser', 'prodi', 'semester', 'period', 'curriculum', 'student', 'student2', 'lecturer', 'otherLecturer', 'course', 'type');
    }

    public function test_eligibility_uses_configured_thresholds_and_defaults_to_zero(): void
    {
        extract($this->context());
        $eligibility = app(ThesisEligibilityService::class);
        $this->assertSame([], $eligibility->validate($student));
        ThesisSetting::create(['prodi_id' => $prodi->id, 'minimum_credits' => 6, 'minimum_gpa' => 3]);
        $this->assertCount(2, $eligibility->validate($student));
        $result = StudentStudyResult::create(['mahasiswa_id' => $student->id, 'periode_krs_id' => $period->id, 'status' => 'published']);
        $result->items()->create(['mata_kuliah_id' => $course->id, 'credits' => 6, 'grade' => 'A', 'grade_point' => 4]);
        $this->assertSame([], $eligibility->validate($student));
    }

    public function test_title_history_is_preserved_and_review_approves_selected_alternative(): void
    {
        extract($this->context());
        $service = app(ThesisService::class);
        $thesis = $service->create($student, $type, $semester->id, $curriculum->id, $studentUser);
        $first = $service->submitTitle($thesis, ['title' => 'Sistem Informasi Akademik', 'alternate_titles' => ['Portal Akademik Terpadu']], $studentUser);
        $service->reviewTitle($first, 'revision', 'Perjelas ruang lingkup.', null, $admin);
        $second = $service->submitTitle($thesis->fresh(), ['title' => 'Sistem Informasi Akademik Berbasis Web'], $studentUser);
        $approved = $service->reviewTitle($second, 'approved', null, 'Sistem Informasi Akademik Berbasis Web', $admin);

        $this->assertSame(2, $thesis->titleSubmissions()->count());
        $this->assertSame(2, $second->version);
        $this->assertSame('title_approved', $approved->status);
        $this->assertSame('Sistem Informasi Akademik Berbasis Web', $approved->title);
    }

    public function test_supervisor_capacity_and_history_are_enforced(): void
    {
        extract($this->context());
        ThesisSetting::create(['prodi_id' => $prodi->id, 'supervisor_capacity' => 1]);
        $service = app(ThesisService::class);
        $first = $service->create($student, $type, $semester->id, $curriculum->id, $studentUser);
        $supervisor = $service->assignSupervisor($first, $lecturer->id, 'pembimbing_1', $admin);
        $this->assertSame('active', $supervisor->status);
        $second = $service->create($student2, $type, $semester->id, $curriculum->id, $student2User);

        $this->expectException(ValidationException::class);
        $service->assignSupervisor($second, $lecturer->id, 'pembimbing_1', $admin);
    }

    public function test_supervision_review_is_scoped_to_active_supervisor(): void
    {
        extract($this->context());
        $service = app(ThesisService::class);
        $thesis = $service->create($student, $type, $semester->id, $curriculum->id, $studentUser);
        $supervisor = $service->assignSupervisor($thesis, $lecturer->id, 'pembimbing_1', $admin);
        $session = $service->submitSession($thesis, $student, $supervisor->id, ['meeting_date' => today(), 'topic' => 'Bab 1'], $studentUser);
        try {
            $service->reviewSession($session, $otherLecturer, 'Catatan', 'reviewed', $otherLecturerUser);
            $this->fail('Dosen lain tidak boleh meninjau bimbingan.');
        } catch (ValidationException) {
            $this->assertSame('submitted', $session->fresh()->status);
        }
        $service->reviewSession($session, $lecturer, 'Lanjutkan Bab 2.', 'reviewed', $lecturerUser);
        $this->assertSame('reviewed', $session->fresh()->status);
    }

    public function test_examiner_schedule_conflict_is_rejected(): void
    {
        extract($this->context());
        $service = app(ThesisService::class);
        $one = $service->create($student, $type, $semester->id, $curriculum->id, $studentUser);
        $two = $service->create($student2, $type, $semester->id, $curriculum->id, $student2User);
        $service->scheduleEvent($one, 'defense', '2027-01-10 09:00:00', '2027-01-10 11:00:00', [$lecturer->id], $admin);
        $this->expectException(ValidationException::class);
        $service->scheduleEvent($two, 'defense', '2027-01-10 10:00:00', '2027-01-10 12:00:00', [$lecturer->id], $admin);
    }

    public function test_revision_finalization_locks_grade_and_syncs_matching_krs_item(): void
    {
        extract($this->context());
        $class = KelasKuliah::create(['mata_kuliah_id' => $course->id, 'kurikulum_id' => $curriculum->id, 'semester_id' => $semester->id, 'kode_kelas' => 'A', 'nama_kelas' => 'A', 'kapasitas' => 30, 'tipe_kelas' => 'reguler', 'status' => 'dibuka']);
        $registration = StudentCourseRegistration::create(['mahasiswa_id' => $student->id, 'periode_krs_id' => $period->id, 'kurikulum_id' => $curriculum->id, 'status' => 'approved']);
        $registration->items()->create(['kelas_kuliah_id' => $class->id, 'mata_kuliah_id' => $course->id, 'sks_snapshot' => 6, 'status' => 'active']);
        $service = app(ThesisService::class);
        $thesis = $service->create($student, $type, $semester->id, $curriculum->id, $studentUser);
        $revision = $service->submitRevision($thesis, ['Perbaiki abstrak'], $studentUser);
        $service->reviewRevision($revision, 'verified', 'Sesuai.', $admin);
        $thesis->documents()->create(['type' => 'final', 'version' => 1, 'file_path' => 'theses/final.pdf', 'uploaded_by' => $studentUser->id]);
        $finished = $service->finalize($thesis, 'A', 4, $admin);

        $this->assertSame('completed', $finished->status);
        $this->assertNotNull($finished->grade_locked_at);
        $this->assertDatabaseHas('student_study_result_items', ['registration_item_id' => $registration->items()->first()->id, 'grade' => 'A']);
        $this->expectException(ValidationException::class);
        $service->finalize($finished, 'B', 3, $admin);
    }

    public function test_student_cannot_submit_session_for_another_students_thesis(): void
    {
        extract($this->context());
        $service = app(ThesisService::class);
        $thesis = $service->create($student2, $type, $semester->id, $curriculum->id, $student2User);
        $supervisor = $service->assignSupervisor($thesis, $lecturer->id, 'pembimbing_1', $admin);
        $this->actingAs($studentUser)->post(route('mahasiswa.tugas-akhir.sessions.store', $thesis), ['thesis_supervisor_id' => $supervisor->id, 'meeting_date' => today()->toDateString(), 'topic' => 'Tidak sah'])->assertForbidden();
    }

    private function student(User $user, Prodi $prodi, string $nim): Mahasiswa
    {
        return Mahasiswa::create(['user_id' => $user->id, 'nim' => $nim, 'nama_lengkap' => 'Mahasiswa '.$nim, 'jenis_kelamin' => 'L', 'tempat_lahir' => 'Bogor', 'tanggal_lahir' => '2005-01-01', 'alamat' => 'Jl. A', 'no_hp' => '0800'.$nim, 'prodi_id' => $prodi->id, 'program_studi' => $prodi->nama_prodi, 'angkatan' => '2026', 'status' => 'aktif', 'surat_komitmen' => 'test.pdf', 'komitmen_uploaded_at' => now()]);
    }

    private function lecturer(User $user, string $nip): Dosen
    {
        return Dosen::create(['user_id' => $user->id, 'nip' => $nip, 'nama_lengkap' => 'Dosen '.$nip, 'jenis_kelamin' => 'L', 'tempat_lahir' => 'Bogor', 'tanggal_lahir' => '1980-01-01', 'alamat' => 'Jl. A', 'no_hp' => '080'.$nip, 'pendidikan_terakhir' => 'S2', 'bidang_keahlian' => 'Informatika', 'status' => 'aktif']);
    }
}
