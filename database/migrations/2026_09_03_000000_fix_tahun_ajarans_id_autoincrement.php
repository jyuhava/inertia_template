<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::getDriverName() === 'mysql') {
            Schema::table('tahun_ajarans', function ($table) {
                // Ensure the id column is a proper auto-incrementing primary key.
                DB::statement('ALTER TABLE `tahun_ajarans` MODIFY `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No-op: reverting the auto-increment is not necessary and may break data integrity.
    }
};