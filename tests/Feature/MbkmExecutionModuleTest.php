<?php

namespace Tests\Feature;

use App\Models\Dosen;
use App\Models\Mahasiswa;
use App\Models\MataKuliah;
use App\Models\MbkmApplication;
use App\Models\MbkmPlacement;
use App\Models\MbkmProgram;
use App\Models\Prodi;
use App\Models\User;
use App\Services\Mbkm\MbkmExecutionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MbkmExecutionModuleTest extends TestCase
{
    use RefreshDatabase;

    private function setupContext(): array
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $studentUser = User::factory()->create(['role' => 'mahasiswa']);
        $lecturerUser = User::factory()->create(['role' => 'dosen']);
        $prodi = Prodi::create(['kode_prodi' => 'TI', 'nama_prodi' => 'Teknik Informatika', 'jenjang' => 'S1', 'status' => 'aktif']);
        $student = Mahasiswa::create(['user_id' => $studentUser->id, 'nim' => '20260010', 'nama_lengkap' => 'Budi', 'jenis_kelamin' => 'L', 'tempat_lahir' => 'Bogor', 'tanggal_lahir' => '2005-01-01', 'alamat' => 'Jl A', 'no_hp' => '0800', 'prodi_id' => $prodi->id, 'program_studi' => 'TI', 'angkatan' => '2026', 'status' => 'aktif', 'surat_komitmen' => 'test.pdf', 'komitmen_uploaded_at' => now()]);
        $lecturer = Dosen::create(['user_id' => $lecturerUser->id, 'nip' => '198001010001', 'nama_lengkap' => 'Dosen', 'jenis_kelamin' => 'L', 'tempat_lahir' => 'Bogor', 'tanggal_lahir' => '1980-01-01', 'alamat' => 'Jl A', 'no_hp' => '0801', 'pendidikan_terakhir' => 'S2', 'bidang_keahlian' => 'TI']);
        $type = \DB::table('mbkm_program_types')->insertGetId(['code' => 'MAGANG', 'name' => 'Magang', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()]);
        $program = MbkmProgram::create(['code' => 'MBKM-01', 'name' => 'Magang', 'mbkm_program_type_id' => $type, 'registration_start' => now()->subDay(), 'registration_end' => now()->addDay(), 'status' => 'registration_open']);
        $application = MbkmApplication::create(['mbkm_program_id' => $program->id, 'mahasiswa_id' => $student->id, 'application_number' => 'A-1', 'status' => 'submitted', 'submitted_at' => now()]);
        $course = MataKuliah::create(['kode_mata_kuliah' => 'IF100', 'nama_mata_kuliah' => 'Proyek', 'sks' => 3, 'semester' => 1, 'prodi_id' => $prodi->id, 'jenis' => 'Wajib', 'status' => 'aktif']);

        return compact('admin', 'studentUser', 'lecturerUser', 'student', 'lecturer', 'application', 'course');
    }

    public function test_acceptance_execution_and_recognition_are_linked_to_academic_entities(): void
    {
        extract($this->setupContext());
        $service = app(MbkmExecutionService::class);
        $participant = $service->accept($application, $admin);
        $placement = MbkmPlacement::create(['mbkm_participant_id' => $participant->id, 'title' => 'Software Engineer', 'status' => 'active']);
        $placement->supervisors()->create(['dosen_id' => $lecturer->id, 'role' => 'academic']);
        $activity = $service->submitActivity($placement, ['activity_date' => today(), 'title' => 'Development', 'hours' => 8]);
        $service->approveActivity($activity, $lecturerUser);
        $recognition = $participant->recognitions()->create(['mata_kuliah_id' => $course->id, 'recognized_credits' => 3, 'score' => 90, 'grade' => 'A']);
        $service->approveRecognition($recognition, $admin);
        $this->assertDatabaseHas('mbkm_participants', ['mbkm_application_id' => $application->id, 'mahasiswa_id' => $student->id]);
        $this->assertDatabaseHas('mbkm_activities', ['id' => $activity->id, 'status' => 'approved']);
        $this->assertDatabaseHas('mbkm_recognitions', ['id' => $recognition->id, 'status' => 'approved', 'mata_kuliah_id' => $course->id]);
    }

    public function test_student_and_supervisor_routes_are_scoped_to_their_records(): void
    {
        extract($this->setupContext());
        $participant = app(MbkmExecutionService::class)->accept($application, $admin);
        $placement = MbkmPlacement::create(['mbkm_participant_id' => $participant->id, 'title' => 'Engineer', 'status' => 'active']);
        $placement->supervisors()->create(['dosen_id' => $lecturer->id, 'role' => 'academic']);
        $this->actingAs($studentUser)->get(route('mahasiswa.mbkm.index'))->assertOk();
        $this->actingAs($studentUser)->post(route('mahasiswa.mbkm.activities.store', $placement), ['activity_date' => today()->toDateString(), 'title' => 'Coding', 'hours' => 8])->assertCreated();
        $activity = $placement->activities()->first();
        $this->actingAs($lecturerUser)->post(route('dosen.mbkm.activities.approve', $activity))->assertRedirect();
        $this->assertSame('approved',$activity->fresh()->status);
    }
}
