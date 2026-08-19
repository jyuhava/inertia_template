<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('raker_borang2_new_programs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('submission_id');
            $table->string('program_name');
            $table->json('main_pillar')->nullable();
            $table->json('supporting_pillar')->nullable();
            $table->text('target_audience')->nullable();
            $table->text('main_output')->nullable();
            $table->text('success_indicator')->nullable();
            $table->json('pic_names')->nullable();
            $table->string('estimated_duration')->nullable();
            $table->integer('priority')->default(1);
            $table->integer('order_index')->default(0);
            $table->timestamps();

            $table->foreign('submission_id')->references('id')->on('raker_submissions')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('raker_borang2_new_programs');
    }
};