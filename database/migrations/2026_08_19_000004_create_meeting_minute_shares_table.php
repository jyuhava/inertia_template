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
        Schema::create('meeting_minute_shares', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('meeting_minute_id');
            $table->unsignedBigInteger('shared_by');
            $table->unsignedBigInteger('shared_to'); // user_id
            $table->timestamp('shared_at');
            $table->timestamp('viewed_at')->nullable();
            $table->text('message')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('meeting_minute_id')->references('id')->on('meeting_minutes')->onDelete('cascade');
            $table->foreign('shared_by')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('shared_to')->references('id')->on('users')->onDelete('cascade');
            $table->unique(['meeting_minute_id', 'shared_to'], 'unique_meeting_user_share');
            $table->index(['shared_to', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('meeting_minute_shares');
    }
};