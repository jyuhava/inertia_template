<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mbkm_participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mbkm_application_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('mahasiswa_id')->constrained()->restrictOnDelete();
            $table->string('status')->default('accepted');
            $table->date('accepted_at')->nullable();
            $table->timestamps();
        });
        Schema::create('mbkm_placements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mbkm_participant_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('mbkm_partner_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->string('status')->default('planned');
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
        });
        Schema::create('mbkm_supervisors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mbkm_placement_id')->constrained()->cascadeOnDelete();
            $table->foreignId('dosen_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name')->nullable();
            $table->string('email')->nullable();
            $table->string('role')->default('academic');
            $table->timestamps();
            $table->unique(['mbkm_placement_id', 'dosen_id', 'role']);
        });
        Schema::create('mbkm_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mbkm_placement_id')->constrained()->cascadeOnDelete();
            $table->date('activity_date');
            $table->string('title');
            $table->text('description')->nullable();
            $table->decimal('hours', 5, 2)->default(0);
            $table->string('status')->default('draft');
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
        });
        Schema::create('mbkm_logbooks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mbkm_placement_id')->constrained()->cascadeOnDelete();
            $table->foreignId('mbkm_activity_id')->nullable()->constrained()->nullOnDelete();
            $table->date('entry_date');
            $table->text('content');
            $table->decimal('hours', 5, 2)->default(0);
            $table->string('status')->default('submitted');
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('review_note')->nullable();
            $table->timestamps();
        });
        Schema::create('mbkm_attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mbkm_placement_id')->constrained()->cascadeOnDelete();
            $table->date('attendance_date');
            $table->string('status');
            $table->timestamp('check_in_at')->nullable();
            $table->timestamp('check_out_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->unique(['mbkm_placement_id', 'attendance_date']);
        });
        Schema::create('mbkm_assessments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mbkm_placement_id')->constrained()->cascadeOnDelete();
            $table->foreignId('dosen_id')->nullable()->constrained()->nullOnDelete();
            $table->string('assessment_type');
            $table->decimal('score', 5, 2)->nullable();
            $table->string('grade')->nullable();
            $table->text('feedback')->nullable();
            $table->string('status')->default('draft');
            $table->timestamps();
        });
        Schema::create('mbkm_recognitions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mbkm_participant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('mata_kuliah_id')->constrained()->restrictOnDelete();
            $table->foreignId('krs_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('study_result_id')->nullable()->constrained('student_study_results')->nullOnDelete();
            $table->decimal('recognized_credits', 5, 2);
            $table->decimal('score', 5, 2)->nullable();
            $table->string('grade')->nullable();
            $table->string('status')->default('draft');
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
            $table->unique(['mbkm_participant_id', 'mata_kuliah_id']);
        });
    }

    public function down(): void
    {
        foreach (['mbkm_recognitions', 'mbkm_assessments', 'mbkm_attendances', 'mbkm_logbooks', 'mbkm_activities', 'mbkm_supervisors', 'mbkm_placements', 'mbkm_participants'] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
