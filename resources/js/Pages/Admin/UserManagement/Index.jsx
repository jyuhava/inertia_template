import { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    UsersIcon,
    AcademicCapIcon,
    UserGroupIcon,
    ShieldCheckIcon,
    MagnifyingGlassIcon,
    ArrowDownTrayIcon,
    KeyIcon,
    ArrowPathIcon,
    CheckIcon,
    ClipboardDocumentIcon,
    EyeIcon,
    EyeSlashIcon,
    XMarkIcon,
    ExclamationTriangleIcon,
    UserIcon,
} from '@heroicons/react/24/outline';

function StatCard({ label, count, icon: Icon, color = 'indigo' }) {
    const colorStyles = {
        indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
        sky: 'bg-sky-50 text-sky-600 border-sky-100',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        violet: 'bg-violet-50 text-violet-600 border-violet-100',
    };

    return (
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-xs transition-all hover:border-slate-300">
            <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border ${colorStyles[color] || colorStyles.indigo}`}>
                <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-medium text-slate-500 uppercase tracking-wider">{label}</p>
                <p className="text-lg font-bold text-slate-800 leading-tight">{count.toLocaleString('id-ID')}</p>
            </div>
        </div>
    );
}

function RoleBadge({ role }) {
    const config = {
        admin: {
            bg: 'bg-purple-50 text-purple-700 border-purple-200',
            label: 'Admin',
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

function StatusBadge({ status }) {
    const isAktif = status === 'aktif' || !status;
    return (
        <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide border ${
                isAktif
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
        >
            <span className={`h-1.5 w-1.5 rounded-full ${isAktif ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            {isAktif ? 'Aktif' : 'Nonaktif'}
        </span>
    );
}

export default function Index({ auth, users, filters, stats }) {
    const { flash } = usePage().props;
    const [search, setSearch] = useState(filters.search || '');
    const [role, setRole] = useState(filters.role || '');
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [actionLoading, setActionLoading] = useState({});
    
    // Quick Reset Modal state
    const [resetTargetUser, setResetTargetUser] = useState(null);
    const [resetPassword, setResetPassword] = useState('');
    const [resetConfirmation, setResetConfirmation] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [resetErrors, setResetErrors] = useState({});
    const [isSubmittingReset, setIsSubmittingReset] = useState(false);

    // Bulk Reset Modal state
    const [showBulkResetModal, setShowBulkResetModal] = useState(false);
    const [bulkPassword, setBulkPassword] = useState('');
    const [bulkConfirmation, setBulkConfirmation] = useState('');
    const [showBulkPassword, setShowBulkPassword] = useState(false);
    const [bulkErrors, setBulkErrors] = useState({});
    const [isSubmittingBulk, setIsSubmittingBulk] = useState(false);

    // Generated Password Display Banner
    const [copied, setCopied] = useState(false);
    const [activeGeneratedPassword, setActiveGeneratedPassword] = useState(null);

    useEffect(() => {
        if (flash?.generated_password) {
            setActiveGeneratedPassword(flash.generated_password);
        }
    }, [flash]);

    const handleCopyPassword = (text) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    const handleSearch = (e) => {
        e?.preventDefault();
        router.get(
            route('admin.user-management.index'),
            { search: search || undefined, role: role || undefined },
            { preserveState: true, preserveScroll: true, replace: true }
        );
    };

    const handleResetFilter = () => {
        setSearch('');
        setRole('');
        router.get(route('admin.user-management.index'), {}, { preserveScroll: true, replace: true });
    };

    const handleSelectUser = (userId) => {
        setSelectedUsers((prev) =>
            prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
        );
    };

    const handleSelectAll = () => {
        if (selectedUsers.length === users.data.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(users.data.map((u) => u.id));
        }
    };

    const handleGeneratePassword = (user) => {
        if (!confirm(`Generate password baru otomatis untuk "${user.name}"?`)) return;

        setActionLoading((prev) => ({ ...prev, [`gen_${user.id}`]: true }));
        router.put(
            route('admin.user-management.generate-password', user.id),
            {},
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    const pass = page.props.flash?.generated_password;
                    if (pass) {
                        setActiveGeneratedPassword(pass);
                    }
                },
                onFinish: () => {
                    setActionLoading((prev) => ({ ...prev, [`gen_${user.id}`]: false }));
                },
            }
        );
    };

    const handleToggleStatus = (user) => {
        const currentStatus = user.additional_info?.status || 'aktif';
        const nextStatus = currentStatus === 'aktif' ? 'nonaktif' : 'aktif';

        if (!confirm(`Ubah status pengguna "${user.name}" menjadi ${nextStatus.toUpperCase()}?`)) return;

        setActionLoading((prev) => ({ ...prev, [`toggle_${user.id}`]: true }));
        router.put(
            route('admin.user-management.toggle-status', user.id),
            {},
            {
                preserveScroll: true,
                onFinish: () => {
                    setActionLoading((prev) => ({ ...prev, [`toggle_${user.id}`]: false }));
                },
            }
        );
    };

    const submitQuickReset = (e) => {
        e.preventDefault();
        if (!resetTargetUser) return;
        setResetErrors({});

        if (!resetPassword) {
            setResetErrors({ password: 'Password baru harus diisi.' });
            return;
        }
        if (resetPassword.length < 8) {
            setResetErrors({ password: 'Password minimal 8 karakter.' });
            return;
        }
        if (resetPassword !== resetConfirmation) {
            setResetErrors({ password_confirmation: 'Konfirmasi password tidak cocok.' });
            return;
        }

        setIsSubmittingReset(true);
        router.put(
            route('admin.user-management.reset-password', resetTargetUser.id),
            {
                password: resetPassword,
                password_confirmation: resetConfirmation,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setResetTargetUser(null);
                    setResetPassword('');
                    setResetConfirmation('');
                },
                onError: (errs) => {
                    setResetErrors(errs);
                },
                onFinish: () => {
                    setIsSubmittingReset(false);
                },
            }
        );
    };

    const submitBulkReset = (e) => {
        e.preventDefault();
        setBulkErrors({});

        if (!bulkPassword) {
            setBulkErrors({ password: 'Password baru harus diisi.' });
            return;
        }
        if (bulkPassword.length < 8) {
            setBulkErrors({ password: 'Password minimal 8 karakter.' });
            return;
        }
        if (bulkPassword !== bulkConfirmation) {
            setBulkErrors({ password_confirmation: 'Konfirmasi password tidak cocok.' });
            return;
        }

        setIsSubmittingBulk(true);
        router.post(
            route('admin.user-management.bulk-reset-password'),
            {
                user_ids: selectedUsers,
                password: bulkPassword,
                password_confirmation: bulkConfirmation,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setShowBulkResetModal(false);
                    setBulkPassword('');
                    setBulkConfirmation('');
                    setSelectedUsers([]);
                },
                onError: (errs) => {
                    setBulkErrors(errs);
                },
                onFinish: () => {
                    setIsSubmittingBulk(false);
                },
            }
        );
    };

    const getUserDetails = (user) => {
        if (user.role === 'mahasiswa' && user.additional_info) {
            return {
                idLabel: 'NIM',
                idValue: user.additional_info.nim || '-',
                detail: user.additional_info.prodi || 'N/A',
                sub: user.additional_info.angkatan ? `Angk. ${user.additional_info.angkatan}` : '',
                status: user.additional_info.status || 'aktif',
            };
        }
        if (user.role === 'dosen' && user.additional_info) {
            return {
                idLabel: 'NIP',
                idValue: user.additional_info.nip || '-',
                detail: user.additional_info.bidang_keahlian || user.additional_info.jabatan_akademik || '-',
                sub: user.additional_info.jabatan_akademik || '',
                status: user.additional_info.status || 'aktif',
            };
        }
        return {
            idLabel: 'ID',
            idValue: `#${user.id}`,
            detail: 'Administrator Sistem',
            sub: '',
            status: 'aktif',
        };
    };

    return (
        <AdminLayout title="Manajemen Akun Pengguna">
            <Head title="Manajemen Pengguna - Admin" />

            <div className="space-y-3.5">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 rounded-lg border border-slate-200 bg-white p-3.5 sm:p-4 shadow-xs">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="inline-flex h-2 w-2 rounded-full bg-indigo-600" />
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Sistem & Keamanan</p>
                        </div>
                        <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">Manajemen Akun Pengguna</h1>
                        <p className="text-xs text-slate-500 mt-0.5">Kelola kredensial login, hak akses, dan reset password mahasiswa, dosen, serta admin.</p>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-center">
                        <a
                            href={route('admin.user-management.export', { search, role })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-300 bg-white text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-400 transition-colors"
                        >
                            <ArrowDownTrayIcon className="h-3.5 w-3.5 text-slate-500" />
                            <span>Export CSV</span>
                        </a>
                    </div>
                </div>

                {/* Banner Password Baru yang baru digenerate */}
                {activeGeneratedPassword && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 p-3 shadow-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                            <div className="flex items-center gap-2.5">
                                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-emerald-100 text-emerald-700">
                                    <KeyIcon className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-emerald-900">Password Baru Berhasil Digenerate!</p>
                                    <p className="text-[11px] text-emerald-700">Segera salin dan berikan password ini kepada pengguna terkait:</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="rounded border border-emerald-300 bg-white px-2.5 py-1 font-mono text-sm font-bold text-emerald-800 tracking-wider select-all shadow-xs">
                                    {activeGeneratedPassword}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleCopyPassword(activeGeneratedPassword)}
                                    className="inline-flex items-center gap-1 rounded bg-emerald-700 px-2.5 py-1 text-xs font-semibold text-white shadow-2xs hover:bg-emerald-800 transition-colors"
                                >
                                    {copied ? <CheckIcon className="h-3.5 w-3.5" /> : <ClipboardDocumentIcon className="h-3.5 w-3.5" />}
                                    <span>{copied ? 'Tersalin!' : 'Salin'}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveGeneratedPassword(null)}
                                    className="text-emerald-500 hover:text-emerald-700 p-1"
                                    title="Tutup banner"
                                >
                                    <XMarkIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Stat Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
                    <StatCard label="Total Akun" count={stats.total_users} icon={UsersIcon} color="indigo" />
                    <StatCard label="Mahasiswa" count={stats.total_mahasiswa} icon={AcademicCapIcon} color="sky" />
                    <StatCard label="Dosen" count={stats.total_dosen} icon={UserGroupIcon} color="emerald" />
                    <StatCard label="Administrator" count={stats.total_admin} icon={ShieldCheckIcon} color="violet" />
                </div>

                {/* Main Content Card */}
                <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
                    {/* Filter & Search Bar */}
                    <div className="border-b border-slate-200 bg-slate-50/60 p-3 sm:p-3.5">
                        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
                            <div className="relative flex-1">
                                <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="Cari nama, email, atau identitas pengguna..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full rounded-md border border-slate-300 bg-white pl-8 pr-8 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 shadow-2xs"
                                />
                                {search && (
                                    <button
                                        type="button"
                                        onClick={() => setSearch('')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        <XMarkIcon className="h-4 w-4" />
                                    </button>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 shadow-2xs"
                                >
                                    <option value="">Semua Role</option>
                                    <option value="admin">Administrator</option>
                                    <option value="mahasiswa">Mahasiswa</option>
                                    <option value="dosen">Dosen</option>
                                </select>

                                <button
                                    type="submit"
                                    className="inline-flex items-center justify-center rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-slate-800 transition-colors"
                                >
                                    Filter
                                </button>

                                {(search || role) && (
                                    <button
                                        type="button"
                                        onClick={handleResetFilter}
                                        className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                                        title="Reset filter"
                                    >
                                        Reset
                                    </button>
                                )}
                            </div>
                        </form>

                        {/* Bar Notifikasi Bulk Selection */}
                        {selectedUsers.length > 0 && (
                            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-md border border-indigo-200 bg-indigo-50/80 px-3 py-1.5 text-xs text-indigo-900">
                                <span className="font-medium">
                                    <strong className="font-bold text-indigo-950">{selectedUsers.length}</strong> pengguna dipilih
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setShowBulkResetModal(true)}
                                        className="inline-flex items-center gap-1 rounded bg-rose-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-2xs hover:bg-rose-700 transition-colors"
                                    >
                                        <KeyIcon className="h-3.5 w-3.5" />
                                        <span>Reset Password Bersama</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedUsers([])}
                                        className="rounded border border-indigo-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                                    >
                                        Batal
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* DESKTOP TABLE VIEW (>= 768px) */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="min-w-full text-left border-collapse table-cards">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                    <th className="w-10 px-3.5 py-2.5 text-center">
                                        <input
                                            type="checkbox"
                                            checked={selectedUsers.length === users.data.length && users.data.length > 0}
                                            onChange={handleSelectAll}
                                            className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                                        />
                                    </th>
                                    <th className="px-3 py-2.5">Pengguna</th>
                                    <th className="px-3 py-2.5">Role</th>
                                    <th className="px-3 py-2.5">Identitas Akademik</th>
                                    <th className="px-3 py-2.5">Status</th>
                                    <th className="px-3.5 py-2.5 text-right">Aksi Manajemen</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                                {users.data.length === 0 ? (
                                    <tr className="table-cards-empty">
                                        <td colSpan={6} className="py-8 text-center text-slate-400">
                                            Tidak ada data pengguna yang sesuai kriteria pencarian.
                                        </td>
                                    </tr>
                                ) : (
                                    users.data.map((user) => {
                                        const details = getUserDetails(user);
                                        const isGenLoading = actionLoading[`gen_${user.id}`];
                                        const isTogLoading = actionLoading[`toggle_${user.id}`];

                                        return (
                                            <tr
                                                key={user.id}
                                                className={`transition-colors hover:bg-slate-50/80 ${
                                                    selectedUsers.includes(user.id) ? 'bg-indigo-50/40' : ''
                                                }`}
                                            >
                                                <td data-label="0} onChange={handleSelectAll} className=&quot;h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600&quot; />" className="px-3.5 py-2.5 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedUsers.includes(user.id)}
                                                        onChange={() => handleSelectUser(user.id)}
                                                        className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                                                    />
                                                </td>
                                                <td data-label="Pengguna" className="px-3 py-2.5">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-700 border border-slate-200">
                                                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="font-semibold text-slate-900 truncate max-w-[200px]">{user.name}</div>
                                                            <div className="text-[11px] text-slate-500 truncate max-w-[200px]">{user.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td data-label="Role" className="px-3 py-2.5">
                                                    <RoleBadge role={user.role} />
                                                </td>
                                                <td data-label="Identitas Akademik" className="px-3 py-2.5">
                                                    <div className="font-medium text-slate-800">
                                                        {details.idLabel}: <span className="font-mono text-slate-900 font-semibold">{details.idValue}</span>
                                                    </div>
                                                    <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                                                        {details.detail} {details.sub ? `• ${details.sub}` : ''}
                                                    </div>
                                                </td>
                                                <td data-label="Status" className="px-3 py-2.5">
                                                    <StatusBadge status={details.status} />
                                                </td>
                                                <td data-label="Aksi Manajemen" className="px-3.5 py-2.5 text-right">
                                                    <div className="inline-flex items-center gap-1.5 justify-end">
                                                        {/* Quick Reset Password Trigger */}
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setResetTargetUser(user);
                                                                setResetPassword('');
                                                                setResetConfirmation('');
                                                                setResetErrors({});
                                                            }}
                                                            className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition-colors"
                                                            title="Ganti Password Manual"
                                                        >
                                                            <KeyIcon className="h-3 w-3 text-slate-500" />
                                                            <span>Reset</span>
                                                        </button>

                                                        {/* Quick Generate Password */}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleGeneratePassword(user)}
                                                            disabled={isGenLoading}
                                                            className="inline-flex items-center gap-1 rounded border border-indigo-200 bg-indigo-50 px-2 py-1 text-[11px] font-semibold text-indigo-700 shadow-2xs hover:bg-indigo-100 transition-colors disabled:opacity-50"
                                                            title="Buat Password Acak Otomatis"
                                                        >
                                                            <ArrowPathIcon className={`h-3 w-3 ${isGenLoading ? 'animate-spin' : ''}`} />
                                                            <span>{isGenLoading ? '...' : 'Generate'}</span>
                                                        </button>

                                                        {/* Toggle Status */}
                                                        {user.role !== 'admin' && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleToggleStatus(user)}
                                                                disabled={isTogLoading}
                                                                className={`inline-flex items-center rounded border px-2 py-1 text-[11px] font-semibold transition-colors shadow-2xs disabled:opacity-50 ${
                                                                    details.status === 'aktif'
                                                                        ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                                                                        : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                                                }`}
                                                                title="Aktifkan / Nonaktifkan Akun"
                                                            >
                                                                <span>{details.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan'}</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* MOBILE CARD VIEW (< 768px) */}
                    <div className="block md:hidden divide-y divide-slate-100">
                        {users.data.length === 0 ? (
                            <div className="p-6 text-center text-xs text-slate-400">
                                Tidak ada data pengguna yang sesuai.
                            </div>
                        ) : (
                            users.data.map((user) => {
                                const details = getUserDetails(user);
                                const isGenLoading = actionLoading[`gen_${user.id}`];
                                const isTogLoading = actionLoading[`toggle_${user.id}`];
                                const isSelected = selectedUsers.includes(user.id);

                                return (
                                    <div
                                        key={user.id}
                                        className={`p-3 transition-colors ${
                                            isSelected ? 'bg-indigo-50/40' : 'bg-white'
                                        }`}
                                    >
                                        {/* Row 1: Checkbox, Avatar, Name & Role */}
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-start gap-2.5 min-w-0">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleSelectUser(user.id)}
                                                    className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                                                />
                                                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-700 border border-slate-200">
                                                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                                                    <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                                                </div>
                                            </div>
                                            <div className="shrink-0 flex flex-col items-end gap-1">
                                                <RoleBadge role={user.role} />
                                                <StatusBadge status={details.status} />
                                            </div>
                                        </div>

                                        {/* Row 2: Detail Identitas */}
                                        <div className="mt-2 ml-6.5 rounded bg-slate-50 p-2 text-[11px] text-slate-600 border border-slate-100">
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-400 font-medium">{details.idLabel}:</span>
                                                <span className="font-mono font-bold text-slate-800">{details.idValue}</span>
                                            </div>
                                            <div className="flex items-center justify-between mt-0.5">
                                                <span className="text-slate-400 font-medium">Keterangan:</span>
                                                <span className="truncate max-w-[180px] text-slate-700 font-medium">{details.detail}</span>
                                            </div>
                                        </div>

                                        {/* Row 3: Action Buttons Toolbar */}
                                        <div className="mt-2.5 ml-6.5 flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setResetTargetUser(user);
                                                    setResetPassword('');
                                                    setResetConfirmation('');
                                                    setResetErrors({});
                                                }}
                                                className="flex-1 inline-flex items-center justify-center gap-1 rounded border border-slate-200 bg-white py-1 text-[11px] font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
                                            >
                                                <KeyIcon className="h-3 w-3 text-slate-500" />
                                                <span>Ganti Password</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleGeneratePassword(user)}
                                                disabled={isGenLoading}
                                                className="inline-flex items-center justify-center gap-1 rounded border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 shadow-2xs disabled:opacity-50"
                                            >
                                                <ArrowPathIcon className={`h-3 w-3 ${isGenLoading ? 'animate-spin' : ''}`} />
                                                <span>Auto</span>
                                            </button>

                                            {user.role !== 'admin' && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleStatus(user)}
                                                    disabled={isTogLoading}
                                                    className={`inline-flex items-center justify-center rounded border px-2 py-1 text-[11px] font-semibold shadow-2xs disabled:opacity-50 ${
                                                        details.status === 'aktif'
                                                            ? 'border-rose-200 bg-rose-50 text-rose-700'
                                                            : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                    }`}
                                                >
                                                    <span>{details.status === 'aktif' ? 'Nonaktif' : 'Aktif'}</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Pagination */}
                    {users.links && users.links.length > 3 && (
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-200 bg-slate-50/50 p-3 sm:px-4 text-xs">
                            <p className="text-slate-500 text-[11px] text-center sm:text-left">
                                Menampilkan <span className="font-semibold text-slate-800">{users.from || 0}</span> -{' '}
                                <span className="font-semibold text-slate-800">{users.to || 0}</span> dari{' '}
                                <span className="font-semibold text-slate-800">{users.total}</span> data
                            </p>
                            <div className="flex flex-wrap items-center justify-center gap-1">
                                {users.links.map((link, key) => {
                                    if (!link.url) {
                                        return (
                                            <span
                                                key={key}
                                                className="px-2.5 py-1 rounded text-[11px] font-medium text-slate-300 border border-slate-100 bg-slate-50 select-none"
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        );
                                    }
                                    return (
                                        <Link
                                            key={key}
                                            href={link.url}
                                            preserveScroll
                                            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors border ${
                                                link.active
                                                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL 1: QUICK RESET PASSWORD INDIVIDUAL */}
            {resetTargetUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
                    <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xl transition-all">
                        <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                                    <KeyIcon className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 leading-tight">Ganti Password Pengguna</h3>
                                    <p className="text-xs text-slate-500 truncate max-w-[240px]">
                                        {resetTargetUser.name} ({resetTargetUser.email})
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setResetTargetUser(null)}
                                className="text-slate-400 hover:text-slate-600 p-1"
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={submitQuickReset} className="mt-3.5 space-y-3">
                            <div>
                                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                                    Password Baru *
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={resetPassword}
                                        onChange={(e) => setResetPassword(e.target.value)}
                                        placeholder="Minimal 8 karakter..."
                                        className={`w-full rounded-md border py-1.5 pl-3 pr-9 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 ${
                                            resetErrors.password
                                                ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500'
                                                : 'border-slate-300 focus:border-indigo-600 focus:ring-indigo-600'
                                        }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                                    </button>
                                </div>
                                {resetErrors.password && (
                                    <p className="text-[11px] text-rose-600 mt-1 font-medium">{resetErrors.password}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                                    Ulangi Konfirmasi Password *
                                </label>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={resetConfirmation}
                                    onChange={(e) => setResetConfirmation(e.target.value)}
                                    placeholder="Ketik ulang password baru..."
                                    className={`w-full rounded-md border py-1.5 px-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 ${
                                        resetErrors.password_confirmation
                                            ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500'
                                                : 'border-slate-300 focus:border-indigo-600 focus:ring-indigo-600'
                                    }`}
                                />
                                {resetErrors.password_confirmation && (
                                    <p className="text-[11px] text-rose-600 mt-1 font-medium">
                                        {resetErrors.password_confirmation}
                                    </p>
                                )}
                            </div>

                            <div className="rounded-md bg-amber-50/80 border border-amber-200 p-2 text-[11px] text-amber-800 flex items-start gap-1.5">
                                <ExclamationTriangleIcon className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                                <span>Pengguna akan menggunakan password baru ini untuk login berikutnya.</span>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setResetTargetUser(null)}
                                    className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingReset}
                                    className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors shadow-xs disabled:opacity-50"
                                >
                                    {isSubmittingReset ? 'Menyimpan...' : 'Simpan Password'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: BULK RESET PASSWORD */}
            {showBulkResetModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
                    <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xl transition-all">
                        <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
                                    <KeyIcon className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 leading-tight">Reset Password Massal</h3>
                                    <p className="text-xs text-slate-500">
                                        Menerapkan password sama untuk <strong>{selectedUsers.length} akun terpilih</strong>.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowBulkResetModal(false)}
                                className="text-slate-400 hover:text-slate-600 p-1"
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={submitBulkReset} className="mt-3.5 space-y-3">
                            <div>
                                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                                    Password Baru Serentak *
                                </label>
                                <div className="relative">
                                    <input
                                        type={showBulkPassword ? 'text' : 'password'}
                                        value={bulkPassword}
                                        onChange={(e) => setBulkPassword(e.target.value)}
                                        placeholder="Minimal 8 karakter..."
                                        className={`w-full rounded-md border py-1.5 pl-3 pr-9 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 ${
                                            bulkErrors.password
                                                ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500'
                                                : 'border-slate-300 focus:border-indigo-600 focus:ring-indigo-600'
                                        }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowBulkPassword(!showBulkPassword)}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showBulkPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                                    </button>
                                </div>
                                {bulkErrors.password && (
                                    <p className="text-[11px] text-rose-600 mt-1 font-medium">{bulkErrors.password}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                                    Konfirmasi Password Serentak *
                                </label>
                                <input
                                    type={showBulkPassword ? 'text' : 'password'}
                                    value={bulkConfirmation}
                                    onChange={(e) => setBulkConfirmation(e.target.value)}
                                    placeholder="Ulangi password baru..."
                                    className={`w-full rounded-md border py-1.5 px-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 ${
                                        bulkErrors.password_confirmation
                                            ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500'
                                            : 'border-slate-300 focus:border-indigo-600 focus:ring-indigo-600'
                                    }`}
                                />
                                {bulkErrors.password_confirmation && (
                                    <p className="text-[11px] text-rose-600 mt-1 font-medium">
                                        {bulkErrors.password_confirmation}
                                    </p>
                                )}
                            </div>

                            <div className="rounded-md bg-rose-50/80 border border-rose-200 p-2 text-[11px] text-rose-800 flex items-start gap-1.5">
                                <ExclamationTriangleIcon className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                                <span>Seluruh {selectedUsers.length} pengguna yang dipilih akan menerima password ini. Pastikan untuk menginformasikan kepada pengguna terkait.</span>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowBulkResetModal(false)}
                                    className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingBulk}
                                    className="inline-flex items-center gap-1 rounded-md bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 transition-colors shadow-xs disabled:opacity-50"
                                >
                                    {isSubmittingBulk ? 'Mereset...' : 'Terapkan ke Semua'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
