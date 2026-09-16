<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Mapping between internal Mahasiswa records and PDDikti/Neo Feeder identifiers.
     * No live PDDikti/Neo Feeder integration exists in this codebase yet; this table
     * is the integration boundary a future client implementation will populate.
     */
    public function up(): void
    {
        Schema::create('pddikti_mahasiswa_mappings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mahasiswa_id')->unique()->constrained('mahasiswas')->onDelete('cascade');
            $table->string('pddikti_id')->nullable();
            $table->string('pddikti_nim')->nullable();
            $table->enum('status_mapping', ['unmapped', 'pending', 'mapped', 'error'])->default('unmapped');
            $table->timestamp('last_synced_at')->nullable();
            $table->string('last_action')->nullable();
            $table->text('last_message')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pddikti_mahasiswa_mappings');
    }
};
