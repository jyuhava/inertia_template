<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('raker_borang6_budgets', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('submission_id');
            $table->unsignedBigInteger('program_source_id')->nullable();
            $table->string('program_name');
            $table->text('cost_component')->nullable();
            $table->decimal('volume', 10, 2)->nullable();
            $table->string('unit')->nullable();
            $table->unsignedBigInteger('unit_price')->nullable();
            $table->unsignedBigInteger('total_price')->nullable();
            $table->string('funding_source')->nullable();
            $table->integer('priority')->nullable();
            $table->text('notes')->nullable();
            $table->integer('order_index')->default(0);
            $table->timestamps();

            $table->foreign('submission_id')->references('id')->on('raker_submissions')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('raker_borang6_budgets');
    }
};