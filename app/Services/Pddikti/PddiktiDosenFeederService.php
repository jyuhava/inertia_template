<?php

namespace App\Services\Pddikti;

use App\Models\Dosen;
use App\Models\PddiktiDosenMapping;
use App\Models\PddiktiDosenSyncLog;

class PddiktiDosenFeederService
{
    public function isConfigured(): bool
    {
        return false;
    }

    public function sync(Dosen $dosen, string $action = 'SYNC'): PddiktiDosenSyncLog
    {
        $mapping = PddiktiDosenMapping::firstOrCreate(['dosen_id' => $dosen->id], ['status_mapping' => 'unmapped']);
        $message = 'Integrasi PDDikti/Neo Feeder belum dikonfigurasi. Client resmi, endpoint, kredensial, dan kontrak layanan diperlukan sebelum sinkronisasi dijalankan.';
        $log = PddiktiDosenSyncLog::create(['dosen_id' => $dosen->id, 'pddikti_id' => $mapping->pddikti_id, 'action' => $action, 'status' => 'failed', 'message' => $message]);
        $mapping->update(['status_mapping' => 'error', 'last_synced_at' => now(), 'last_action' => $action, 'last_message' => $message]);

        return $log;
    }
}
