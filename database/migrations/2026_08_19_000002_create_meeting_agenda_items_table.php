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
        Schema::create('meeting_agenda_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('meeting_minute_id');
            $table->integer('item_number');
            $table->text('discussion');
            $table->text('decision');
            $table->json('pic'); // Array of employee IDs (Person In Charge)
            $table->date('deadline');
            $table->enum('status', ['pending', 'in_progress', 'completed', 'overdue'])->default('pending');
            $table->integer('progress_percentage')->default(0);
            $table->text('progress_notes')->nullable();
            $table->timestamp('last_updated_at')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();

            $table->foreign('meeting_minute_id')->references('id')->on('meeting_minutes')->onDelete('cascade');
            $table->foreign('updated_by')->references('id')->on('users')->onDelete('set null');
            $table->index(['meeting_minute_id', 'item_number']);
            $table->index(['meeting_minute_id', 'progress_percentage']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('meeting_agenda_items');
    }
};