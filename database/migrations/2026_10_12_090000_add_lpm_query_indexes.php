<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Index untuk query yang dijalankan modul LPM (laporan kemajuan/akhir) dan
 * jalur pemuatan sesi dosen.
 *
 * Catatan: pada SQLite `foreignId()->constrained()` tidak pernah membuat index
 * otomatis — SQLite memang tidak mewajibkan index untuk foreign key, berbeda
 * dengan MySQL yang otomatis mengindeks kolom FK. Akibatnya setiap filter dan
 * sorter di bawah berakhir sebagai full table scan.
 *
 * Setiap index dicek dengan Schema::hasIndex() lebih dulu supaya migrasi ini
 * aman dijalankan pada MySQL (yang sudah punya index FK) maupun diulang.
 */
return new class extends Migration
{
    /**
     * @var list<array{table: string, columns: list<string>, name: string}>
     */
    private const INDEXES = [
        // Daftar proposal dosen: where ketua_user_id + order by updated_at.
        ['table' => 'lpm_proposals', 'columns' => ['ketua_user_id', 'updated_at'], 'name' => 'lpm_proposals_ketua_updated_index'],
        ['table' => 'lpm_proposals', 'columns' => ['updated_at'], 'name' => 'lpm_proposals_updated_at_index'],
        ['table' => 'lpm_proposals', 'columns' => ['status'], 'name' => 'lpm_proposals_status_index'],
        ['table' => 'lpm_proposals', 'columns' => ['created_by'], 'name' => 'lpm_proposals_created_by_index'],

        ['table' => 'lpm_programs', 'columns' => ['tahun_anggaran'], 'name' => 'lpm_programs_tahun_anggaran_index'],

        ['table' => 'lpm_reports', 'columns' => ['proposal_id'], 'name' => 'lpm_reports_proposal_id_index'],
        ['table' => 'lpm_reports', 'columns' => ['status_validasi'], 'name' => 'lpm_reports_status_validasi_index'],

        ['table' => 'lpm_reviews', 'columns' => ['reviewer_user_id'], 'name' => 'lpm_reviews_reviewer_user_id_index'],

        ['table' => 'lpm_proposal_documents', 'columns' => ['proposal_id'], 'name' => 'lpm_documents_proposal_id_index'],
        ['table' => 'lpm_activities', 'columns' => ['proposal_id'], 'name' => 'lpm_activities_proposal_id_index'],
        ['table' => 'lpm_contracts', 'columns' => ['proposal_id'], 'name' => 'lpm_contracts_proposal_id_index'],
        ['table' => 'lpm_outputs', 'columns' => ['proposal_id'], 'name' => 'lpm_outputs_proposal_id_index'],
        ['table' => 'lpm_outputs', 'columns' => ['status_validasi'], 'name' => 'lpm_outputs_status_validasi_index'],

        // Dipanggil di HandleInertiaRequests pada setiap request bertipe dosen,
        // bukan hanya saat membuka halaman LPM.
        ['table' => 'dosens', 'columns' => ['user_id'], 'name' => 'dosens_user_id_index'],
    ];

    public function up(): void
    {
        foreach (self::INDEXES as $index) {
            if (Schema::hasIndex($index['table'], $index['columns'])) {
                continue;
            }

            Schema::table($index['table'], function (Blueprint $table) use ($index) {
                $table->index($index['columns'], $index['name']);
            });
        }
    }

    public function down(): void
    {
        foreach (array_reverse(self::INDEXES) as $index) {
            // Dicocokkan berdasarkan NAMA, bukan daftar kolom. Index dengan
            // kolom yang sama bisa saja sudah ada sebelum migrasi ini (MySQL
            // membuat index FK otomatis dengan nama sendiri) dan itu bukan
            // milik kita untuk dibuang.
            if (! Schema::hasIndex($index['table'], $index['name'])) {
                continue;
            }

            Schema::table($index['table'], function (Blueprint $table) use ($index) {
                $table->dropIndex($index['name']);
            });
        }
    }
};