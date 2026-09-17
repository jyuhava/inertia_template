<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Extends the existing periode_krs (course registration period) entity
     * instead of creating a duplicate `course_registration_periods` table.
     * `krs_status` is a distinct lifecycle field from the legacy `status`
     * (aktif/tidak_aktif) column so the legacy KRS flow (jadwal_kuliahs
     * based) keeps working unmodified.
     */
    public function up(): void
    {
        Schema::table('periode_krs', function (Blueprint $table) {
            $table->enum('krs_status', ['draft', 'open', 'closed'])->default('draft')->after('status');
            $table->date('revisi_mulai')->nullable()->after('tanggal_selesai');
            $table->date('revisi_selesai')->nullable()->after('revisi_mulai');
            $table->boolean('wajib_persetujuan_pa')->default(false)->after('revisi_selesai');
            $table->unsignedInteger('maksimal_sks')->nullable()->after('wajib_persetujuan_pa');
            $table->unsignedInteger('minimal_sks')->nullable()->after('maksimal_sks');
        });
    }

    public function down(): void
    {
        Schema::table('periode_krs', function (Blueprint $table) {
            $table->dropColumn(['krs_status', 'revisi_mulai', 'revisi_selesai', 'wajib_persetujuan_pa', 'maksimal_sks', 'minimal_sks']);
        });
    }
};
