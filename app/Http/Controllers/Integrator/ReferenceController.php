<?php

namespace App\Http\Controllers\Integrator;

use App\Http\Controllers\Controller;
use App\Services\Integrator\IntegratorReferenceRegistry;
use App\Services\Integrator\IntegratorReferenceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReferenceController extends Controller
{
    public function __construct(private readonly IntegratorReferenceService $references) {}

    public function summary(): JsonResponse
    {
        return response()->json($this->references->summary());
    }

    public function list(Request $request, string $key): JsonResponse
    {
        abort_unless(IntegratorReferenceRegistry::exists($key), 404, 'Referensi tidak dikenal.');
        $validated = $request->validate([
            'page' => ['sometimes', 'integer', 'min:1'],
            'perPage' => ['sometimes', 'integer', 'min:1', 'max:250'],
            'search' => ['sometimes', 'nullable', 'string', 'max:200'],
            'unmappedOnly' => ['sometimes', 'boolean'],
            'prodiId' => ['sometimes', 'nullable', 'integer', 'min:1'],
        ]);

        return response()->json($this->references->list($key, $validated));
    }
}
