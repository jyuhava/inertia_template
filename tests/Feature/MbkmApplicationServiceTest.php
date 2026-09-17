<?php

namespace Tests\Feature;

use App\Models\Mahasiswa;
use App\Models\MbkmApplication;
use App\Models\MbkmProgram;
use App\Models\MbkmProgramTarget;
use App\Models\Prodi;
use App\Models\User;
use App\Services\Mbkm\MbkmApplicationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class MbkmApplicationServiceTest extends TestCase
{
    use RefreshDatabase;

    private function prodi(string $code): Prodi
    {
        return Prodi::create([
            'kode_prodi' => $code,
            'nama_prodi' => "Program Studi {$code}",
            'jenjang' => 'S1',
            'status' => 'aktif',
        ]);
    }

    private function mahasiswa(Prodi $prodi, string $nim, string $status = 'aktif'): Mahasiswa
    {
        $user = User::factory()->create(['role' => 'mahasiswa']);

        return Mahasiswa::create([
            'user_id' => $user->id,
            'nim' => $nim,
            'nama_lengkap' => 'Mahasiswa MBKM',
            'jenis_kelamin' => 'L',
            'tempat_lahir' => 'Bandung',
            'tanggal_lahir' => '2005-01-01',
            'alamat' => 'Jl. Kampus',
            'no_hp' => '08123456789',
            'prodi_id' => $prodi->id,
            'program_studi' => $prodi->nama_prodi,
            'angkatan' => '2024',
            'status' => $status,
        ]);
    }

    private function program(?Prodi $prodi = null, array $overrides = []): MbkmProgram
    {
        $typeId = \DB::table('mbkm_program_types')->insertGetId([
            'code' => 'MSIB',
            'name' => 'Magang dan Studi Independen',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return MbkmProgram::create(array_merge([
            'code' => 'MBKM-001',
            'name' => 'Magang Industri',
            'mbkm_program_type_id' => $typeId,
            'prodi_id' => $prodi?->id,
            'registration_start' => now()->subDay()->toDateString(),
            'registration_end' => now()->addDay()->toDateString(),
            'status' => 'registration_open',
        ], $overrides));
    }

    public function test_eligible_student_can_create_one_draft_and_submission_is_audited(): void
    {
        $prodi = $this->prodi('TI');
        $mahasiswa = $this->mahasiswa($prodi, '20240001');
        $program = $this->program($prodi);
        MbkmProgramTarget::create([
            'mbkm_program_id' => $program->id,
            'prodi_id' => $prodi->id,
            'student_status' => 'aktif',
        ]);

        $service = app(MbkmApplicationService::class);
        $draft = $service->getOrCreateDraft($mahasiswa, $program, ['motivation' => 'Belajar di industri'], $mahasiswa->user);
        $sameDraft = $service->getOrCreateDraft($mahasiswa, $program, [], $mahasiswa->user);

        $this->assertSame($draft->id, $sameDraft->id);
        $this->assertSame("MBKM-{$program->id}-{$mahasiswa->id}", $draft->application_number);
        $this->assertSame('draft', $draft->status);
        $this->assertSame(1, MbkmApplication::count());
        $this->assertDatabaseHas('mbkm_audits', ['auditable_type' => MbkmApplication::class, 'auditable_id' => $draft->id, 'action' => 'APPLICATION_CREATED']);

        $submitted = $service->submit($draft, $mahasiswa->user);

        $this->assertSame('submitted', $submitted->status);
        $this->assertNotNull($submitted->submitted_at);
        $this->assertDatabaseHas('mbkm_audits', ['auditable_type' => MbkmApplication::class, 'auditable_id' => $draft->id, 'action' => 'APPLICATION_SUBMITTED']);
    }

    public function test_draft_is_rejected_when_student_is_not_active(): void
    {
        $prodi = $this->prodi('TI');
        $mahasiswa = $this->mahasiswa($prodi, '20240002', 'nonaktif');
        $program = $this->program($prodi);

        $this->expectException(ValidationException::class);
        app(MbkmApplicationService::class)->getOrCreateDraft($mahasiswa, $program);

        $this->assertSame(0, MbkmApplication::count());
    }

    public function test_draft_is_rejected_outside_registration_window(): void
    {
        $prodi = $this->prodi('TI');
        $mahasiswa = $this->mahasiswa($prodi, '20240003');
        $program = $this->program($prodi, [
            'registration_start' => now()->subDays(5)->toDateString(),
            'registration_end' => now()->subDay()->toDateString(),
        ]);

        try {
            app(MbkmApplicationService::class)->getOrCreateDraft($mahasiswa, $program);
            $this->fail('Expected eligibility validation to fail.');
        } catch (ValidationException $exception) {
            $this->assertContains('Pendaftaran program MBKM tidak sedang dibuka.', $exception->errors()['eligibility']);
        }
    }

    public function test_target_prodi_and_status_are_enforced_on_create_and_submit(): void
    {
        $ti = $this->prodi('TI');
        $si = $this->prodi('SI');
        $mahasiswa = $this->mahasiswa($si, '20240004');
        $program = $this->program(null);
        MbkmProgramTarget::create([
            'mbkm_program_id' => $program->id,
            'prodi_id' => $ti->id,
            'student_status' => 'aktif',
        ]);

        $this->expectException(ValidationException::class);
        app(MbkmApplicationService::class)->getOrCreateDraft($mahasiswa, $program);
    }

    public function test_submit_revalidates_changed_program_eligibility_and_draft_status(): void
    {
        $prodi = $this->prodi('TI');
        $mahasiswa = $this->mahasiswa($prodi, '20240005');
        $program = $this->program($prodi);
        $service = app(MbkmApplicationService::class);
        $draft = $service->getOrCreateDraft($mahasiswa, $program);
        $program->update(['status' => 'closed']);

        try {
            $service->submit($draft);
            $this->fail('Expected eligibility validation to fail.');
        } catch (ValidationException $exception) {
            $this->assertContains('Pendaftaran program MBKM tidak sedang dibuka.', $exception->errors()['eligibility']);
        }

        $program->update(['status' => 'registration_open']);
        $service->submit($draft);

        $this->expectException(ValidationException::class);
        $service->submit($draft->fresh());
    }
}
