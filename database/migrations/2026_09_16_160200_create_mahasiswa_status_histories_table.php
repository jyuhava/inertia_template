<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mahasiswa_status_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mahasiswa_id')->constrained('mahasiswas')->onDelete('cascade');
            $table->enum('status', [
                'aktif',
                'cuti',
                'nonaktif',
                'lulus',
                'dropout',
                'mengundurkan_diri',
                'pindah',
                'dikeluarkan',
            ]);
            $table->date('tanggal_berlaku');
            $table->foreignId('tahun_ajaran_id')->nullable()->constrained('tahun_ajarans')->onDelete('set null');
            $table->string('alasan')->nullable();
            $table->text('keterangan')->nullable();
            $table->string('dokumen_pendukung')->nullable();
            $table->foreignId('changed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            $table->index(['mahasiswa_id', 'tanggal_berlaku']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mahasiswa_status_histories');
    }
};
