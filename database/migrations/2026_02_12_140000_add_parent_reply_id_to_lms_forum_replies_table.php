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
        Schema::table('lms_forum_replies', function (Blueprint $table) {
            $table->foreignId('parent_reply_id')
                ->nullable()
                ->after('dosen_id')
                ->constrained('lms_forum_replies')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('lms_forum_replies', function (Blueprint $table) {
            $table->dropConstrainedForeignId('parent_reply_id');
        });
    }
};

