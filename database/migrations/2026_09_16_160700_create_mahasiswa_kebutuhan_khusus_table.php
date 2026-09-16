<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * One row per kebutuhan khusus so a student can have more than one.
     */
    public function up(): void
    {
        Schema::create('mahasiswa_kebutuhan_khusus', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mahasiswa_id')->constrained('mahasiswas')->onDelete('cascade');
            $table->enum('jenis_kebutuhan', [
                'tuna_netra',
                'tuna_rungu',
                'tuna_daksa',
                'tuna_grahita',
                'kesulitan_belajar_spesifik',
                'autis',
                'lainnya',
            ]);
            $table->text('keterangan')->nullable();
            $table->timestamps();

            $table->unique(['mahasiswa_id', 'jenis_kebutuhan']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mahasiswa_kebutuhan_khusus');
    }
};
