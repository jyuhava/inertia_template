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
            $table->foreignId('mahasiswa_id')
                ->nullable()
                ->after('dosen_id')
                ->constrained('mahasiswas')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('lms_forum_replies', function (Blueprint $table) {
            $table->dropConstrainedForeignId('mahasiswa_id');
        });
    }
};

