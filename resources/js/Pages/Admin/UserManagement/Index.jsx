import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

function Box({ children, className = '', padded = true, variant = 'white' }) {
    const variants = {
        white: 'bg-white border-[#e5e5e5]',
        black: 'bg-black border-black text-white',
        gray: 'bg-[#f5f5f5] border-[#e5e5e5]',
    };
    return (
        <div className={`border ${variants[variant]} ${padded ? 'p-6' : ''} ${className}`}>
            {children}
        </div>
    );
}

function SectionTitle({ children, action }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-900">{children}</h2>
            {action && <div>{action}</div>}
        </div>
    );
}

function ActionButton({ children, href, onClick, variant = 'primary', type = 'button', disabled = false }) {
    const map = {
        primary: 'bg-black text-white border-black hover:bg-neutral-800',
        secondary: 'bg-white text-black border-[#ccc] hover:bg-[#f5f5f5]',
        danger: 'bg-white text-red-600 border-red-200 hover:bg-red-50',
        ghost: 'bg-transparent text-neutral-500 border-transparent hover:text-black',
    };
    const base = 'inline-flex items-center justify-center px-4 py-2 text-[10px] font-bold uppercase tracking-widest border transition-colors duration-200 disabled:opacity-50';
    if (href) {
        return (
            <Link href={href} className={`${base} ${map[variant]}`}>
                {children}
            </Link>
        );
    }
    return (
        <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${map[variant]}`}>
            {children}
        </button>
    );
}

function StatusBadge({ status }) {
    const map = {
        aktif: 'bg-black text-white border-black',
        nonaktif: 'bg-white text-red-600 border-red-200',
        lulus: 'bg-[#f5f5f5] text-neutral-900 border-[#ccc]',
        pensiun: 'bg-white text-neutral-400 border-[#ddd]',
    };
    const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Aktif';
    return (
        <span className={`inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-widest border ${map[status] || map.aktif}`}>
            {label}
        </span>
    );
}

function RoleBadge({ role }) {
    const map = {
        admin: 'bg-neutral-900 text-white border-neutral-900',
        mahasiswa: 'bg-white text-neutral-900 border-[#ccc]',
        dosen: 'bg-[#f5f5f5] text-neutral-900 border-[#ccc]',
    };
    const label = role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User';
    return (
        <span className={`inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-widest border ${map[role] || map.mahasiswa}`}>
            {label}
        </span>
    );
}

function StatCard({ label, count }) {
    return (
        <Box className="flex items-center gap-3">
            <div className="w-2 h-8 bg-black"></div>
            <div>
                <div className="text-2xl font-bold text-neutral-900 leading-none">{count}</div>
                <div className="text-[10px] uppercase tracking-widest text-neutral-500 mt-1">{label}</div>
            </div>
        </Box>
    );
}

export default function Index({ auth, users, filters, stats }) {
    const [search, setSearch] = useState(filters.search || '');
    const [role, setRole] = useState(filters.role || '');
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('admin.user-management.index'), {
            search: search,
            role: role,
        }, {
            preserveState: true,
        });
    };

    const handleResetSearch = () => {
        setSearch('');
        setRole('');
        router.get(route('admin.user-management.index'));
    };

    const handleSelectUser = (userId) => {
        setSelectedUsers(prev => {
            if (prev.includes(userId)) {
                return prev.filter(id => id !== userId);
            } else {
                return [...prev, userId];
            }
        });
    };

    const handleSelectAll = () => {
        if (selectedUsers.length === users.data.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(users.data.map(user => user.id));
        }
    };

    const handleGeneratePassword = (user) => {
        if (confirm(`Apakah Anda yakin ingin generate password baru untuk ${user.name}?`)) {
            setIsLoading(true);
            router.put(route('admin.user-management.generate-password', user.id), {}, {
                onFinish: () => setIsLoading(false),
            });
        }
    };

    const handleToggleStatus = (user) => {
        const currentStatus = user.additional_info?.status || 'aktif';
        const newStatus = currentStatus === 'aktif' ? 'nonaktif' : 'aktif';

        if (confirm(`Apakah Anda yakin ingin mengubah status ${user.name} menjadi ${newStatus}?`)) {
            setIsLoading(true);
            router.put(route('admin.user-management.toggle-status', user.id), {}, {
                onFinish: () => setIsLoading(false),
            });
        }
    };

    const getUserTypeInfo = (user) => {
        if (user.role === 'mahasiswa' && user.additional_info) {
            return {
                identifier: user.additional_info.nim,
                detail: user.additional_info.prodi,
                extra: `Angkatan ${user.additional_info.angkatan}`,
                status: user.additional_info.status,
            };
        } else if (user.role === 'dosen' && user.additional_info) {
            return {
                identifier: user.additional_info.nip,
                detail: user.additional_info.bidang_keahlian,
                extra: user.additional_info.jabatan_akademik,
                status: user.additional_info.status,
            };
        }
        return {
            identifier: '-',
            detail: '-',
            extra: '-',
            status: 'aktif',
        };
    };

    return (
        <AdminLayout title="Manajemen User">
            <Head title="Manajemen User" />

            <div className="p-6 lg:p-8 min-h-screen bg-[#fafafa]">
                <Box variant="black" className="mb-6">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-400 mb-1">Sistem</p>
                        <h1 className="text-xl font-bold uppercase tracking-tight text-white">Manajemen User</h1>
                    </div>
                </Box>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <StatCard label="Total User" count={stats.total_users} />
                    <StatCard label="Mahasiswa" count={stats.total_mahasiswa} />
                    <StatCard label="Dosen" count={stats.total_dosen} />
                    <StatCard label="Admin" count={stats.total_admin} />
                </div>

                <Box>
                    <SectionTitle action={
                        <a
                            href={route('admin.user-management.export', { search, role })}
                            className="inline-flex items-center justify-center px-4 py-2 text-[10px] font-bold uppercase tracking-widest border bg-black text-white border-black hover:bg-neutral-800 transition-colors"
                        >
                            Export
                        </a>
                    }>
                        Daftar User
                    </SectionTitle>

                    <form onSubmit={handleSearch} className="mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div className="md:col-span-2">
                                <input
                                    type="text"
                                    placeholder="Cari nama atau email..."
                                    className="w-full px-3 py-2 text-xs border border-[#ccc] bg-white focus:outline-none focus:border-black"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <div>
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="w-full px-3 py-2 text-xs border border-[#ccc] bg-white focus:outline-none focus:border-black"
                                >
                                    <option value="">Semua Role</option>
                                    <option value="admin">Admin</option>
                                    <option value="mahasiswa">Mahasiswa</option>
                                    <option value="dosen">Dosen</option>
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <ActionButton type="submit" variant="primary">Cari</ActionButton>
                                <ActionButton type="button" onClick={handleResetSearch} variant="secondary">Reset</ActionButton>
                            </div>
                        </div>
                    </form>

                    {selectedUsers.length > 0 && (
                        <div className="bg-[#f5f5f5] border border-[#e5e5e5] p-4 mb-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <span className="text-xs font-bold uppercase tracking-widest text-neutral-900">
                                    {selectedUsers.length} user dipilih
                                </span>
                                <ActionButton
                                    onClick={() => {
                                        const password = prompt('Masukkan password baru:');
                                        const passwordConfirmation = prompt('Konfirmasi password:');

                                        if (password && passwordConfirmation && password === passwordConfirmation) {
                                            if (password.length >= 8) {
                                                setIsLoading(true);
                                                router.post(route('admin.user-management.bulk-reset-password'), {
                                                    user_ids: selectedUsers,
                                                    password: password,
                                                    password_confirmation: passwordConfirmation,
                                                }, {
                                                    onFinish: () => {
                                                        setIsLoading(false);
                                                        setSelectedUsers([]);
                                                    },
                                                });
                                            } else {
                                                alert('Password minimal 8 karakter');
                                            }
                                        } else if (password) {
                                            alert('Password dan konfirmasi tidak cocok');
                                        }
                                    }}
                                    variant="danger"
                                    disabled={isLoading}
                                >
                                    Reset Password
                                </ActionButton>
                            </div>
                        </div>
                    )}

                    <div className="overflow-x-auto border border-[#e5e5e5]">
                        <table className="min-w-full text-left">
                            <thead className="bg-[#f5f5f5] border-b border-[#e5e5e5]">
                                <tr>
                                    <th className="px-4 py-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedUsers.length === users.data.length && users.data.length > 0}
                                            onChange={handleSelectAll}
                                            className="w-4 h-4 border-[#ccc] text-black focus:ring-black"
                                        />
                                    </th>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500">User</th>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Role</th>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Info Tambahan</th>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Status</th>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#e5e5e5]">
                                {users.data.map((user) => {
                                    const userInfo = getUserTypeInfo(user);

                                    return (
                                        <tr key={user.id} className="hover:bg-[#fafafa]">
                                            <td className="px-4 py-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedUsers.includes(user.id)}
                                                    onChange={() => handleSelectUser(user.id)}
                                                    className="w-4 h-4 border-[#ccc] text-black focus:ring-black"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-sm font-semibold text-neutral-900">{user.name}</div>
                                                <div className="text-xs text-neutral-500">{user.email}</div>
                                            </td>
                                            <td className="px-4 py-3"><RoleBadge role={user.role} /></td>
                                            <td className="px-4 py-3 text-sm text-neutral-600">
                                                <div className="font-medium">{userInfo.identifier}</div>
                                                <div>{userInfo.detail}</div>
                                                {userInfo.extra && userInfo.extra !== '-' && (
                                                    <div className="text-[10px] uppercase tracking-widest text-neutral-400">{userInfo.extra}</div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3"><StatusBadge status={userInfo.status} /></td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <ActionButton href={route('admin.user-management.reset-password.form', user.id)} variant="ghost">Reset</ActionButton>
                                                    <ActionButton onClick={() => handleGeneratePassword(user)} variant="primary" disabled={isLoading}>Generate</ActionButton>
                                                    {user.role !== 'admin' && (
                                                        <ActionButton onClick={() => handleToggleStatus(user)} variant="secondary" disabled={isLoading}>
                                                            Toggle
                                                        </ActionButton>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {users.links && (
                        <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-[#e5e5e5] p-4">
                            <p className="text-xs text-neutral-500 uppercase tracking-widest">
                                Menampilkan <span className="font-bold text-neutral-900">{users.from}</span> sampai{' '}
                                <span className="font-bold text-neutral-900">{users.to}</span> dari{' '}
                                <span className="font-bold text-neutral-900">{users.total}</span> data
                            </p>
                            <div className="flex items-center gap-1">
                                {users.links.map((link, key) => (
                                    link.url ? (
                                        <Link
                                            key={key}
                                            href={link.url}
                                            className={`px-3 py-2 text-xs font-bold uppercase tracking-widest border transition-colors ${
                                                link.active
                                                    ? 'bg-black text-white border-black'
                                                    : 'bg-white text-neutral-700 border-[#ccc] hover:bg-[#f5f5f5]'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ) : (
                                        <span
                                            key={key}
                                            className="px-3 py-2 text-xs font-bold uppercase tracking-widest border bg-[#f5f5f5] text-neutral-400 border-[#e5e5e5] cursor-not-allowed"
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    )
                                ))}
                            </div>
                        </div>
                    )}
                </Box>
            </div>
        </AdminLayout>
    );
}
