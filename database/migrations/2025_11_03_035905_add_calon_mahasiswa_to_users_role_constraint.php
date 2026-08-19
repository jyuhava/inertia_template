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
        // For SQLite, we need to recreate the table to change constraint
        if (DB::connection()->getDriverName() === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = OFF');
            
            // Create new table with updated constraint
            DB::statement('
                CREATE TABLE users_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                    name VARCHAR NOT NULL,
                    email VARCHAR NOT NULL,
                    email_verified_at DATETIME,
                    password VARCHAR NOT NULL,
                    remember_token VARCHAR,
                    created_at DATETIME,
                    updated_at DATETIME,
                    role VARCHAR CHECK (role IN ("admin", "mahasiswa", "dosen", "calon_mahasiswa")) NOT NULL DEFAULT "mahasiswa"
                )
            ');
            
            // Copy data from old table
            DB::statement('INSERT INTO users_new SELECT * FROM users');
            
            // Drop old table and rename new table
            DB::statement('DROP TABLE users');
            DB::statement('ALTER TABLE users_new RENAME TO users');
            
            // Recreate unique index
            DB::statement('CREATE UNIQUE INDEX users_email_unique ON users (email)');
            
            DB::statement('PRAGMA foreign_keys = ON');
        } else {
            // For other databases, modify the column
            DB::statement('ALTER TABLE users DROP CONSTRAINT users_role_check');
            DB::statement('ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ("admin", "mahasiswa", "dosen", "calon_mahasiswa"))');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // For SQLite, recreate table with old constraint
        if (DB::connection()->getDriverName() === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = OFF');
            
            // Create table with old constraint
            DB::statement('
                CREATE TABLE users_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                    name VARCHAR NOT NULL,
                    email VARCHAR NOT NULL,
                    email_verified_at DATETIME,
                    password VARCHAR NOT NULL,
                    remember_token VARCHAR,
                    created_at DATETIME,
                    updated_at DATETIME,
                    role VARCHAR CHECK (role IN ("admin", "mahasiswa", "dosen")) NOT NULL DEFAULT "mahasiswa"
                )
            ');
            
            // Copy data (excluding calon_mahasiswa records)
            DB::statement('INSERT INTO users_new SELECT * FROM users WHERE role != "calon_mahasiswa"');
            
            // Drop old table and rename new table
            DB::statement('DROP TABLE users');
            DB::statement('ALTER TABLE users_new RENAME TO users');
            
            // Recreate unique index
            DB::statement('CREATE UNIQUE INDEX users_email_unique ON users (email)');
            
            DB::statement('PRAGMA foreign_keys = ON');
        } else {
            // For other databases
            DB::statement('ALTER TABLE users DROP CONSTRAINT users_role_check');
            DB::statement('ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ("admin", "mahasiswa", "dosen"))');
        }
    }
};
