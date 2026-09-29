<?php

namespace App\Services\Integrator;

use App\Models\IntegratorAuditEvent;
use Illuminate\Http\Request;

class IntegratorAuditService
{
    /** @param array<string, mixed>|null $result */
    public function record(
        Request $request,
        string $eventType,
        ?string $entity = null,
        ?string $localId = null,
        int $dataCount = 0,
        int $successCount = 0,
        int $failedCount = 0,
        ?array $result = null,
    ): void {
        IntegratorAuditEvent::query()->create([
            'user_id' => $request->user()?->getAuthIdentifier(),
            'event_type' => $eventType,
            'entity' => $entity,
            'local_id' => $localId,
            'data_count' => max(0, $dataCount),
            'success_count' => max(0, $successCount),
            'failed_count' => max(0, $failedCount),
            'result' => $result === null ? null : SensitiveDataSanitizer::sanitize($result),
        ]);
    }
}
