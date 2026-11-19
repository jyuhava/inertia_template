<?php

namespace Tests\Feature;

use App\Models\MeetingMinute;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class OfficialDocumentTest extends TestCase
{
    use RefreshDatabase;

    private function makeMeeting(User $creator, array $attendees = []): MeetingMinute
    {
        return MeetingMinute::create([
            'title' => 'Rapat Uji Dokumen Resmi',
            'division' => 'Akademik',
            'meeting_date' => '2026-11-19',
            'location' => 'Ruang Rapat',
            'attendees' => $attendees,
            'description' => null,
            'status' => 'published',
            'created_by' => $creator->id,
        ]);
    }

    public function test_admin_can_upload_official_document_and_metadata_is_saved(): void
    {
        Storage::fake('public');

        $admin = User::factory()->create(['role' => 'admin']);
        $meeting = $this->makeMeeting($admin);

        $response = $this->actingAs($admin)->post(
            route('meeting-minutes.official-document.upload', $meeting),
            ['file' => UploadedFile::fake()->create('notulen-final.pdf', 100, 'application/pdf')],
        );

        $response->assertRedirect();

        $meeting->refresh();
        $this->assertTrue($meeting->has_official_document);
        $this->assertSame('notulen-final.pdf', $meeting->official_document_name);
        $this->assertSame('application/pdf', $meeting->official_document_mime);
        $this->assertSame($admin->id, $meeting->official_document_uploaded_by);
        $this->assertNotNull($meeting->official_document_uploaded_at);
        Storage::disk('public')->assertExists($meeting->official_document_path);
    }

    public function test_uploading_again_replaces_document_and_deletes_old_file(): void
    {
        Storage::fake('public');

        $admin = User::factory()->create(['role' => 'admin']);
        $meeting = $this->makeMeeting($admin);

        $this->actingAs($admin)->post(
            route('meeting-minutes.official-document.upload', $meeting),
            ['file' => UploadedFile::fake()->create('versi-lama.pdf', 100, 'application/pdf')],
        )->assertRedirect();

        $oldPath = $meeting->fresh()->official_document_path;
        Storage::disk('public')->assertExists($oldPath);

        $this->actingAs($admin)->post(
            route('meeting-minutes.official-document.upload', $meeting),
            ['file' => UploadedFile::fake()->create('versi-baru.pdf', 100, 'application/pdf')],
        )->assertRedirect();

        $meeting->refresh();
        $this->assertSame('versi-baru.pdf', $meeting->official_document_name);
        $this->assertNotSame($oldPath, $meeting->official_document_path);
        Storage::disk('public')->assertMissing($oldPath);
        Storage::disk('public')->assertExists($meeting->official_document_path);
    }

    public function test_viewer_can_download_document_with_original_filename(): void
    {
        Storage::fake('public');

        $admin = User::factory()->create(['role' => 'admin']);
        $viewer = User::factory()->create(['role' => 'dosen']);
        $meeting = $this->makeMeeting($admin, [$viewer->id]);

        $this->actingAs($admin)->post(
            route('meeting-minutes.official-document.upload', $meeting),
            ['file' => UploadedFile::fake()->create('notulen-final.pdf', 100, 'application/pdf')],
        )->assertRedirect();

        $response = $this->actingAs($viewer)->get(
            route('meeting-minutes.official-document.download', $meeting)
        );

        $response->assertOk();
        $this->assertStringContainsString(
            'notulen-final.pdf',
            $response->headers->get('content-disposition'),
        );
    }

    public function test_unrelated_user_cannot_download_or_upload(): void
    {
        Storage::fake('public');

        $admin = User::factory()->create(['role' => 'admin']);
        $stranger = User::factory()->create(['role' => 'mahasiswa']);
        $meeting = $this->makeMeeting($admin);

        $this->actingAs($admin)->post(
            route('meeting-minutes.official-document.upload', $meeting),
            ['file' => UploadedFile::fake()->create('notulen-final.pdf', 100, 'application/pdf')],
        )->assertRedirect();

        $this->actingAs($stranger)->get(
            route('meeting-minutes.official-document.download', $meeting)
        )->assertForbidden();

        $this->actingAs($stranger)->post(
            route('meeting-minutes.official-document.upload', $meeting),
            ['file' => UploadedFile::fake()->create('template.pdf', 100, 'application/pdf')],
        )->assertForbidden();
    }

    public function test_public_download_requires_public_flag_and_valid_token(): void
    {
        Storage::fake('public');

        $admin = User::factory()->create(['role' => 'admin']);
        $meeting = $this->makeMeeting($admin);

        $this->actingAs($admin)->post(
            route('meeting-minutes.official-document.upload', $meeting),
            ['file' => UploadedFile::fake()->create('notulen-publik.pdf', 100, 'application/pdf')],
        )->assertRedirect();

        // Notulen belum dipublikasikan -> 404
        $meeting->update(['public_token' => 'token-rahasia-123']);
        $this->get(route('meeting-minutes.public.official-document', 'token-rahasia-123'))
            ->assertNotFound();

        // Setelah dipublikasikan -> unduh berhasil
        $meeting->update(['is_public' => true]);
        $response = $this->get(route('meeting-minutes.public.official-document', 'token-rahasia-123'));
        $response->assertOk();
        $this->assertStringContainsString(
            'notulen-publik.pdf',
            $response->headers->get('content-disposition'),
        );

        // Token salah -> 404
        $this->get(route('meeting-minutes.public.official-document', 'token-salah'))
            ->assertNotFound();
    }

    public function test_uploaded_document_can_be_deleted(): void
    {
        Storage::fake('public');

        $admin = User::factory()->create(['role' => 'admin']);
        $meeting = $this->makeMeeting($admin);

        $this->actingAs($admin)->post(
            route('meeting-minutes.official-document.upload', $meeting),
            ['file' => UploadedFile::fake()->create('dokumen-lama.pdf', 100, 'application/pdf')],
        )->assertRedirect();

        $oldPath = $meeting->fresh()->official_document_path;

        $this->actingAs($admin)->delete(
            route('meeting-minutes.official-document.destroy', $meeting)
        )->assertRedirect();

        $this->assertFalse($meeting->fresh()->has_official_document);
        Storage::disk('public')->assertMissing($oldPath);
    }

    public function test_meeting_can_be_created_with_document_only_and_downloaded(): void
    {
        Storage::fake('public');

        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->post(route('meeting-minutes.store'), [
            'title' => 'Notulen via Dokumen',
            'division' => 'Akademik',
            'meeting_date' => '2026-11-19',
            'location' => 'Ruang Rapat',
            'attendees' => [$admin->id],
            'agenda_items' => [],
            'official_document' => UploadedFile::fake()->create('dokumen-rapat.pdf', 100, 'application/pdf'),
        ]);

        $meeting = MeetingMinute::where('title', 'Notulen via Dokumen')->firstOrFail();
        $response->assertRedirect(route('meeting-minutes.show', $meeting));

        $this->assertTrue($meeting->has_official_document);
        $this->assertSame('dokumen-rapat.pdf', $meeting->official_document_name);
        $this->assertCount(0, $meeting->agendaItems);
        Storage::disk('public')->assertExists($meeting->official_document_path);

        $download = $this->actingAs($admin)->get(
            route('meeting-minutes.official-document.download', $meeting)
        );
        $download->assertOk();
        $this->assertStringContainsString(
            'dokumen-rapat.pdf',
            $download->headers->get('content-disposition'),
        );
    }

    public function test_create_page_lists_uploaded_documents(): void
    {
        Storage::fake('public');

        $admin = User::factory()->create(['role' => 'admin']);
        $meeting = $this->makeMeeting($admin);

        $this->actingAs($admin)->post(
            route('meeting-minutes.official-document.upload', $meeting),
            ['file' => UploadedFile::fake()->create('daftar-dokumen.pdf', 100, 'application/pdf')],
        )->assertRedirect();

        $this->actingAs($admin)->get(route('meeting-minutes.create'))
            ->assertOk()
            ->assertSee('daftar-dokumen.pdf');
    }

    public function test_upload_rejects_invalid_file_type(): void
    {
        Storage::fake('public');

        $admin = User::factory()->create(['role' => 'admin']);
        $meeting = $this->makeMeeting($admin);

        $this->actingAs($admin)->post(
            route('meeting-minutes.official-document.upload', $meeting),
            ['file' => UploadedFile::fake()->create('script.exe', 100)],
        )->assertSessionHasErrors('file');

        $this->assertFalse($meeting->fresh()->has_official_document);
    }
}
