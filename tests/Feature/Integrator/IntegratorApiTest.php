<?php

namespace Tests\Feature\Integrator;

use App\Models\Mahasiswa;
use App\Models\MataKuliah;
use App\Models\Prodi;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class IntegratorApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_integrator_api_requires_an_authenticated_operator(): void
    {
        $this->getJson('/api/integrator/session')->assertUnauthorized();
    }

    public function test_admin_can_read_session_connection_and_period_contracts_without_secrets(): void
    {
        $user = User::factory()->create(['role' => 'admin']);
        $this->actingAs($user);

        $this->getJson('/api/integrator/session')
            ->assertOk()
            ->assertJsonPath('id', $user->id)
            ->assertJsonPath('role', 'admin')
            ->assertJsonPath('mockMode', false);

        $connection = $this->getJson('/api/integrator/connection')->assertOk();
        $connection->assertJsonStructure(['profile', 'status', 'token', 'dictionary', 'events', 'retryPolicy']);
        $this->assertArrayNotHasKey('password', $connection->json('profile'));
        $this->assertArrayNotHasKey('value', $connection->json('token'));
        $this->assertArrayNotHasKey('secret', $connection->json('token'));

        $this->getJson('/api/integrator/periods')
            ->assertOk()
            ->assertJsonStructure(['active', 'data']);
        $this->getJson('/api/integrator/prodi-options')->assertOk();
    }

    public function test_mapping_endpoints_use_existing_academic_mapping_table(): void
    {
        $user = User::factory()->create(['role' => 'admin']);
        $this->actingAs($user);
        $prodi = Prodi::query()->create([
            'kode_prodi' => 'TI',
            'nama_prodi' => 'Teknik Informatika',
            'jenjang' => 'S1',
            'status' => 'aktif',
        ]);

        $this->postJson('/api/integrator/mapping/prodi', [
            'localId' => (string) $prodi->id,
            'externalId' => 'PRODI-TEST-ID',
            'externalCode' => '55201',
            'externalLabel' => 'Teknik Informatika',
            'mappingType' => 'manual',
        ])->assertOk()->assertJsonPath('record.externalId', 'PRODI-TEST-ID');

        $this->getJson('/api/integrator/mapping/prodi')
            ->assertOk()
            ->assertJsonPath('data.0.status', 'MAPPED')
            ->assertJsonPath('data.0.externalLabel', 'Teknik Informatika');

        $this->getJson('/api/integrator/prodi')
            ->assertOk()
            ->assertJsonPath('data.0.namaProdi', 'Teknik Informatika')
            ->assertJsonPath('meta.total', 1);
        $this->getJson('/api/integrator/prodi/'.$prodi->id)
            ->assertOk()
            ->assertJsonPath('local.namaProdi', 'Teknik Informatika');

        $this->postJson('/api/integrator/mapping/prodi/unmap', ['localIds' => [(string) $prodi->id]])
            ->assertOk()->assertJsonPath('updated', 1);

        $this->assertDatabaseHas('pddikti_akademik_mappings', [
            'entity_type' => Prodi::class,
            'entity_id' => $prodi->id,
            'external_id' => null,
        ]);
    }

    public function test_entity_list_reads_real_siakad_student_rows_and_decorates_mapping_state(): void
    {
        $user = User::factory()->create(['role' => 'admin']);
        $this->actingAs($user);
        $prodi = Prodi::query()->create([
            'kode_prodi' => 'TI',
            'nama_prodi' => 'Teknik Informatika',
            'jenjang' => 'S1',
            'status' => 'aktif',
        ]);
        $studentUser = User::factory()->create(['role' => 'mahasiswa']);
        Mahasiswa::query()->create([
            'user_id' => $studentUser->id,
            'nim' => '2024001001',
            'no_ktp' => '3201010101010001',
            'nisn' => '0012345678',
            'nama_lengkap' => 'Siti Rahmawati',
            'jenis_kelamin' => 'P',
            'tempat_lahir' => 'Bandung',
            'tanggal_lahir' => '2005-04-18',
            'agama' => 'ISLAM',
            'kewarganegaraan' => 'WNI',
            'alamat' => 'Jl. Pendidikan No. 1',
            'no_hp' => '081234567890',
            'email' => 'siti@example.test',
            'prodi_id' => $prodi->id,
            'program_studi' => 'Teknik Informatika',
            'angkatan' => '2024',
            'status' => 'aktif',
        ]);

        $this->getJson('/api/integrator/mahasiswa')
            ->assertOk()
            ->assertJsonPath('data.0.nim', '2024001001')
            ->assertJsonPath('data.0.prodiNama', 'Teknik Informatika')
            ->assertJsonPath('data.0.mappingStatus', 'UNMAPPED')
            ->assertJsonPath('meta.total', 1);
    }

    public function test_live_job_is_blocked_until_write_switch_and_act_allowlist_are_enabled(): void
    {
        $user = User::factory()->create(['role' => 'admin']);
        $this->actingAs($user);
        Http::preventStrayRequests();
        config(['integrator.neofeeder.allow_write' => false]);
        $prodi = Prodi::query()->create([
            'kode_prodi' => 'TI',
            'nama_prodi' => 'Teknik Informatika',
            'jenjang' => 'S1',
            'status' => 'aktif',
        ]);
        $this->postJson('/api/integrator/mapping/prodi', [
            'localId' => (string) $prodi->id,
            'externalId' => 'PRODI-VERIFIED',
            'externalLabel' => 'Teknik Informatika',
        ])->assertOk();
        $course = MataKuliah::query()->create([
            'kode_mata_kuliah' => 'TI101',
            'nama_mata_kuliah' => 'Algoritma dan Pemrograman',
            'sks' => 3,
            'theory_credits' => 3,
            'practical_credits' => 0,
            'field_credits' => 0,
            'semester' => 1,
            'prodi_id' => $prodi->id,
            'jenis' => 'Wajib',
            'status' => 'aktif',
        ]);

        $created = $this->postJson('/api/integrator/sync/jobs', [
            'entity' => 'mata-kuliah',
            'ids' => [(string) $course->id],
            'dryRun' => false,
        ])->assertCreated();
        $job = $this->postJson('/api/integrator/sync/jobs/'.$created->json('id').'/run')
            ->assertOk()
            ->assertJsonPath('status', 'PARTIAL')
            ->assertJsonPath('success', 0)
            ->assertJsonPath('failed', 0)
            ->assertJsonPath('invalid', 1);

        $this->assertStringContainsString('Live write belum diaktifkan', $job->json('items.0.message'));
    }

    public function test_dry_run_job_is_audited_and_never_claims_feeder_success(): void
    {
        $user = User::factory()->create(['role' => 'admin']);
        $this->actingAs($user);
        $prodi = Prodi::query()->create([
            'kode_prodi' => 'SI',
            'nama_prodi' => 'Sistem Informasi',
            'jenjang' => 'S1',
            'status' => 'aktif',
        ]);

        $created = $this->postJson('/api/integrator/sync/jobs', [
            'entity' => 'prodi',
            'ids' => [(string) $prodi->id],
            'dryRun' => true,
        ])->assertCreated()->assertJsonPath('status', 'QUEUED');
        $jobId = $created->json('id');

        $this->postJson("/api/integrator/sync/jobs/{$jobId}/run")
            ->assertOk()
            ->assertJsonPath('status', 'COMPLETED')
            ->assertJsonPath('success', 0)
            ->assertJsonPath('skipped', 1);

        $this->assertDatabaseHas('integrator_sync_jobs', ['id' => $jobId, 'dry_run' => 1, 'success' => 0]);
        $this->assertDatabaseHas('integrator_audit_events', ['event_type' => 'SYNC_JOB_CREATED', 'user_id' => $user->id]);
    }

    public function test_read_only_entity_preview_does_not_generate_a_write_action(): void
    {
        $user = User::factory()->create(['role' => 'admin']);
        $this->actingAs($user);
        $prodi = Prodi::query()->create([
            'kode_prodi' => 'MI',
            'nama_prodi' => 'Manajemen Informatika',
            'jenjang' => 'D3',
            'status' => 'aktif',
        ]);

        $this->postJson('/api/integrator/prodi/preview', ['ids' => [(string) $prodi->id], 'dryRun' => true])
            ->assertOk()
            ->assertJsonPath('items.0.action', 'SKIP')
            ->assertJsonPath('items.0.act', '');
    }

    public function test_connection_authentication_keeps_password_and_token_out_of_api_responses(): void
    {
        $user = User::factory()->create(['role' => 'admin']);
        $this->actingAs($user);
        config(['app.key' => 'base64:'.base64_encode(str_repeat('x', 32))]);
        Cache::flush();
        Http::fake([
            'https://feeder.example.test/ws/live2.php' => Http::response([
                'error_code' => 0,
                'error_desc' => '',
                'data' => ['token' => 'neo-feeder-test-token'],
            ], 200),
        ]);

        $this->putJson('/api/integrator/connection', [
            'profile' => [
                'baseUrl' => 'https://feeder.example.test',
                'webServiceUrl' => 'https://feeder.example.test/ws/live2.php',
                'username' => 'integrator-user',
                'timeoutSeconds' => 30,
                'retryCount' => 2,
                'active' => true,
                'useProxy' => false,
            ],
            'password' => 'do-not-return-this-password',
        ])->assertOk()->assertJsonPath('profile.passwordConfigured', true);

        $stored = \App\Models\IntegratorSetting::get('connection.password_encrypted');
        $this->assertIsString($stored);
        $this->assertNotSame('do-not-return-this-password', $stored);
        $this->assertSame('do-not-return-this-password', Crypt::decryptString($stored));

        $auth = $this->postJson('/api/integrator/connection/authenticate')->assertOk();
        $auth->assertJsonPath('status', 'CONNECTED');
        $this->assertStringNotContainsString('neo-feeder-test-token', $auth->getContent());
        $this->assertStringNotContainsString('do-not-return-this-password', $auth->getContent());
        Http::assertSent(fn ($request): bool => ($request['act'] ?? null) === 'GetToken' && ($request['password'] ?? null) === 'do-not-return-this-password');
    }

    public function test_all_contract_routes_resolve_for_an_authorized_admin(): void
    {
        $user = User::factory()->create(['role' => 'admin']);
        $this->actingAs($user);

        $this->getJson('/api/integrator/perguruan-tinggi')->assertOk();
        $this->getJson('/api/integrator/aktivitas-mahasiswa')->assertOk();
        $this->getJson('/api/integrator/kelulusan')->assertOk();
        $this->getJson('/api/integrator/mapping')->assertOk();
        $this->getJson('/api/integrator/validation/summary')->assertOk();
        $this->getJson('/api/integrator/validation/issues')->assertOk();
        $this->getJson('/api/integrator/sync/order')->assertOk();
        $this->getJson('/api/integrator/sync/jobs')->assertOk();
        $this->getJson('/api/integrator/logs')->assertOk();
        $this->getJson('/api/integrator/monitoring')->assertOk();
        $this->getJson('/api/integrator/references')->assertOk();
        $this->getJson('/api/integrator/references/jenis-kelamin')->assertOk();
        $this->getJson('/api/integrator/neofeeder/dictionary')->assertOk();
        $this->postJson('/api/integrator/neofeeder/call', ['act' => 'DeleteKelasKuliah'])->assertUnprocessable();
        $this->getJson('/api/integrator/dashboard/summary')->assertOk();
    }
}
