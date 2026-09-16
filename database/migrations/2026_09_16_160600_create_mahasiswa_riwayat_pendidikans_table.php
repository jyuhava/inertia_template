<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mahasiswa_riwayat_pendidikans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mahasiswa_id')->constrained('mahasiswas')->onDelete('cascade');
            $table->enum('jenjang_pendidikan', ['SMA', 'SMK', 'MA', 'D1', 'D2', 'D3', 'lainnya']);
            $table->string('nama_institusi');
            $table->string('npsn', 20)->nullable();
            $table->string('program_jurusan')->nullable();
            $table->date('tanggal_mulai')->nullable();
            $table->date('tanggal_selesai')->nullable();
            $table->date('tanggal_lulus')->nullable();
            $table->string('nomor_ijazah')->nullable();
            $table->string('nisn', 20)->nullable();
            $table->timestamps();

            $table->index('mahasiswa_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mahasiswa_riwayat_pendidikans');
    }
};
