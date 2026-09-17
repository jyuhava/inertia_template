<?php

namespace Tests\Feature;

use App\Models\Dosen;
use App\Models\JadwalKelasKuliah;
use App\Models\KelasKuliah;
use App\Models\Kurikulum;
use App\Models\Mahasiswa;
use App\Models\MataKuliah;
use App\Models\PeriodeKrs;
use App\Models\Prodi;
use App\Models\Semester;
use App\Models\StudentAdvisor;
use App\Models\StudentCourseRegistration;
use App\Models\TahunAjaran;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class KrsEnrollmentModuleTest extends TestCase
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

    private function periodeKrs(Semester $semester, array $overrides = []): PeriodeKrs
    {
        return PeriodeKrs::create(array_merge([
            'nama_periode' => 'KRS Ganjil 2026/2027',
            'tahun_ajaran_id' => $semester->tahun_ajaran_id,
            'semester_id' => $semester->id,
            'tanggal_mulai' => now()->subDay()->toDateString(),
            'tanggal_selesai' => now()->addDays(7)->toDateString(),
            'status' => 'aktif',
            'krs_status' => 'open',
        ], $overrides));
    }

    private function kurikulum(Prodi $prodi, Semester $semester): Kurikulum
    {
        return Kurikulum::create(['kode' => 'KUR-2026', 'nama' => 'Kurikulum 2026', 'prodi_id' => $prodi->id, 'semester_mulai_id' => $semester->id, 'status' => 'aktif']);
    }

    private function mahasiswa(Prodi $prodi): Mahasiswa
    {
        $user = User::factory()->create(['role' => 'mahasiswa']);

        return Mahasiswa::create([
            'user_id' => $user->id, 'nim' => '20260001', 'nama_lengkap' => 'Budi Santoso', 'jenis_kelamin' => 'L',
            'tempat_lahir' => 'Bogor', 'tanggal_lahir' => '2005-01-01', 'alamat' => 'Jl. A', 'no_hp' => '0800',
            'prodi_id' => $prodi->id, 'program_studi' => $prodi->nama_prodi, 'angkatan' => '2026', 'status' => 'aktif',
            'surat_komitmen' => 'dummy.pdf', 'komitmen_uploaded_at' => now(),
        ]);
    }

    private function mataKuliah(Prodi $prodi, string $kode = 'IF101', int $sks = 3): MataKuliah
    {
        return MataKuliah::create(['kode_mata_kuliah' => $kode, 'nama_mata_kuliah' => 'Algoritma', 'sks' => $sks, 'semester' => 1, 'prodi_id' => $prodi->id, 'jenis' => 'Wajib', 'status' => 'aktif']);
    }

    private function kelasKuliah(MataKuliah $mk, Semester $semester, string $kode = 'A', int $kapasitas = 40): KelasKuliah
    {
        return KelasKuliah::create(['mata_kuliah_id' => $mk->id, 'semester_id' => $semester->id, 'kode_kelas' => $kode, 'kapasitas' => $kapasitas, 'tipe_kelas' => 'reguler', 'status' => 'dibuka']);
    }

    private function jadwal(KelasKuliah $kelas, string $hari = 'Senin', string $mulai = '08:00', string $selesai = '09:40'): JadwalKelasKuliah
    {
        return JadwalKelasKuliah::create(['kelas_kuliah_id' => $kelas->id, 'hari' => $hari, 'jam_mulai' => $mulai, 'jam_selesai' => $selesai, 'tipe_pertemuan' => 'tatap_muka', 'status' => 'dipublikasikan']);
    }

    private function mahasiswaUser(Mahasiswa $mahasiswa): User
    {
        return $mahasiswa->user;
    }

    public function test_student_can_add_and_remove_class_in_draft(): void
    {
        $prodi = $this->prodi();
        $semester = $this->semester();
        $periode = $this->periodeKrs($semester);
        $mahasiswa = $this->mahasiswa($prodi);
        $mk = $this->mataKuliah($prodi);
        $kelas = $this->kelasKuliah($mk, $semester);
        $this->jadwal($kelas);

        $this->actingAs($mahasiswa->user)->get(route('mahasiswa.krs-enrollment.index'))->assertOk();
        $registration = StudentCourseRegistration::first();
        $this->assertEquals('draft', $registration->status);

        $this->actingAs($mahasiswa->user)->post(route('mahasiswa.krs-enrollment.add-class'), [
            'registration_id' => $registration->id, 'kelas_kuliah_id' => $kelas->id,
        ])->assertRedirect();

        $this->assertEquals(1, $registration->fresh()->activeItems()->count());
        $this->assertEquals(3, (float) $registration->fresh()->total_sks);

        $item = $registration->fresh()->activeItems()->first();
        $this->actingAs($mahasiswa->user)->delete(route('mahasiswa.krs-enrollment.remove-class', [$registration->id, $item->id]))->assertRedirect();
        $this->assertEquals(0, $registration->fresh()->activeItems()->count());
    }

    public function test_class_capacity_full_is_rejected(): void
    {
        $prodi = $this->prodi();
        $semester = $this->semester();
        $periode = $this->periodeKrs($semester);
        $mk = $this->mataKuliah($prodi);
        $kelas = $this->kelasKuliah($mk, $semester, 'A', 1);
        $this->jadwal($kelas);

        $mhs1 = $this->mahasiswa($prodi);
        $reg1 = app(\App\Services\Krs\KrsRegistrationService::class)->getOrCreateDraft($mhs1, $periode);
        $this->actingAs($mhs1->user)->post(route('mahasiswa.krs-enrollment.add-class'), ['registration_id' => $reg1->id, 'kelas_kuliah_id' => $kelas->id])->assertRedirect();

        $mhs2User = User::factory()->create(['role' => 'mahasiswa']);
        $mhs2 = Mahasiswa::create(['user_id' => $mhs2User->id, 'nim' => '20260002', 'nama_lengkap' => 'Sari', 'jenis_kelamin' => 'P', 'tempat_lahir' => 'Bogor', 'tanggal_lahir' => '2005-01-01', 'alamat' => 'Jl. B', 'no_hp' => '0801', 'prodi_id' => $prodi->id, 'program_studi' => $prodi->nama_prodi, 'angkatan' => '2026', 'status' => 'aktif', 'surat_komitmen' => 'dummy.pdf', 'komitmen_uploaded_at' => now()]);
        $reg2 = app(\App\Services\Krs\KrsRegistrationService::class)->getOrCreateDraft($mhs2, $periode);

        $response = $this->actingAs($mhs2User)->post(route('mahasiswa.krs-enrollment.add-class'), ['registration_id' => $reg2->id, 'kelas_kuliah_id' => $kelas->id]);
        $response->assertSessionHasErrors('class');
        $this->assertEquals(0, $reg2->fresh()->activeItems()->count());
    }

    public function test_duplicate_class_in_same_registration_is_rejected(): void
    {
        $prodi = $this->prodi();
        $semester = $this->semester();
        $periode = $this->periodeKrs($semester);
        $mahasiswa = $this->mahasiswa($prodi);
        $mk = $this->mataKuliah($prodi);
        $kelas = $this->kelasKuliah($mk, $semester);
        $this->jadwal($kelas);

        $registration = app(\App\Services\Krs\KrsRegistrationService::class)->getOrCreateDraft($mahasiswa, $periode);
        $this->actingAs($mahasiswa->user)->post(route('mahasiswa.krs-enrollment.add-class'), ['registration_id' => $registration->id, 'kelas_kuliah_id' => $kelas->id]);
        $response = $this->actingAs($mahasiswa->user)->post(route('mahasiswa.krs-enrollment.add-class'), ['registration_id' => $registration->id, 'kelas_kuliah_id' => $kelas->id]);

        $response->assertSessionHasErrors('class');
        $this->assertEquals(1, $registration->fresh()->activeItems()->count());
    }

    public function test_schedule_conflict_is_detected_with_interval_overlap(): void
    {
        $prodi = $this->prodi();
        $semester = $this->semester();
        $periode = $this->periodeKrs($semester);
        $mahasiswa = $this->mahasiswa($prodi);

        $mk1 = $this->mataKuliah($prodi, 'IF101');
        $kelas1 = $this->kelasKuliah($mk1, $semester, 'A');
        $this->jadwal($kelas1, 'Senin', '08:00', '09:40');

        $mk2 = $this->mataKuliah($prodi, 'IF102');
        $kelas2 = $this->kelasKuliah($mk2, $semester, 'A');
        $this->jadwal($kelas2, 'Senin', '09:00', '11:00');

        $registration = app(\App\Services\Krs\KrsRegistrationService::class)->getOrCreateDraft($mahasiswa, $periode);
        $this->actingAs($mahasiswa->user)->post(route('mahasiswa.krs-enrollment.add-class'), ['registration_id' => $registration->id, 'kelas_kuliah_id' => $kelas1->id]);
        $response = $this->actingAs($mahasiswa->user)->post(route('mahasiswa.krs-enrollment.add-class'), ['registration_id' => $registration->id, 'kelas_kuliah_id' => $kelas2->id]);

        $response->assertSessionHasErrors('class');
        $this->assertEquals(1, $registration->fresh()->activeItems()->count());
    }

    public function test_credit_limit_is_enforced_from_periode_krs_not_hardcoded(): void
    {
        $prodi = $this->prodi();
        $semester = $this->semester();
        $periode = $this->periodeKrs($semester, ['maksimal_sks' => 3]);
        $mahasiswa = $this->mahasiswa($prodi);

        $mk1 = $this->mataKuliah($prodi, 'IF101', 3);
        $kelas1 = $this->kelasKuliah($mk1, $semester, 'A');
        $this->jadwal($kelas1, 'Senin');

        $mk2 = $this->mataKuliah($prodi, 'IF102', 3);
        $kelas2 = $this->kelasKuliah($mk2, $semester, 'A');
        $this->jadwal($kelas2, 'Selasa');

        $registration = app(\App\Services\Krs\KrsRegistrationService::class)->getOrCreateDraft($mahasiswa, $periode);
        $this->actingAs($mahasiswa->user)->post(route('mahasiswa.krs-enrollment.add-class'), ['registration_id' => $registration->id, 'kelas_kuliah_id' => $kelas1->id])->assertRedirect();
        $response = $this->actingAs($mahasiswa->user)->post(route('mahasiswa.krs-enrollment.add-class'), ['registration_id' => $registration->id, 'kelas_kuliah_id' => $kelas2->id]);

        $response->assertSessionHasErrors('class');
        $this->assertEquals(3, (float) $registration->fresh()->total_sks);
    }

    public function test_prerequisite_validation_blocks_when_not_taken(): void
    {
        $prodi = $this->prodi();
        $semester = $this->semester();
        $periode = $this->periodeKrs($semester);
        $mahasiswa = $this->mahasiswa($prodi);

        $dasar = $this->mataKuliah($prodi, 'IF101');
        $lanjut = $this->mataKuliah($prodi, 'IF201');
        $lanjut->prasyarats()->attach($dasar->id);
        $kelasLanjut = $this->kelasKuliah($lanjut, $semester, 'A');
        $this->jadwal($kelasLanjut);

        $registration = app(\App\Services\Krs\KrsRegistrationService::class)->getOrCreateDraft($mahasiswa, $periode);
        $response = $this->actingAs($mahasiswa->user)->post(route('mahasiswa.krs-enrollment.add-class'), ['registration_id' => $registration->id, 'kelas_kuliah_id' => $kelasLanjut->id]);

        $response->assertSessionHasErrors('class');
        $this->assertEquals(0, $registration->fresh()->activeItems()->count());
    }

    public function test_full_krs_lifecycle_submit_approve_lock(): void
    {
        $admin = $this->admin();
        $prodi = $this->prodi();
        $semester = $this->semester();
        $periode = $this->periodeKrs($semester);
        $mahasiswa = $this->mahasiswa($prodi);
        $mk = $this->mataKuliah($prodi);
        $kelas = $this->kelasKuliah($mk, $semester);
        $this->jadwal($kelas);

        $registration = app(\App\Services\Krs\KrsRegistrationService::class)->getOrCreateDraft($mahasiswa, $periode);
        $this->actingAs($mahasiswa->user)->post(route('mahasiswa.krs-enrollment.add-class'), ['registration_id' => $registration->id, 'kelas_kuliah_id' => $kelas->id]);

        $this->actingAs($mahasiswa->user)->post(route('mahasiswa.krs-enrollment.submit', $registration->id))->assertRedirect();
        $this->assertEquals('submitted', $registration->fresh()->status);

        $this->actingAs($admin)->post(route('admin.krs-enrollment.approve', $registration->id))->assertRedirect();
        $this->assertEquals('approved', $registration->fresh()->status);

        $this->actingAs($admin)->post(route('admin.krs-enrollment.lock', $registration->id))->assertRedirect();
        $this->assertEquals('locked', $registration->fresh()->status);
        $this->assertNotNull($registration->fresh()->locked_at);

        // Cannot edit while locked
        $mk2 = $this->mataKuliah($prodi, 'IF999');
        $kelas2 = $this->kelasKuliah($mk2, $semester, 'A');
        $this->jadwal($kelas2, 'Rabu');
        $response = $this->actingAs($mahasiswa->user)->post(route('mahasiswa.krs-enrollment.add-class'), ['registration_id' => $registration->id, 'kelas_kuliah_id' => $kelas2->id]);
        $response->assertSessionHasErrors('registration');
    }

    public function test_admin_reject_and_revision_workflow(): void
    {
        $admin = $this->admin();
        $prodi = $this->prodi();
        $semester = $this->semester();
        $periode = $this->periodeKrs($semester);
        $mahasiswa = $this->mahasiswa($prodi);
        $mk = $this->mataKuliah($prodi);
        $kelas = $this->kelasKuliah($mk, $semester);
        $this->jadwal($kelas);

        $registration = app(\App\Services\Krs\KrsRegistrationService::class)->getOrCreateDraft($mahasiswa, $periode);
        $this->actingAs($mahasiswa->user)->post(route('mahasiswa.krs-enrollment.add-class'), ['registration_id' => $registration->id, 'kelas_kuliah_id' => $kelas->id]);
        $this->actingAs($mahasiswa->user)->post(route('mahasiswa.krs-enrollment.submit', $registration->id));

        $this->actingAs($admin)->post(route('admin.krs-enrollment.request-revision', $registration->id), ['reason' => 'SKS kurang'])->assertRedirect();
        $this->assertEquals('revision', $registration->fresh()->status);
        $this->assertEquals('SKS kurang', $registration->fresh()->rejection_reason);

        // Student can re-submit after revision
        $this->actingAs($mahasiswa->user)->post(route('mahasiswa.krs-enrollment.submit', $registration->id))->assertRedirect();
        $this->assertEquals('submitted', $registration->fresh()->status);

        $this->actingAs($admin)->post(route('admin.krs-enrollment.reject', $registration->id), ['reason' => 'Ditolak'])->assertRedirect();
        $this->assertEquals('rejected', $registration->fresh()->status);
    }

    public function test_admin_unlock_override_is_audited(): void
    {
        $admin = $this->admin();
        $prodi = $this->prodi();
        $semester = $this->semester();
        $periode = $this->periodeKrs($semester);
        $mahasiswa = $this->mahasiswa($prodi);
        $mk = $this->mataKuliah($prodi);
        $kelas = $this->kelasKuliah($mk, $semester);
        $this->jadwal($kelas);

        $registration = app(\App\Services\Krs\KrsRegistrationService::class)->getOrCreateDraft($mahasiswa, $periode);
        $this->actingAs($mahasiswa->user)->post(route('mahasiswa.krs-enrollment.add-class'), ['registration_id' => $registration->id, 'kelas_kuliah_id' => $kelas->id]);
        $this->actingAs($mahasiswa->user)->post(route('mahasiswa.krs-enrollment.submit', $registration->id));
        $this->actingAs($admin)->post(route('admin.krs-enrollment.approve', $registration->id));
        $this->actingAs($admin)->post(route('admin.krs-enrollment.lock', $registration->id));

        $this->actingAs($admin)->post(route('admin.krs-enrollment.unlock', $registration->id), ['reason' => 'Perubahan mendesak'])->assertRedirect();
        $this->assertEquals('approved', $registration->fresh()->status);

        $audit = $registration->fresh()->audits()->where('action', 'KRS_ADMIN_UNLOCK')->first();
        $this->assertNotNull($audit);
        $this->assertEquals('Perubahan mendesak', $audit->reason);
        $this->assertEquals($admin->id, $audit->user_id);
    }

    public function test_previous_period_krs_is_not_overwritten_by_new_period(): void
    {
        $prodi = $this->prodi();
        $semester1 = $this->semester();
        $periode1 = $this->periodeKrs($semester1);
        $mahasiswa = $this->mahasiswa($prodi);
        $mk = $this->mataKuliah($prodi);
        $kelas = $this->kelasKuliah($mk, $semester1);
        $this->jadwal($kelas);

        $reg1 = app(\App\Services\Krs\KrsRegistrationService::class)->getOrCreateDraft($mahasiswa, $periode1);
        $this->actingAs($mahasiswa->user)->post(route('mahasiswa.krs-enrollment.add-class'), ['registration_id' => $reg1->id, 'kelas_kuliah_id' => $kelas->id]);
        $this->actingAs($mahasiswa->user)->post(route('mahasiswa.krs-enrollment.submit', $reg1->id));
        $this->actingAs($this->admin())->post(route('admin.krs-enrollment.approve', $reg1->id));

        $ta2 = TahunAjaran::create(['nama_tahun_ajaran' => '2027/2028', 'tanggal_mulai' => '2027-08-01', 'tanggal_selesai' => '2028-07-31', 'status' => 'aktif']);
        $semester2 = Semester::create(['tahun_ajaran_id' => $ta2->id, 'nama_semester' => 'Ganjil', 'tanggal_mulai' => '2027-08-01', 'tanggal_selesai' => '2028-01-31', 'status' => 'aktif']);
        $periode2 = $this->periodeKrs($semester2);

        $reg2 = app(\App\Services\Krs\KrsRegistrationService::class)->getOrCreateDraft($mahasiswa, $periode2);

        $this->assertNotEquals($reg1->id, $reg2->id);
        $this->assertEquals('approved', $reg1->fresh()->status);
        $this->assertEquals(2, StudentCourseRegistration::where('mahasiswa_id', $mahasiswa->id)->count());
    }

    public function test_advisor_can_only_review_own_advisees(): void
    {
        $prodi = $this->prodi();
        $semester = $this->semester();
        $periode = $this->periodeKrs($semester);
        $mahasiswa = $this->mahasiswa($prodi);
        $mk = $this->mataKuliah($prodi);
        $kelas = $this->kelasKuliah($mk, $semester);
        $this->jadwal($kelas);

        $dosenUser = User::factory()->create(['role' => 'dosen']);
        $dosen = Dosen::create(['user_id' => $dosenUser->id, 'nip' => 'D001', 'nama_lengkap' => 'Dr. A', 'jenis_kelamin' => 'L', 'tempat_lahir' => 'Bogor', 'tanggal_lahir' => '1980-01-01', 'alamat' => 'Jl.', 'no_hp' => '08', 'pendidikan_terakhir' => 'S3', 'bidang_keahlian' => 'TI', 'status' => 'aktif']);

        $otherDosenUser = User::factory()->create(['role' => 'dosen']);
        Dosen::create(['user_id' => $otherDosenUser->id, 'nip' => 'D002', 'nama_lengkap' => 'Dr. B', 'jenis_kelamin' => 'L', 'tempat_lahir' => 'Bogor', 'tanggal_lahir' => '1980-01-01', 'alamat' => 'Jl.', 'no_hp' => '08', 'pendidikan_terakhir' => 'S3', 'bidang_keahlian' => 'TI', 'status' => 'aktif']);

        StudentAdvisor::create(['mahasiswa_id' => $mahasiswa->id, 'dosen_id' => $dosen->id, 'tanggal_mulai' => now()->toDateString(), 'status' => 'aktif']);

        $registration = app(\App\Services\Krs\KrsRegistrationService::class)->getOrCreateDraft($mahasiswa, $periode);
        $this->actingAs($mahasiswa->user)->post(route('mahasiswa.krs-enrollment.add-class'), ['registration_id' => $registration->id, 'kelas_kuliah_id' => $kelas->id]);
        $this->actingAs($mahasiswa->user)->post(route('mahasiswa.krs-enrollment.submit', $registration->id));

        $this->actingAs($dosenUser)->get(route('dosen.krs-advisor.show', $registration->id))->assertOk();
        $this->actingAs($otherDosenUser)->get(route('dosen.krs-advisor.show', $registration->id))->assertForbidden();
    }

    public function test_student_cannot_approve_own_krs(): void
    {
        $prodi = $this->prodi();
        $semester = $this->semester();
        $periode = $this->periodeKrs($semester);
        $mahasiswa = $this->mahasiswa($prodi);

        $registration = app(\App\Services\Krs\KrsRegistrationService::class)->getOrCreateDraft($mahasiswa, $periode);

        $this->actingAs($mahasiswa->user)->post(route('admin.krs-enrollment.approve', $registration->id))->assertForbidden();
    }

    public function test_student_can_only_see_own_krs(): void
    {
        $prodi = $this->prodi();
        $semester = $this->semester();
        $periode = $this->periodeKrs($semester);
        $mahasiswaA = $this->mahasiswa($prodi);

        $userB = User::factory()->create(['role' => 'mahasiswa']);
        $mahasiswaB = Mahasiswa::create(['user_id' => $userB->id, 'nim' => '20260099', 'nama_lengkap' => 'Lain', 'jenis_kelamin' => 'P', 'tempat_lahir' => 'Bogor', 'tanggal_lahir' => '2005-01-01', 'alamat' => 'Jl.', 'no_hp' => '08', 'prodi_id' => $prodi->id, 'program_studi' => $prodi->nama_prodi, 'angkatan' => '2026', 'status' => 'aktif', 'surat_komitmen' => 'dummy.pdf', 'komitmen_uploaded_at' => now()]);

        $regA = app(\App\Services\Krs\KrsRegistrationService::class)->getOrCreateDraft($mahasiswaA, $periode);
        $mk = $this->mataKuliah($prodi);
        $kelas = $this->kelasKuliah($mk, $semester);
        $this->jadwal($kelas);
        $this->actingAs($mahasiswaA->user)->post(route('mahasiswa.krs-enrollment.add-class'), ['registration_id' => $regA->id, 'kelas_kuliah_id' => $kelas->id]);
        $item = $regA->fresh()->activeItems()->first();

        $this->actingAs($userB)->delete(route('mahasiswa.krs-enrollment.remove-class', [$regA->id, $item->id]))->assertForbidden();
    }

    public function test_pddikti_sync_only_allowed_for_approved_or_locked_and_is_honest(): void
    {
        $admin = $this->admin();
        $prodi = $this->prodi();
        $semester = $this->semester();
        $periode = $this->periodeKrs($semester);
        $mahasiswa = $this->mahasiswa($prodi);

        $registration = app(\App\Services\Krs\KrsRegistrationService::class)->getOrCreateDraft($mahasiswa, $periode);

        $this->actingAs($admin)->put(route('admin.krs-enrollment.pddikti.sync', $registration->id))->assertSessionHas('error');
        $this->assertNull(\App\Models\PddiktiAkademikMapping::where('entity_id', $registration->id)->first());

        $mk = $this->mataKuliah($prodi);
        $kelas = $this->kelasKuliah($mk, $semester);
        $this->jadwal($kelas);
        $this->actingAs($mahasiswa->user)->post(route('mahasiswa.krs-enrollment.add-class'), ['registration_id' => $registration->id, 'kelas_kuliah_id' => $kelas->id]);
        $this->actingAs($mahasiswa->user)->post(route('mahasiswa.krs-enrollment.submit', $registration->id));
        $this->actingAs($admin)->post(route('admin.krs-enrollment.approve', $registration->id));

        $this->actingAs($admin)->put(route('admin.krs-enrollment.pddikti.sync', $registration->id))->assertSessionHas('error');
        $mapping = \App\Models\PddiktiAkademikMapping::where('entity_type', StudentCourseRegistration::class)->where('entity_id', $registration->id)->first();
        $this->assertEquals('failed', $mapping->sync_status);
    }

    public function test_open_krs_requires_classes_and_curriculum_to_be_ready(): void
    {
        $admin = $this->admin();
        $prodi = $this->prodi();
        $semester = $this->semester();
        $periode = PeriodeKrs::create([
            'nama_periode' => 'KRS Baru', 'tahun_ajaran_id' => $semester->tahun_ajaran_id, 'semester_id' => $semester->id,
            'tanggal_mulai' => now()->toDateString(), 'tanggal_selesai' => now()->addDays(5)->toDateString(), 'status' => 'aktif', 'krs_status' => 'draft',
        ]);

        $response = $this->actingAs($admin)->post(route('admin.periode-krs.open-krs', $periode->id));
        $response->assertSessionHasErrors('krs_status');
        $this->assertEquals('draft', $periode->fresh()->krs_status);

        $this->kurikulum($prodi, $semester);
        $mk = $this->mataKuliah($prodi);
        $this->kelasKuliah($mk, $semester);

        $this->actingAs($admin)->post(route('admin.periode-krs.open-krs', $periode->id))->assertRedirect();
        $this->assertEquals('open', $periode->fresh()->krs_status);
    }
}
