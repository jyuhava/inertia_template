<?php

namespace App\Http\Requests\Auth;

use App\Models\User;
use App\Models\Mahasiswa;
use App\Models\Dosen;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string'],
            'password' => ['required', 'string'],
        ];
    }

    /**
     * Attempt to authenticate the request's credentials.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();

        $loginInput = trim($this->input('email'));
        $password = $this->input('password');

        $user = null;

        // 1. If format is email, attempt lookup by email
        if (filter_var($loginInput, FILTER_VALIDATE_EMAIL)) {
            $user = User::where('email', $loginInput)->first();
        }

        // 2. Lookup by Mahasiswa NIM
        if (!$user) {
            $mahasiswa = Mahasiswa::where('nim', $loginInput)->first();
            if ($mahasiswa && $mahasiswa->user_id) {
                $user = $mahasiswa->user;
            }
        }

        // 3. Lookup by Dosen NIP
        if (!$user) {
            $dosen = Dosen::where('nip', $loginInput)->first();
            if ($dosen && $dosen->user_id) {
                $user = $dosen->user;
            }
        }

        // 4. Direct email lookup fallback (e.g. usernames or custom domains)
        if (!$user) {
            $user = User::where('email', $loginInput)->first();
        }

        if (! $user || ! Hash::check($password, $user->password)) {
            RateLimiter::hit($this->throttleKey());

            throw ValidationException::withMessages([
                'email' => trans('auth.failed'),
            ]);
        }

        // Check if mahasiswa or dosen account is nonaktif
        if ($user->role === 'mahasiswa' && $user->mahasiswa && $user->mahasiswa->status === 'nonaktif') {
            RateLimiter::hit($this->throttleKey());

            throw ValidationException::withMessages([
                'email' => 'Akun mahasiswa Anda sedang dinonaktifkan. Silakan hubungi admin.',
            ]);
        }

        if ($user->role === 'dosen' && $user->dosen && $user->dosen->status === 'nonaktif') {
            RateLimiter::hit($this->throttleKey());

            throw ValidationException::withMessages([
                'email' => 'Akun dosen Anda sedang dinonaktifkan. Silakan hubungi admin.',
            ]);
        }

        Auth::login($user, $this->boolean('remember'));

        RateLimiter::clear($this->throttleKey());
    }

    /**
     * Ensure the login request is not rate limited.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            'email' => trans('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    /**
     * Get the rate limiting throttle key for the request.
     */
    public function throttleKey(): string
    {
        return Str::transliterate(Str::lower($this->string('email')).'|'.$this->ip());
    }
}
