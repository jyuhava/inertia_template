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
        Schema::create('penilaians', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mahasiswa_id')->constrained('mahasiswas')->onDelete('cascade');
            $table->foreignId('jadwal_kuliah_id')->constrained('jadwal_kuliahs')->onDelete('cascade');
            $table->foreignId('periode_krs_id')->constrained('periode_krs')->onDelete('cascade');
            $table->decimal('nilai_tugas', 5, 2)->nullable(); // 0-100
            $table->decimal('nilai_uts', 5, 2)->nullable(); // 0-100
            $table->decimal('nilai_uas', 5, 2)->nullable(); // 0-100
            $table->decimal('nilai_akhir', 5, 2)->nullable(); // 0-100
            $table->char('nilai_huruf', 2)->nullable(); // A, B+, B, C+, C, D, E
            $table->decimal('nilai_angka', 3, 2)->nullable(); // 4.00, 3.75, 3.00, etc
            $table->enum('status', ['draft', 'final'])->default('draft');
            $table->text('catatan')->nullable();
            $table->timestamps();
            
            // Unique constraint agar satu mahasiswa hanya punya satu nilai per mata kuliah per periode
            $table->unique(['mahasiswa_id', 'jadwal_kuliah_id', 'periode_krs_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('penilaians');
    }
};
