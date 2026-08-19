import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import TextInput from '@/Components/TextInput';

function Box({ children, className = '', padded = true, variant = 'white' }) {
    const variants = {
        white: 'bg-white border-[#e4e4e7]',
        dark: 'bg-[#0a0a0a] border-[#222] text-white',
        accent: 'bg-black text-white border-black'
    };
    return (
        <div className={`border ${variants[variant]} ${padded ? 'p-5' : ''} ${className}`}>
            {children}
        </div>
    );
}

function SectionTitle({ children, action }) {
    return (
        <div className="flex items-center justify-between mb-5">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">{children}</h2>
            {action && <div>{action}</div>}
        </div>
    );
}

function ActionButton({ children, href, onClick, variant = 'primary', type = 'button' }) {
    const map = {
        primary: 'bg-black text-white border-black hover:bg-neutral-800',
        secondary: 'bg-white text-black border-[#e4e4e7] hover:border-black',
        danger: 'bg-white text-red-600 border-[#e4e4e7] hover:border-red-600 hover:bg-red-50',
        ghost: 'bg-transparent text-neutral-500 border-transparent hover:text-black'
    };
    const className = `inline-flex items-center justify-center px-4 py-2 text-[11px] font-semibold uppercase tracking-widest border transition-colors duration-200 ${map[variant]}`;
    if (href) {
        return (
            <Link href={href} className={className}>
                {children}
            </Link>
        );
    }
    return (
        <button type={type} onClick={onClick} className={className}>
            {children}
        </button>
    );
}

function StatusBadge({ status }) {
    const map = {
        aktif: 'bg-black text-white border-black',
        nonaktif: 'bg-white text-neutral-500 border-[#e4e4e7]',
        pensiun: 'bg-neutral-100 text-neutral-500 border-[#e4e4e7]',
    };
    return (
        <span className={`inline-flex px-3 py-1 text-[10px] font-semibold uppercase tracking-wider border ${map[status] || map.nonaktif}`}>
            {status}
        </span>
    );
}

function JabatanBadge({ jabatan }) {
    if (!jabatan) return <span className="text-neutral-400 text-sm">-</span>;
    return (
        <span className="inline-flex px-3 py-1 text-[10px] font-semibold uppercase tracking-wider border bg-neutral-100 text-neutral-700 border-[#e4e4e7]">
            {jabatan}
        </span>
    );
}

export default function Index({ dosens, filters }) {
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = (e) => {
        e.preventDefault();
        router.get('/admin/dosen', { search }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleDelete = (dosen) => {
        if (confirm('Apakah Anda yakin ingin menghapus dosen ini?')) {
            router.delete(`/admin/dosen/${dosen.id}`);
        }
    };

    return (
        <AdminLayout title="Manajemen Dosen">
            <Head title="Manajemen Dosen" />

            <div className="space-y-6">
                {/* Header */}
                <Box variant="dark" className="relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-neutral-400 mb-2">Sumber Daya</p>
                        <h1 className="text-2xl font-bold tracking-tight text-white">DOSEN</h1>
                        <p className="text-sm text-neutral-400 mt-1">Kelola data dosen STIT Al Wafi</p>
                    </div>
                </Box>

                {/* Controls */}
                <Box>
                    <SectionTitle action={<ActionButton href="/admin/dosen/create" variant="primary">+ Tambah Dosen</ActionButton>}>
                        Daftar Dosen
                    </SectionTitle>

                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                            <TextInput
                                type="text"
                                placeholder="Cari NIP, nama, bidang keahlian, atau jabatan..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full border-[#e4e4e7] focus:border-black focus:ring-black rounded-none"
                            />
                        </div>
                        <div className="flex gap-2">
                            <ActionButton type="submit" variant="primary">Cari</ActionButton>
                            {filters.search && (
                                <ActionButton
                                    onClick={() => {
                                        setSearch('');
                                        router.get('/admin/dosen', {}, {
                                            preserveState: true,
                                            preserveScroll: true,
                                        });
                                    }}
                                    variant="secondary"
                                >
                                    Reset
                                </ActionButton>
                            )}
                        </div>
                    </form>
                </Box>

                {/* Table */}
                <Box padded={false} className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-[#e4e4e7]">
                            <thead className="bg-[#fafafa]">
                                <tr>
                                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">NIP</th>
                                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Nama Lengkap</th>
                                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Bidang Keahlian</th>
                                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Jabatan Akademik</th>
                                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Status</th>
                                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Email</th>
                                    <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-[#e4e4e7]">
                                {dosens.data.map((dosen) => (
                                    <tr key={dosen.id} className="hover:bg-[#fafafa] transition-colors">
                                        <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-black">{dosen.nip}</td>
                                        <td className="px-5 py-4 whitespace-nowrap text-sm text-neutral-700">{dosen.nama_lengkap}</td>
                                        <td className="px-5 py-4 whitespace-nowrap text-sm text-neutral-700">{dosen.bidang_keahlian}</td>
                                        <td className="px-5 py-4 whitespace-nowrap"><JabatanBadge jabatan={dosen.jabatan_akademik} /></td>
                                        <td className="px-5 py-4 whitespace-nowrap"><StatusBadge status={dosen.status} /></td>
                                        <td className="px-5 py-4 whitespace-nowrap text-sm text-neutral-700">{dosen.user.email}</td>
                                        <td className="px-5 py-4 whitespace-nowrap text-right">
                                            <div className="flex justify-end gap-2">
                                                <ActionButton href={`/admin/dosen/${dosen.id}`} variant="secondary" size="sm">Detail</ActionButton>
                                                <ActionButton href={`/admin/dosen/${dosen.id}/edit`} variant="primary" size="sm">Edit</ActionButton>
                                                <ActionButton onClick={() => handleDelete(dosen)} variant="danger" size="sm">Hapus</ActionButton>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {dosens.data.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="px-5 py-12 text-center text-sm text-neutral-500">
                                            Tidak ada data dosen.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {dosens.links && (
                        <div className="px-5 py-4 border-t border-[#e4e4e7] flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-xs text-neutral-500 uppercase tracking-wider">
                                Menampilkan {dosens.from} sampai {dosens.to} dari {dosens.total} data
                            </div>
                            <div className="flex gap-1">
                                {dosens.links.map((link, key) => (
                                    link.url ? (
                                        <Link
                                            key={key}
                                            href={link.url}
                                            className={`px-3 py-2 text-xs font-medium border transition-colors ${
                                                link.active
                                                    ? 'bg-black text-white border-black'
                                                    : 'bg-white text-neutral-700 border-[#e4e4e7] hover:border-black hover:text-black'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ) : (
                                        <span
                                            key={key}
                                            className="px-3 py-2 text-xs font-medium border bg-[#fafafa] text-neutral-400 border-[#e4e4e7] cursor-not-allowed"
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
