<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Sync log for PDDikti/Neo Feeder actions. Only non-sensitive payload/response
     * data should ever be written here (no secrets, tokens, or credentials).
     */
    public function up(): void
    {
        Schema::create('pddikti_sync_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mahasiswa_id')->constrained('mahasiswas')->onDelete('cascade');
            $table->string('pddikti_id')->nullable();
            $table->string('action', 50); // e.g. INSERT_BIODATA, UPDATE_BIODATA, GET_BIODATA, SYNC
            $table->json('payload')->nullable();
            $table->json('response')->nullable();
            $table->enum('status', ['success', 'failed', 'pending'])->default('pending');
            $table->text('message')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['mahasiswa_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pddikti_sync_logs');
    }
};
