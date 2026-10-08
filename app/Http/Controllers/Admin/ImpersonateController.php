<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Dosen;
use App\Models\Mahasiswa;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

/**
 * Impersonasi akun (login-as) oleh admin.
 *
 * Aturan keamanan:
 * - Hanya admin yang boleh memanggil (route berada di group role:admin).
 * - Target hanya mahasiswa atau dosen; admin tidak boleh mengimpersonasi
 *   admin lain (mencegah rantai hak akses & admin mengunci dirinya sendiri).
 * - Sesi di-regenerate setiap kali berganti akun.
 * - Setiap mulai/berhenti impersonasi dicatat di log aplikasi.
 */
class ImpersonateController extends Controller
{
    public const SESSION_KEY = 'impersonator_id';

    public const ALLOWED_ROLES = ['mahasiswa', 'dosen'];

    /**
     * Mulai berpindah ke akun mahasiswa/dosen.
     */
    public function store(Request $request, string $type)
    {
        $target = $this->resolveTarget($type, $request);

        if (! $target) {
            return back()->with('error', 'Akun tujuan tidak ditemukan atau tidak memiliki akses masuk.');
        }

        if (in_array($target->role, ['admin'], true)) {
            return back()->with('error', 'Akun admin tidak dapat diimpersonasi.');
        }

        if ($target->id === $request->user()->id) {
            return back()->with('error', 'Anda sudah berada di akun tersebut.');
        }

        $admin = $request->user();

        $request->session()->put(self::SESSION_KEY, [
            'id' => $admin->id,
            'name' => $admin->name,
            'email' => $admin->email,
        ]);

        Auth::login($target);
        $request->session()->regenerate();

        Log::info('Impersonasi dimulai', [
            'admin_id' => $admin->id,
            'admin_name' => $admin->name,
            'target_id' => $target->id,
            'target_name' => $target->name,
            'target_role' => $target->role,
            'ip' => $request->ip(),
        ]);

        return redirect()->route($target->role === 'mahasiswa' ? 'mahasiswa.dashboard' : 'dosen.dashboard')
            ->with('success', 'Anda kini/login sebagai '.$target->name.'.');
    }

    /**
     * Kembali ke akun admin asli.
     */
    public function destroy(Request $request)
    {
        $impersonator = $request->session()->get(self::SESSION_KEY);

        if (! $impersonator) {
            return back()->with('error', 'Tidak sedang melakukan impersonasi.');
        }

        $admin = User::where('role', 'admin')->find($impersonator['id']);

        if (! $admin) {
            $request->session()->forget(self::SESSION_KEY);
            Auth::logout();
            $request->session()->regenerate();

            return redirect()->route('login')->with('error', 'Akun admin asal tidak ditemukan. Silakan login kembali.');
        }

        $targetName = $request->user()?->name;
        $targetRole = $request->user()?->role;

        Auth::login($admin);
        $request->session()->forget(self::SESSION_KEY);
        $request->session()->regenerate();

        Log::info('Impersonasi dihentikan', [
            'admin_id' => $admin->id,
            'target_name' => $targetName,
            'target_role' => $targetRole,
            'ip' => $request->ip(),
        ]);

        return redirect()->route('admin.dashboard')
            ->with('success', 'Anda kembali ke akun admin.');
    }

    /**
     * Cari akun tujuan berdasarkan tipe (mahasiswa/dosen) dan id.
     */
    private function resolveTarget(string $type, Request $request): ?User
    {
        $validator = validator(['id' => $request->route('id')], [
            'id' => 'required|integer|min:1',
        ]);

        if ($validator->fails()) {
            return null;
        }

        $id = (int) $request->route('id');

        if ($type === 'mahasiswa') {
            return Mahasiswa::with('user')->find($id)?->user;
        }

        if ($type === 'dosen') {
            return Dosen::with('user')->find($id)?->user;
        }

        return null;
    }
}
