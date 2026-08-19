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
        Schema::table('lms_assignments', function (Blueprint $table) {
            $table->enum('komponen', ['harian', 'uts', 'uas'])
                ->default('harian')
                ->after('description');
            $table->decimal('bobot_komponen', 5, 2)
                ->default(1)
                ->after('komponen');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('lms_assignments', function (Blueprint $table) {
            $table->dropColumn(['komponen', 'bobot_komponen']);
        });
    }
};
