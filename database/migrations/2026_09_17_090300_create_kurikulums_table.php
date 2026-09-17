<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Curriculum is version-aware: one prodi can have many curriculums over
     * time, anchored to academic periods (semesters) rather than a bare year.
     */
    public function up(): void
    {
        Schema::create('kurikulums', function (Blueprint $table) {
            $table->id();
            $table->string('kode', 30)->unique();
            $table->string('nama');
            $table->text('deskripsi')->nullable();
            $table->foreignId('prodi_id')->constrained('prodis')->restrictOnDelete();
            $table->foreignId('semester_mulai_id')->constrained('semesters')->restrictOnDelete();
            $table->foreignId('semester_selesai_id')->nullable()->constrained('semesters')->nullOnDelete();
            $table->decimal('total_sks_wajib', 6, 2)->default(0);
            $table->enum('status', ['draft', 'aktif', 'arsip'])->default('draft');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kurikulums');
    }
};
