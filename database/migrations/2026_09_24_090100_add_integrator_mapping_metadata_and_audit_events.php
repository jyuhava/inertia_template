<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $columns = [
            'pddikti_mahasiswa_mappings' => [
                'external_label' => fn (Blueprint $table) => $table->string('external_label')->nullable(),
                'mapping_type' => fn (Blueprint $table) => $table->string('mapping_type', 20)->nullable(),
                'confidence' => fn (Blueprint $table) => $table->unsignedTinyInteger('confidence')->nullable(),
            ],
            'pddikti_dosen_mappings' => [
                'external_label' => fn (Blueprint $table) => $table->string('external_label')->nullable(),
                'mapping_type' => fn (Blueprint $table) => $table->string('mapping_type', 20)->nullable(),
                'confidence' => fn (Blueprint $table) => $table->unsignedTinyInteger('confidence')->nullable(),
            ],
            'pddikti_akademik_mappings' => [
                'external_code' => fn (Blueprint $table) => $table->string('external_code')->nullable(),
                'external_label' => fn (Blueprint $table) => $table->string('external_label')->nullable(),
                'mapping_type' => fn (Blueprint $table) => $table->string('mapping_type', 20)->nullable(),
                'confidence' => fn (Blueprint $table) => $table->unsignedTinyInteger('confidence')->nullable(),
            ],
        ];

        foreach ($columns as $tableName => $definitions) {
            if (! Schema::hasTable($tableName)) {
                continue;
            }

            foreach ($definitions as $column => $definition) {
                if (Schema::hasColumn($tableName, $column)) {
                    continue;
                }

                Schema::table($tableName, static function (Blueprint $table) use ($definition): void {
                    $definition($table);
                });
            }
        }

        Schema::create('integrator_audit_events', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('event_type', 50);
            $table->string('entity', 40)->nullable();
            $table->string('local_id')->nullable();
            $table->unsignedInteger('data_count')->default(0);
            $table->unsignedInteger('success_count')->default(0);
            $table->unsignedInteger('failed_count')->default(0);
            $table->json('result')->nullable();
            $table->timestamps();
            $table->index(['entity', 'event_type', 'created_at'], 'integrator_audit_entity_event_idx');
            $table->index('created_at', 'integrator_audit_created_at_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('integrator_audit_events');

        $columns = [
            'pddikti_mahasiswa_mappings' => ['external_label', 'mapping_type', 'confidence'],
            'pddikti_dosen_mappings' => ['external_label', 'mapping_type', 'confidence'],
            'pddikti_akademik_mappings' => ['external_code', 'external_label', 'mapping_type', 'confidence'],
        ];

        foreach ($columns as $tableName => $names) {
            if (! Schema::hasTable($tableName)) {
                continue;
            }

            foreach ($names as $column) {
                if (Schema::hasColumn($tableName, $column)) {
                    Schema::table($tableName, static function (Blueprint $table) use ($column): void {
                        $table->dropColumn($column);
                    });
                }
            }
        }
    }
};
