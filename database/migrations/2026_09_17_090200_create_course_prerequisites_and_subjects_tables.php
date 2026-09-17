<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mata_kuliah_prasyarats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mata_kuliah_id')->constrained('mata_kuliahs')->cascadeOnDelete();
            $table->foreignId('prasyarat_mata_kuliah_id')->constrained('mata_kuliahs')->restrictOnDelete();
            $table->string('nilai_minimum', 5)->nullable();
            $table->string('keterangan')->nullable();
            $table->timestamps();
            $table->unique(['mata_kuliah_id', 'prasyarat_mata_kuliah_id'], 'unique_mk_prasyarat');
        });

        Schema::create('substansi_kuliahs', function (Blueprint $table) {
            $table->id();
            $table->string('code', 30)->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('mata_kuliah_substansi', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mata_kuliah_id')->constrained('mata_kuliahs')->cascadeOnDelete();
            $table->foreignId('substansi_kuliah_id')->constrained('substansi_kuliahs')->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['mata_kuliah_id', 'substansi_kuliah_id'], 'unique_mk_substansi');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mata_kuliah_substansi');
        Schema::dropIfExists('substansi_kuliahs');
        Schema::dropIfExists('mata_kuliah_prasyarats');
    }
};
