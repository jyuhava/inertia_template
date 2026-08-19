<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Tymon\JWTAuth\Facades\JWTAuth;

class LmsLoginController extends Controller
{
    public function redirectToLms(Request $request)
    {
        $user = auth()->user(); // mahasiswa yg login di SIAKAD

        // Buat payload token
        $payload = [
            'email' => $user->email,
            'iat' => now()->timestamp,
            'exp' => now()->addSeconds(30)->timestamp, // berlaku 30 detik
        ];

        // Generate token JWT
        $token = JWTAuth::getJWTProvider()->encode($payload);

        // Redirect ke Moodle dengan token
        $redirectUrl = "https://learning.alwafi.ac.id/auth/siakadjwt/auth.php?token={$token}";
        return redirect()->away($redirectUrl);
    }
}
