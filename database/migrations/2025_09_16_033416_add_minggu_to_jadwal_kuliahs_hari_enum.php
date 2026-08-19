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
        // For SQLite, we need to recreate the table with the new enum values
        if (DB::getDriverName() === 'sqlite') {
            // Get existing data
            $existingData = DB::table('jadwal_kuliahs')->get();
            
            // Drop and recreate table with new enum
            Schema::dropIfExists('jadwal_kuliahs');
            
            Schema::create('jadwal_kuliahs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('mata_kuliah_id')->constrained('mata_kuliahs')->onDelete('cascade');
                $table->foreignId('dosen_id')->constrained('dosens')->onDelete('restrict');
                $table->foreignId('semester_id')->constrained('semesters')->onDelete('restrict');
                $table->enum('hari', ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']);
                $table->time('jam_mulai');
                $table->time('jam_selesai');
                $table->string('ruangan');
                $table->integer('kapasitas')->default(40);
                $table->text('keterangan')->nullable();
                $table->enum('status', ['aktif', 'nonaktif'])->default('aktif');
                $table->timestamps();
                
                // Ensure no schedule conflicts for same room at same time
                $table->unique(['hari', 'jam_mulai', 'ruangan'], 'unique_schedule_room');
            });
            
            // Restore existing data
            foreach ($existingData as $data) {
                DB::table('jadwal_kuliahs')->insert((array) $data);
            }
        } else {
            // For MySQL/PostgreSQL
            DB::statement("ALTER TABLE jadwal_kuliahs MODIFY COLUMN hari ENUM('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu')");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // For SQLite, we need to recreate the table with the old enum values
        if (DB::getDriverName() === 'sqlite') {
            // Get existing data
            $existingData = DB::table('jadwal_kuliahs')->where('hari', '!=', 'Minggu')->get();
            
            // Drop and recreate table with old enum
            Schema::dropIfExists('jadwal_kuliahs');
            
            Schema::create('jadwal_kuliahs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('mata_kuliah_id')->constrained('mata_kuliahs')->onDelete('cascade');
                $table->foreignId('dosen_id')->constrained('dosens')->onDelete('restrict');
                $table->foreignId('semester_id')->constrained('semesters')->onDelete('restrict');
                $table->enum('hari', ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']);
                $table->time('jam_mulai');
                $table->time('jam_selesai');
                $table->string('ruangan');
                $table->integer('kapasitas')->default(40);
                $table->text('keterangan')->nullable();
                $table->enum('status', ['aktif', 'nonaktif'])->default('aktif');
                $table->timestamps();
                
                // Ensure no schedule conflicts for same room at same time
                $table->unique(['hari', 'jam_mulai', 'ruangan'], 'unique_schedule_room');
            });
            
            // Restore existing data (excluding Minggu)
            foreach ($existingData as $data) {
                DB::table('jadwal_kuliahs')->insert((array) $data);
            }
        } else {
            // For MySQL/PostgreSQL
            DB::statement("ALTER TABLE jadwal_kuliahs MODIFY COLUMN hari ENUM('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu')");
        }
    }
};
