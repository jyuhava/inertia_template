<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse|HttpResponse
    {
        $request->authenticate();

        // Regenerate session id + token to avoid fixation, then force a hard
        // browser reload (Inertia::location) so no stale client-side state or
        // cached CSRF token from a previous account survives the switch.
        $request->session()->regenerate();
        $request->session()->regenerateToken();

        return Inertia::location(route('dashboard', absolute: false));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        // Log out, then fully invalidate and flush the session so no stale
        // auth/role data from the previous account survives. Regenerate the
        // CSRF token and force a hard browser reload to clear Inertia cache.
        Auth::guard('web')->logout();

        $request->session()->flush();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        // Drop any remember-me cookie explicitly.
        if ($request->hasCookie(Auth::guard('web')->getRecallerName())) {
            cookie()->queue(cookie()->forget(Auth::guard('web')->getRecallerName()));
        }

        return Inertia::location('/');
    }
}
