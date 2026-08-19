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
        Schema::create('lms_courses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('jadwal_kuliah_id')->unique()->constrained('jadwal_kuliahs')->onDelete('cascade');
            $table->text('description')->nullable();
            $table->string('thumbnail')->nullable();
            $table->timestamps();
        });

        Schema::create('lms_chapters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lms_course_id')->constrained('lms_courses')->onDelete('cascade');
            $table->string('title');
            $table->integer('order')->default(0);
            $table->timestamps();
        });

        Schema::create('lms_materials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lms_chapter_id')->constrained('lms_chapters')->onDelete('cascade');
            $table->string('title');
            $table->enum('type', ['text', 'file', 'video'])->default('text');
            $table->longText('content')->nullable(); // For rich text
            $table->string('file_path')->nullable(); // For file/video uploads
            $table->integer('order')->default(0);
            $table->timestamps();
        });

        Schema::create('lms_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lms_chapter_id')->constrained('lms_chapters')->onDelete('cascade');
            $table->string('title');
            $table->longText('description')->nullable();
            $table->dateTime('deadline')->nullable();
            $table->string('file_path')->nullable(); // Attachment for the assignment (soal)
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lms_assignments');
        Schema::dropIfExists('lms_materials');
        Schema::dropIfExists('lms_chapters');
        Schema::dropIfExists('lms_courses');
    }
};
