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
        Schema::create('dokumen_pmb', function (Blueprint $table) {
            $table->id();
            $table->string('nama_dokumen');
            $table->string('kode_dokumen')->unique();
            $table->text('deskripsi')->nullable();
            $table->enum('jenis_file', ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'])->default('pdf')->change();
            $table->integer('max_size_kb')->default(2048); // 2MB default
            $table->boolean('wajib')->default(true);
            $table->boolean('aktif')->default(true);
            $table->integer('urutan')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dokumen_pmb');
    }
};
