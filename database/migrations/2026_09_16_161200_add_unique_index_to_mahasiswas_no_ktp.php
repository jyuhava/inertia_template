<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * NIK (no_ktp) should be unique across active students once populated.
     * The column stays nullable so historical rows without NIK on file are
     * unaffected — most databases treat multiple NULLs as distinct under a
     * unique index, so this cannot break existing data.
     */
    public function up(): void
    {
        Schema::table('mahasiswas', function (Blueprint $table) {
            $table->unique('no_ktp');
        });
    }

    public function down(): void
    {
        Schema::table('mahasiswas', function (Blueprint $table) {
            $table->dropUnique(['no_ktp']);
        });
    }
};
