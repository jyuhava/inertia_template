<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\PeriodePmb;
use App\Models\Prodi;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        \Log::info('=== RegisteredUserController create method called ===');
        \Log::info('Request URL: ' . request()->fullUrl());
        
        // Get active PMB period
        $periodePmb = PeriodePmb::berlangsung()->first();
        \Log::info('PMB period found in register: ' . ($periodePmb ? $periodePmb->nama_periode : 'None'));
        
        // Get active program studi
        $prodis = Prodi::where('status', 'aktif')->orderBy('nama_prodi')->get();
        \Log::info('Prodis count in register: ' . $prodis->count());

        \Log::info('Rendering Auth/Register page');
        return Inertia::render('Auth/Register', [
            'periodePmb' => $periodePmb,
            'prodis' => $prodis,
        ]);
    }

    /**
     * Handle an incoming registration request.
     * Redirect to PMB registration form.
     */
    public function store(Request $request): RedirectResponse
    {
        \Log::info('=== RegisteredUserController store method called ===');
        \Log::info('Redirecting to PMB create route');
        
        // Redirect to PMB registration form instead of creating user account
        return redirect()->route('pmb.create')->with('info', 
            'Silakan lengkapi formulir pendaftaran mahasiswa baru berikut ini.'
        );
    }
}
