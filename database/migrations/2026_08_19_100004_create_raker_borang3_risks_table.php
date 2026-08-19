<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('raker_borang3_risks', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('submission_id');
            $table->enum('program_source_type', ['existing', 'new'])->nullable();
            $table->unsignedBigInteger('program_source_id')->nullable();
            $table->string('program_name');
            $table->text('main_risk')->nullable();
            $table->text('cause')->nullable();
            $table->text('impact')->nullable();
            $table->enum('risk_level', ['Tinggi', 'Sedang', 'Rendah'])->default('Sedang');
            $table->text('mitigation_strategy')->nullable();
            $table->json('pic_names')->nullable();
            $table->text('additional_notes')->nullable();
            $table->integer('order_index')->default(0);
            $table->timestamps();

            $table->foreign('submission_id')->references('id')->on('raker_submissions')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('raker_borang3_risks');
    }
};