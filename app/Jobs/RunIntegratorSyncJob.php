<?php

namespace App\Jobs;

use App\Services\Integrator\IntegratorSyncService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class RunIntegratorSyncJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;

    public function __construct(public readonly string $syncJobId)
    {
        $this->onQueue((string) config('integrator.sync.queue', 'default'));
    }

    public function handle(IntegratorSyncService $sync): void
    {
        $sync->run($this->syncJobId);
    }
}
