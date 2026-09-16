<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * no_ktp (existing) is treated as NIK per PDDikti terminology.
     */
    public function up(): void
    {
        Schema::table('mahasiswas', function (Blueprint $table) {
            $table->string('nisn', 20)->nullable()->after('no_ktp');
            $table->string('npwp', 25)->nullable()->after('nisn');
            $table->string('agama', 50)->nullable()->after('tanggal_lahir');
            $table->string('kewarganegaraan', 50)->default('WNI')->after('agama');
            $table->string('email')->nullable()->after('no_hp');
            $table->string('foto')->nullable()->after('email');
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('mahasiswas', function (Blueprint $table) {
            $table->dropColumn(['nisn', 'npwp', 'agama', 'kewarganegaraan', 'email', 'foto']);
            $table->dropSoftDeletes();
        });
    }
};
