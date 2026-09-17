<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Kelas kuliah: the bridge between a master course and a schedule for a
     * concrete academic period (Semester, the existing academic-period
     * entity). Kept independent from the legacy `jadwal_kuliahs` table so
     * KRS/Penilaian/Absensi/LMS — which key off `jadwal_kuliahs` — are
     * untouched; this is the new foundation for future enrollment work.
     */
    public function up(): void
    {
        Schema::create('kelas_kuliahs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mata_kuliah_id')->constrained('mata_kuliahs')->restrictOnDelete();
            $table->foreignId('kurikulum_id')->nullable()->constrained('kurikulums')->nullOnDelete();
            $table->foreignId('semester_id')->constrained('semesters')->restrictOnDelete();
            $table->string('kode_kelas', 20);
            $table->string('nama_kelas')->nullable();
            $table->unsignedInteger('kapasitas')->default(40);
            $table->enum('tipe_kelas', ['reguler', 'paralel', 'praktikum', 'daring', 'blended'])->default('reguler');
            $table->enum('status', ['draft', 'dibuka', 'ditutup', 'dibatalkan'])->default('draft');
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['mata_kuliah_id', 'semester_id', 'kode_kelas'], 'unique_kelas_kuliah');
        });

        Schema::create('kelas_kuliah_pengajars', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kelas_kuliah_id')->constrained('kelas_kuliahs')->cascadeOnDelete();
            $table->foreignId('dosen_id')->constrained('dosens')->restrictOnDelete();
            $table->enum('peran', ['utama', 'pendamping', 'asisten'])->default('utama');
            $table->enum('status', ['aktif', 'nonaktif'])->default('aktif');
            $table->timestamps();

            $table->unique(['kelas_kuliah_id', 'dosen_id'], 'unique_kelas_pengajar');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kelas_kuliah_pengajars');
        Schema::dropIfExists('kelas_kuliahs');
    }
};
