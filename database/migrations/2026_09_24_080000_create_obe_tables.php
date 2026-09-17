<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('obe_taxonomy_levels', function (Blueprint $table) {
            $table->id();
            $table->string('code', 30)->unique();
            $table->string('name');
            $table->string('category', 100)->nullable();
            $table->text('description')->nullable();
            $table->unsignedSmallInteger('sequence')->default(0);
            $table->string('status', 20)->default('aktif');
            $table->timestamps();
        });

        Schema::create('obe_cpl', function (Blueprint $table) {
            $table->id();
            $table->foreignId('prodi_id')->constrained('prodis')->restrictOnDelete();
            $table->foreignId('kurikulum_id')->constrained('kurikulums')->restrictOnDelete();
            $table->string('code', 50);
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('domain', 100)->nullable();
            $table->unsignedSmallInteger('sequence')->default(0);
            $table->string('status', 20)->default('aktif');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->unique(['kurikulum_id', 'code'], 'obe_cpl_kurikulum_code_unique');
        });

        Schema::create('obe_cpmk', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mata_kuliah_id')->constrained('mata_kuliahs')->restrictOnDelete();
            $table->foreignId('kurikulum_id')->constrained('kurikulums')->restrictOnDelete();
            $table->string('code', 50);
            $table->string('title');
            $table->text('description')->nullable();
            $table->foreignId('taxonomy_level_id')->nullable()->constrained('obe_taxonomy_levels')->nullOnDelete();
            $table->unsignedSmallInteger('sequence')->default(0);
            $table->string('status', 20)->default('aktif');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->unique(['mata_kuliah_id', 'kurikulum_id', 'code'], 'obe_cpmk_course_curriculum_code_unique');
        });

        Schema::create('obe_sub_cpmk', function (Blueprint $table) {
            $table->id();
            $table->foreignId('obe_cpmk_id')->constrained('obe_cpmk')->cascadeOnDelete();
            $table->string('code', 50);
            $table->string('title');
            $table->text('description')->nullable();
            $table->foreignId('taxonomy_level_id')->nullable()->constrained('obe_taxonomy_levels')->nullOnDelete();
            $table->unsignedSmallInteger('sequence')->default(0);
            $table->string('status', 20)->default('aktif');
            $table->timestamps();
            $table->unique(['obe_cpmk_id', 'code'], 'obe_sub_cpmk_parent_code_unique');
        });

        Schema::create('obe_cpl_course_mappings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cpl_id')->constrained('obe_cpl')->cascadeOnDelete();
            $table->foreignId('mata_kuliah_id')->constrained('mata_kuliahs')->restrictOnDelete();
            $table->foreignId('kurikulum_id')->constrained('kurikulums')->restrictOnDelete();
            $table->string('contribution_level', 50)->nullable();
            $table->decimal('weight', 7, 4)->default(1);
            $table->timestamps();
            $table->unique(['cpl_id', 'mata_kuliah_id', 'kurikulum_id'], 'obe_cpl_course_mapping_unique');
        });

        Schema::create('obe_cpmk_cpl_mappings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cpmk_id')->constrained('obe_cpmk')->cascadeOnDelete();
            $table->foreignId('cpl_id')->constrained('obe_cpl')->cascadeOnDelete();
            $table->decimal('weight', 7, 4)->default(1);
            $table->timestamps();
            $table->unique(['cpmk_id', 'cpl_id'], 'obe_cpmk_cpl_mapping_unique');
        });

        Schema::create('obe_assessments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mata_kuliah_id')->constrained('mata_kuliahs')->restrictOnDelete();
            $table->foreignId('kelas_kuliah_id')->nullable()->constrained('kelas_kuliahs')->nullOnDelete();
            $table->string('type', 50);
            $table->string('title');
            $table->text('description')->nullable();
            $table->decimal('max_score', 8, 2)->default(100);
            $table->decimal('weight', 7, 4)->default(1);
            $table->string('status', 20)->default('aktif');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('obe_assessment_mappings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assessment_id')->constrained('obe_assessments')->cascadeOnDelete();
            $table->foreignId('cpmk_id')->nullable()->constrained('obe_cpmk')->cascadeOnDelete();
            $table->foreignId('sub_cpmk_id')->nullable()->constrained('obe_sub_cpmk')->cascadeOnDelete();
            $table->decimal('weight', 7, 4)->default(1);
            $table->timestamps();
            $table->unique(['assessment_id', 'cpmk_id'], 'obe_assessment_cpmk_mapping_unique');
            $table->unique(['assessment_id', 'sub_cpmk_id'], 'obe_assessment_sub_cpmk_mapping_unique');
        });

        Schema::create('obe_assessment_scores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assessment_id')->constrained('obe_assessments')->cascadeOnDelete();
            $table->foreignId('mahasiswa_id')->constrained('mahasiswas')->restrictOnDelete();
            $table->foreignId('penilaian_id')->nullable()->constrained('penilaians')->nullOnDelete();
            $table->decimal('score', 8, 2)->nullable();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->unique(['assessment_id', 'mahasiswa_id'], 'obe_assessment_score_unique');
        });

        Schema::create('obe_audits', function (Blueprint $table) {
            $table->id();
            $table->nullableMorphs('auditable');
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action', 50);
            $table->json('before')->nullable();
            $table->json('after')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('obe_audits');
        Schema::dropIfExists('obe_assessment_scores');
        Schema::dropIfExists('obe_assessment_mappings');
        Schema::dropIfExists('obe_assessments');
        Schema::dropIfExists('obe_cpmk_cpl_mappings');
        Schema::dropIfExists('obe_cpl_course_mappings');
        Schema::dropIfExists('obe_sub_cpmk');
        Schema::dropIfExists('obe_cpmk');
        Schema::dropIfExists('obe_cpl');
        Schema::dropIfExists('obe_taxonomy_levels');
    }
};
