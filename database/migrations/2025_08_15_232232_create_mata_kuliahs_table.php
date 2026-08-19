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
        Schema::create('mata_kuliahs', function (Blueprint $table) {
            $table->id();
            $table->string('kode_mata_kuliah')->unique(); // e.g., "TI101"
            $table->string('nama_mata_kuliah');
            $table->integer('sks'); // Satuan Kredit Semester
            $table->integer('semester'); // Semester berapa mata kuliah ini
            $table->foreignId('prodi_id')->constrained('prodis')->onDelete('restrict');
            $table->enum('jenis', ['Wajib', 'Pilihan'])->default('Wajib');
            $table->text('deskripsi')->nullable();
            $table->enum('status', ['aktif', 'nonaktif'])->default('aktif');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mata_kuliahs');
    }
};
