<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dosen_alamats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dosen_id')->constrained('dosens')->cascadeOnDelete();
            $table->enum('jenis', ['ktp', 'domisili']);
            $table->text('jalan');
            $table->string('dusun')->nullable();
            $table->string('rt', 5)->nullable();
            $table->string('rw', 5)->nullable();
            $table->string('kelurahan')->nullable();
            $table->string('kecamatan')->nullable();
            $table->string('kabupaten_kota')->nullable();
            $table->string('provinsi')->nullable();
            $table->string('kode_pos', 10)->nullable();
            $table->string('wilayah_id', 50)->nullable();
            $table->timestamps();
            $table->unique(['dosen_id', 'jenis']);
        });
        Schema::create('dosen_kepegawaians', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dosen_id')->unique()->constrained('dosens')->cascadeOnDelete();
            $table->string('jenis_kepegawaian', 50)->nullable();
            $table->string('status_kepegawaian', 50)->nullable();
            $table->string('nomor_pegawai', 50)->nullable()->unique();
            $table->date('tanggal_mulai_kerja')->nullable();
            $table->date('tanggal_mulai_dosen')->nullable();
            $table->string('status_dosen', 30)->nullable();
            $table->string('status_pns', 30)->nullable();
            $table->string('sumber_pembiayaan', 100)->nullable();
            $table->string('unit_kerja', 150)->nullable();
            $table->timestamps();
        });
        Schema::create('dosen_status_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dosen_id')->constrained('dosens')->cascadeOnDelete();
            $table->string('status', 30);
            $table->date('tanggal_berlaku');
            $table->date('tanggal_selesai')->nullable();
            $table->string('alasan')->nullable();
            $table->text('keterangan')->nullable();
            $table->string('dokumen_pendukung')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index(['dosen_id', 'tanggal_berlaku']);
        });
        Schema::create('dosen_homebase_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dosen_id')->constrained('dosens')->cascadeOnDelete();
            $table->foreignId('prodi_id')->constrained('prodis')->restrictOnDelete();
            $table->date('tanggal_mulai');
            $table->date('tanggal_selesai')->nullable();
            $table->string('status', 30)->default('aktif');
            $table->string('alasan')->nullable();
            $table->string('dokumen_pendukung')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index(['dosen_id', 'tanggal_mulai']);
        });
        Schema::create('dosen_riwayat_pendidikans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dosen_id')->constrained('dosens')->cascadeOnDelete();
            $table->string('jenjang', 20);
            $table->string('perguruan_tinggi');
            $table->string('program_studi');
            $table->string('gelar')->nullable();
            $table->string('nomor_ijazah')->nullable();
            $table->year('tahun_masuk')->nullable();
            $table->year('tahun_lulus')->nullable();
            $table->date('tanggal_lulus')->nullable();
            $table->string('negara', 100)->nullable();
            $table->string('status_pendidikan', 30)->default('lulus');
            $table->timestamps();
        });
        Schema::create('dosen_jabatan_akademik_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dosen_id')->constrained('dosens')->cascadeOnDelete();
            $table->string('jabatan_akademik', 100);
            $table->date('tanggal_berlaku');
            $table->date('tanggal_selesai')->nullable();
            $table->string('nomor_sk')->nullable();
            $table->date('tanggal_sk')->nullable();
            $table->string('file_sk')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
        Schema::create('dosen_pangkat_golongans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dosen_id')->constrained('dosens')->cascadeOnDelete();
            $table->string('pangkat')->nullable();
            $table->string('golongan', 30)->nullable();
            $table->date('tanggal_berlaku')->nullable();
            $table->string('nomor_sk')->nullable();
            $table->date('tanggal_sk')->nullable();
            $table->timestamps();
        });
        Schema::create('dosen_sertifikasis', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dosen_id')->constrained('dosens')->cascadeOnDelete();
            $table->string('jenis', 100);
            $table->string('nomor_sertifikat')->nullable();
            $table->string('penerbit')->nullable();
            $table->date('tanggal_terbit')->nullable();
            $table->date('berlaku_sampai')->nullable();
            $table->string('file_path')->nullable();
            $table->timestamps();
        });
        Schema::create('dosen_dokumens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dosen_id')->constrained('dosens')->cascadeOnDelete();
            $table->string('jenis', 50);
            $table->string('nama_dokumen');
            $table->string('nomor_dokumen')->nullable();
            $table->date('tanggal_dokumen')->nullable();
            $table->string('file_path');
            $table->string('status_verifikasi', 20)->default('pending');
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dosen_dokumens');
        Schema::dropIfExists('dosen_sertifikasis');
        Schema::dropIfExists('dosen_pangkat_golongans');
        Schema::dropIfExists('dosen_jabatan_akademik_histories');
        Schema::dropIfExists('dosen_riwayat_pendidikans');
        Schema::dropIfExists('dosen_homebase_histories');
        Schema::dropIfExists('dosen_status_histories');
        Schema::dropIfExists('dosen_kepegawaians');
        Schema::dropIfExists('dosen_alamats');
    }
};
