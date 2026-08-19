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
        Schema::create('periode_pmb', function (Blueprint $table) {
            $table->id();
            $table->string('nama_periode');
            $table->string('tahun_akademik'); // e.g., "2025/2026"
            $table->date('tanggal_buka');
            $table->date('tanggal_tutup');
            $table->decimal('biaya_pendaftaran', 10, 0)->default(100000);
            $table->integer('kuota_total')->default(100);
            $table->text('persyaratan')->nullable();
            $table->text('keterangan')->nullable();
            $table->enum('status', ['aktif', 'nonaktif', 'selesai'])->default('nonaktif');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('periode_pmb');
    }
};
