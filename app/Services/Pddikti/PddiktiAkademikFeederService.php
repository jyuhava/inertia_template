<?php

namespace App\Services\Pddikti;

use App\Models\PddiktiAkademikMapping;
use App\Models\PddiktiAkademikSyncLog;
use Illuminate\Database\Eloquent\Model;

/**
 * Integration boundary for PDDikti / Neo Feeder reporting of academic
 * entities (mata kuliah, kurikulum, mata kuliah kurikulum, kelas kuliah).
 *
 * IMPORTANT: no Neo Feeder client, endpoint, or request/response contract
 * exists anywhere in this repository (confirmed during the Modul
 * Mahasiswa/Dosen audits, and re-confirmed here). This class intentionally
 * does NOT call any external API. It exists so the mapping/sync-log tables
 * are ready to receive real results once an official client is wired in.
 *
 * DO NOT report a successful sync from this class. Every call is logged
 * truthfully, and secrets/credentials must never be written to
 * payload/response/message fields.
 */
class PddiktiAkademikFeederService
{
    public function isConfigured(): bool
    {
        return false;
    }

    public function sync(Model $entity, string $action = 'SYNC'): PddiktiAkademikSyncLog
    {
        $entityType = $entity::class;
        $mapping = PddiktiAkademikMapping::firstOrCreate(
            ['entity_type' => $entityType, 'entity_id' => $entity->getKey()],
            ['sync_status' => 'not_synced']
        );

        $message = 'Integrasi PDDikti/Neo Feeder belum dikonfigurasi untuk entitas akademik ini. '
            .'Hubungi tim teknis untuk memasang client resmi sebelum sinkronisasi dapat dijalankan.';

        $log = PddiktiAkademikSyncLog::create([
            'entity_type' => $entityType,
            'entity_id' => $entity->getKey(),
            'external_id' => $mapping->external_id,
            'action' => $action,
            'status' => 'failed',
            'message' => $message,
            'synced_at' => now(),
        ]);

        $mapping->update([
            'sync_status' => 'failed',
            'last_synced_at' => now(),
            'last_sync_action' => $action,
            'last_sync_message' => $message,
        ]);

        return $log;
    }
}
