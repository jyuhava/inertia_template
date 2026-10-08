<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Membuat tabel kelas_kuliah_pengajars yang belum pernah terbentuk.
 *
 * Migrasi aslinya (2026_09_17_090700) tercatat "Ran" padahal hanya
 * kelas_kuliahs yang berhasil dibuat: baris berikutnya memakai
 * foreignId('dosen_id')->constrained('dosens') padahal dosens.id bertipe
 * int signed, sementara foreignId menghasilkan bigint unsigned, sehingga
 * MySQL menolak dengan errno 150 dan DDL (yang tidak dibungkus transaksi)
 * membuat tabel tidak ikut terbentuk.
 *
 * Kolom mengikuti tipe id tabel tujuannya masing-masing:
 *   kelas_kuliahs.id = bigint unsigned
 *   dosens.id        = int signed
 *
 * Tabel baru dan kosong; tidak ada data yang diubah atau dihapus.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('kelas_kuliah_pengajars')) {
            return;
        }

        Schema::create('kelas_kuliah_pengajars', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('kelas_kuliah_id');
            $table->integer('dosen_id');
            $table->enum('peran', ['utama', 'pendamping', 'asisten'])->default('utama');
            $table->enum('status', ['aktif', 'nonaktif'])->default('aktif');
            $table->timestamps();

            $table->foreign('kelas_kuliah_id')
                ->references('id')
                ->on('kelas_kuliahs')
                ->cascadeOnDelete();
            $table->foreign('dosen_id')
                ->references('id')
                ->on('dosens')
                ->restrictOnDelete();

            $table->unique(['kelas_kuliah_id', 'dosen_id'], 'unique_kelas_pengajar');
        });
    }

    public function down(): void
    {
        // Sengaja kosong: tabel kosong yang tercipta tidak perlu di-drop.
    }
};
