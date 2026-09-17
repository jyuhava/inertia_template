<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grade_scales', function (Blueprint $table) {
            $table->id();
            $table->string('code', 10)->unique();
            $table->string('name');
            $table->decimal('minimum_score', 5, 2);
            $table->decimal('maximum_score', 5, 2);
            $table->decimal('grade_point', 3, 2);
            $table->boolean('is_passing')->default(true);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('student_study_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mahasiswa_id')->constrained('mahasiswas')->restrictOnDelete();
            $table->foreignId('periode_krs_id')->constrained('periode_krs')->restrictOnDelete();
            $table->foreignId('kurikulum_id')->nullable()->constrained('kurikulums')->nullOnDelete();
            $table->enum('status', ['draft', 'processing', 'published', 'locked'])->default('draft');
            $table->unsignedSmallInteger('total_courses')->default(0);
            $table->decimal('total_credits', 6, 2)->default(0);
            $table->decimal('earned_credits', 6, 2)->default(0);
            $table->decimal('semester_gpa', 4, 2)->nullable();
            $table->decimal('cumulative_gpa', 4, 2)->nullable();
            $table->timestamp('published_at')->nullable();
            $table->foreignId('published_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('locked_at')->nullable();
            $table->timestamps();
            $table->unique(['mahasiswa_id', 'periode_krs_id']);
        });

        Schema::create('student_study_result_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('study_result_id')->constrained('student_study_results')->cascadeOnDelete();
            $table->foreignId('krs_id')->nullable()->constrained('krs')->nullOnDelete();
            $table->foreignId('registration_item_id')->nullable()->constrained('student_course_registration_items')->nullOnDelete();
            $table->foreignId('penilaian_id')->nullable()->constrained('penilaians')->nullOnDelete();
            $table->foreignId('mata_kuliah_id')->constrained('mata_kuliahs')->restrictOnDelete();
            $table->foreignId('kelas_kuliah_id')->nullable()->constrained('kelas_kuliahs')->nullOnDelete();
            $table->foreignId('jadwal_kuliah_id')->nullable()->constrained('jadwal_kuliahs')->nullOnDelete();
            $table->decimal('credits', 4, 2);
            $table->decimal('grade_numeric', 5, 2)->nullable();
            $table->string('grade', 10);
            $table->decimal('grade_point', 3, 2);
            $table->enum('status', ['published', 'locked'])->default('published');
            $table->timestamps();
            $table->unique(['study_result_id', 'penilaian_id']);
        });

        Schema::create('surveys', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('survey_type', 40)->default('academic_evaluation');
            $table->foreignId('periode_krs_id')->nullable()->constrained('periode_krs')->nullOnDelete();
            $table->timestamp('start_at')->nullable();
            $table->timestamp('end_at')->nullable();
            $table->boolean('is_required')->default(false);
            $table->enum('status', ['draft', 'published', 'closed', 'archived'])->default('draft');
            $table->timestamps();
        });
        Schema::create('survey_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('survey_id')->constrained()->cascadeOnDelete();
            $table->text('question');
            $table->string('question_type', 30);
            $table->boolean('is_required')->default(false);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->text('description')->nullable();
            $table->timestamps();
        });
        Schema::create('survey_question_options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('survey_question_id')->constrained()->cascadeOnDelete();
            $table->string('label');
            $table->string('value');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });
        Schema::create('survey_targets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('survey_id')->constrained()->cascadeOnDelete();
            $table->string('target_type', 30);
            $table->unsignedBigInteger('target_id')->nullable();
            $table->timestamps();
            $table->index(['survey_id', 'target_type', 'target_id']);
        });
        Schema::create('survey_responses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('survey_id')->constrained()->cascadeOnDelete();
            $table->foreignId('mahasiswa_id')->constrained('mahasiswas')->cascadeOnDelete();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();
            $table->unique(['survey_id', 'mahasiswa_id']);
        });
        Schema::create('survey_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('survey_response_id')->constrained()->cascadeOnDelete();
            $table->foreignId('survey_question_id')->constrained()->cascadeOnDelete();
            $table->text('answer')->nullable();
            $table->timestamps();
            $table->unique(['survey_response_id', 'survey_question_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('survey_answers');
        Schema::dropIfExists('survey_responses');
        Schema::dropIfExists('survey_targets');
        Schema::dropIfExists('survey_question_options');
        Schema::dropIfExists('survey_questions');
        Schema::dropIfExists('surveys');
        Schema::dropIfExists('student_study_result_items');
        Schema::dropIfExists('student_study_results');
        Schema::dropIfExists('grade_scales');
    }
};
