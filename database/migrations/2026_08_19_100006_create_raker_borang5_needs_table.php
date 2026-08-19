<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('raker_borang5_needs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('submission_id');
            $table->unsignedBigInteger('program_source_id')->nullable();
            $table->string('program_name');
            $table->enum('need_type', ['Sarana', 'Prasarana', 'SDM'])->nullable();
            $table->text('need_details')->nullable();
            $table->text('main_specifications')->nullable();
            $table->string('quantity')->nullable();
            $table->enum('status', ['Ada', 'Belum Ada'])->nullable();
            $table->json('pic_names')->nullable();
            $table->text('notes')->nullable();
            $table->integer('order_index')->default(0);
            $table->timestamps();

            $table->foreign('submission_id')->references('id')->on('raker_submissions')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('raker_borang5_needs');
    }
};