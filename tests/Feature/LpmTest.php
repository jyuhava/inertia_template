<?php

namespace Tests\Feature;

use App\Models\Dosen;
use App\Models\LpmProgram;
use App\Models\LpmProposal;
use App\Models\LpmProposalDocument;
use App\Models\LpmReview;
use App\Models\LpmReviewCriterion;
use App\Models\LpmReviewScheme;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class LpmTest extends TestCase
{
    use RefreshDatabase;

    private function makeAdmin(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }

    private function makeDosen(): User
    {
        $user = User::factory()->create(['role' => 'dosen']);

        Dosen::create([
            'user_id' => $user->id,
            'nip' => '198700'.random_int(1000, 9999),
            'nama_lengkap' => 'Dosen LPM '.random_int(100, 999),
            'jenis_kelamin' => 'L',
            'tempat_lahir' => 'Jakarta',
            'tanggal_lahir' => '1987-01-01',
            'alamat' => 'Jl. Test No. 1',
            'no_hp' => '081234567890',
            'pendidikan_terakhir' => 'S2',
            'bidang_keahlian' => 'Ilmu Sosial',
            'jabatan_akademik' => 'Lektor',
            'status' => 'aktif',
        ]);

        return $user;
    }

    private function makeProgram(array $overrides = []): LpmProgram
    {
        return LpmProgram::create(array_merge([
            'nama_program' => 'Pengabdian Internal 2026',
            'skema' => 'Internal',
            'tahun_anggaran' => '2026',
            'tanggal_buka' => now()->subDays(10)->toDateString(),
            'tanggal_tutup' => now()->addDays(20)->toDateString(),
            'pagu_dana' => 100000000,
            'maksimal_dana' => 10000000,
            'sumber_dana' => 'Yayasan',
            'status' => 'aktif',
        ], $overrides));
    }

    private function addScheme(LpmProgram $program): LpmReviewScheme
    {
        $scheme = LpmReviewScheme::create([
            'program_id' => $program->id,
            'nama' => 'Skema Review',
            'minimum_score' => 70,
            'reviewer_count' => 2,
            'aktif' => true,
        ]);

        LpmReviewCriterion::create(['scheme_id' => $scheme->id, 'nama_kriteria' => 'Metode', 'bobot' => 50, 'urutan' => 0]);
        LpmReviewCriterion::create(['scheme_id' => $scheme->id, 'nama_kriteria' => 'Luaran', 'bobot' => 50, 'urutan' => 1]);

        return $scheme;
    }

    private function makeProposal(User $ketua, LpmProgram $program, string $status = 'draft'): LpmProposal
    {
        $proposal = LpmProposal::create([
            'program_id' => $program->id,
            'ketua_user_id' => $ketua->id,
            'judul' => 'Pendampingan UMKM ' . random_int(100, 999),
            'ringkasan' => 'Ringkasan singkat pengabdian.',
            'mitra' => 'UMKM Bina Sejahtera',
            'permasalahan' => 'Mitra belum memanfaatkan digitalisasi.',
            'solusi' => 'Pelatihan dan pendampingan digital marketing.',
            'metode' => 'Pelatihan, praktik, dan evaluasi.',
            'jadwal' => [['kegiatan' => 'Survey', 'bulan' => 'Juli']],
            'rab' => [['uraian' => 'ATK', 'harga_satuan' => 100000, 'jumlah' => 5]],
            'luaran_target' => [['jenis' => 'Artikel', 'keterangan' => 'Terbit']],
            'status' => $status,
            'versi' => 1,
            'created_by' => $ketua->id,
        ]);

        return $proposal;
    }

    public function test_admin_can_manage_programs_and_dashboard(): void
    {
        $admin = $this->makeAdmin();
        $program = $this->makeProgram();
        $this->addScheme($program);

        $this->actingAs($admin)
            ->get(route('admin.lpm.dashboard'))
            ->assertOk();

        $this->actingAs($admin)
            ->get(route('admin.lpm.programs.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Admin/Lpm/Programs/Index'));

        $this->actingAs($admin)
            ->get(route('admin.lpm.programs.create'))
            ->assertOk();

        $this->actingAs($admin)
            ->post(route('admin.lpm.programs.store'), [
                'nama_program' => 'Pengabdian Hibah 2026',
                'skema' => 'Hibah',
                'tahun_anggaran' => '2026',
                'tanggal_buka' => now()->toDateString(),
                'tanggal_tutup' => now()->addDays(30)->toDateString(),
                'pagu_dana' => 50000000,
                'maksimal_dana' => 5000000,
                'status' => 'aktif',
                'review_scheme' => [
                    'minimum_score' => 70,
                    'reviewer_count' => 2,
                    'criteria' => [
                        ['nama_kriteria' => 'Metode', 'bobot' => 50],
                        ['nama_kriteria' => 'Luaran', 'bobot' => 50],
                    ],
                ],
            ])
            ->assertRedirect(route('admin.lpm.programs.index'))
            ->assertSessionHas('success');

        $this->assertDatabaseHas('lpm_programs', ['nama_program' => 'Pengabdian Hibah 2026']);
        $this->assertDatabaseCount('lpm_review_criteria', 4);
    }

    public function test_dosen_can_create_submit_and_admin_full_workflow(): void
    {
        $admin = $this->makeAdmin();
        $ketua = $this->makeDosen();
        $reviewerUser = $this->makeDosen();
        $program = $this->makeProgram();
        $this->addScheme($program);

        // Dosen melihat program yang terbuka & membuat proposal
        $this->actingAs($ketua)
            ->get(route('dosen.lpm.proposals.create'))
            ->assertOk();

        $this->actingAs($ketua)
            ->post(route('dosen.lpm.proposals.store'), [
                'program_id' => $program->id,
                'judul' => 'Digitalisasi UMKM Desa',
                'ringkasan' => 'Ringkasan.',
                'mitra' => 'Mitra A',
                'permasalahan' => 'Problem A',
                'solusi' => 'Solusi A',
                'metode' => 'Metode A',
                'jadwal' => [['kegiatan' => 'Kegiatan 1', 'bulan' => 'Juli']],
                'rab' => [['uraian' => 'ATK', 'harga_satuan' => 100000, 'jumlah' => 5]],
                'luaran_target' => [['jenis' => 'Artikel', 'keterangan' => '']],
                'members' => [],
            ])
            ->assertRedirect();

        $proposal = LpmProposal::where('judul', 'Digitalisasi UMKM Desa')->first();
        $this->assertNotNull($proposal);
        $this->assertEquals('draft', $proposal->status);

        // Upload dokumen lalu submit
        $this->actingAs($ketua)->postJson(route('dosen.lpm.proposals.documents.upload', $proposal->id), [
            'jenis' => 'Proposal PDF',
            'file' => UploadedFile::fake()->create('proposal.pdf', 10, 'application/pdf'),
        ])->assertSessionHas('success');

        $this->actingAs($ketua)->post(route('dosen.lpm.proposals.submit', $proposal->id))
            ->assertSessionHas('success');

        $proposal->refresh();
        $this->assertEquals('submitted', $proposal->status);

        // Admin: verifikasi administrasi -> lolos -> tugaskan reviewer
        $this->actingAs($admin)->post(route('admin.lpm.proposals.verify-approve', $proposal->id), ['catatan' => 'ok'])
            ->assertSessionHas('success');
        $proposal->refresh();
        $this->assertEquals('under_admin_review', $proposal->status);

        $this->actingAs($admin)->post(route('admin.lpm.proposals.verify-admin-approve', $proposal->id), ['catatan' => 'lolos'])
            ->assertSessionHas('success');
        $proposal->refresh();
        $this->assertEquals('admin_approved', $proposal->status);

        $this->actingAs($admin)->post(route('admin.lpm.proposals.assign-reviewers', $proposal->id), [
            'reviewers' => [$reviewerUser->id],
        ])->assertSessionHas('success');
        $proposal->refresh();
        $this->assertEquals('under_substance_review', $proposal->status);
        $this->assertDatabaseHas('lpm_reviews', ['proposal_id' => $proposal->id, 'reviewer_user_id' => $reviewerUser->id]);

        // Reviewer memberi penilaian (harus lolos skor >= 70)
        $review = LpmReview::where('proposal_id', $proposal->id)->first();
        $criteria = LpmReviewCriterion::where('scheme_id', $program->reviewScheme->id)->get();

        $this->actingAs($reviewerUser)->get(route('dosen.lpm.reviews.edit', $review->id))->assertOk();

        $scores = [];
        foreach ($criteria as $i => $c) {
            $scores[$c->id] = $i === 0 ? 80 : 75;
        }
        $this->actingAs($reviewerUser)->put(route('dosen.lpm.reviews.update', $review->id), [
            'scores' => $scores,
            'catatan' => 'Bagus',
        ])->assertSessionHas('success');

        $review->refresh();
        $this->assertEquals('submitted', $review->status);
        $this->assertGreaterThanOrEqual(70, $review->total_score);
        $this->assertEquals('lolos', $review->kesimpulan);

        // Admin: keputusan lulus -> dana -> kontrak -> mulai
        $this->actingAs($admin)->post(route('admin.lpm.proposals.decide-review', $proposal->id), ['keputusan' => 'passed', 'catatan' => 'ok'])
            ->assertSessionHas('success');
        $proposal->refresh();
        $this->assertEquals('passed', $proposal->status);

        $this->actingAs($admin)->post(route('admin.lpm.proposals.fund', $proposal->id))
            ->assertSessionHas('success');
        $proposal->refresh();
        $this->assertEquals('funded', $proposal->status);

        $this->actingAs($admin)->post(route('admin.lpm.proposals.contract', $proposal->id), [
            'nomor_kontrak' => '001/LPM/2026',
            'tanggal_mulai' => now()->toDateString(),
            'tanggal_selesai' => now()->addMonths(3)->toDateString(),
            'dana_disetujui' => 9000000,
            'kesepakatan' => 'Sesuai proposal',
        ])->assertSessionHas('success');
        $proposal->refresh();
        $this->assertEquals('contracted', $proposal->status);

        $this->actingAs($admin)->post(route('admin.lpm.proposals.start', $proposal->id))
            ->assertSessionHas('success');
        $proposal->refresh();
        $this->assertEquals('ongoing', $proposal->status);

        // Admin tampilkan detail
        $this->actingAs($admin)->get(route('admin.lpm.proposals.show', $proposal->id))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Admin/Lpm/Proposals/Show'));

        // Dosen detail
        $this->actingAs($ketua)->get(route('dosen.lpm.proposals.show', $proposal->id))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Dosen/Lpm/Show'));
    }

    public function test_reviewer_member_and_laporan_luaran_flow(): void
    {
        $admin = $this->makeAdmin();
        $ketua = $this->makeDosen();
        $anggota = $this->makeDosen();
        $program = $this->makeProgram();
        $this->addScheme($program);

        $proposal = LpmProposal::create([
            'program_id' => $program->id,
            'ketua_user_id' => $ketua->id,
            'judul' => 'Proposal Berjalan',
            'ringkasan' => 'Ringkasan.',
            'metode' => 'Metode.',
            'solusi' => 'Solusi.',
            'status' => 'ongoing',
            'versi' => 1,
            'created_by' => $ketua->id,
        ]);
        LpmProposalDocument::create([
            'proposal_id' => $proposal->id,
            'jenis' => 'Proposal',
            'nama_file' => 'p.pdf',
            'path' => 'lpm/documents/p.pdf',
            'uploaded_by' => $ketua->id,
        ]);

        // Dosen ketua melihat daftar & detail
        $this->actingAs($ketua)->get(route('dosen.lpm.proposals.index'))->assertOk();
        $this->actingAs($ketua)->get(route('dosen.lpm.proposals.show', $proposal->id))->assertOk();

        // Tarik review list utk reviewer kosong
        $this->actingAs($anggota)->get(route('dosen.lpm.reviews.index'))->assertOk();

        // Upload laporan akhir (ongoing -> tetap ongoing; hanya jenis akhir saat final_report yang maju)
        $this->actingAs($ketua)->post(route('dosen.lpm.proposals.reports.upload', $proposal->id), [
            'jenis' => 'kemajuan',
            'file' => UploadedFile::fake()->create('laporan.pdf', 10, 'application/pdf'),
        ])->assertSessionHas('success');

        // Admin validasi luaran dari anggota (tidak mengubah status krn bukan tahap validasi)
        // Proses: ubah ke final_report -> upload akhir -> validasi -> output_validation
        $proposal->update(['status' => 'final_report']);
        $this->actingAs($ketua)->post(route('dosen.lpm.proposals.reports.upload', $proposal->id), [
            'jenis' => 'akhir',
            'file' => UploadedFile::fake()->create('akhir.pdf', 10, 'application/pdf'),
        ])->assertSessionHas('success');

        $this->actingAs($ketua)->post(route('dosen.lpm.proposals.outputs.store', $proposal->id), [
            'jenis_luaran' => 'HKI',
            'judul' => 'Pendaftaran HKI Kabupaten',
            'deskripsi' => 'Pendaftaran HKI',
            'bukti' => UploadedFile::fake()->create('hki.pdf', 10, 'application/pdf'),
        ])->assertSessionHas('success');

        $output = $proposal->outputs()->first();
        $this->assertNotNull($output);

        $this->actingAs($admin)->post(route('admin.lpm.outputs.validate', $output->id), ['status' => 'valid', 'catatan' => 'ok'])
            ->assertSessionHas('success');

        $output->refresh();
        $this->assertEquals('valid', $output->status_validasi);
    }
}