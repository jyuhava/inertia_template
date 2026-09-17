<?php

namespace App\Services\Krs;

use App\Models\StudentCourseRegistration;

class KrsAuditService
{
    public function log(StudentCourseRegistration $registration, string $action, ?array $before, ?array $after, ?string $reason = null, ?int $userId = null): void
    {
        $registration->audits()->create([
            'user_id' => $userId ?? auth()->id(),
            'action' => $action,
            'before' => $before,
            'after' => $after,
            'reason' => $reason,
        ]);
    }
}
