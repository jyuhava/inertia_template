<?php

namespace Tests\Feature;

use App\Models\RakerBorang1ExistingProgram;
use App\Models\RakerSession;
use App\Models\RakerSubmission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class RakerTest extends TestCase
{
    use RefreshDatabase;

    private function user(string $role): User
    {
        return User::factory()->create(['role' => $role]);
    }

    private function makeSession(): RakerSession
    {
        return RakerSession::create([
            'name' => 'Raker 2026',
            'start_date' => '2026-01-01',
            'end_date' => '2026-12-31',
            'status' => 'Aktif',
            'created_by' => $this->user('admin')->id,
        ]);
    }

    public function test_mahasiswa_is_blocked_from_all_raker_routes(): void
    {
        $mahasiswa = $this->user('mahasiswa');
        $session = $this->makeSession();

        $this->actingAs($mahasiswa)->get('/raker')->assertForbidden();
        $this->actingAs($mahasiswa)->get('/raker/sessions')->assertForbidden();
        $this->actingAs($mahasiswa)
            ->get("/raker/sessions/{$session->id}/my-submission")
            ->assertForbidden();
    }

    public function test_admin_can_manage_sessions(): void
    {
        $admin = $this->user('admin');

        $this->actingAs($admin)->get('/raker/sessions')->assertOk();

        $this->actingAs($admin)
            ->post('/raker/sessions', [
                'name' => 'Raker Baru',
                'start_date' => '2026-02-01',
                'end_date' => '2026-02-05',
                'location' => 'Aula',
                'description' => 'Sesi baru',
                'status' => 'Aktif',
            ])
            ->assertRedirect(route('raker.sessions.index'));

        $this->assertDatabaseHas('raker_sessions', ['name' => 'Raker Baru']);
    }

    public function test_non_admin_cannot_manage_sessions(): void
    {
        $dosen = $this->user('dosen');

        $this->actingAs($dosen)->get('/raker/sessions')->assertForbidden();
        $this->actingAs($dosen)
            ->post('/raker/sessions', [
                'name' => 'X',
                'start_date' => '2026-01-01',
                'end_date' => '2026-01-02',
                'status' => 'Draft',
            ])
            ->assertForbidden();
    }

    public function test_get_or_create_auto_creates_submission(): void
    {
        $dosen = $this->user('dosen');
        $session = $this->makeSession();

        $this->actingAs($dosen)
            ->get("/raker/sessions/{$session->id}/my-submission")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Raker/Submission/Show')
                ->where('isOwner', true)
                ->where('canEdit', true));

        $this->assertDatabaseHas('raker_submissions', [
            'session_id' => $session->id,
            'user_id' => $dosen->id,
            'status' => 'draft',
        ]);
    }

    public function test_borang_crud_reorder_flow(): void
    {
        $dosen = $this->user('dosen');
        $session = $this->makeSession();
        $submission = RakerSubmission::create([
            'session_id' => $session->id,
            'user_id' => $dosen->id,
            'status' => 'draft',
        ]);

        $this->actingAs($dosen)
            ->post("/raker/submissions/{$submission->id}/borang1", [
                'program_name' => 'Program A',
                'pillars' => ['Pendidikan & Pengajaran'],
                'pic_names' => ['Budi', 'Siti'],
            ])
            ->assertRedirect();

        $itemA = $submission->borang1()->first();
        $this->assertNotNull($itemA);
        $this->assertEquals(1, $itemA->order_index);
        $this->assertEquals(['Budi', 'Siti'], $itemA->pic_names);

        $itemB = RakerBorang1ExistingProgram::create([
            'submission_id' => $submission->id,
            'program_name' => 'Program B',
            'order_index' => 2,
        ]);

        $this->actingAs($dosen)
            ->post("/raker/submissions/{$submission->id}/borang1/reorder", [
                'items' => [
                    ['id' => $itemB->id, 'order_index' => 0],
                    ['id' => $itemA->id, 'order_index' => 1],
                ],
            ])
            ->assertRedirect();

        $this->assertEquals(0, $itemB->refresh()->order_index);
        $this->assertEquals(1, $itemA->refresh()->order_index);

        $this->actingAs($dosen)
            ->put("/raker/borang1/{$itemA->id}", ['program_name' => 'Program A (updated)'])
            ->assertRedirect();
        $this->assertEquals('Program A (updated)', $itemA->refresh()->program_name);

        $this->actingAs($dosen)->delete("/raker/borang1/{$itemA->id}")->assertRedirect();
        $this->assertDatabaseMissing('raker_borang1_existing_programs', ['id' => $itemA->id]);
    }

    public function test_non_owner_cannot_access_other_submission(): void
    {
        $dosen = $this->user('dosen');
        $other = $this->user('dosen');
        $session = $this->makeSession();
        $submission = RakerSubmission::create([
            'session_id' => $session->id,
            'user_id' => $other->id,
            'status' => 'draft',
        ]);

        $this->actingAs($dosen)->get("/raker/submissions/{$submission->id}")->assertForbidden();
        $this->actingAs($dosen)
            ->post("/raker/submissions/{$submission->id}/borang1", ['program_name' => 'X'])
            ->assertForbidden();
    }

    public function test_submit_locks_editing_for_owner(): void
    {
        $dosen = $this->user('dosen');
        $session = $this->makeSession();
        $submission = RakerSubmission::create([
            'session_id' => $session->id,
            'user_id' => $dosen->id,
            'status' => 'draft',
        ]);

        $this->actingAs($dosen)->post("/raker/submissions/{$submission->id}/submit")->assertRedirect();
        $this->assertEquals('submitted', $submission->refresh()->status);

        $this->actingAs($dosen)
            ->post("/raker/submissions/{$submission->id}/borang1", ['program_name' => 'X'])
            ->assertForbidden();

        $this->actingAs($dosen)
            ->patch("/raker/submissions/{$submission->id}", ['unit' => 'Unit Baru'])
            ->assertForbidden();
    }

    public function test_borang6_total_price_is_computed(): void
    {
        $dosen = $this->user('dosen');
        $session = $this->makeSession();
        $submission = RakerSubmission::create([
            'session_id' => $session->id,
            'user_id' => $dosen->id,
            'status' => 'draft',
        ]);

        $this->actingAs($dosen)
            ->post("/raker/submissions/{$submission->id}/borang6", [
                'program_name' => 'Program A',
                'cost_component' => 'Honorarium',
                'volume' => 5,
                'unit' => 'orang',
                'unit_price' => 100000,
                'total_price' => 999999,
            ])
            ->assertRedirect();

        $item = $submission->borang6()->first();
        $this->assertEquals(500000, $item->total_price);
    }

    public function test_admin_can_view_session_and_user_submission_detail(): void
    {
        $admin = $this->user('admin');
        $dosen = $this->user('dosen');
        $session = $this->makeSession();
        $submission = RakerSubmission::create([
            'session_id' => $session->id,
            'user_id' => $dosen->id,
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        $this->actingAs($admin)
            ->get("/raker/sessions/{$session->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Raker/Sessions/Show')
                ->has('submissions', 1)
                ->where('stats.submitted', 1));

        $this->actingAs($admin)
            ->get("/raker/submissions/{$submission->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Raker/Submission/Show')
                ->where('isOwner', false)
                ->where('isAdmin', true)
                ->where('canEdit', false));
    }

    public function test_session_list_only_contains_active_and_finished(): void
    {
        $admin = $this->user('admin');
        $dosen = $this->user('dosen');

        RakerSession::create(['name' => 'Aktif', 'start_date' => '2026-01-01', 'end_date' => '2026-01-02', 'status' => 'Aktif', 'created_by' => $admin->id]);
        RakerSession::create(['name' => 'Selesai', 'start_date' => '2025-01-01', 'end_date' => '2025-01-02', 'status' => 'Selesai', 'created_by' => $admin->id]);
        RakerSession::create(['name' => 'Draft', 'start_date' => '2027-01-01', 'end_date' => '2027-01-02', 'status' => 'Draft', 'created_by' => $admin->id]);

        $this->actingAs($dosen)
            ->get('/raker')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Raker/Index')
                ->has('sessions', 2));
    }
}