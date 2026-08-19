<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $authData = null;

        if ($user) {
            $authData = [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ];

            // Load mahasiswa data with prodi relation if user is mahasiswa
            if ($user->role === 'mahasiswa') {
                $authData['mahasiswa'] = $user->mahasiswa()->with('prodi')->first();
            }

            // Load dosen data if user is dosen
            if ($user->role === 'dosen') {
                $authData['dosen'] = $user->dosen;
            }
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $authData,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ];
    }
}
