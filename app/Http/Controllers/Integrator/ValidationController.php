<?php

namespace App\Http\Controllers\Integrator;

use App\Http\Controllers\Controller;
use App\Services\Integrator\IntegratorEntityRegistry;
use App\Services\Integrator\IntegratorEntityService;
use App\Services\Integrator\IntegratorValidationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ValidationController extends Controller
{
    public function __construct(
        private readonly IntegratorEntityService $entities,
        private readonly IntegratorValidationService $validator,
    ) {}

    public function summary(): JsonResponse
    {
        $summaries = [];
        $totals = ['total' => 0, 'valid' => 0, 'critical' => 0, 'error' => 0, 'warning' => 0, 'info' => 0, 'conflict' => 0];

        foreach (IntegratorEntityRegistry::keys() as $entity) {
            $counts = ['critical' => 0, 'error' => 0, 'warning' => 0, 'info' => 0];
            $invalidIds = [];
            $rowCount = 0;
            $this->entities->scanRows($entity, function (array $row) use ($entity, &$counts, &$invalidIds, &$rowCount): void {
                $rowCount++;
                foreach ($this->validator->validateRow($entity, $row) as $issue) {
                    $severity = $issue['severity'];
                    if (isset($counts[$severity])) {
                        $counts[$severity]++;
                    }
                    if (in_array($severity, ['critical', 'error'], true)) {
                        $invalidIds[$issue['localId']] = true;
                    }
                }
            });

            $summary = [
                'entity' => $entity,
                'total' => $rowCount,
                'valid' => max(0, $rowCount - count($invalidIds)),
                'critical' => $counts['critical'],
                'error' => $counts['error'],
                'warning' => $counts['warning'],
                'info' => $counts['info'],
                'conflict' => 0,
            ];
            $summaries[] = $summary;
            foreach ($totals as $key => $value) {
                $totals[$key] += $summary[$key];
            }
        }

        return response()->json(['summaries' => $summaries, 'totals' => $totals]);
    }

    public function issues(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'page' => ['sometimes', 'integer', 'min:1'],
            'perPage' => ['sometimes', 'integer', 'min:1', 'max:250'],
            'search' => ['sometimes', 'nullable', 'string', 'max:200'],
            'entity' => ['sometimes', 'nullable', 'string', 'max:40'],
            'severity' => ['sometimes', 'nullable', 'in:critical,error,warning,info'],
        ]);
        $entities = isset($validated['entity']) && $validated['entity'] !== ''
            ? [$validated['entity']]
            : IntegratorEntityRegistry::keys();
        foreach ($entities as $entity) {
            abort_unless(IntegratorEntityRegistry::exists($entity), 422, 'Entitas filter tidak dikenal.');
        }

        $page = max(1, (int) ($validated['page'] ?? 1));
        $perPage = max(1, min(250, (int) ($validated['perPage'] ?? 50)));
        $start = ($page - 1) * $perPage;
        $end = $start + $perPage;
        $search = mb_strtolower(trim((string) ($validated['search'] ?? '')));
        $severityFilter = (string) ($validated['severity'] ?? '');
        $matchedCount = 0;
        $pageIssues = [];
        $grouped = [];

        foreach ($entities as $entity) {
            $this->entities->scanRows($entity, function (array $row) use ($entity, $search, $severityFilter, $start, $end, &$matchedCount, &$pageIssues, &$grouped): void {
                foreach ($this->validator->validateRow($entity, $row) as $issue) {
                    if ($severityFilter !== '' && $issue['severity'] !== $severityFilter) {
                        continue;
                    }
                    if ($search !== '' && ! str_contains(mb_strtolower(implode(' ', [
                        (string) $issue['localLabel'],
                        (string) $issue['code'],
                        (string) $issue['message'],
                        (string) $issue['entity'],
                    ])), $search)) {
                        continue;
                    }

                    $key = implode('|', [$issue['entity'], $issue['code'], $issue['severity']]);
                    $grouped[$key] ??= [
                        'code' => $issue['code'],
                        'message' => $issue['message'],
                        'entity' => $issue['entity'],
                        'severity' => $issue['severity'],
                        'count' => 0,
                    ];
                    $grouped[$key]['count']++;
                    if ($matchedCount >= $start && $matchedCount < $end) {
                        $pageIssues[] = $issue;
                    }
                    $matchedCount++;
                }
            });
        }

        $grouped = array_values($grouped);
        usort($grouped, static fn (array $left, array $right): int => $right['count'] <=> $left['count']);

        return response()->json([
            'data' => $pageIssues,
            'meta' => ['page' => $page, 'perPage' => $perPage, 'total' => $matchedCount, 'lastPage' => max(1, (int) ceil($matchedCount / $perPage))],
            'grouped' => $grouped,
        ]);
    }
}
