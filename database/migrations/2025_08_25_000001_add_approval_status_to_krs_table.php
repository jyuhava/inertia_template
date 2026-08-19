<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('krs', function (Blueprint $table) {
            // Ubah enum status untuk menambah approval status
            $table->dropColumn('status');
        });
        
        Schema::table('krs', function (Blueprint $table) {
            $table->enum('status', ['diambil', 'dibatalkan', 'disetujui', 'ditolak', 'menunggu_persetujuan'])->default('menunggu_persetujuan');
            $table->text('catatan_admin')->nullable()->after('status');
            $table->timestamp('tanggal_approval')->nullable()->after('catatan_admin');
            $table->foreignId('approved_by')->nullable()->constrained('users')->after('tanggal_approval');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('krs', function (Blueprint $table) {
            $table->dropForeign(['approved_by']);
            $table->dropColumn(['status', 'catatan_admin', 'tanggal_approval', 'approved_by']);
        });
        
        Schema::table('krs', function (Blueprint $table) {
            $table->enum('status', ['diambil', 'dibatalkan'])->default('diambil');
        });
    }
};
