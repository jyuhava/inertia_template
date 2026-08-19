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
        lulus: 'bg-neutral-100 text-neutral-700 border-[#e4e4e7]',
    };
    return (
        <span className={`inline-flex px-3 py-1 text-[10px] font-semibold uppercase tracking-wider border ${map[status] || map.nonaktif}`}>
            {status}
        </span>
    );
}

export default function Index({ mahasiswas, filters, totalMahasiswa, filteredCount }) {
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('admin.mahasiswa.index'), { search }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleDelete = (mahasiswa) => {
        if (confirm('Apakah Anda yakin ingin menghapus mahasiswa ini?')) {
            router.delete(route('admin.mahasiswa.destroy', mahasiswa.id));
        }
    };

    return (
        <AdminLayout title="Manajemen Mahasiswa">
            <Head title="Manajemen Mahasiswa" />

            <div className="space-y-6">
                {/* Header */}
                <Box variant="dark" className="relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-neutral-400 mb-2">Sumber Daya</p>
                        <h1 className="text-2xl font-bold tracking-tight text-white">MAHASISWA</h1>
                        <p className="text-sm text-neutral-400 mt-1">
                            {filters.search ? (
                                <>Menampilkan {filteredCount} dari {totalMahasiswa} mahasiswa untuk pencarian "{filters.search}"</>
                            ) : (
                                <>Total {totalMahasiswa} mahasiswa terdaftar</>
                            )}
                        </p>
                    </div>
                </Box>

                {/* Controls */}
                <Box>
                    <SectionTitle
                        action={
                            <div className="flex flex-wrap gap-2">
                                <ActionButton href="/admin/bulk-mahasiswa" variant="secondary">Bulk Import</ActionButton>
                                <a
                                    href={`/admin/mahasiswa-export${filters.search ? `?search=${encodeURIComponent(filters.search)}` : ''}`}
                                    className="inline-flex items-center justify-center px-4 py-2 text-[11px] font-semibold uppercase tracking-widest border bg-black text-white border-black hover:bg-neutral-800 transition-colors duration-200"
                                >
                                    Export Data
                                </a>
                                <ActionButton href={route('admin.mahasiswa.create')} variant="primary">+ Tambah Mahasiswa</ActionButton>
                            </div>
                        }
                    >
                        Daftar Mahasiswa
                    </SectionTitle>

                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                            <TextInput
                                type="text"
                                placeholder="Cari NIM, nama, atau program studi..."
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
                                        router.get(route('admin.mahasiswa.index'), {}, {
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
                                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">NIM</th>
                                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Nama Lengkap</th>
                                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Program Studi</th>
                                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Angkatan</th>
                                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Status</th>
                                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Email</th>
                                    <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-[#e4e4e7]">
                                {mahasiswas.data.map((mahasiswa) => (
                                    <tr key={mahasiswa.id} className="hover:bg-[#fafafa] transition-colors">
                                        <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-black">{mahasiswa.nim}</td>
                                        <td className="px-5 py-4 whitespace-nowrap text-sm text-neutral-700">{mahasiswa.nama_lengkap}</td>
                                        <td className="px-5 py-4 whitespace-nowrap text-sm text-neutral-700">
                                            {mahasiswa.prodi ? `${mahasiswa.prodi.kode_prodi} - ${mahasiswa.prodi.nama_prodi}` : mahasiswa.program_studi}
                                        </td>
                                        <td className="px-5 py-4 whitespace-nowrap text-sm text-neutral-700">{mahasiswa.angkatan}</td>
                                        <td className="px-5 py-4 whitespace-nowrap"><StatusBadge status={mahasiswa.status} /></td>
                                        <td className="px-5 py-4 whitespace-nowrap text-sm text-neutral-700">{mahasiswa.user.email}</td>
                                        <td className="px-5 py-4 whitespace-nowrap text-right">
                                            <div className="flex justify-end gap-2">
                                                <ActionButton href={route('admin.mahasiswa.show', mahasiswa.id)} variant="secondary" size="sm">Detail</ActionButton>
                                                <ActionButton href={route('admin.mahasiswa.edit', mahasiswa.id)} variant="primary" size="sm">Edit</ActionButton>
                                                <ActionButton onClick={() => handleDelete(mahasiswa)} variant="danger" size="sm">Hapus</ActionButton>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {mahasiswas.data.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="px-5 py-12 text-center text-sm text-neutral-500">
                                            Tidak ada data mahasiswa.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {mahasiswas.links && (
                        <div className="px-5 py-4 border-t border-[#e4e4e7] flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-xs text-neutral-500 uppercase tracking-wider">
                                Menampilkan {mahasiswas.from} sampai {mahasiswas.to} dari {mahasiswas.total} data
                            </div>
                            <div className="flex gap-1">
                                {mahasiswas.links.map((link, key) => (
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
