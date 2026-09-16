<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mahasiswa_orang_tuas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mahasiswa_id')->constrained('mahasiswas')->onDelete('cascade');
            $table->enum('jenis', ['ayah', 'ibu', 'wali']);
            $table->string('nama');
            $table->string('nik', 20)->nullable();
            $table->date('tanggal_lahir')->nullable();
            $table->string('pendidikan')->nullable();
            $table->string('pekerjaan')->nullable();
            $table->string('penghasilan')->nullable();
            $table->string('kebutuhan_khusus')->nullable();
            $table->string('no_hp', 20)->nullable();
            $table->string('email')->nullable();
            $table->text('alamat')->nullable();
            $table->timestamps();

            $table->unique(['mahasiswa_id', 'jenis']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mahasiswa_orang_tuas');
    }
};
