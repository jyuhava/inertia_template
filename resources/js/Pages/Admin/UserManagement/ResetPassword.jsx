import { useState } from 'react';
import { Head } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    KeyIcon,
    UserIcon,
    ArrowLeftIcon,
} from '@heroicons/react/24/outline';

function Box({ children, className = '', padded = true, variant = 'white' }) {
    const variants = {
        white: 'bg-white border-neutral-200',
        gray: 'bg-neutral-50 border-neutral-200',
        black: 'bg-black text-white border-black',
    };
    return (
        <div className={`border ${variants[variant]} ${padded ? 'p-6' : ''} ${className}`}>
            {children}
        </div>
    );
}

function SectionTitle({ children, action }) {
    return (
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-900">{children}</h3>
            {action && <div>{action}</div>}
        </div>
    );
}

function ActionButton({ children, href, onClick, variant = 'primary', type = 'button', disabled = false }) {
    const map = {
        primary: 'bg-black text-white border-black hover:bg-neutral-800 disabled:bg-neutral-400 disabled:border-neutral-400',
        secondary: 'bg-white text-neutral-900 border-neutral-300 hover:bg-neutral-50',
        danger: 'bg-white text-red-600 border-red-200 hover:bg-red-50',
    };
    const className = `inline-flex items-center border px-4 py-2 text-[11px] font-bold uppercase tracking-widest transition-colors ${map[variant]} ${disabled ? 'cursor-not-allowed' : ''}`;
    if (href) {
        return (
            <a href={href} className={className}>
                {children}
            </a>
        );
    }
    return (
        <button type={type} onClick={onClick} disabled={disabled} className={className}>
            {children}
        </button>
    );
}

function InputLabel({ children, htmlFor }) {
    return (
        <label htmlFor={htmlFor} className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1.5">
            {children}
        </label>
    );
}

function TextInput({ id, type = 'text', value, onChange, error, ...props }) {
    return (
        <input
            id={id}
            type={type}
            value={value}
            onChange={onChange}
            className={`block w-full border px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-black focus:outline-none ${
                error ? 'border-red-300' : 'border-neutral-300'
            }`}
            {...props}
        />
    );
}

function RoleBadge({ role }) {
    const map = {
        admin: 'bg-black text-white border-black',
        mahasiswa: 'bg-neutral-100 text-neutral-700 border-neutral-200',
        dosen: 'bg-neutral-100 text-neutral-700 border-neutral-200',
    };
    return (
        <span className={`inline-flex border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${map[role] || 'bg-neutral-100 text-neutral-700 border-neutral-200'}`}>
            {role.charAt(0).toUpperCase() + role.slice(1)}
        </span>
    );
}

function DetailRow({ label, value }) {
    return (
        <div className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0">
            <span className="text-xs text-neutral-500">{label}</span>
            <span className="text-sm font-medium text-neutral-900">{value}</span>
        </div>
    );
}

export default function ResetPassword({ auth, user }) {
    const [data, setData] = useState({
        password: '',
        password_confirmation: '',
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsLoading(true);

        router.put(route('admin.user-management.reset-password', user.id), data, {
            onError: (errors) => {
                setErrors(errors);
                setIsLoading(false);
            },
            onSuccess: () => {
                setIsLoading(false);
            },
        });
    };

    const getUserInfo = () => {
        if (user.role === 'mahasiswa' && user.mahasiswa) {
            return {
                identifier: user.mahasiswa.nim,
                detail: user.mahasiswa.prodi?.nama_prodi || 'N/A',
                extra: `Angkatan ${user.mahasiswa.angkatan}`,
            };
        } else if (user.role === 'dosen' && user.dosen) {
            return {
                identifier: user.dosen.nip,
                detail: user.dosen.bidang_keahlian,
                extra: user.dosen.jabatan_akademik,
            };
        }
        return {
            identifier: '-',
            detail: '-',
            extra: '-',
        };
    };

    const userInfo = getUserInfo();

    return (
        <AdminLayout title="Reset Password">
            <Head title={`Reset Password - ${user.name}`} />

            <div className="space-y-6">
                {/* Header */}
                <Box variant="black" className="flex items-center gap-4">
                    <a
                        href={route('admin.user-management.index')}
                        className="text-neutral-400 hover:text-white transition-colors"
                    >
                        <ArrowLeftIcon className="h-5 w-5" />
                    </a>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Manajemen User</p>
                        <h1 className="text-xl font-bold text-white">Reset Password - {user.name}</h1>
                    </div>
                </Box>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* User Info */}
                    <Box className="lg:col-span-1">
                        <SectionTitle>Informasi User</SectionTitle>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-10 w-10 bg-neutral-100 border border-neutral-200 flex items-center justify-center">
                                <UserIcon className="h-6 w-6 text-neutral-500" />
                            </div>
                            <div>
                                <div className="text-sm font-bold text-neutral-900">{user.name}</div>
                                <div className="text-xs text-neutral-500">{user.email}</div>
                            </div>
                        </div>

                        <div className="space-y-1 mb-6">
                            <DetailRow label="Role" value={<RoleBadge role={user.role} />} />
                            {userInfo.identifier !== '-' && (
                                <DetailRow label={user.role === 'mahasiswa' ? 'NIM' : 'NIP'} value={userInfo.identifier} />
                            )}
                            {userInfo.detail !== '-' && (
                                <DetailRow label={user.role === 'mahasiswa' ? 'Prodi' : 'Bidang'} value={userInfo.detail} />
                            )}
                            {userInfo.extra !== '-' && (
                                <DetailRow label={user.role === 'mahasiswa' ? 'Angkatan' : 'Jabatan'} value={userInfo.extra} />
                            )}
                        </div>

                        <div className="border-t border-neutral-200 pt-4 space-y-1">
                            <DetailRow label="Email Verified" value={user.email_verified_at ? 'Ya' : 'Tidak'} />
                            <DetailRow label="Bergabung" value={new Date(user.created_at).toLocaleDateString('id-ID')} />
                        </div>
                    </Box>

                    {/* Reset Password Form */}
                    <Box className="lg:col-span-2">
                        <div className="flex items-center gap-3 mb-6">
                            <KeyIcon className="h-5 w-5 text-neutral-900" />
                            <SectionTitle>Reset Password</SectionTitle>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <InputLabel htmlFor="password">Password Baru *</InputLabel>
                                <TextInput
                                    id="password"
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData({ ...data, password: e.target.value })}
                                    error={errors.password}
                                    placeholder="Masukkan password baru (minimal 8 karakter)"
                                    disabled={isLoading}
                                />
                                {errors.password && (
                                    <p className="mt-1.5 text-xs text-red-600">{errors.password}</p>
                                )}
                            </div>

                            <div>
                                <InputLabel htmlFor="password_confirmation">Konfirmasi Password *</InputLabel>
                                <TextInput
                                    id="password_confirmation"
                                    type="password"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData({ ...data, password_confirmation: e.target.value })}
                                    error={errors.password_confirmation}
                                    placeholder="Ulangi password baru"
                                    disabled={isLoading}
                                />
                                {errors.password_confirmation && (
                                    <p className="mt-1.5 text-xs text-red-600">{errors.password_confirmation}</p>
                                )}
                            </div>

                            <Box variant="gray" className="border-l-4 border-l-black">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-900 mb-2">Peringatan</h4>
                                <ul className="list-disc pl-4 space-y-1 text-xs text-neutral-600">
                                    <li>Password baru akan langsung aktif setelah direset</li>
                                    <li>User akan otomatis logout dari semua sesi</li>
                                    <li>Informasikan password baru kepada user melalui saluran yang aman</li>
                                    <li>Pastikan password minimal 8 karakter dan sulit ditebak</li>
                                </ul>
                            </Box>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <ActionButton href={route('admin.user-management.index')} variant="secondary">
                                    Batal
                                </ActionButton>
                                <ActionButton type="submit" variant="danger" disabled={isLoading}>
                                    {isLoading ? 'Mereset...' : 'Reset Password'}
                                </ActionButton>
                            </div>
                        </form>
                    </Box>
                </div>
            </div>
        </AdminLayout>
    );
}
