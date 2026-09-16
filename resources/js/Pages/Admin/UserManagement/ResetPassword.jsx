import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    KeyIcon,
    ArrowLeftIcon,
    EyeIcon,
    EyeSlashIcon,
    ShieldCheckIcon,
    UserIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
} from '@heroicons/react/24/outline';

function RoleBadge({ role }) {
    const config = {
        admin: {
            bg: 'bg-purple-50 text-purple-700 border-purple-200',
            label: 'Administrator',
        },
        mahasiswa: {
            bg: 'bg-sky-50 text-sky-700 border-sky-200',
            label: 'Mahasiswa',
        },
        dosen: {
            bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            label: 'Dosen',
        },
    };
    const c = config[role] || { bg: 'bg-slate-100 text-slate-700 border-slate-200', label: role || 'User' };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${c.bg}`}>
            {c.label}
        </span>
    );
}

export default function ResetPassword({ auth, user }) {
    const [data, setData] = useState({
        password: '',
        password_confirmation: '',
    });
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setErrors({});

        if (!data.password) {
            setErrors({ password: 'Password baru harus diisi.' });
            return;
        }
        if (data.password.length < 8) {
            setErrors({ password: 'Password minimal 8 karakter.' });
            return;
        }
        if (data.password !== data.password_confirmation) {
            setErrors({ password_confirmation: 'Konfirmasi password tidak cocok.' });
            return;
        }

        setIsLoading(true);
        router.put(route('admin.user-management.reset-password', user.id), data, {
            preserveScroll: true,
            onError: (errs) => {
                setErrors(errs);
                setIsLoading(false);
            },
            onFinish: () => {
                setIsLoading(false);
            },
        });
    };

    const getUserInfo = () => {
        if (user.role === 'mahasiswa' && user.mahasiswa) {
            return {
                idLabel: 'NIM',
                idValue: user.mahasiswa.nim || '-',
                detailLabel: 'Program Studi',
                detailValue: user.mahasiswa.prodi?.nama_prodi || 'N/A',
                subLabel: 'Angkatan',
                subValue: user.mahasiswa.angkatan || '-',
                status: user.mahasiswa.status || 'aktif',
            };
        }
        if (user.role === 'dosen' && user.dosen) {
            return {
                idLabel: 'NIP',
                idValue: user.dosen.nip || '-',
                detailLabel: 'Bidang Keahlian',
                detailValue: user.dosen.bidang_keahlian || '-',
                subLabel: 'Jabatan',
                subValue: user.dosen.jabatan_akademik || '-',
                status: user.dosen.status || 'aktif',
            };
        }
        return {
            idLabel: 'ID User',
            idValue: `#${user.id}`,
            detailLabel: 'Hak Akses',
            detailValue: 'Admin Utama Sistem',
            subLabel: '',
            subValue: '',
            status: 'aktif',
        };
    };

    const userInfo = getUserInfo();

    return (
        <AdminLayout title="Reset Password Pengguna">
            <Head title={`Reset Password - ${user.name}`} />

            <div className="space-y-3.5 max-w-4xl mx-auto">
                {/* Header with Back button */}
                <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 sm:p-4 shadow-xs">
                    <Link
                        href={route('admin.user-management.index')}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors"
                        title="Kembali ke Daftar Pengguna"
                    >
                        <ArrowLeftIcon className="h-4 w-4" />
                    </Link>
                    <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                            Manajemen Akun Pengguna
                        </p>
                        <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                            Reset Password: {user.name}
                        </h1>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    {/* Left Column: Compact Profile Card */}
                    <div className="md:col-span-1 rounded-lg border border-slate-200 bg-white p-4 shadow-xs space-y-4">
                        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-slate-100 text-sm font-bold text-slate-700 border border-slate-200">
                                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-xs font-bold text-slate-900 truncate">{user.name}</h3>
                                <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                                <div className="mt-1">
                                    <RoleBadge role={user.role} />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 text-xs">
                            <div className="flex items-center justify-between py-1 border-b border-slate-50">
                                <span className="text-slate-400">{userInfo.idLabel}</span>
                                <span className="font-mono font-bold text-slate-800">{userInfo.idValue}</span>
                            </div>

                            <div className="flex items-start justify-between py-1 border-b border-slate-50 gap-2">
                                <span className="text-slate-400 shrink-0">{userInfo.detailLabel}</span>
                                <span className="font-medium text-slate-800 text-right truncate max-w-[150px]">
                                    {userInfo.detailValue}
                                </span>
                            </div>

                            {userInfo.subLabel && (
                                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                                    <span className="text-slate-400">{userInfo.subLabel}</span>
                                    <span className="font-medium text-slate-800">{userInfo.subValue}</span>
                                </div>
                            )}

                            <div className="flex items-center justify-between py-1 border-b border-slate-50">
                                <span className="text-slate-400">Status</span>
                                <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                        userInfo.status === 'aktif'
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                            : 'bg-rose-50 text-rose-700 border-rose-200'
                                    }`}
                                >
                                    {userInfo.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                                </span>
                            </div>

                            <div className="flex items-center justify-between py-1">
                                <span className="text-slate-400">Verifikasi Email</span>
                                <span className="font-medium text-slate-800">
                                    {user.email_verified_at ? 'Terverifikasi' : 'Belum'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Reset Password Form */}
                    <div className="md:col-span-2 rounded-lg border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
                        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
                            <KeyIcon className="h-4 w-4 text-indigo-600" />
                            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Form Password Baru</h2>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                                    Password Baru *
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={data.password}
                                        onChange={(e) => setData({ ...data, password: e.target.value })}
                                        disabled={isLoading}
                                        placeholder="Masukkan password baru (minimal 8 karakter)"
                                        className={`w-full rounded-md border py-2 pl-3 pr-10 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 ${
                                            errors.password
                                                ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500'
                                                : 'border-slate-300 focus:border-indigo-600 focus:ring-indigo-600'
                                        }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="mt-1 text-[11px] text-rose-600 font-medium">{errors.password}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                                    Konfirmasi Password Baru *
                                </label>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={data.password_confirmation}
                                    onChange={(e) => setData({ ...data, password_confirmation: e.target.value })}
                                    disabled={isLoading}
                                    placeholder="Ketik ulang password baru untuk konfirmasi"
                                    className={`w-full rounded-md border py-2 px-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 ${
                                        errors.password_confirmation
                                            ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500'
                                            : 'border-slate-300 focus:border-indigo-600 focus:ring-indigo-600'
                                    }`}
                                />
                                {errors.password_confirmation && (
                                    <p className="mt-1 text-[11px] text-rose-600 font-medium">{errors.password_confirmation}</p>
                                )}
                            </div>

                            {/* Info Box */}
                            <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-xs text-slate-600 space-y-1.5">
                                <div className="flex items-center gap-1.5 font-semibold text-slate-800 text-[11px]">
                                    <ShieldCheckIcon className="h-4 w-4 text-indigo-600" />
                                    <span>Ketentuan & Informasi Keamanan:</span>
                                </div>
                                <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-500">
                                    <li>Password baru akan langsung aktif dan berlaku saat ini juga.</li>
                                    <li>Sesi login pengguna sebelumnya akan otomatis terputus (*logged out*).</li>
                                    <li>Sampaikan password baru secara aman kepada pengguna terkait.</li>
                                </ul>
                            </div>

                            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                                <Link
                                    href={route('admin.user-management.index')}
                                    className="rounded-md border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                    Batal
                                </Link>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                >
                                    <KeyIcon className="h-3.5 w-3.5" />
                                    <span>{isLoading ? 'Menyimpan...' : 'Simpan Password Baru'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
