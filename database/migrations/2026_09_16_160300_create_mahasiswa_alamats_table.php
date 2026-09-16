<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mahasiswa_alamats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mahasiswa_id')->constrained('mahasiswas')->onDelete('cascade');
            $table->enum('jenis', ['ktp', 'domisili']);
            $table->string('jalan')->nullable();
            $table->string('dusun')->nullable();
            $table->string('rt', 5)->nullable();
            $table->string('rw', 5)->nullable();
            $table->string('kelurahan')->nullable();
            $table->string('kecamatan')->nullable();
            $table->string('kabupaten_kota')->nullable();
            $table->string('provinsi')->nullable();
            $table->string('kode_pos', 10)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['mahasiswa_id', 'jenis']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mahasiswa_alamats');
    }
};
