<?php

namespace App\Http\Controllers\Integrator;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

/**
 * Autentikasi Integrator untuk frontend yang berada pada subdomain terpisah.
 *
 * Modul integrator awalnya dirancang dipasang pada sub-path /integrator di
 * domain yang sama dengan SIAKAD, sehingga sesi Laravel ikut tersimpan di
 * browser yang sama. Karena frontend kini dilayani pada subdomain sendiri
 * (mis. feeder.alwafi.ac.id) sementara API tetap berada di domain SIAKAD,
 * cookie sesi tidak otomatis tersedia: operator perlu login dari halaman
 * integrator.
 *
 * Cookie XSRF-TOKEN hanya dapat dibaca JavaScript pada origin yang
 * mengaturnya, jadi dari subdomain lain token tidak bisa diambil lewat
 * document.cookie. Endpoint csrf() mengembalikan token sesi dalam bentuk JSON
 * agar frontend bisa mengirimkannya sebagai header X-CSRF-TOKEN; Laravel
 * membandingkan header tersebut langsung dengan token sesi.
 *
 * Endpoint ini berada di luar middleware auth:sanctum dan tidak menyentuh
 * data lain selain sesi operator.
 */
class AuthController extends Controller
{
    /** Token CSRF dalam bentuk JSON (lihat catatan pada docblock class). */
    public function csrf(Request $request): JsonResponse
    {
        // StartSession sudah dijalankan oleh middleware stateful Sanctum,
        // sehingga session()->token() selalu tersedia di titik ini.
        return response()->json([
            'token' => (string) $request->session()->token(),
        ]);
    }

    /**
     * Login operator integrator.
     *
     * Mengembalikan sesi dengan bentuk yang sama persis dengan GET /session
     * supaya frontend tidak perlu membedakan sumber datanya.
     */
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        if (! Auth::attempt($credentials, (bool) $request->boolean('remember'))) {
            throw ValidationException::withMessages([
                'email' => 'Email atau password salah.',
            ]);
        }

        $request->session()->regenerate();

        $user = $request->user();
        abort_unless(
            Gate::forUser($user)->allows('integrator-access'),
            403,
            'Akun ini tidak memiliki akses ke modul Integrator.',
        );

        return response()->json($this->sessionPayload($request));
    }

    /** Keluar dan mengakhiri sesi integrator. */
    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Sesi integrator telah diakhiri.']);
    }

    /** Bentuk payload sesi, sama dengan SessionController::show(). */
    private function sessionPayload(Request $request): array
    {
        $user = $request->user();

        return [
            'id' => $user->getAuthIdentifier(),
            'name' => (string) ($user->name ?? 'Operator'),
            'email' => (string) ($user->email ?? ''),
            'role' => (string) ($user->role ?? 'operator'),
            'permissions' => config('integrator.permissions', ['integrator.view']),
            'institution' => (string) config('integrator.institusi.nama_pt', config('app.name')),
            'mockMode' => false,
        ];
    }
}
