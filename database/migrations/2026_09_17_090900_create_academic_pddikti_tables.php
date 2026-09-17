<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * No Neo Feeder/PDDikti client exists anywhere in this repository
     * (confirmed during Modul Mahasiswa/Dosen audits). This mapping table
     * is a generic polymorphic boundary — not a call to any external
     * service — covering the four entities Neo Feeder reports separately:
     * mata kuliah, kurikulum, mata kuliah kurikulum, dan kelas kuliah.
     */
    public function up(): void
    {
        Schema::create('pddikti_akademik_mappings', function (Blueprint $table) {
            $table->id();
            $table->string('entity_type', 40);
            $table->unsignedBigInteger('entity_id');
            $table->string('external_id')->nullable();
            $table->enum('sync_status', ['not_synced', 'pending', 'synced', 'failed'])->default('not_synced');
            $table->timestamp('last_synced_at')->nullable();
            $table->string('last_sync_action', 30)->nullable();
            $table->text('last_sync_message')->nullable();
            $table->timestamps();

            $table->unique(['entity_type', 'entity_id'], 'unique_pddikti_akademik_entity');
            $table->index(['entity_type', 'external_id']);
        });

        Schema::create('pddikti_akademik_sync_logs', function (Blueprint $table) {
            $table->id();
            $table->string('entity_type', 40);
            $table->unsignedBigInteger('entity_id');
            $table->string('external_id')->nullable();
            $table->string('action', 30);
            $table->json('request_payload')->nullable();
            $table->json('response_payload')->nullable();
            $table->enum('status', ['success', 'failed'])->default('failed');
            $table->text('message')->nullable();
            $table->timestamp('synced_at')->nullable();
            $table->timestamps();

            $table->index(['entity_type', 'entity_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pddikti_akademik_sync_logs');
        Schema::dropIfExists('pddikti_akademik_mappings');
    }
};
