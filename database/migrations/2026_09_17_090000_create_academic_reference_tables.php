<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kategori_mata_kuliahs', function (Blueprint $table) {
            $table->id();
            $table->string('code', 30)->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('kelompok_mata_kuliahs', function (Blueprint $table) {
            $table->id();
            $table->string('code', 30)->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        $now = now();

        DB::table('kategori_mata_kuliahs')->insert(collect([
            ['Wajib', 'Wajib'],
            ['Pilihan', 'Pilihan'],
            ['Wajib Institusi', 'Wajib Institusi'],
            ['Wajib Fakultas', 'Wajib Fakultas'],
            ['Wajib Prodi', 'Wajib Program Studi'],
            ['Peminatan', 'Peminatan'],
            ['Praktikum', 'Praktikum'],
            ['Seminar', 'Seminar'],
            ['Tugas Akhir', 'Tugas Akhir'],
        ])->map(fn ($row) => [
            'code' => $row[0], 'name' => $row[1], 'is_active' => true, 'created_at' => $now, 'updated_at' => $now,
        ])->toArray());

        DB::table('kelompok_mata_kuliahs')->insert(collect([
            ['MPK', 'Mata Kuliah Pengembangan Kepribadian'],
            ['MKK', 'Mata Kuliah Keilmuan dan Keterampilan'],
            ['MKB', 'Mata Kuliah Keahlian Berkarya'],
            ['MPB', 'Mata Kuliah Perilaku Berkarya'],
            ['MBB', 'Mata Kuliah Berkehidupan Bermasyarakat'],
            ['INSTITUSI', 'Wajib Institusi'],
            ['FAKULTAS', 'Wajib Fakultas'],
            ['PRODI', 'Wajib Program Studi'],
            ['PEMINATAN', 'Peminatan'],
        ])->map(fn ($row) => [
            'code' => $row[0], 'name' => $row[1], 'is_active' => true, 'created_at' => $now, 'updated_at' => $now,
        ])->toArray());
    }

    public function down(): void
    {
        Schema::dropIfExists('kelompok_mata_kuliahs');
        Schema::dropIfExists('kategori_mata_kuliahs');
    }
};
