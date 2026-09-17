<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * "Mata kuliah X menjadi bagian dari Kurikulum Y" — deliberately kept
     * separate from both `kurikulums` and `mata_kuliahs` so overrides
     * (credits, minimum grade, semester placement) are per-curriculum.
     */
    public function up(): void
    {
        Schema::create('kurikulum_mata_kuliahs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kurikulum_id')->constrained('kurikulums')->cascadeOnDelete();
            $table->foreignId('mata_kuliah_id')->constrained('mata_kuliahs')->restrictOnDelete();
            $table->unsignedTinyInteger('semester');
            $table->foreignId('kelompok_mata_kuliah_id')->nullable()->constrained('kelompok_mata_kuliahs')->nullOnDelete();
            $table->boolean('is_wajib')->default(true);
            $table->decimal('sks_override', 4, 2)->nullable();
            $table->decimal('sks_teori_override', 4, 2)->nullable();
            $table->decimal('sks_praktik_override', 4, 2)->nullable();
            $table->decimal('sks_lapangan_override', 4, 2)->nullable();
            $table->string('nilai_minimum', 5)->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['kurikulum_id', 'mata_kuliah_id'], 'unique_kurikulum_mk');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kurikulum_mata_kuliahs');
    }
};
