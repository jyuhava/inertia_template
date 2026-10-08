<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tabel detail Dosen yang belum pernah terbentuk.
     *
     * Migrasi aslinya berhenti di tabel pertama karena `dosen_alamats` sudah
     * ada, sehingga tabel sisanya tidak pernah dibuat; halaman List/Detail
     * Dosen memuat relasi ke tabel-tabel itu sehingga error "Base table or
     * view not found".
     *
     * Kolom foreign id sengaja dibuat polos dengan tipe mengikuti kolom id
     * tabel tujuan (tabel lama memakai int signed) supaya migrasi tidak gagal
     * karena ketidakcocokan tipe. Hanya menambah tabel yang belum ada - tidak
     * menghapus dan tidak mengubah data.
     */
    public function up(): void
    {
        if (! Schema::hasTable('dosen_kepegawaians')) {
            Schema::create('dosen_kepegawaians', function (Blueprint $table) {
            $table->id();
            $table->integer('dosen_id');
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
        }

        if (! Schema::hasTable('dosen_status_histories')) {
            Schema::create('dosen_status_histories', function (Blueprint $table) {
            $table->id();
            $table->integer('dosen_id');
            $table->string('status', 30);
            $table->date('tanggal_berlaku');
            $table->date('tanggal_selesai')->nullable();
            $table->string('alasan')->nullable();
            $table->text('keterangan')->nullable();
            $table->string('dokumen_pendukung')->nullable();
            $table->integer('created_by')->nullable();
            $table->timestamps();
            $table->index(['dosen_id', 'tanggal_berlaku']);
        
            });
        }

        if (! Schema::hasTable('dosen_homebase_histories')) {
            Schema::create('dosen_homebase_histories', function (Blueprint $table) {
            $table->id();
            $table->integer('dosen_id');
            $table->integer('prodi_id');
            $table->date('tanggal_mulai');
            $table->date('tanggal_selesai')->nullable();
            $table->string('status', 30)->default('aktif');
            $table->string('alasan')->nullable();
            $table->string('dokumen_pendukung')->nullable();
            $table->integer('created_by')->nullable();
            $table->timestamps();
            $table->index(['dosen_id', 'tanggal_mulai']);
        
            });
        }

        if (! Schema::hasTable('dosen_riwayat_pendidikans')) {
            Schema::create('dosen_riwayat_pendidikans', function (Blueprint $table) {
            $table->id();
            $table->integer('dosen_id');
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
        }

        if (! Schema::hasTable('dosen_jabatan_akademik_histories')) {
            Schema::create('dosen_jabatan_akademik_histories', function (Blueprint $table) {
            $table->id();
            $table->integer('dosen_id');
            $table->string('jabatan_akademik', 100);
            $table->date('tanggal_berlaku');
            $table->date('tanggal_selesai')->nullable();
            $table->string('nomor_sk')->nullable();
            $table->date('tanggal_sk')->nullable();
            $table->string('file_sk')->nullable();
            $table->integer('created_by')->nullable();
            $table->timestamps();
        
            });
        }

        if (! Schema::hasTable('dosen_pangkat_golongans')) {
            Schema::create('dosen_pangkat_golongans', function (Blueprint $table) {
            $table->id();
            $table->integer('dosen_id');
            $table->string('pangkat')->nullable();
            $table->string('golongan', 30)->nullable();
            $table->date('tanggal_berlaku')->nullable();
            $table->string('nomor_sk')->nullable();
            $table->date('tanggal_sk')->nullable();
            $table->timestamps();
        
            });
        }

        if (! Schema::hasTable('dosen_sertifikasis')) {
            Schema::create('dosen_sertifikasis', function (Blueprint $table) {
            $table->id();
            $table->integer('dosen_id');
            $table->string('jenis', 100);
            $table->string('nomor_sertifikat')->nullable();
            $table->string('penerbit')->nullable();
            $table->date('tanggal_terbit')->nullable();
            $table->date('berlaku_sampai')->nullable();
            $table->string('file_path')->nullable();
            $table->timestamps();
        
            });
        }

        if (! Schema::hasTable('pddikti_dosen_sync_logs')) {
            Schema::create('pddikti_dosen_sync_logs', function (Blueprint $table) {
            $table->id();
            $table->integer('dosen_id');
            $table->string('pddikti_id')->nullable();
            $table->string('action', 30);
            $table->json('payload')->nullable();
            $table->json('response')->nullable();
            $table->string('status', 20);
            $table->text('message')->nullable();
            $table->timestamps();
            $table->index(['dosen_id', 'created_at']);
        
            });
        }

    }

    public function down(): void
    {
        // Sengaja kosong: tabel kosong yang tercipta tidak perlu di-drop.
    }
};
