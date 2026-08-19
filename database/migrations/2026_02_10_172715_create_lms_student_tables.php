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
        Schema::create('lms_material_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mahasiswa_id')->constrained('mahasiswas')->onDelete('cascade');
            $table->foreignId('lms_material_id')->constrained('lms_materials')->onDelete('cascade');
            $table->boolean('is_completed')->default(false);
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            
            // Prevent duplicate progress records
            $table->unique(['mahasiswa_id', 'lms_material_id']);
        });

        Schema::create('lms_assignment_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mahasiswa_id')->constrained('mahasiswas')->onDelete('cascade');
            $table->foreignId('lms_assignment_id')->constrained('lms_assignments')->onDelete('cascade');
            $table->string('file_path');
            $table->text('notes')->nullable();
            $table->float('grade')->nullable(); // Nilai dari dosen
            $table->text('feedback')->nullable(); // Masukan dari dosen
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lms_assignment_submissions');
        Schema::dropIfExists('lms_material_progress');
    }
};
