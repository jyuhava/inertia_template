<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Antrean pekerjaan AI.
     *
     * Panggilan LLM butuh 90-150 detik, sedangkan shared hosting (Hostinger)
     * memutus request web yang lebih dari ~55 detik. Karena itu permintaan
     * dibuat asinkron: request hanya mengantre pekerjaan, lalu frontend
     * melakukan polling status sampai selesai.
     */
    public function up(): void
    {
        Schema::create('ai_jobs', function (Blueprint $table) {
            $table->id();
            // Tabel users lama memakai id int signed, jadi kolomnya dibuat
            // int agar foreign key bisa dibuat.
            $table->integer('user_id');
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->string('type', 50);                 // mis. generate-material-draft
            $table->string('status', 20)->default('pending'); // pending|processing|done|failed
            $table->text('input')->nullable();
            $table->longText('result')->nullable();
            $table->text('error')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_jobs');
    }
};
