<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckSuratKomitmen
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Only check for mahasiswa role
        if (auth()->check() && auth()->user()->role === 'mahasiswa') {
            $mahasiswa = auth()->user()->mahasiswa;
            
            // Allow access to surat komitmen routes and logout
            $allowedRoutes = [
                'mahasiswa.surat-komitmen.index',
                'mahasiswa.surat-komitmen.download', 
                'mahasiswa.surat-komitmen.upload',
                'mahasiswa.surat-komitmen.delete',
                'logout',
                'profile.edit',
                'profile.update',
                'profile.destroy',
                'password.update',
                'password.confirm'
            ];
            
            $currentRoute = $request->route()->getName();
            
            if (!in_array($currentRoute, $allowedRoutes)) {
                // Check if mahasiswa has uploaded surat komitmen
                if (!$mahasiswa || !$mahasiswa->hasUploadedKomitmen()) {
                    return redirect()->route('mahasiswa.surat-komitmen.index')
                        ->with('warning', 'Anda harus mengupload surat komitmen terlebih dahulu untuk mengakses fitur lainnya.');
                }
            }
        }

        return $next($request);
    }
}
