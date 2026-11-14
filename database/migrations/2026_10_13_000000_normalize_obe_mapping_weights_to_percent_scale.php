<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ubah bobot pada rentang (0, 1) dengan faktor tertentu.
     *
     * Hanya baris dengan bobot di bawah 1 yang disentuh, karena hanya baris
     * itulah yang ditulis dalam skala fraksi. Nilai >= 1 sudah berada dalam
     * skala persen atau sengaja bernilai kecil, jadi dibiarkan apa adanya.
     * Ambang yang sama membuat migrasi ini idempoten: dijalankan dua kali
     * tidak mengubah data untuk kedua kalinya.
     */
    private function rescaleFractionRows(string $table, string $expression): void
    {
        if (! Schema::hasTable($table) || ! Schema::hasColumn($table, 'weight')) {
            return;
        }

        DB::table($table)
            ->whereNotNull('weight')
            ->where('weight', '>', 0)
            ->where('weight', '<', 1)
            ->update([
                'weight' => DB::raw($expression),
                'updated_at' => now(),
            ]);
    }

    /**
     * Samakan bobot pemetaan OBE ke skala persen (0-100).
     *
     * storeCplCourse() memvalidasi weight dengan max:100 dan Mapping.jsx
     * menampilkan input "bobot kontribusi (0-100)", jadi skala yang benar
     * adalah persen. Sebaliknya, AkademikLengkapSeeder lama menulis fraksi
     * 0.3333 sehingga Laporan OBE menampilkan "0.3%" untuk bobot yang
     * dimaksudnya 33.3%.
     */
    public function up(): void
    {
        foreach (['obe_cpl_course_mappings', 'obe_cpmk_cpl_mappings'] as $table) {
            $this->rescaleFractionRows($table, 'weight * 100');
        }
    }

    public function down(): void
    {
        // Pembalikan hanya aman selama tidak ada bobot persen asli di tabel.
        // Begitu ada, baris di bawah 1 tidak lagi bisa dibedakan dari baris
        // yang aslinya ditulis sebagai fraksi, jadi lewati seluruh tabel
        // daripada menebak dan merusak data.
        foreach (['obe_cpl_course_mappings', 'obe_cpmk_cpl_mappings'] as $table) {
            if (! Schema::hasTable($table) || ! Schema::hasColumn($table, 'weight')) {
                continue;
            }

            $hasPercentRows = DB::table($table)
                ->whereNotNull('weight')
                ->where('weight', '>=', 1)
                ->exists();

            if ($hasPercentRows) {
                continue;
            }

            $this->rescaleFractionRows($table, 'weight / 100');
        }
    }
};