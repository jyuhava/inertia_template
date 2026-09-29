<?php

namespace App\Http\Controllers\Integrator;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SessionController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'id' => $user->getAuthIdentifier(),
            'name' => (string) ($user->name ?? 'Operator'),
            'email' => (string) ($user->email ?? ''),
            'role' => (string) ($user->role ?? 'operator'),
            'permissions' => config('integrator.permissions', ['integrator.view']),
            'institution' => (string) config('integrator.institusi.nama_pt', config('app.name')),
            'mockMode' => false,
        ]);
    }
}
