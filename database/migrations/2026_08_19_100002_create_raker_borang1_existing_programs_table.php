<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('raker_borang1_existing_programs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('submission_id');
            $table->string('program_name');
            $table->string('unit')->nullable();
            $table->json('pic_names')->nullable();
            $table->json('pillars')->nullable();
            $table->text('description')->nullable();
            $table->enum('policy_alignment', ['Sangat Sesuai', 'Cukup Sesuai', 'Perlu Penyesuaian'])->default('Sangat Sesuai');
            $table->text('improvement_notes')->nullable();
            $table->integer('order_index')->default(0);
            $table->timestamps();

            $table->foreign('submission_id')->references('id')->on('raker_submissions')->onDelete('cascade');
            $table->index(['submission_id', 'order_index']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('raker_borang1_existing_programs');
    }
};