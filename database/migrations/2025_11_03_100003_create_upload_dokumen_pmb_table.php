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
        Schema::create('upload_dokumen_pmb', function (Blueprint $table) {
            $table->id();
            $table->foreignId('calon_mahasiswa_id')->constrained('calon_mahasiswas')->onDelete('cascade');
            $table->foreignId('dokumen_pmb_id')->constrained('dokumen_pmb')->onDelete('cascade');
            $table->string('file_path');
            $table->string('original_name');
            $table->integer('file_size');
            $table->enum('status_verifikasi', ['pending', 'approved', 'rejected'])->default('pending');
            $table->text('catatan_verifikasi')->nullable();
            $table->timestamp('tanggal_upload');
            $table->foreignId('verified_by')->nullable()->constrained('users');
            $table->timestamp('tanggal_verifikasi')->nullable();
            $table->timestamps();
            
            // Constraint untuk memastikan satu dokumen per calon mahasiswa
            $table->unique(['calon_mahasiswa_id', 'dokumen_pmb_id'], 'unique_dokumen_per_calon');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('upload_dokumen_pmb');
    }
};
