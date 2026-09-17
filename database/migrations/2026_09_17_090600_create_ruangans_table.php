<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * No existing room master was found in the repository (jadwal_kuliahs
     * stores `ruangan` as a free-text string). This is the first master
     * room table, used by the new schedule foundation.
     */
    public function up(): void
    {
        Schema::create('ruangans', function (Blueprint $table) {
            $table->id();
            $table->string('kode', 30)->unique();
            $table->string('nama');
            $table->string('gedung', 100)->nullable();
            $table->string('lantai', 20)->nullable();
            $table->unsignedInteger('kapasitas')->default(0);
            $table->enum('tipe', ['kelas', 'laboratorium', 'auditorium', 'online'])->default('kelas');
            $table->enum('status', ['aktif', 'nonaktif'])->default('aktif');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ruangans');
    }
};
