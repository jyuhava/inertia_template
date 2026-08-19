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
        Schema::create('krs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mahasiswa_id')->constrained('mahasiswas')->onDelete('cascade');
            $table->foreignId('jadwal_kuliah_id')->constrained('jadwal_kuliahs')->onDelete('cascade');
            $table->foreignId('periode_krs_id')->constrained('periode_krs')->onDelete('cascade');
            $table->enum('status', ['diambil', 'dibatalkan'])->default('diambil');
            $table->timestamps();
            
            // Unique constraint agar mahasiswa tidak bisa mengambil mata kuliah yang sama dalam periode yang sama
            $table->unique(['mahasiswa_id', 'jadwal_kuliah_id', 'periode_krs_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('krs');
    }
};
