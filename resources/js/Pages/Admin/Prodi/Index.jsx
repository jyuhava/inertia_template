import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import TextInput from '@/Components/TextInput';

function Box({ children, className = '', padded = true, variant = 'white' }) {
    const variants = {
        white: 'bg-white border-[#e4e4e7]',
        dark: 'bg-gradient-to-br from-slate-800 via-indigo-700 to-indigo-600 border-transparent text-white rounded-2xl shadow-lg shadow-indigo-500/20',
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
    };
    return (
        <span className={`inline-flex px-3 py-1 text-[10px] font-semibold uppercase tracking-wider border ${map[status] || map.nonaktif}`}>
            {status}
        </span>
    );
}

function JenjangBadge({ jenjang }) {
    return (
        <span className="inline-flex px-3 py-1 text-[10px] font-semibold uppercase tracking-wider border bg-neutral-100 text-neutral-700 border-[#e4e4e7]">
            {jenjang}
        </span>
    );
}

export default function Index({ prodis, filters }) {
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('admin.prodi.index'), { search }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleDelete = (prodi) => {
        if (confirm('Apakah Anda yakin ingin menghapus program studi ini?')) {
            router.delete(route('admin.prodi.destroy', prodi.id));
        }
    };

    return (
        <AdminLayout title="Manajemen Program Studi">
            <Head title="Manajemen Program Studi" />

            <div className="space-y-6">
                {/* Header */}
                <Box variant="dark" className="relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-neutral-400 mb-2">Master Data</p>
                        <h1 className="text-2xl font-bold tracking-tight text-white">PROGRAM STUDI</h1>
                        <p className="text-sm text-neutral-400 mt-1">Kelola data program studi STIT Al Wafi</p>
                    </div>
                </Box>

                {/* Controls */}
                <Box>
                    <SectionTitle action={<ActionButton href={route('admin.prodi.create')} variant="primary">+ Tambah Prodi</ActionButton>}>
                        Daftar Program Studi
                    </SectionTitle>

                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                            <TextInput
                                type="text"
                                placeholder="Cari kode prodi, nama prodi, atau jenjang..."
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
                                        router.get(route('admin.prodi.index'), {}, {
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
                        <table className="min-w-full divide-y divide-[#e4e4e7] table-cards">
                            <thead className="bg-[#fafafa]">
                                <tr>
                                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Kode Prodi</th>
                                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Nama Program Studi</th>
                                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Jenjang</th>
                                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Status</th>
                                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Mahasiswa</th>
                                    <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-[#e4e4e7]">
                                {prodis.data.map((prodi) => (
                                    <tr key={prodi.id} className="hover:bg-[#fafafa] transition-colors">
                                        <td data-label="Kode Prodi" className="px-5 py-4 whitespace-nowrap text-sm font-medium text-black">{prodi.kode_prodi}</td>
                                        <td data-label="Nama Program Studi" className="px-5 py-4 whitespace-nowrap text-sm text-neutral-700">{prodi.nama_prodi}</td>
                                        <td data-label="Jenjang" className="px-5 py-4 whitespace-nowrap"><JenjangBadge jenjang={prodi.jenjang} /></td>
                                        <td data-label="Status" className="px-5 py-4 whitespace-nowrap"><StatusBadge status={prodi.status} /></td>
                                        <td data-label="Mahasiswa" className="px-5 py-4 whitespace-nowrap text-sm text-neutral-700">{prodi.mahasiswas_count} mahasiswa</td>
                                        <td data-label="Aksi" className="px-5 py-4 whitespace-nowrap text-right">
                                            <div className="flex justify-end gap-2">
                                                <ActionButton href={route('admin.prodi.show', prodi.id)} variant="secondary" size="sm">Detail</ActionButton>
                                                <ActionButton href={route('admin.prodi.edit', prodi.id)} variant="primary" size="sm">Edit</ActionButton>
                                                <ActionButton onClick={() => handleDelete(prodi)} variant="danger" size="sm">Hapus</ActionButton>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {prodis.data.length === 0 && (
                                    <tr className="table-cards-empty">
                                        <td colSpan="6" className="px-5 py-12 text-center text-sm text-neutral-500">
                                            Tidak ada data program studi.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {prodis.links && (
                        <div className="px-5 py-4 border-t border-[#e4e4e7] flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-xs text-neutral-500 uppercase tracking-wider">
                                Menampilkan {prodis.from} sampai {prodis.to} dari {prodis.total} data
                            </div>
                            <div className="flex gap-1">
                                {prodis.links.map((link, key) => (
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
