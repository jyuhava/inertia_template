<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('dosens', function (Blueprint $table) {
            $table->enum('status', ['aktif', 'nonaktif', 'pensiun', 'mengundurkan_diri', 'meninggal', 'pindah'])->default('aktif')->change();
            $table->string('gelar_depan', 50)->nullable()->after('nama_lengkap');
            $table->string('gelar_belakang', 100)->nullable()->after('gelar_depan');
            $table->string('nik', 20)->nullable()->unique()->after('nip');
            $table->string('nidn', 20)->nullable()->unique()->after('nik');
            $table->string('nidk', 20)->nullable()->unique()->after('nidn');
            $table->string('nuptk', 20)->nullable()->unique()->after('nidk');
            $table->string('npwp', 25)->nullable()->after('nuptk');
            $table->string('agama', 50)->nullable()->after('tanggal_lahir');
            $table->string('kewarganegaraan', 50)->default('WNI')->after('agama');
            $table->string('email')->nullable()->after('no_hp');
            $table->string('telepon', 30)->nullable()->after('email');
            $table->string('kontak_darurat', 50)->nullable()->after('telepon');
            $table->string('foto')->nullable()->after('kontak_darurat');
            $table->string('status_kepegawaian', 50)->nullable()->after('status');
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('dosens', function (Blueprint $table) {
            $table->dropUnique(['nik']);
            $table->dropUnique(['nidn']);
            $table->dropUnique(['nidk']);
            $table->dropUnique(['nuptk']);
            $table->dropColumn(['gelar_depan', 'gelar_belakang', 'nik', 'nidn', 'nidk', 'nuptk', 'npwp', 'agama', 'kewarganegaraan', 'email', 'telepon', 'kontak_darurat', 'foto', 'status_kepegawaian']);
            $table->dropSoftDeletes();
        });
    }
};
