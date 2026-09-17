<?php

namespace Tests\Feature;

use App\Models\Kurikulum;
use App\Models\MataKuliah;
use App\Models\Prodi;
use App\Models\Semester;
use App\Models\TahunAjaran;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class KurikulumModuleTest extends TestCase
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

    private function semester(): Semester
    {
        $ta = TahunAjaran::create(['nama_tahun_ajaran' => '2026/2027', 'tanggal_mulai' => '2026-08-01', 'tanggal_selesai' => '2027-07-31', 'status' => 'aktif']);

        return Semester::create(['tahun_ajaran_id' => $ta->id, 'nama_semester' => 'Ganjil', 'tanggal_mulai' => '2026-08-01', 'tanggal_selesai' => '2027-01-31', 'status' => 'aktif']);
    }

    private function mataKuliah(Prodi $prodi, string $kode = 'IF101'): MataKuliah
    {
        return MataKuliah::create([
            'kode_mata_kuliah' => $kode, 'nama_mata_kuliah' => 'Algoritma', 'sks' => 3,
            'semester' => 1, 'prodi_id' => $prodi->id, 'jenis' => 'Wajib', 'status' => 'aktif',
        ]);
    }

    public function test_admin_can_create_curriculum_as_draft(): void
    {
        $admin = $this->admin();
        $prodi = $this->prodi();
        $semester = $this->semester();
        $response = $this->actingAs($admin)->post(route('admin.kurikulum.store'), [
            'kode' => 'KUR-TI-2026', 'nama' => 'Kurikulum 2026', 'prodi_id' => $prodi->id, 'semester_mulai_id' => $semester->id,
        ]);
        $response->assertRedirect();
        $this->assertEquals('draft', Kurikulum::first()->status);
    }

    public function test_admin_can_add_and_remove_course_in_curriculum(): void
    {
        $admin = $this->admin();
        $prodi = $this->prodi();
        $semester = $this->semester();
        $this->actingAs($admin)->post(route('admin.kurikulum.store'), ['kode' => 'KUR-TI-2026', 'nama' => 'Kurikulum 2026', 'prodi_id' => $prodi->id, 'semester_mulai_id' => $semester->id]);
        $kurikulum = Kurikulum::first();
        $mk = $this->mataKuliah($prodi);

        $this->actingAs($admin)->post(route('admin.kurikulum.mata-kuliah.store', $kurikulum), ['mata_kuliah_id' => $mk->id, 'semester' => 1, 'is_wajib' => true])->assertRedirect();
        $this->assertEquals(1, $kurikulum->kurikulumMataKuliahs()->count());

        $item = $kurikulum->kurikulumMataKuliahs()->first();
        $this->actingAs($admin)->delete(route('admin.kurikulum.mata-kuliah.destroy', [$kurikulum, $item]))->assertRedirect();
        $this->assertEquals(0, $kurikulum->kurikulumMataKuliahs()->count());
    }

    public function test_duplicate_course_in_same_curriculum_is_rejected(): void
    {
        $admin = $this->admin();
        $prodi = $this->prodi();
        $semester = $this->semester();
        $this->actingAs($admin)->post(route('admin.kurikulum.store'), ['kode' => 'KUR-TI-2026', 'nama' => 'Kurikulum 2026', 'prodi_id' => $prodi->id, 'semester_mulai_id' => $semester->id]);
        $kurikulum = Kurikulum::first();
        $mk = $this->mataKuliah($prodi);

        $this->actingAs($admin)->post(route('admin.kurikulum.mata-kuliah.store', $kurikulum), ['mata_kuliah_id' => $mk->id, 'semester' => 1, 'is_wajib' => true]);
        $response = $this->actingAs($admin)->post(route('admin.kurikulum.mata-kuliah.store', $kurikulum), ['mata_kuliah_id' => $mk->id, 'semester' => 2, 'is_wajib' => true]);
        $response->assertSessionHasErrors('mata_kuliah_id');
    }

    public function test_semester_placement_and_total_sks_are_correct(): void
    {
        $admin = $this->admin();
        $prodi = $this->prodi();
        $semester = $this->semester();
        $this->actingAs($admin)->post(route('admin.kurikulum.store'), ['kode' => 'KUR-TI-2026', 'nama' => 'Kurikulum 2026', 'prodi_id' => $prodi->id, 'semester_mulai_id' => $semester->id]);
        $kurikulum = Kurikulum::first();
        $mk1 = $this->mataKuliah($prodi, 'IF101');
        $mk2 = $this->mataKuliah($prodi, 'IF102');

        $this->actingAs($admin)->post(route('admin.kurikulum.mata-kuliah.store', $kurikulum), ['mata_kuliah_id' => $mk1->id, 'semester' => 1, 'is_wajib' => true]);
        $this->actingAs($admin)->post(route('admin.kurikulum.mata-kuliah.store', $kurikulum), ['mata_kuliah_id' => $mk2->id, 'semester' => 2, 'is_wajib' => true]);

        $this->assertEquals(6, $kurikulum->fresh()->hitungTotalSks());
        $this->assertEquals(1, $kurikulum->kurikulumMataKuliahs()->where('semester', 1)->count());
        $this->assertEquals(1, $kurikulum->kurikulumMataKuliahs()->where('semester', 2)->count());
    }

    public function test_curriculum_can_be_activated_when_valid_and_archived_afterwards(): void
    {
        $admin = $this->admin();
        $prodi = $this->prodi();
        $semester = $this->semester();
        $this->actingAs($admin)->post(route('admin.kurikulum.store'), ['kode' => 'KUR-TI-2026', 'nama' => 'Kurikulum 2026', 'prodi_id' => $prodi->id, 'semester_mulai_id' => $semester->id]);
        $kurikulum = Kurikulum::first();
        $mk = $this->mataKuliah($prodi);
        $this->actingAs($admin)->post(route('admin.kurikulum.mata-kuliah.store', $kurikulum), ['mata_kuliah_id' => $mk->id, 'semester' => 1, 'is_wajib' => true]);

        $this->actingAs($admin)->post(route('admin.kurikulum.activate', $kurikulum))->assertRedirect();
        $this->assertEquals('aktif', $kurikulum->fresh()->status);

        $this->actingAs($admin)->post(route('admin.kurikulum.archive', $kurikulum))->assertRedirect();
        $this->assertEquals('arsip', $kurikulum->fresh()->status);
    }

    public function test_curriculum_cannot_be_activated_without_courses(): void
    {
        $admin = $this->admin();
        $prodi = $this->prodi();
        $semester = $this->semester();
        $this->actingAs($admin)->post(route('admin.kurikulum.store'), ['kode' => 'KUR-TI-2026', 'nama' => 'Kurikulum 2026', 'prodi_id' => $prodi->id, 'semester_mulai_id' => $semester->id]);
        $kurikulum = Kurikulum::first();

        $response = $this->actingAs($admin)->post(route('admin.kurikulum.activate', $kurikulum));
        $response->assertSessionHasErrors('activation');
        $this->assertEquals('draft', $kurikulum->fresh()->status);
    }

    public function test_previous_curriculum_is_not_overwritten_by_new_one(): void
    {
        $admin = $this->admin();
        $prodi = $this->prodi();
        $semester = $this->semester();
        $this->actingAs($admin)->post(route('admin.kurikulum.store'), ['kode' => 'KUR-TI-2020', 'nama' => 'Kurikulum 2020', 'prodi_id' => $prodi->id, 'semester_mulai_id' => $semester->id]);
        $this->actingAs($admin)->post(route('admin.kurikulum.store'), ['kode' => 'KUR-TI-2026', 'nama' => 'Kurikulum 2026', 'prodi_id' => $prodi->id, 'semester_mulai_id' => $semester->id]);

        $this->assertEquals(2, Kurikulum::where('prodi_id', $prodi->id)->count());
    }
}
