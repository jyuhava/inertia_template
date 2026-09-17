<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mahasiswa_beasiswas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mahasiswa_id')->constrained('mahasiswas')->onDelete('cascade');
            $table->enum('jenis_bantuan', [
                'kip_kuliah',
                'beasiswa_internal',
                'beasiswa_eksternal',
                'bantuan_pemerintah',
                'lainnya',
            ]);
            $table->string('nama_bantuan')->nullable();
            $table->string('nomor_bantuan')->nullable();
            $table->date('tanggal_mulai')->nullable();
            $table->date('tanggal_selesai')->nullable();
            $table->enum('status', ['aktif', 'selesai', 'dibatalkan'])->default('aktif');
            $table->text('keterangan')->nullable();
            $table->timestamps();

            $table->index('mahasiswa_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mahasiswa_beasiswas');
    }
};
