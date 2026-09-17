<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * KRS header (student_course_registrations) + detail
     * (student_course_registration_items). Enrollment is deliberately
     * Mahasiswa -> KRS -> Kelas Kuliah -> Mata Kuliah, never a direct
     * Mahasiswa -> MataKuliah link. Curriculum context is stored on the
     * header (per registration, not per item) because a student's
     * curriculum does not change per course within the same KRS; items
     * still keep an optional curriculum_mata_kuliah_id snapshot in case a
     * course maps differently across concurrently-active curriculums.
     *
     * This is entirely new — the legacy `krs` + `jadwal_kuliahs` flow used
     * by Penilaian/Absensi/LMS is untouched.
     */
    public function up(): void
    {
        Schema::create('student_course_registrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mahasiswa_id')->constrained('mahasiswas')->restrictOnDelete();
            $table->foreignId('periode_krs_id')->constrained('periode_krs')->restrictOnDelete();
            $table->foreignId('kurikulum_id')->nullable()->constrained('kurikulums')->nullOnDelete();
            $table->enum('status', ['draft', 'submitted', 'revision', 'approved', 'rejected', 'locked', 'cancelled'])->default('draft');
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('rejected_at')->nullable();
            $table->foreignId('rejected_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('rejection_reason')->nullable();
            $table->timestamp('locked_at')->nullable();
            $table->timestamps();

            $table->unique(['mahasiswa_id', 'periode_krs_id'], 'unique_student_registration_per_period');
        });

        Schema::create('student_course_registration_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('registration_id')->constrained('student_course_registrations')->cascadeOnDelete();
            $table->foreignId('kelas_kuliah_id')->constrained('kelas_kuliahs')->restrictOnDelete();
            $table->foreignId('mata_kuliah_id')->constrained('mata_kuliahs')->restrictOnDelete();
            $table->foreignId('kurikulum_mata_kuliah_id')->nullable()->constrained('kurikulum_mata_kuliahs')->nullOnDelete();
            $table->decimal('sks_snapshot', 4, 2);
            $table->enum('status', ['active', 'cancelled'])->default('active');
            $table->timestamps();

            // A cancelled item does not block re-adding the same class, so
            // the unique constraint only applies while status = active
            // (enforced at the application layer; SQLite/MySQL partial
            // unique indexes are not consistently available here).
            $table->index(['registration_id', 'kelas_kuliah_id', 'status'], 'idx_registration_item_lookup');
        });

        Schema::create('student_course_registration_audits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('registration_id')->constrained('student_course_registrations')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action', 40);
            $table->json('before')->nullable();
            $table->json('after')->nullable();
            $table->text('reason')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_course_registration_audits');
        Schema::dropIfExists('student_course_registration_items');
        Schema::dropIfExists('student_course_registrations');
    }
};
