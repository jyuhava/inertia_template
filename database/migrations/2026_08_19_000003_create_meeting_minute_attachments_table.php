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
        Schema::create('meeting_minute_attachments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('meeting_minute_id');
            $table->unsignedBigInteger('meeting_agenda_item_id')->nullable(); // attachment per agenda item
            $table->unsignedBigInteger('uploaded_by');
            $table->string('original_name');
            $table->string('file_name');
            $table->string('file_path');
            $table->string('file_type'); // image, document, spreadsheet, pdf
            $table->string('mime_type');
            $table->bigInteger('file_size'); // in bytes
            $table->text('description')->nullable();
            $table->timestamps();

            $table->foreign('meeting_minute_id')->references('id')->on('meeting_minutes')->onDelete('cascade');
            $table->foreign('uploaded_by')->references('id')->on('users')->onDelete('cascade');
            $table->index(['meeting_minute_id', 'file_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('meeting_minute_attachments');
    }
};