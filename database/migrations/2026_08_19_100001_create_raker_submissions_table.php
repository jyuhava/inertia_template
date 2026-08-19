<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('raker_submissions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('session_id');
            $table->unsignedBigInteger('user_id');
            $table->string('unit')->nullable();
            $table->string('jabatan')->nullable();
            $table->enum('status', ['draft', 'submitted'])->default('draft');
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();

            $table->foreign('session_id')->references('id')->on('raker_sessions')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->unique(['session_id', 'user_id']);
            $table->index(['session_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('raker_submissions');
    }
};