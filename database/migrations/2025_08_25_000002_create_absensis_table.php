<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('absensis', function (Blueprint $table) {
            $table->id();
            $table->foreignId('jadwal_kuliah_id')->constrained('jadwal_kuliahs')->onDelete('cascade');
            $table->foreignId('mahasiswa_id')->constrained('mahasiswas')->onDelete('cascade');
            $table->foreignId('periode_krs_id')->constrained('periode_krs')->onDelete('cascade');
            $table->date('tanggal');
            $table->time('jam_mulai');
            $table->time('jam_selesai');
            $table->enum('status', ['hadir', 'tidak_hadir', 'izin', 'sakit'])->default('tidak_hadir');
            $table->text('keterangan')->nullable();
            $table->foreignId('created_by')->constrained('users'); // Dosen yang input absensi
            $table->timestamps();
            
            // Unique constraint agar tidak duplikasi absensi untuk pertemuan yang sama
            $table->unique(['jadwal_kuliah_id', 'mahasiswa_id', 'tanggal']);
            
            // Index untuk performance
            $table->index(['jadwal_kuliah_id', 'tanggal']);
            $table->index(['mahasiswa_id', 'periode_krs_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('absensis');
    }
};
