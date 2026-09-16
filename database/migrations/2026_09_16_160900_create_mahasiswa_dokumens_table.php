<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mahasiswa_dokumens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mahasiswa_id')->constrained('mahasiswas')->onDelete('cascade');
            $table->enum('jenis_dokumen', [
                'ktp',
                'kk',
                'ijazah',
                'skl',
                'akta_kelahiran',
                'pas_foto',
                'kartu_kip',
                'dokumen_transfer',
                'surat_pernyataan',
                'lainnya',
            ]);
            $table->string('nomor_dokumen')->nullable();
            $table->string('file_path');
            $table->string('original_name')->nullable();
            $table->date('tanggal_terbit')->nullable();
            $table->date('tanggal_kedaluwarsa')->nullable();
            $table->enum('status_verifikasi', ['pending', 'approved', 'rejected'])->default('pending');
            $table->foreignId('verified_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();

            $table->index(['mahasiswa_id', 'jenis_dokumen']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mahasiswa_dokumens');
    }
};
