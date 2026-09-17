<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Master-level equivalence relationship for curriculum changes
     * (MK Lama -> MK Baru). Grade conversion/KHS logic is out of scope here.
     */
    public function up(): void
    {
        Schema::create('mata_kuliah_ekuivalensis', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mata_kuliah_lama_id')->constrained('mata_kuliahs')->cascadeOnDelete();
            $table->foreignId('mata_kuliah_baru_id')->constrained('mata_kuliahs')->cascadeOnDelete();
            $table->foreignId('kurikulum_id')->nullable()->constrained('kurikulums')->nullOnDelete();
            $table->text('keterangan')->nullable();
            $table->timestamps();

            $table->unique(['mata_kuliah_lama_id', 'mata_kuliah_baru_id', 'kurikulum_id'], 'unique_mk_ekuivalensi');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mata_kuliah_ekuivalensis');
    }
};
