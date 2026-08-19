<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Mahasiswa;
use App\Models\Dosen;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class UserManagementController extends Controller
{
    /**
     * Display a listing of all users for management
     */
    public function index(Request $request)
    {
        $query = User::query()->orderBy('created_at', 'desc');

        // Filter by role
        if ($request->has('role') && !empty($request->role)) {
            $query->where('role', $request->role);
        }

        // Search functionality
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $users = $query->with(['mahasiswa.prodi', 'dosen'])->paginate(15)->withQueryString();

        // Transform users to include additional info
        $users->through(function ($user) {
            $additionalInfo = [];
            
            if ($user->role === 'mahasiswa' && $user->mahasiswa) {
                $additionalInfo = [
                    'nim' => $user->mahasiswa->nim,
                    'prodi' => $user->mahasiswa->prodi?->nama_prodi ?? 'N/A',
                    'angkatan' => $user->mahasiswa->angkatan,
                    'status' => $user->mahasiswa->status,
                ];
            } elseif ($user->role === 'dosen' && $user->dosen) {
                $additionalInfo = [
                    'nip' => $user->dosen->nip,
                    'jabatan_akademik' => $user->dosen->jabatan_akademik,
                    'bidang_keahlian' => $user->dosen->bidang_keahlian,
                    'status' => $user->dosen->status,
                ];
            }

            $user->additional_info = $additionalInfo;
            return $user;
        });

        return Inertia::render('Admin/UserManagement/Index', [
            'users' => $users,
            'filters' => $request->only(['search', 'role']),
            'stats' => [
                'total_users' => User::count(),
                'total_mahasiswa' => User::where('role', 'mahasiswa')->count(),
                'total_dosen' => User::where('role', 'dosen')->count(),
                'total_admin' => User::where('role', 'admin')->count(),
            ]
        ]);
    }

    /**
     * Show form for resetting user password
     */
    public function showResetPasswordForm(User $user)
    {
        // Load related data
        $userData = $user->load(['mahasiswa.prodi', 'dosen']);
        
        return Inertia::render('Admin/UserManagement/ResetPassword', [
            'user' => $userData,
        ]);
    }

    /**
     * Reset user password
     */
    public function resetPassword(Request $request, User $user)
    {
        $request->validate([
            'password' => 'required|string|min:8|confirmed',
        ], [
            'password.required' => 'Password baru harus diisi.',
            'password.min' => 'Password minimal 8 karakter.',
            'password.confirmed' => 'Konfirmasi password tidak cocok.',
        ]);

        // Update password
        $user->update([
            'password' => Hash::make($request->password),
        ]);

        // Get user type for message
        $userType = match($user->role) {
            'mahasiswa' => 'mahasiswa',
            'dosen' => 'dosen',
            'admin' => 'admin',
            default => 'user'
        };

        return redirect()->route('admin.user-management.index')
            ->with('success', "Password {$userType} {$user->name} berhasil direset!");
    }

    /**
     * Bulk reset passwords
     */
    public function bulkResetPassword(Request $request)
    {
        $request->validate([
            'user_ids' => 'required|array|min:1',
            'user_ids.*' => 'exists:users,id',
            'password' => 'required|string|min:8|confirmed',
        ], [
            'user_ids.required' => 'Pilih minimal satu user.',
            'password.required' => 'Password baru harus diisi.',
            'password.min' => 'Password minimal 8 karakter.',
            'password.confirmed' => 'Konfirmasi password tidak cocok.',
        ]);

        $hashedPassword = Hash::make($request->password);
        
        // Update passwords for selected users
        $updatedCount = User::whereIn('id', $request->user_ids)
            ->update(['password' => $hashedPassword]);

        return redirect()->back()
            ->with('success', "Password {$updatedCount} user berhasil direset!");
    }

    /**
     * Generate random password for user
     */
    public function generateRandomPassword(User $user)
    {
        // Generate random password (8 characters, alphanumeric)
        $randomPassword = $this->generateRandomString(8);
        
        // Update password
        $user->update([
            'password' => Hash::make($randomPassword),
        ]);

        // Get user type for message
        $userType = match($user->role) {
            'mahasiswa' => 'mahasiswa',
            'dosen' => 'dosen',
            'admin' => 'admin',
            default => 'user'
        };

        return redirect()->back()
            ->with('success', "Password {$userType} {$user->name} berhasil direset!")
            ->with('generated_password', $randomPassword);
    }

    /**
     * Toggle user status (active/inactive)
     */
    public function toggleStatus(User $user)
    {
        // For mahasiswa and dosen, update their respective status
        if ($user->role === 'mahasiswa' && $user->mahasiswa) {
            $newStatus = $user->mahasiswa->status === 'aktif' ? 'nonaktif' : 'aktif';
            $user->mahasiswa->update(['status' => $newStatus]);
            
            return redirect()->back()
                ->with('success', "Status mahasiswa {$user->name} berhasil diubah menjadi {$newStatus}!");
                
        } elseif ($user->role === 'dosen' && $user->dosen) {
            $newStatus = $user->dosen->status === 'aktif' ? 'nonaktif' : 'aktif';
            $user->dosen->update(['status' => $newStatus]);
            
            return redirect()->back()
                ->with('success', "Status dosen {$user->name} berhasil diubah menjadi {$newStatus}!");
        }

        return redirect()->back()
            ->with('error', 'Status user tidak dapat diubah!');
    }

    /**
     * Generate random string for password
     */
    private function generateRandomString($length = 8)
    {
        $characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        $charactersLength = strlen($characters);
        $randomString = '';
        
        for ($i = 0; $i < $length; $i++) {
            $randomString .= $characters[rand(0, $charactersLength - 1)];
        }
        
        return $randomString;
    }

    /**
     * Export users data
     */
    public function export(Request $request)
    {
        $query = User::with(['mahasiswa.prodi', 'dosen'])->orderBy('role')->orderBy('name');

        // Apply filters
        if ($request->has('role') && !empty($request->role)) {
            $query->where('role', $request->role);
        }

        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $users = $query->get();

        $fileName = 'data_users_' . date('Y-m-d_H-i-s') . '.csv';
        
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $fileName . '"',
        ];

        $callback = function() use ($users) {
            $file = fopen('php://output', 'w');
            
            // Add BOM for Excel compatibility
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));
            
            // CSV header
            fputcsv($file, [
                'Nama',
                'Email',
                'Role',
                'NIM/NIP',
                'Program Studi/Bidang Keahlian',
                'Status',
                'Email Verified',
                'Tanggal Dibuat'
            ]);

            // Data rows
            foreach ($users as $user) {
                $nim_nip = '';
                $prodi_bidang = '';
                $status = '';

                if ($user->role === 'mahasiswa' && $user->mahasiswa) {
                    $nim_nip = $user->mahasiswa->nim;
                    $prodi_bidang = $user->mahasiswa->prodi?->nama_prodi ?? $user->mahasiswa->program_studi ?? '';
                    $status = ucfirst($user->mahasiswa->status ?? '');
                } elseif ($user->role === 'dosen' && $user->dosen) {
                    $nim_nip = $user->dosen->nip;
                    $prodi_bidang = $user->dosen->bidang_keahlian ?? '';
                    $status = ucfirst($user->dosen->status ?? '');
                }

                fputcsv($file, [
                    $user->name,
                    $user->email,
                    ucfirst($user->role),
                    $nim_nip,
                    $prodi_bidang,
                    $status,
                    $user->email_verified_at ? 'Verified' : 'Not Verified',
                    $user->created_at->format('Y-m-d H:i:s')
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
