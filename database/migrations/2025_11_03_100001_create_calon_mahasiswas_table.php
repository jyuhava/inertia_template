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
        Schema::create('calon_mahasiswas', function (Blueprint $table) {
            $table->id();
            $table->string('no_pendaftaran')->unique();
            $table->foreignId('periode_pmb_id')->constrained('periode_pmb')->onDelete('cascade');
            $table->foreignId('prodi_pilihan_1')->constrained('prodis')->onDelete('restrict');
            $table->foreignId('prodi_pilihan_2')->nullable()->constrained('prodis')->onDelete('restrict');
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            
            // Data Pribadi
            $table->string('nama_lengkap');
            $table->string('nik', 16)->unique();
            $table->enum('jenis_kelamin', ['L', 'P']);
            $table->string('tempat_lahir');
            $table->date('tanggal_lahir');
            $table->string('agama');
            $table->text('alamat');
            $table->string('no_hp', 15);
            $table->string('email')->unique();
            
            // Data Orang Tua
            $table->string('nama_ayah');
            $table->string('pekerjaan_ayah');
            $table->string('nama_ibu');
            $table->string('pekerjaan_ibu');
            $table->string('no_hp_ortu', 15);
            $table->text('alamat_ortu')->nullable();
            
            // Data Pendidikan
            $table->string('asal_sekolah');
            $table->string('tahun_lulus', 4);
            $table->string('jurusan_sekolah')->nullable();
            $table->decimal('nilai_rata_rata', 4, 2)->nullable();
            
            // Status & Dokumen
            $table->enum('status_pendaftaran', ['draft', 'submitted', 'verified', 'accepted', 'rejected'])->default('draft');
            $table->enum('status_pembayaran', ['unpaid', 'pending', 'paid', 'expired'])->default('unpaid');
            $table->enum('status_berkas', ['incomplete', 'complete', 'verified', 'revision'])->default('incomplete');
            
            // Dokumen
            $table->string('foto')->nullable();
            $table->string('ktp')->nullable();
            $table->string('ijazah')->nullable();
            $table->string('transkrip')->nullable();
            $table->string('bukti_pembayaran')->nullable();
            
            // Catatan Admin
            $table->text('catatan_admin')->nullable();
            $table->timestamp('tanggal_daftar')->nullable();
            $table->timestamp('tanggal_verifikasi')->nullable();
            $table->foreignId('verified_by')->nullable()->constrained('users');
            
            $table->timestamps();
            
            // Indexes
            $table->index(['periode_pmb_id', 'status_pendaftaran']);
            $table->index(['prodi_pilihan_1', 'status_pendaftaran']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('calon_mahasiswas');
    }
};
