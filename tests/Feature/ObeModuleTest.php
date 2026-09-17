<?php

namespace Tests\Feature;

use App\Models\Dosen;
use App\Models\DosenHomebaseHistory;
use App\Models\KelasKuliah;
use App\Models\KelasKuliahPengajar;
use App\Models\Kurikulum;
use App\Models\KurikulumMataKuliah;
use App\Models\Mahasiswa;
use App\Models\MataKuliah;
use App\Models\ObeAssessment;
use App\Models\ObeAssessmentMapping;
use App\Models\ObeAssessmentScore;
use App\Models\ObeCpl;
use App\Models\ObeCpmk;
use App\Models\ObeCpmkCplMapping;
use App\Models\Prodi;
use App\Models\Semester;
use App\Models\TahunAjaran;
use App\Models\User;
use App\Services\ObeAchievementService;
use App\Services\ObeValidationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class ObeModuleTest extends TestCase
{
    use RefreshDatabase;

    private function context(string $suffix = 'A'): array
    {
        $prodi = Prodi::create(['kode_prodi' => "TI-{$suffix}", 'nama_prodi' => "Teknik {$suffix}", 'jenjang' => 'S1', 'status' => 'aktif']);
        $tahunAjaran = TahunAjaran::create(['nama_tahun_ajaran' => "2026/2027 {$suffix}", 'tanggal_mulai' => '2026-08-01', 'tanggal_selesai' => '2027-07-31', 'status' => 'aktif']);
        $semester = Semester::create(['tahun_ajaran_id' => $tahunAjaran->id, 'nama_semester' => 'Ganjil', 'tanggal_mulai' => '2026-08-01', 'tanggal_selesai' => '2027-01-31', 'status' => 'aktif']);
        $kurikulum = Kurikulum::create(['kode' => "KUR-{$suffix}", 'nama' => "Kurikulum {$suffix}", 'prodi_id' => $prodi->id, 'semester_mulai_id' => $semester->id, 'status' => 'aktif']);
        $mataKuliah = MataKuliah::create(['kode_mata_kuliah' => "IF{$suffix}01", 'nama_mata_kuliah' => "Algoritma {$suffix}", 'sks' => 3, 'semester' => 1, 'prodi_id' => $prodi->id, 'jenis' => 'Wajib', 'status' => 'aktif']);
        KurikulumMataKuliah::create(['kurikulum_id' => $kurikulum->id, 'mata_kuliah_id' => $mataKuliah->id, 'semester' => 1, 'is_wajib' => true]);

        return compact('prodi', 'kurikulum', 'mataKuliah');
    }

    private function mahasiswa(Prodi $prodi): Mahasiswa
    {
        $user = User::factory()->create(['role' => 'mahasiswa']);

        return Mahasiswa::create([
            'user_id' => $user->id, 'nim' => '2026'.str_pad((string) $prodi->id, 4, '0', STR_PAD_LEFT),
            'nama_lengkap' => 'Mahasiswa Uji', 'jenis_kelamin' => 'L', 'tempat_lahir' => 'Bandung', 'tanggal_lahir' => '2005-01-01',
            'alamat' => 'Bandung', 'no_hp' => '081234567890', 'program_studi' => $prodi->nama_prodi, 'prodi_id' => $prodi->id, 'angkatan' => '2026', 'status' => 'aktif',
        ]);
    }

    public function test_duplicate_cpl_code_is_rejected_per_curriculum_scope(): void
    {
        ['prodi' => $prodi, 'kurikulum' => $kurikulum] = $this->context();
        $admin = User::factory()->create(['role' => 'admin']);
        ObeCpl::create(['prodi_id' => $prodi->id, 'kurikulum_id' => $kurikulum->id, 'code' => 'CPL-01', 'name' => 'Sikap']);

        $this->actingAs($admin)->post(route('admin.obe.cpl.store'), [
            'prodi_id' => $prodi->id, 'kurikulum_id' => $kurikulum->id, 'code' => 'CPL-01', 'name' => 'Pengetahuan',
        ])->assertSessionHasErrors('code');
    }

    public function test_admin_can_create_cpl_and_duplicate_cpmk_code_is_rejected_in_its_scope(): void
    {
        ['prodi' => $prodi, 'kurikulum' => $kurikulum, 'mataKuliah' => $mataKuliah] = $this->context();
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin)->post(route('admin.obe.cpl.store'), [
            'prodi_id' => $prodi->id, 'kurikulum_id' => $kurikulum->id, 'code' => 'CPL-01', 'name' => 'Sikap',
        ])->assertRedirect();
        $this->assertDatabaseHas('obe_audits', ['action' => 'created', 'auditable_type' => ObeCpl::class]);

        ObeCpmk::create(['mata_kuliah_id' => $mataKuliah->id, 'kurikulum_id' => $kurikulum->id, 'code' => 'CPMK-01', 'title' => 'Analisis']);
        $this->actingAs($admin)->post(route('admin.obe.cpmk.store'), [
            'mata_kuliah_id' => $mataKuliah->id, 'kurikulum_id' => $kurikulum->id, 'code' => 'CPMK-01', 'title' => 'Implementasi',
        ])->assertSessionHasErrors('code');
    }

    public function test_cross_prodi_mappings_are_rejected(): void
    {
        $a = $this->context('A');
        $b = $this->context('B');
        $cpl = ObeCpl::create(['prodi_id' => $a['prodi']->id, 'kurikulum_id' => $a['kurikulum']->id, 'code' => 'CPL-01', 'name' => 'CPL A']);

        $this->expectException(ValidationException::class);
        app(ObeValidationService::class)->assertCplCourseMapping($cpl, $b['mataKuliah'], $a['kurikulum']);
    }

    public function test_cpmk_to_cpl_and_assessment_mapping_require_same_course_and_curriculum(): void
    {
        $a = $this->context('A');
        $b = $this->context('B');
        $cplA = ObeCpl::create(['prodi_id' => $a['prodi']->id, 'kurikulum_id' => $a['kurikulum']->id, 'code' => 'CPL-01', 'name' => 'CPL A']);
        $cplB = ObeCpl::create(['prodi_id' => $b['prodi']->id, 'kurikulum_id' => $b['kurikulum']->id, 'code' => 'CPL-01', 'name' => 'CPL B']);
        $cpmk = ObeCpmk::create(['mata_kuliah_id' => $a['mataKuliah']->id, 'kurikulum_id' => $a['kurikulum']->id, 'code' => 'CPMK-01', 'title' => 'Mampu menguji']);
        $assessment = ObeAssessment::create(['mata_kuliah_id' => $a['mataKuliah']->id, 'type' => 'quiz', 'title' => 'Kuis 1', 'max_score' => 100, 'weight' => 20]);

        app(ObeValidationService::class)->assertCpmkCplMapping($cpmk, $cplA);
        app(ObeValidationService::class)->assertAssessmentMapping($assessment, $cpmk, null);
        $this->assertTrue(true);

        try {
            app(ObeValidationService::class)->assertCpmkCplMapping($cpmk, $cplB);
            $this->fail('Mapping lintas prodi harus ditolak.');
        } catch (ValidationException) {
            $this->assertTrue(true);
        }
    }

    public function test_achievement_uses_weighted_assessment_evidence_and_cpl_threshold_gap(): void
    {
        ['prodi' => $prodi, 'kurikulum' => $kurikulum, 'mataKuliah' => $mataKuliah] = $this->context();
        $mahasiswa = $this->mahasiswa($prodi);
        $cpl = ObeCpl::create(['prodi_id' => $prodi->id, 'kurikulum_id' => $kurikulum->id, 'code' => 'CPL-01', 'name' => 'CPL']);
        $cpmk = ObeCpmk::create(['mata_kuliah_id' => $mataKuliah->id, 'kurikulum_id' => $kurikulum->id, 'code' => 'CPMK-01', 'title' => 'CPMK']);
        ObeCpmkCplMapping::create(['cpmk_id' => $cpmk->id, 'cpl_id' => $cpl->id, 'weight' => 1]);
        $quiz = ObeAssessment::create(['mata_kuliah_id' => $mataKuliah->id, 'type' => 'quiz', 'title' => 'Quiz', 'max_score' => 100, 'weight' => 20]);
        $project = ObeAssessment::create(['mata_kuliah_id' => $mataKuliah->id, 'type' => 'project', 'title' => 'Proyek', 'max_score' => 100, 'weight' => 80]);
        ObeAssessmentMapping::create(['assessment_id' => $quiz->id, 'cpmk_id' => $cpmk->id, 'weight' => 1]);
        ObeAssessmentMapping::create(['assessment_id' => $project->id, 'cpmk_id' => $cpmk->id, 'weight' => 3]);
        ObeAssessmentScore::create(['assessment_id' => $quiz->id, 'mahasiswa_id' => $mahasiswa->id, 'score' => 80]);
        ObeAssessmentScore::create(['assessment_id' => $project->id, 'mahasiswa_id' => $mahasiswa->id, 'score' => 60]);

        $service = app(ObeAchievementService::class);
        $this->assertSame(65.0, $service->cpmkAchievement($cpmk, $mahasiswa)['achievement']);
        $report = $service->cplAchievement($cpl, $mahasiswa, 70);
        $this->assertSame(65.0, $report['achievement']);
        $this->assertSame(5.0, $report['gap']);
        $this->assertFalse($report['achieved']);
    }

    public function test_historical_curriculum_achievement_is_isolated(): void
    {
        $old = $this->context('OLD');
        $new = $this->context('NEW');
        $mahasiswa = $this->mahasiswa($old['prodi']);
        $oldCpl = ObeCpl::create(['prodi_id' => $old['prodi']->id, 'kurikulum_id' => $old['kurikulum']->id, 'code' => 'CPL-OLD', 'name' => 'CPL Lama']);
        ObeCpl::create(['prodi_id' => $new['prodi']->id, 'kurikulum_id' => $new['kurikulum']->id, 'code' => 'CPL-NEW', 'name' => 'CPL Baru']);

        $report = app(ObeAchievementService::class)->gapReport($old['kurikulum']->id, $mahasiswa);
        $this->assertCount(1, $report);
        $this->assertSame($oldCpl->id, $report[0]['cpl_id']);
    }

    public function test_legacy_penilaian_can_be_used_as_assessment_evidence(): void
    {
        ['prodi' => $prodi, 'kurikulum' => $kurikulum, 'mataKuliah' => $mataKuliah] = $this->context();
        $mahasiswa = $this->mahasiswa($prodi);
        $dosenUser = User::factory()->create(['role' => 'dosen']);
        $dosen = Dosen::create(['user_id' => $dosenUser->id, 'nip' => '19800002', 'nama_lengkap' => 'Dosen Penilaian', 'jenis_kelamin' => 'L', 'tempat_lahir' => 'Bandung', 'tanggal_lahir' => '1980-01-01', 'alamat' => 'Bandung', 'no_hp' => '081234567898', 'pendidikan_terakhir' => 'S2', 'bidang_keahlian' => 'Informatika']);
        $cpmk = ObeCpmk::create(['mata_kuliah_id' => $mataKuliah->id, 'kurikulum_id' => $kurikulum->id, 'code' => 'CPMK-01', 'title' => 'CPMK']);
        $assessment = ObeAssessment::create(['mata_kuliah_id' => $mataKuliah->id, 'type' => 'uts', 'title' => 'UTS', 'max_score' => 100, 'weight' => 1]);
        ObeAssessmentMapping::create(['assessment_id' => $assessment->id, 'cpmk_id' => $cpmk->id, 'weight' => 1]);
        $penilaian = \App\Models\Penilaian::create([
            'mahasiswa_id' => $mahasiswa->id, 'jadwal_kuliah_id' => \App\Models\JadwalKuliah::create([
                'mata_kuliah_id' => $mataKuliah->id, 'dosen_id' => $dosen->id, 'semester_id' => $kurikulum->semester_mulai_id, 'hari' => 'Senin', 'jam_mulai' => '08:00', 'jam_selesai' => '10:00', 'ruangan' => 'R1', 'status' => 'aktif',
            ])->id,
            'periode_krs_id' => \App\Models\PeriodeKrs::create(['tahun_ajaran_id' => $kurikulum->semesterMulai->tahun_ajaran_id, 'semester_id' => $kurikulum->semester_mulai_id, 'nama_periode' => 'KRS Uji', 'tanggal_mulai' => '2026-08-01', 'tanggal_selesai' => '2026-08-10', 'status' => 'aktif'])->id,
            'nilai_akhir' => 75, 'status' => 'final',
        ]);
        ObeAssessmentScore::create(['assessment_id' => $assessment->id, 'mahasiswa_id' => $mahasiswa->id, 'penilaian_id' => $penilaian->id]);

        $this->assertSame(75.0, app(ObeAchievementService::class)->cpmkAchievement($cpmk, $mahasiswa)['achievement']);
    }

    public function test_lecturer_cannot_read_a_class_outside_their_homebase_scope(): void
    {
        $a = $this->context('A');
        $b = $this->context('B');
        $user = User::factory()->create(['role' => 'dosen']);
        $dosen = Dosen::create(['user_id' => $user->id, 'nip' => '19800001', 'nama_lengkap' => 'Dosen Uji', 'jenis_kelamin' => 'L', 'tempat_lahir' => 'Bandung', 'tanggal_lahir' => '1980-01-01', 'alamat' => 'Bandung', 'no_hp' => '081234567899', 'pendidikan_terakhir' => 'S2', 'bidang_keahlian' => 'Informatika']);
        DosenHomebaseHistory::create(['dosen_id' => $dosen->id, 'prodi_id' => $a['prodi']->id, 'tanggal_mulai' => '2020-01-01', 'status' => 'aktif']);
        $kelas = KelasKuliah::create(['mata_kuliah_id' => $b['mataKuliah']->id, 'kurikulum_id' => $b['kurikulum']->id, 'semester_id' => $b['kurikulum']->semester_mulai_id, 'kode_kelas' => 'A', 'kapasitas' => 30, 'status' => 'dibuka']);
        KelasKuliahPengajar::create(['kelas_kuliah_id' => $kelas->id, 'dosen_id' => $dosen->id, 'status' => 'aktif']);

        $this->expectException(ValidationException::class);
        app(ObeValidationService::class)->assertDosenCanReadClass($dosen, $kelas);
    }
}
