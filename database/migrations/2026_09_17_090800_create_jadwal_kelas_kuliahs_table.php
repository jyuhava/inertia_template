<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Recurring weekly schedule for a kelas_kuliah. A class can have
     * multiple meetings per week (hasMany), and a schedule references the
     * class (which already carries the academic period), never the course
     * directly, and never a lecturer directly (that goes through
     * kelas_kuliah_pengajars).
     */
    public function up(): void
    {
        Schema::create('jadwal_kelas_kuliahs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kelas_kuliah_id')->constrained('kelas_kuliahs')->cascadeOnDelete();
            $table->enum('hari', ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']);
            $table->time('jam_mulai');
            $table->time('jam_selesai');
            $table->foreignId('ruangan_id')->nullable()->constrained('ruangans')->nullOnDelete();
            $table->enum('tipe_pertemuan', ['tatap_muka', 'daring', 'hybrid'])->default('tatap_muka');
            $table->enum('status', ['draft', 'dipublikasikan', 'dibatalkan'])->default('draft');
            $table->text('catatan')->nullable();
            $table->timestamps();

            $table->index(['hari', 'jam_mulai', 'jam_selesai']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('jadwal_kelas_kuliahs');
    }
};
