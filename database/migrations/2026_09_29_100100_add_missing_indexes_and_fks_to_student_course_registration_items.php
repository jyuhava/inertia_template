<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Melengkapi index dan foreign key yang belum terbentuk saat tabel
 * student_course_registration_items / _audits dibuat.
 *
 * MySQL tidak membungkus DDL dalam transaksi, sehingga migrasi
 * 2026_09_29_100000 sempat berhenti di tengah jalan: tabel sudah ada
 * beserta 3 foreign key pertamanya, tetapi index
 * idx_registration_item_lookup dan FK nullable kurikulum_mata_kuliah_id
 * belum sempat dibuat.
 *
 * Both table kosong, jadi hanya menambah indeks dan FK - tidak ada data
 * yang diubah atau dihapus.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('student_course_registration_items')) {
            Schema::table('student_course_registration_items', function (Blueprint $table): void {
                $indexes = Schema::getIndexes('student_course_registration_items');
                $hasLookup = collect($indexes)->contains(fn (array $i) => $i['name'] === 'idx_registration_item_lookup');

                if (! $hasLookup) {
                    $table->index(
                        ['registration_id', 'kelas_kuliah_id', 'status'],
                        'idx_registration_item_lookup'
                    );
                }

                $hasFk = collect(DB::select(
                    'SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
                     WHERE TABLE_SCHEMA = DATABASE()
                       AND TABLE_NAME = ?
                       AND COLUMN_NAME = ?
                       AND REFERENCED_TABLE_NAME IS NOT NULL',
                    ['student_course_registration_items', 'kurikulum_mata_kuliah_id']
                ))->isNotEmpty();

                if (! $hasFk) {
                    // Nama FK wajib ditulis eksplisit: nama bawaan Laravel
                    // ("student_course_registration_items_kurikulum_mata_kuliah_id_foreign")
                    // panjangnya 66 karakter, melebihi batas 64 karakter MySQL,
                    // sehingga MySQL menolak dengan errno 1059.
                    // kurikulum_mata_kuliahs.id = bigint unsigned, kolomnya
                    // sudah bigint unsigned nullable, jadi tipenya cocok.
                    $table->foreign('kurikulum_mata_kuliah_id', 'scr_items_kurikulum_mata_kuliah_fk')
                        ->references('id')
                        ->on('kurikulum_mata_kuliahs')
                        ->nullOnDelete();
                }
            });
        }
    }

    public function down(): void
    {
        // Sengaja kosong: menghapus FK/index ini tidak diperlukan.
    }
};
