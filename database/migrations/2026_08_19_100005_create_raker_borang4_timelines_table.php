<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('raker_borang4_timelines', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('submission_id');
            $table->unsignedBigInteger('program_source_id')->nullable();
            $table->string('program_name');
            $table->text('jan')->nullable();
            $table->text('feb')->nullable();
            $table->text('mar')->nullable();
            $table->text('apr')->nullable();
            $table->text('may')->nullable();
            $table->text('jun')->nullable();
            $table->text('jul')->nullable();
            $table->text('aug')->nullable();
            $table->text('sep')->nullable();
            $table->text('oct')->nullable();
            $table->text('nov')->nullable();
            $table->text('dec')->nullable();
            $table->text('main_milestone')->nullable();
            $table->integer('order_index')->default(0);
            $table->timestamps();

            $table->foreign('submission_id')->references('id')->on('raker_submissions')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('raker_borang4_timelines');
    }
};