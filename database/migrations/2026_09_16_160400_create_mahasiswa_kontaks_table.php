<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mahasiswa_kontaks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mahasiswa_id')->constrained('mahasiswas')->onDelete('cascade');
            $table->enum('jenis', ['email', 'hp', 'telepon', 'whatsapp', 'darurat']);
            $table->string('nilai');
            $table->string('nama_kontak')->nullable(); // e.g. nama kontak darurat
            $table->boolean('is_primary')->default(false);
            $table->timestamps();

            $table->index(['mahasiswa_id', 'jenis']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mahasiswa_kontaks');
    }
};
