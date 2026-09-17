<?php

namespace Tests\Feature;

use App\Models\Dosen;
use App\Models\DosenDokumen;
use App\Models\PddiktiDosenMapping;
use App\Models\Prodi;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class DosenModuleTest extends TestCase
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

    private function payload(?Prodi $prodi = null): array
    {
        return ['nip' => 'DSN-001', 'nama_lengkap' => 'Dr. Siti Aminah', 'jenis_kelamin' => 'P', 'tempat_lahir' => 'Bandung', 'tanggal_lahir' => '1985-01-01', 'alamat' => 'Jl. Pendidikan', 'no_hp' => '081234567890', 'email' => 'siti@example.test', 'password' => 'password123', 'bidang_keahlian' => 'Informatika', 'nik' => '3201010101010001', 'nidn' => '0010108501', 'prodi_id' => $prodi?->id, 'tanggal_mulai_dosen' => '2020-08-01', 'status_dosen' => 'tetap'];
    }

    public function test_admin_creates_dosen_with_initial_histories_and_mapping(): void
    {
        $admin = $this->admin();
        $prodi = $this->prodi();
        $this->actingAs($admin)->post(route('admin.dosen.store'), $this->payload($prodi))->assertRedirect();
        $dosen = Dosen::where('nip', 'DSN-001')->first();
        $this->assertNotNull($dosen);
        $this->assertEquals(1, $dosen->statusHistories()->count());
        $this->assertEquals(1, $dosen->homebaseHistories()->count());
        $this->assertNotNull($dosen->kepegawaian);
        $this->assertEquals('unmapped', $dosen->pddiktiMapping->status_mapping);
    }

    public function test_identifiers_must_be_unique_and_dosen_can_be_updated(): void
    {
        $admin = $this->admin();
        $prodi = $this->prodi();
        $this->actingAs($admin)->post(route('admin.dosen.store'), $this->payload($prodi));
        $duplicate = $this->payload($prodi);
        $duplicate['nip'] = 'DSN-002';
        $duplicate['email'] = 'other@example.test';
        $this->actingAs($admin)->post(route('admin.dosen.store'), $duplicate)->assertSessionHasErrors('nik');
        $dosen = Dosen::first();
        $update = $this->payload($prodi);
        unset($update['password']);
        $update['nama_lengkap'] = 'Dr. Siti Aminah, M.Kom.';
        $update['status'] = 'aktif';
        $this->actingAs($admin)->put(route('admin.dosen.update', $dosen), $update)->assertRedirect();
        $this->assertEquals('Dr. Siti Aminah, M.Kom.', $dosen->fresh()->nama_lengkap);
    }

    public function test_admin_records_homebase_status_education_and_academic_rank_histories(): void
    {
        $admin = $this->admin();
        $prodi = $this->prodi();
        $this->actingAs($admin)->post(route('admin.dosen.store'), $this->payload($prodi));
        $dosen = Dosen::first();
        $this->actingAs($admin)->post(route('admin.dosen.status-history.store', $dosen), ['status' => 'nonaktif', 'tanggal_berlaku' => '2025-01-01'])->assertRedirect();
        $this->actingAs($admin)->post(route('admin.dosen.homebase-history.store', $dosen), ['prodi_id' => $prodi->id, 'tanggal_mulai' => '2025-02-01', 'status' => 'aktif'])->assertRedirect();
        $this->actingAs($admin)->post(route('admin.dosen.riwayat-pendidikan.store', $dosen), ['jenjang' => 'S2', 'perguruan_tinggi' => 'Universitas A', 'program_studi' => 'Ilmu Komputer', 'status_pendidikan' => 'lulus'])->assertRedirect();
        $this->actingAs($admin)->post(route('admin.dosen.jabatan-akademik-history.store', $dosen), ['jabatan_akademik' => 'Lektor', 'tanggal_berlaku' => '2025-03-01'])->assertRedirect();
        $this->assertEquals('nonaktif', $dosen->fresh()->status);
        $this->assertEquals('Lektor', $dosen->fresh()->jabatan_akademik);
        $this->assertEquals(2, $dosen->homebaseHistories()->count());
        $this->assertEquals(1, $dosen->riwayatPendidikans()->count());
    }

    public function test_admin_can_upload_verify_document_and_soft_delete_restore_dosen(): void
    {
        Storage::fake('public');
        $admin = $this->admin();
        $this->actingAs($admin)->post(route('admin.dosen.store'), $this->payload());
        $dosen = Dosen::first();
        $this->actingAs($admin)->post(route('admin.dosen.dokumen.store', $dosen), ['jenis' => 'ktp', 'nama_dokumen' => 'KTP Siti', 'file' => UploadedFile::fake()->create('ktp.pdf', 20, 'application/pdf')])->assertRedirect();
        $dokumen = DosenDokumen::first();
        Storage::disk('public')->assertExists($dokumen->file_path);
        $this->actingAs($admin)->patch(route('admin.dosen.dokumen.verify', [$dosen, $dokumen]), ['status_verifikasi' => 'approved'])->assertRedirect();
        $this->assertEquals('approved', $dokumen->fresh()->status_verifikasi);
        $this->actingAs($admin)->delete(route('admin.dosen.destroy', $dosen))->assertRedirect();
        $this->assertSoftDeleted('dosens', ['id' => $dosen->id]);
        $this->actingAs($admin)->post(route('admin.dosen.restore', $dosen->id))->assertRedirect();
        $this->assertNotNull(Dosen::find($dosen->id));
    }

    public function test_pddikti_sync_is_honest_when_client_is_not_configured_and_non_admin_is_forbidden(): void
    {
        $admin = $this->admin();
        $this->actingAs($admin)->post(route('admin.dosen.store'), $this->payload());
        $dosen = Dosen::first();
        $this->actingAs($admin)->put(route('admin.dosen.pddikti.mapping.update', $dosen), ['pddikti_id' => 'PDD-001', 'id_registrasi_dosen' => 'REG-001', 'status_mapping' => 'mapped'])->assertRedirect();
        $this->assertEquals('PDD-001', $dosen->fresh()->pddiktiMapping->pddikti_id);
        $this->actingAs($admin)->post(route('admin.dosen.pddikti.sync', $dosen))->assertSessionHas('error');
        $this->assertEquals('error', PddiktiDosenMapping::first()->status_mapping);
        $this->assertEquals('failed', $dosen->pddiktiSyncLogs()->first()->status);
        $this->actingAs(User::factory()->create(['role' => 'dosen']))->get(route('admin.dosen.index'))->assertForbidden();
    }
}
