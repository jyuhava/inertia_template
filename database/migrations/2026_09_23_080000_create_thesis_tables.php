<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('thesis_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('prodi_id')->unique()->constrained()->cascadeOnDelete();
            $table->decimal('minimum_credits', 6, 2)->default(0);
            $table->decimal('minimum_gpa', 4, 2)->default(0);
            $table->unsignedSmallInteger('supervisor_capacity')->nullable();
            $table->timestamps();
        });

        Schema::create('thesis_types', function (Blueprint $table) {
            $table->id();
            $table->foreignId('prodi_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('mata_kuliah_id')->nullable()->constrained()->nullOnDelete();
            $table->string('code', 50);
            $table->string('name');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->unique(['prodi_id', 'code']);
        });

        Schema::create('theses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mahasiswa_id')->constrained()->restrictOnDelete();
            $table->foreignId('prodi_id')->constrained()->restrictOnDelete();
            $table->foreignId('semester_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('kurikulum_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('thesis_type_id')->constrained()->restrictOnDelete();
            $table->string('title')->nullable();
            $table->text('abstract')->nullable();
            $table->string('keywords')->nullable();
            $table->string('status', 40)->default('draft')->index();
            $table->string('final_grade', 10)->nullable();
            $table->decimal('final_grade_point', 4, 2)->nullable();
            $table->timestamp('grade_locked_at')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('finalized_at')->nullable();
            $table->timestamps();
            $table->index(['mahasiswa_id', 'status']);
        });

        Schema::create('thesis_title_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('thesis_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('version');
            $table->string('title');
            $table->json('alternate_titles')->nullable();
            $table->text('background')->nullable();
            $table->text('problem_statement')->nullable();
            $table->text('objective')->nullable();
            $table->string('topic')->nullable();
            $table->string('method')->nullable();
            $table->text('description')->nullable();
            $table->string('status', 30)->default('submitted');
            $table->text('review_comment')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
            $table->unique(['thesis_id', 'version']);
        });

        Schema::create('thesis_supervisors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('thesis_id')->constrained()->cascadeOnDelete();
            $table->foreignId('dosen_id')->constrained()->restrictOnDelete();
            $table->string('role', 20);
            $table->string('status', 20)->default('proposed');
            $table->timestamp('appointed_at')->nullable();
            $table->foreignId('appointed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('ended_at')->nullable();
            $table->timestamps();
            $table->index(['dosen_id', 'status']);
            $table->index(['thesis_id', 'role', 'status']);
        });

        Schema::create('thesis_supervision_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('thesis_id')->constrained()->cascadeOnDelete();
            $table->foreignId('thesis_supervisor_id')->constrained()->restrictOnDelete();
            $table->date('meeting_date');
            $table->string('topic');
            $table->text('discussion')->nullable();
            $table->text('student_notes')->nullable();
            $table->text('feedback')->nullable();
            $table->string('status', 20)->default('submitted');
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('thesis_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('thesis_id')->constrained()->cascadeOnDelete();
            $table->string('type', 40);
            $table->unsignedSmallInteger('version');
            $table->string('file_path');
            $table->string('original_name')->nullable();
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->unique(['thesis_id', 'type', 'version']);
        });

        Schema::create('thesis_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('thesis_id')->constrained()->cascadeOnDelete();
            $table->string('kind', 30);
            $table->timestamp('scheduled_at');
            $table->timestamp('ends_at')->nullable();
            $table->json('examiner_ids')->nullable();
            $table->string('status', 20)->default('scheduled');
            $table->text('notes')->nullable();
            $table->foreignId('scheduled_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index(['kind', 'scheduled_at']);
        });

        Schema::create('thesis_revisions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('thesis_id')->constrained()->cascadeOnDelete();
            $table->json('items');
            $table->string('status', 20)->default('submitted');
            $table->text('review_comment')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('thesis_audits', function (Blueprint $table) {
            $table->id();
            $table->nullableMorphs('auditable');
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('action', 50);
            $table->json('before')->nullable();
            $table->json('after')->nullable();
            $table->text('reason')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        foreach (['thesis_audits', 'thesis_revisions', 'thesis_events', 'thesis_documents', 'thesis_supervision_sessions', 'thesis_supervisors', 'thesis_title_submissions', 'theses', 'thesis_types', 'thesis_settings'] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
