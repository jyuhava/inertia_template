<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lpm_programs', function (Blueprint $table) {
            $table->id();
            $table->string('nama_program');
            $table->string('skema');
            $table->string('tahun_anggaran', 10)->nullable();
            $table->date('tanggal_buka');
            $table->date('tanggal_tutup');
            $table->decimal('pagu_dana', 15, 2)->default(0);
            $table->decimal('maksimal_dana', 15, 2)->default(0);
            $table->string('sumber_dana')->nullable();
            $table->text('persyaratan')->nullable();
            $table->string('template_proposal')->nullable();
            $table->enum('status', ['draft', 'aktif', 'ditutup', 'selesai'])->default('draft');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('lpm_review_schemes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('program_id')->constrained('lpm_programs')->cascadeOnDelete();
            $table->string('nama');
            $table->integer('minimum_score')->default(70);
            $table->integer('reviewer_count')->default(2);
            $table->boolean('aktif')->default(true);
            $table->timestamps();
        });

        Schema::create('lpm_review_criteria', function (Blueprint $table) {
            $table->id();
            $table->foreignId('scheme_id')->constrained('lpm_review_schemes')->cascadeOnDelete();
            $table->string('nama_kriteria');
            $table->unsignedInteger('bobot');
            $table->integer('urutan')->default(0);
            $table->timestamps();
        });

        Schema::create('lpm_proposals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('program_id')->constrained('lpm_programs')->restrictOnDelete();
            $table->foreignId('ketua_user_id')->constrained('users')->restrictOnDelete();
            $table->string('judul');
            $table->text('ringkasan')->nullable();
            $table->text('mitra')->nullable();
            $table->text('permasalahan')->nullable();
            $table->text('solusi')->nullable();
            $table->text('metode')->nullable();
            $table->json('jadwal')->nullable();
            $table->json('rab')->nullable();
            $table->json('luaran_target')->nullable();
            $table->string('status')->default('draft');
            $table->unsignedInteger('versi')->default(1);
            $table->text('alasan_verifikasi')->nullable();
            $table->timestamp('tanggal_submit')->nullable();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->index(['program_id', 'status']);
        });

        Schema::create('lpm_proposal_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('proposal_id')->constrained('lpm_proposals')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->enum('peran', ['ketua', 'anggota', 'mahasiswa']);
            $table->enum('status_persetujuan', ['menunggu', 'menyetujui', 'menolak'])->default('menunggu');
            $table->timestamps();
            $table->unique(['proposal_id', 'user_id']);
        });

        Schema::create('lpm_proposal_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('proposal_id')->constrained('lpm_proposals')->cascadeOnDelete();
            $table->string('jenis');
            $table->string('nama_file');
            $table->string('path');
            $table->foreignId('uploaded_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
        });

        Schema::create('lpm_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('proposal_id')->constrained('lpm_proposals')->cascadeOnDelete();
            $table->foreignId('reviewer_user_id')->constrained('users')->cascadeOnDelete();
            $table->json('scores')->nullable();
            $table->decimal('total_score', 5, 2)->nullable();
            $table->enum('kesimpulan', ['lolos', 'gagal'])->nullable();
            $table->text('catatan')->nullable();
            $table->enum('status', ['draft', 'submitted'])->default('draft');
            $table->timestamps();
            $table->unique(['proposal_id', 'reviewer_user_id']);
        });

        Schema::create('lpm_contracts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('proposal_id')->constrained('lpm_proposals')->cascadeOnDelete();
            $table->string('nomor_kontrak')->nullable();
            $table->date('tanggal_mulai');
            $table->date('tanggal_selesai');
            $table->decimal('dana_disetujui', 15, 2)->default(0);
            $table->string('file_kontrak')->nullable();
            $table->text('kesepakatan')->nullable();
            $table->foreignId('disetujui_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('lpm_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('proposal_id')->constrained('lpm_proposals')->cascadeOnDelete();
            $table->string('nama_kegiatan');
            $table->date('tanggal')->nullable();
            $table->text('deskripsi')->nullable();
            $table->string('dokumentasi')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('lpm_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('proposal_id')->constrained('lpm_proposals')->cascadeOnDelete();
            $table->enum('jenis', ['kemajuan', 'akhir']);
            $table->string('file_path');
            $table->text('catatan')->nullable();
            $table->enum('status_validasi', ['menunggu', 'valid', 'ditolak'])->default('menunggu');
            $table->text('catatan_validasi')->nullable();
            $table->timestamp('tanggal_verifikasi')->nullable();
            $table->foreignId('diverifikasi_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('uploaded_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
        });

        Schema::create('lpm_outputs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('proposal_id')->constrained('lpm_proposals')->cascadeOnDelete();
            $table->string('jenis_luaran');
            $table->string('judul');
            $table->text('deskripsi')->nullable();
            $table->string('bukti_path')->nullable();
            $table->enum('status_validasi', ['menunggu', 'valid', 'ditolak'])->default('menunggu');
            $table->text('catatan_validasi')->nullable();
            $table->timestamp('tanggal_verifikasi')->nullable();
            $table->foreignId('diverifikasi_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lpm_outputs');
        Schema::dropIfExists('lpm_reports');
        Schema::dropIfExists('lpm_activities');
        Schema::dropIfExists('lpm_contracts');
        Schema::dropIfExists('lpm_reviews');
        Schema::dropIfExists('lpm_proposal_documents');
        Schema::dropIfExists('lpm_proposal_members');
        Schema::dropIfExists('lpm_proposals');
        Schema::dropIfExists('lpm_review_criteria');
        Schema::dropIfExists('lpm_review_schemes');
        Schema::dropIfExists('lpm_programs');
    }
};