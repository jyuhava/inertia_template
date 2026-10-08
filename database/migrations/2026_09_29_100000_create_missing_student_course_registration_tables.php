<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Melengkapi tabel enrollment KRS yang belum pernah terbentuk.
     *
     * Migrasi aslinya (2026_09_18_080200) berhenti setelah
     * `student_course_registrations`, sehingga `..._items` dan `..._audits`
     * tidak pernah dibuat. Endpoint ringkasan Integrator PDDikki memakai
     * tabel items, jadi halaman tersebut gagal dengan error 1146.
     *
     * Kolom foreign key sengaja memakai int (bukan foreignId/unsignedBigInteger)
     * karena tabel-tabel yang direferensikan dibuat lebih dulu dengan id int
     * signed; memakai tipe yang tidak sama akan ditolak MySQL (errno 150).
     *
     * Hanya membuat tabel yang belum ada - tidak menghapus dan tidak mengubah
     * data yang sudah ada.
     */
    public function up(): void
    {
        if (! Schema::hasTable('student_course_registration_items')) {
            Schema::create('student_course_registration_items', function (Blueprint $table) {
                $table->id();
                // Tipe id tabel rujukan berbeda-beda: tabel enrollment, kelas
                // kuliah, dan kurikulum memakai bigint unsigned, sedangkan
                // mata_kuliahs (tabel lama) tetap int signed. Kolom harus
                // mengikuti tipe persis tabel tujuannya.
                $table->unsignedBigInteger('registration_id');
                $table->unsignedBigInteger('kelas_kuliah_id');
                $table->integer('mata_kuliah_id');
                $table->unsignedBigInteger('kurikulum_mata_kuliah_id')->nullable();
                $table->decimal('sks_snapshot', 4, 2);
                $table->enum('status', ['active', 'cancelled'])->default('active');
                $table->timestamps();

                $table->foreign('registration_id')->references('id')->on('student_course_registrations')->cascadeOnDelete();
                $table->foreign('kelas_kuliah_id')->references('id')->on('kelas_kuliahs')->restrictOnDelete();
                $table->foreign('mata_kuliah_id')->references('id')->on('mata_kuliahs')->restrictOnDelete();
                $table->foreign('kurikulum_mata_kuliah_id')->references('id')->on('kurikulum_mata_kuliahs')->nullOnDelete();

                $table->index(['registration_id', 'kelas_kuliah_id', 'status'], 'idx_registration_item_lookup');
            });
        }

        if (! Schema::hasTable('student_course_registration_audits')) {
            Schema::create('student_course_registration_audits', function (Blueprint $table) {
                $table->id();
                // student_course_registrations = bigint unsigned, users = int signed.
                $table->unsignedBigInteger('registration_id');
                $table->integer('user_id')->nullable();
                $table->string('action', 40);
                $table->json('before')->nullable();
                $table->json('after')->nullable();
                $table->text('reason')->nullable();
                $table->timestamps();

                $table->foreign('registration_id')->references('id')->on('student_course_registrations')->cascadeOnDelete();
                $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        // Sengaja kosong: tabel kosong yang tercipta tidak perlu di-drop.
    }
};
