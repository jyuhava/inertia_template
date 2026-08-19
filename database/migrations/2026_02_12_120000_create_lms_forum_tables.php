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
        // Schema::create('lms_forums', function (Blueprint $table) {
        //     $table->id();
        //     $table->foreignId('lms_chapter_id')->constrained('lms_chapters')->onDelete('cascade');
        //     $table->string('title');
        //     $table->longText('description')->nullable();
        //     $table->boolean('is_active')->default(true);
        //     $table->integer('order')->default(0);
        //     $table->timestamps();
        // });

        // Schema::create('lms_forum_threads', function (Blueprint $table) {
        //     $table->id();
        //     $table->foreignId('lms_forum_id')->constrained('lms_forums')->onDelete('cascade');
        //     $table->foreignId('dosen_id')->nullable()->constrained('dosens')->nullOnDelete();
        //     $table->string('title');
        //     $table->longText('content');
        //     $table->boolean('is_pinned')->default(false);
        //     $table->boolean('is_locked')->default(false);
        //     $table->timestamp('last_activity_at')->nullable();
        //     $table->timestamps();
        // });

        Schema::create('lms_forum_replies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lms_forum_thread_id')->constrained('lms_forum_threads')->onDelete('cascade');
            $table->foreignId('dosen_id')->nullable()->constrained('dosens')->nullOnDelete();
            $table->longText('content');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lms_forum_replies');
        Schema::dropIfExists('lms_forum_threads');
        Schema::dropIfExists('lms_forums');
    }
};

