<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('course_meetings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kelas_kuliah_id')->constrained('kelas_kuliahs')->restrictOnDelete();
            $table->foreignId('jadwal_kelas_kuliah_id')->nullable()->constrained('jadwal_kelas_kuliahs')->nullOnDelete();
            $table->unsignedSmallInteger('meeting_number');
            $table->date('meeting_date');
            $table->time('start_time');
            $table->time('end_time');
            $table->string('topic')->nullable();
            $table->text('description')->nullable();
            $table->enum('status', ['scheduled', 'open', 'completed', 'cancelled'])->default('scheduled');
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->unique(['kelas_kuliah_id', 'meeting_number']);
        });
        Schema::table('absensis', function (Blueprint $table) {
            $table->foreignId('course_meeting_id')->nullable()->after('id')->constrained('course_meetings')->nullOnDelete();
            $table->foreignId('registration_item_id')->nullable()->after('mahasiswa_id')->constrained('student_course_registration_items')->nullOnDelete();
            $table->string('attendance_status', 20)->nullable()->after('status');
            $table->timestamp('check_in_at')->nullable();
            $table->timestamp('check_out_at')->nullable();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->index(['course_meeting_id', 'mahasiswa_id']);
        });
        Schema::create('attendance_audits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('absensi_id')->constrained('absensis')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action', 30);
            $table->json('before')->nullable();
            $table->json('after')->nullable();
            $table->text('reason')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_audits');
        Schema::table('absensis', function (Blueprint $table) {
            $table->dropConstrainedForeignId('recorded_by');
            $table->dropColumn(['check_in_at', 'check_out_at', 'attendance_status']);
            $table->dropConstrainedForeignId('registration_item_id');
            $table->dropConstrainedForeignId('course_meeting_id');
        });
        Schema::dropIfExists('course_meetings');
    }
};
