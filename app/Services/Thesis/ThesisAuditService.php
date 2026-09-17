<?php

namespace App\Services\Thesis;

use Illuminate\Database\Eloquent\Model;

class ThesisAuditService
{
    public function log(Model $model, string $action, ?array $before = null, ?array $after = null, ?string $reason = null, ?int $userId = null): void
    {
        $model->audits()->create([
            'user_id' => $userId ?? auth()->id(),
            'action' => $action,
            'before' => $before,
            'after' => $after,
            'reason' => $reason,
        ]);
    }
}
