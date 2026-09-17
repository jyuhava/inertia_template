<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Registration data separated from core student identity.
     * A student may have more than one row historically (e.g. re-admission),
     * so no unique constraint is placed on mahasiswa_id.
     */
    public function up(): void
    {
        Schema::create('mahasiswa_registrasis', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mahasiswa_id')->constrained('mahasiswas')->onDelete('cascade');
            $table->foreignId('calon_mahasiswa_id')->nullable()->constrained('calon_mahasiswas')->onDelete('set null');
            $table->string('no_pendaftaran')->nullable();
            $table->foreignId('prodi_id')->constrained('prodis')->onDelete('restrict');
            $table->string('periode_masuk', 20); // e.g. angkatan/tahun ajaran label
            $table->date('tanggal_masuk');
            $table->enum('jenis_pendaftaran', ['reguler', 'transfer', 'pindahan'])->default('reguler');
            $table->string('jalur_masuk', 100)->nullable(); // e.g. PMB, undangan, mandiri
            $table->string('status_awal', 50)->default('aktif');
            $table->enum('asal_mahasiswa', ['baru', 'pindahan', 'transfer'])->default('baru');
            $table->string('pt_asal')->nullable(); // perguruan tinggi sebelumnya, jika transfer
            $table->foreignId('prodi_asal_id')->nullable()->constrained('prodis')->onDelete('set null');
            $table->text('keterangan')->nullable();
            $table->timestamps();

            $table->index(['mahasiswa_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mahasiswa_registrasis');
    }
};
