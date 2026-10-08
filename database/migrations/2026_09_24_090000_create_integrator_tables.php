<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabel pendukung modul Integrator:
 *  - integrator_sync_jobs / integrator_sync_job_items : job sinkronisasi
 *  - integrator_settings : konfigurasi backend, ciphertext password, cache
 *    dictionary, riwayat event koneksi (token hanya berada di cache backend)
 *
 * Mapping per entitas tetap memakai tabel lama:
 *  - pddikti_mahasiswa_mappings (mahasiswa)
 *  - pddikti_dosen_mappings (dosen)
 *  - pddikti_akademik_mappings (entity_type = FQCN model, polymorphic)
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('integrator_settings', function (Blueprint $table): void {
            $table->id();
            $table->string('key')->unique();
            $table->json('value')->nullable();
            $table->timestamps();
        });

        Schema::create('integrator_sync_jobs', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('entity', 40);
            $table->string('status', 20)->default('QUEUED'); // QUEUED|RUNNING|COMPLETED|PARTIAL|FAILED|CANCELLED
            $table->boolean('dry_run')->default(true);
            $table->unsignedBigInteger('period_id')->nullable();
            $table->string('period_label')->nullable();
            $table->unsignedBigInteger('prodi_id')->nullable();
            $table->string('prodi_label')->nullable();
            // Tabel users dibuat lebih dulu dan memakai id int signed, jadi
            // kolom ini harus int agar foreign key bisa dibuat (unsignedBigInteger
            // akan ditolak MySQL dengan errno 150).
            $table->integer('user_id')->nullable();
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
            $table->string('created_by_name');
            $table->unsignedInteger('total')->default(0);
            $table->unsignedInteger('processed')->default(0);
            $table->unsignedInteger('success')->default(0);
            $table->unsignedInteger('failed')->default(0);
            $table->unsignedInteger('skipped')->default(0);
            $table->unsignedInteger('invalid')->default(0);
            $table->boolean('cancel_requested')->default(false);
            $table->timestamp('started_at')->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['entity', 'status']);
            $table->index('created_at');
        });

        Schema::create('integrator_sync_job_items', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('job_id');
            $table->string('entity', 40);
            $table->string('local_id');
            $table->string('local_label')->nullable();
            $table->string('pddikti_id')->nullable();
            $table->string('act', 80);
            $table->string('action', 10); // INSERT|UPDATE|SKIP
            $table->string('status', 12)->default('PENDING'); // PENDING|RUNNING|SUCCESS|FAILED|SKIPPED|INVALID
            $table->unsignedSmallInteger('attempts')->default(0);
            $table->unsignedSmallInteger('max_attempts')->default(3);
            $table->text('message')->nullable();
            $table->string('error_category', 30)->nullable();
            $table->unsignedInteger('duration_ms')->nullable();
            $table->string('request_id')->nullable();
            $table->unsignedInteger('response_code')->nullable();
            // payload & response TANPA token (token disensor sebelum disimpan)
            $table->json('payload')->nullable();
            $table->json('response')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->timestamps();

            $table->foreign('job_id')->references('id')->on('integrator_sync_jobs')->cascadeOnDelete();
            $table->index(['job_id', 'status']);
            $table->index(['entity', 'local_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('integrator_sync_job_items');
        Schema::dropIfExists('integrator_sync_jobs');
        Schema::dropIfExists('integrator_settings');
    }
};
