<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update enum role untuk menambahkan calon_mahasiswa
        if (DB::getDriverName() === 'sqlite') {
            // For SQLite, we need to add the new enum value
            DB::statement("UPDATE users SET role = 'calon_mahasiswa' WHERE 1 = 0"); // This won't update any rows, just validates the column
        } else {
            // For MySQL/PostgreSQL
            DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'mahasiswa', 'dosen', 'calon_mahasiswa') DEFAULT 'mahasiswa'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove calon_mahasiswa role
        DB::table('users')->where('role', 'calon_mahasiswa')->delete();
        
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'mahasiswa', 'dosen') DEFAULT 'mahasiswa'");
        }
    }
};
