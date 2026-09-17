<?php

namespace Tests\Feature;

use App\Models\MataKuliah;
use App\Models\PddiktiAkademikMapping;
use App\Models\Prodi;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CourseModuleTest extends TestCase
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

    private function payload(Prodi $prodi, string $kode = 'IF101'): array
    {
        return [
            'kode_mata_kuliah' => $kode, 'nama_mata_kuliah' => 'Algoritma dan Pemrograman',
            'sks' => 3, 'theory_credits' => 2, 'practical_credits' => 1,
            'semester' => 1, 'prodi_id' => $prodi->id, 'jenis' => 'Wajib', 'status' => 'aktif',
        ];
    }

    public function test_admin_can_create_course(): void
    {
        $admin = $this->admin();
        $prodi = $this->prodi();
        $this->actingAs($admin)->post(route('admin.mata-kuliah.store'), $this->payload($prodi))->assertRedirect();
        $this->assertEquals(1, MataKuliah::count());
    }

    public function test_admin_can_update_course(): void
    {
        $admin = $this->admin();
        $prodi = $this->prodi();
        $this->actingAs($admin)->post(route('admin.mata-kuliah.store'), $this->payload($prodi));
        $mk = MataKuliah::first();
        $update = $this->payload($prodi);
        $update['nama_mata_kuliah'] = 'Algoritma Lanjut';
        $this->actingAs($admin)->put(route('admin.mata-kuliah.update', $mk), $update)->assertRedirect();
        $this->assertEquals('Algoritma Lanjut', $mk->fresh()->nama_mata_kuliah);
    }

    public function test_duplicate_course_code_is_rejected(): void
    {
        $admin = $this->admin();
        $prodi = $this->prodi();
        $this->actingAs($admin)->post(route('admin.mata-kuliah.store'), $this->payload($prodi));
        $this->actingAs($admin)->post(route('admin.mata-kuliah.store'), $this->payload($prodi))
            ->assertSessionHasErrors('kode_mata_kuliah');
        $this->assertEquals(1, MataKuliah::count());
    }

    public function test_course_prerequisite_can_be_attached(): void
    {
        $admin = $this->admin();
        $prodi = $this->prodi();
        $this->actingAs($admin)->post(route('admin.mata-kuliah.store'), $this->payload($prodi, 'IF101'));
        $dasar = MataKuliah::first();
        $this->actingAs($admin)->post(route('admin.mata-kuliah.store'), $this->payload($prodi, 'IF201') + ['prasyarat_ids' => [$dasar->id]]);
        $lanjut = MataKuliah::where('kode_mata_kuliah', 'IF201')->first();
        $this->assertEquals(1, $lanjut->prasyarats()->count());
        $this->assertEquals('IF101', $lanjut->prasyarats()->first()->kode_mata_kuliah);
    }

    public function test_admin_can_archive_course_without_hard_delete(): void
    {
        $admin = $this->admin();
        $prodi = $this->prodi();
        $this->actingAs($admin)->post(route('admin.mata-kuliah.store'), $this->payload($prodi));
        $mk = MataKuliah::first();
        $this->actingAs($admin)->delete(route('admin.mata-kuliah.destroy', $mk))->assertRedirect();
        $this->assertSoftDeleted('mata_kuliahs', ['id' => $mk->id]);
        $this->assertEquals('nonaktif', $mk->fresh()->status);
    }

    public function test_pddikti_sync_reports_honest_not_configured_result_for_course(): void
    {
        $admin = $this->admin();
        $prodi = $this->prodi();
        $this->actingAs($admin)->post(route('admin.mata-kuliah.store'), $this->payload($prodi));
        $mk = MataKuliah::first();

        $response = $this->actingAs($admin)->post(route('admin.mata-kuliah.pddikti.sync', $mk));
        $response->assertSessionHas('error');

        $mapping = PddiktiAkademikMapping::where('entity_type', MataKuliah::class)->where('entity_id', $mk->id)->first();
        $this->assertEquals('failed', $mapping->sync_status);
    }

    public function test_non_admin_cannot_access_course_module(): void
    {
        $mahasiswaUser = User::factory()->create(['role' => 'mahasiswa']);
        $this->actingAs($mahasiswaUser)->get(route('admin.mata-kuliah.index'))->assertForbidden();
    }
}
