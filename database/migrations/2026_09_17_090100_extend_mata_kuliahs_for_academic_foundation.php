<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Adds richer master-course fields without disturbing columns already
     * used by KRS/Penilaian/Absensi/LMS (kode_mata_kuliah, sks, semester,
     * jenis, status stay untouched).
     */
    public function up(): void
    {
        Schema::table('mata_kuliahs', function (Blueprint $table) {
            $table->string('short_name', 50)->nullable()->after('nama_mata_kuliah');
            $table->string('english_name')->nullable()->after('short_name');
            $table->string('course_type', 30)->nullable()->after('jenis');
            $table->foreignId('kategori_mata_kuliah_id')->nullable()->after('course_type')->constrained('kategori_mata_kuliahs')->nullOnDelete();
            $table->decimal('theory_credits', 4, 2)->nullable()->after('sks');
            $table->decimal('practical_credits', 4, 2)->nullable()->after('theory_credits');
            $table->decimal('field_credits', 4, 2)->nullable()->after('practical_credits');
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('mata_kuliahs', function (Blueprint $table) {
            $table->dropConstrainedForeignId('kategori_mata_kuliah_id');
            $table->dropColumn(['short_name', 'english_name', 'course_type', 'theory_credits', 'practical_credits', 'field_credits']);
            $table->dropSoftDeletes();
        });
    }
};
