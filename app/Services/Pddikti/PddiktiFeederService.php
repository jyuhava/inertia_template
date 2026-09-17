<?php

namespace App\Services\Pddikti;

use App\Models\Mahasiswa;
use App\Models\PddiktiMahasiswaMapping;
use App\Models\PddiktiSyncLog;

/**
 * Integration boundary for PDDikti / Neo Feeder.
 *
 * IMPORTANT: No PDDikti / Neo Feeder client, endpoint, or request/response
 * contract exists anywhere else in this repository. This class intentionally
 * does NOT call any external API — inventing one would misrepresent sync
 * results to administrators. It exists so:
 *   - the database structure (mapping + sync log) is ready to receive real
 *     sync results once an official Neo Feeder client/credentials are wired in,
 *   - admin UI can trigger a "sync" action and get a clear, honest response
 *     instead of a fake success,
 *   - a future implementation only has to fill in `push()` / `pull()` with the
 *     real Neo Feeder SOAP/REST client and swap this class via the
 *     container/service binding.
 *
 * DO NOT report a successful sync from this class. Every call must be logged
 * truthfully via PddiktiSyncLog, and secrets/credentials must never be written
 * to payload/response/message fields.
 */
class PddiktiFeederService
{
    /**
     * Whether a real Neo Feeder client is configured for this environment.
     */
    public function isConfigured(): bool
    {
        return false;
    }

    /**
     * Attempt to sync a mahasiswa's biodata to PDDikti/Neo Feeder.
     *
     * Always logs the attempt. Returns without claiming success because no
     * real client is implemented yet.
     */
    public function sync(Mahasiswa $mahasiswa, string $action = 'SYNC'): PddiktiSyncLog
    {
        $mapping = PddiktiMahasiswaMapping::firstOrCreate(
            ['mahasiswa_id' => $mahasiswa->id],
            ['status_mapping' => 'unmapped']
        );

        $message = 'Integrasi PDDikti/Neo Feeder belum dikonfigurasi. '
            . 'Hubungi tim teknis untuk memasang client resmi sebelum sinkronisasi dapat dijalankan.';

        $log = PddiktiSyncLog::create([
            'mahasiswa_id' => $mahasiswa->id,
            'pddikti_id' => $mapping->pddikti_id,
            'action' => $action,
            'payload' => null,
            'response' => null,
            'status' => 'failed',
            'message' => $message,
            'created_at' => now(),
        ]);

        $mapping->update([
            'status_mapping' => 'error',
            'last_synced_at' => now(),
            'last_action' => $action,
            'last_message' => $message,
        ]);

        return $log;
    }
}
