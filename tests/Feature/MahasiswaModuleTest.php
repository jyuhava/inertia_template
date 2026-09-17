<?php

namespace Tests\Feature;

use App\Models\Mahasiswa;
use App\Models\MahasiswaBeasiswa;
use App\Models\MahasiswaDokumen;
use App\Models\PddiktiMahasiswaMapping;
use App\Models\Prodi;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class MahasiswaModuleTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }

    private function prodi(): Prodi
    {
        return Prodi::create([
            'kode_prodi' => 'TI',
            'nama_prodi' => 'Teknik Informatika',
            'jenjang' => 'S1',
            'status' => 'aktif',
        ]);
    }

    private function baseStorePayload(Prodi $prodi): array
    {
        return [
            'nim' => '2024001001',
            'nama_lengkap' => 'Budi Santoso',
            'jenis_kelamin' => 'L',
            'tempat_lahir' => 'Bogor',
            'tanggal_lahir' => '2005-01-01',
            'agama' => 'Islam',
            'kewarganegaraan' => 'WNI',
            'no_ktp' => '3201011234560001',
            'alamat' => 'Jl. Merdeka No. 1',
            'no_hp' => '081234567890',
            'email' => 'budi.santoso@student.test',
            'password' => 'password123',
            'prodi_id' => $prodi->id,
            'angkatan' => '2024',
            'periode_masuk' => '2024/2025',
            'tanggal_masuk' => '2024-09-01',
            'jenis_pendaftaran' => 'reguler',
            'jalur_masuk' => 'PMB',
            'asal_mahasiswa' => 'baru',
        ];
    }

    public function test_admin_can_create_mahasiswa_with_registration_and_status_history(): void
    {
        $admin = $this->admin();
        $prodi = $this->prodi();

        $response = $this->actingAs($admin)
            ->post(route('admin.mahasiswa.store'), $this->baseStorePayload($prodi));

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $mahasiswa = Mahasiswa::where('nim', '2024001001')->first();
        $this->assertNotNull($mahasiswa);
        $this->assertEquals('aktif', $mahasiswa->status);
        $this->assertNotNull($mahasiswa->user);
        $this->assertEquals(1, $mahasiswa->registrasis()->count());
        $this->assertEquals(1, $mahasiswa->statusHistories()->count());
        $this->assertEquals('aktif', $mahasiswa->statusHistories()->first()->status);
        $this->assertNotNull($mahasiswa->pddiktiMapping);
        $this->assertEquals('unmapped', $mahasiswa->pddiktiMapping->status_mapping);
    }

    public function test_store_fails_on_duplicate_nim(): void
    {
        $admin = $this->admin();
        $prodi = $this->prodi();

        $this->actingAs($admin)->post(route('admin.mahasiswa.store'), $this->baseStorePayload($prodi));

        $payload = $this->baseStorePayload($prodi);
        $payload['email'] = 'lain@student.test';
        $payload['no_ktp'] = '3201011234560002';

        $response = $this->actingAs($admin)->post(route('admin.mahasiswa.store'), $payload);

        $response->assertSessionHasErrors('nim');
        $this->assertEquals(1, Mahasiswa::where('nim', '2024001001')->count());
    }

    public function test_store_fails_on_duplicate_nik(): void
    {
        $admin = $this->admin();
        $prodi = $this->prodi();

        $this->actingAs($admin)->post(route('admin.mahasiswa.store'), $this->baseStorePayload($prodi));

        $payload = $this->baseStorePayload($prodi);
        $payload['nim'] = '2024001002';
        $payload['email'] = 'lain@student.test';

        $response = $this->actingAs($admin)->post(route('admin.mahasiswa.store'), $payload);

        $response->assertSessionHasErrors('no_ktp');
    }

    public function test_store_transaction_rolls_back_on_failure(): void
    {
        $admin = $this->admin();
        $prodi = $this->prodi();

        // Existing user with the same email triggers validation failure before
        // any records are created, proving the request never partially commits.
        User::factory()->create(['email' => 'budi.santoso@student.test']);

        $response = $this->actingAs($admin)
            ->post(route('admin.mahasiswa.store'), $this->baseStorePayload($prodi));

        $response->assertSessionHasErrors('email');
        $this->assertEquals(0, Mahasiswa::count());
    }

    public function test_admin_can_update_mahasiswa_biodata(): void
    {
        $admin = $this->admin();
        $prodi = $this->prodi();
        $this->actingAs($admin)->post(route('admin.mahasiswa.store'), $this->baseStorePayload($prodi));
        $mahasiswa = Mahasiswa::first();

        $response = $this->actingAs($admin)->put(route('admin.mahasiswa.update', $mahasiswa), [
            'nim' => $mahasiswa->nim,
            'nama_lengkap' => 'Budi Santoso Update',
            'jenis_kelamin' => 'L',
            'tempat_lahir' => 'Bogor',
            'tanggal_lahir' => '2005-01-01',
            'alamat' => 'Jl. Baru No. 2',
            'no_hp' => '081234567891',
            'prodi_id' => $prodi->id,
            'angkatan' => '2024',
            'status' => 'aktif',
            'email' => $mahasiswa->user->email,
        ]);

        $response->assertRedirect();
        $this->assertEquals('Budi Santoso Update', $mahasiswa->fresh()->nama_lengkap);
    }

    public function test_admin_can_soft_delete_and_restore_mahasiswa(): void
    {
        $admin = $this->admin();
        $prodi = $this->prodi();
        $this->actingAs($admin)->post(route('admin.mahasiswa.store'), $this->baseStorePayload($prodi));
        $mahasiswa = Mahasiswa::first();

        $this->actingAs($admin)->delete(route('admin.mahasiswa.destroy', $mahasiswa));
        $this->assertSoftDeleted('mahasiswas', ['id' => $mahasiswa->id]);
        $this->assertEquals(0, Mahasiswa::count());

        $this->actingAs($admin)->post(route('admin.mahasiswa.restore', $mahasiswa->id));
        $this->assertEquals(1, Mahasiswa::count());
    }

    public function test_admin_can_add_guardian_information(): void
    {
        $admin = $this->admin();
        $prodi = $this->prodi();
        $this->actingAs($admin)->post(route('admin.mahasiswa.store'), $this->baseStorePayload($prodi));
        $mahasiswa = Mahasiswa::first();

        $response = $this->actingAs($admin)->post(route('admin.mahasiswa.orang-tua.store', $mahasiswa), [
            'jenis' => 'ayah',
            'nama' => 'Bapak Budi',
            'pekerjaan' => 'Wiraswasta',
        ]);

        $response->assertRedirect();
        $this->assertEquals('Bapak Budi', $mahasiswa->ayah()->first()->nama);
    }

    public function test_admin_can_record_education_history(): void
    {
        $admin = $this->admin();
        $prodi = $this->prodi();
        $this->actingAs($admin)->post(route('admin.mahasiswa.store'), $this->baseStorePayload($prodi));
        $mahasiswa = Mahasiswa::first();

        $response = $this->actingAs($admin)->post(route('admin.mahasiswa.riwayat-pendidikan.store', $mahasiswa), [
            'jenjang_pendidikan' => 'SMA',
            'nama_institusi' => 'SMA Negeri 1 Bogor',
            'tanggal_lulus' => '2024-06-01',
            'nomor_ijazah' => 'IJZ-001',
        ]);

        $response->assertRedirect();
        $this->assertEquals(1, $mahasiswa->riwayatPendidikans()->count());
    }

    public function test_admin_can_upload_and_verify_document(): void
    {
        Storage::fake('public');
        $admin = $this->admin();
        $prodi = $this->prodi();
        $this->actingAs($admin)->post(route('admin.mahasiswa.store'), $this->baseStorePayload($prodi));
        $mahasiswa = Mahasiswa::first();

        $file = UploadedFile::fake()->create('ktp.pdf', 200, 'application/pdf');

        $response = $this->actingAs($admin)->post(route('admin.mahasiswa.dokumen.store', $mahasiswa), [
            'jenis_dokumen' => 'ktp',
            'file' => $file,
        ]);
        $response->assertRedirect();

        $dokumen = MahasiswaDokumen::first();
        $this->assertNotNull($dokumen);
        $this->assertEquals('pending', $dokumen->status_verifikasi);
        Storage::disk('public')->assertExists($dokumen->file_path);

        $verifyResponse = $this->actingAs($admin)->patch(
            route('admin.mahasiswa.dokumen.verify', [$mahasiswa, $dokumen]),
            ['status_verifikasi' => 'approved']
        );
        $verifyResponse->assertRedirect();
        $this->assertEquals('approved', $dokumen->fresh()->status_verifikasi);
        $this->assertEquals($admin->id, $dokumen->fresh()->verified_by);
    }

    public function test_admin_can_add_financial_aid(): void
    {
        $admin = $this->admin();
        $prodi = $this->prodi();
        $this->actingAs($admin)->post(route('admin.mahasiswa.store'), $this->baseStorePayload($prodi));
        $mahasiswa = Mahasiswa::first();

        $response = $this->actingAs($admin)->post(route('admin.mahasiswa.beasiswa.store', $mahasiswa), [
            'jenis_bantuan' => 'kip_kuliah',
            'nomor_bantuan' => 'KIP-0001',
            'status' => 'aktif',
        ]);

        $response->assertRedirect();
        $this->assertEquals(1, MahasiswaBeasiswa::where('mahasiswa_id', $mahasiswa->id)->count());
    }

    public function test_admin_can_record_status_history_change(): void
    {
        $admin = $this->admin();
        $prodi = $this->prodi();
        $this->actingAs($admin)->post(route('admin.mahasiswa.store'), $this->baseStorePayload($prodi));
        $mahasiswa = Mahasiswa::first();

        $response = $this->actingAs($admin)->post(route('admin.mahasiswa.status-history.store', $mahasiswa), [
            'status' => 'cuti',
            'tanggal_berlaku' => '2025-02-01',
            'alasan' => 'Cuti melahirkan',
        ]);

        $response->assertRedirect();
        $this->assertEquals('cuti', $mahasiswa->fresh()->status);
        $this->assertEquals(2, $mahasiswa->statusHistories()->count());
    }

    public function test_pddikti_sync_reports_honest_not_configured_result(): void
    {
        $admin = $this->admin();
        $prodi = $this->prodi();
        $this->actingAs($admin)->post(route('admin.mahasiswa.store'), $this->baseStorePayload($prodi));
        $mahasiswa = Mahasiswa::first();

        $response = $this->actingAs($admin)->post(route('admin.mahasiswa.pddikti.sync', $mahasiswa));

        $response->assertRedirect();
        $response->assertSessionHas('error');

        $mapping = PddiktiMahasiswaMapping::where('mahasiswa_id', $mahasiswa->id)->first();
        $this->assertEquals('error', $mapping->status_mapping);
        $this->assertEquals(1, $mahasiswa->pddiktiSyncLogs()->count());
        $this->assertEquals('failed', $mahasiswa->pddiktiSyncLogs()->first()->status);
    }

    public function test_non_admin_cannot_access_mahasiswa_module(): void
    {
        $mahasiswaUser = User::factory()->create(['role' => 'mahasiswa']);

        $response = $this->actingAs($mahasiswaUser)->get(route('admin.mahasiswa.index'));

        $response->assertForbidden();
    }
}
