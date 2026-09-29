<?php

namespace App\Http\Controllers\Integrator;

use App\Http\Controllers\Controller;
use App\Services\Integrator\IntegratorEntityRegistry;
use App\Services\Integrator\IntegratorEntityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EntityController extends Controller
{
    public function __construct(private readonly IntegratorEntityService $entities) {}

    public function index(Request $request, string $entity): JsonResponse
    {
        $this->assertEntity($entity);

        return response()->json($this->entities->list($entity, $request->query()));
    }

    public function show(string $entity, string $id): JsonResponse
    {
        $this->assertEntity($entity);

        return response()->json($this->entities->detail($entity, $id));
    }

    public function preview(Request $request, string $entity): JsonResponse
    {
        $this->assertEntity($entity);
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1', 'max:500'],
            'ids.*' => ['required', 'string', 'max:191'],
            'dryRun' => ['sometimes', 'boolean'],
        ]);

        return response()->json($this->entities->preview($entity, $validated['ids'], (bool) ($validated['dryRun'] ?? true)));
    }

    public function validate(Request $request, string $entity): JsonResponse
    {
        $this->assertEntity($entity);
        $validated = $request->validate([
            'ids' => ['sometimes', 'array', 'max:500'],
            'ids.*' => ['required', 'string', 'max:191'],
        ]);

        return response()->json($this->entities->validate($entity, $validated['ids'] ?? []));
    }

    public function compare(Request $request, string $entity): JsonResponse
    {
        $this->assertEntity($entity);
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1', 'max:500'],
            'ids.*' => ['required', 'string', 'max:191'],
        ]);

        return response()->json($this->entities->compare($entity, $validated['ids']));
    }

    private function assertEntity(string $entity): void
    {
        abort_unless(IntegratorEntityRegistry::exists($entity), 404, 'Entitas integrator tidak dikenal.');
    }
}
