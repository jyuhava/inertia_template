<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pddikti_dosen_mappings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dosen_id')->unique()->constrained('dosens')->cascadeOnDelete();
            $table->string('pddikti_id')->nullable()->unique();
            $table->string('id_registrasi_dosen')->nullable()->unique();
            $table->string('status_mapping', 20)->default('unmapped');
            $table->timestamp('last_synced_at')->nullable();
            $table->string('last_action', 30)->nullable();
            $table->text('last_message')->nullable();
            $table->timestamps();
        });
        Schema::create('pddikti_dosen_sync_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dosen_id')->constrained('dosens')->cascadeOnDelete();
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

    public function down(): void
    {
        Schema::dropIfExists('pddikti_dosen_sync_logs');
        Schema::dropIfExists('pddikti_dosen_mappings');
    }
};
