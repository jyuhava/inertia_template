import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useState } from 'react';

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

function ActionButton({ children, href, onClick, variant = 'primary', type = 'button' }) {
    const map = {
        primary: 'bg-black text-white border-black hover:bg-neutral-800',
        secondary: 'bg-white text-black border-[#ccc] hover:bg-[#f5f5f5]',
        danger: 'bg-white text-red-600 border-red-200 hover:bg-red-50',
        ghost: 'bg-transparent text-neutral-500 border-transparent hover:text-black',
    };
    const base = 'inline-flex items-center justify-center px-4 py-2 text-[10px] font-bold uppercase tracking-widest border transition-colors duration-200';
    if (href) {
        return (
            <Link href={href} className={`${base} ${map[variant]}`}>
                {children}
            </Link>
        );
    }
    return (
        <button type={type} onClick={onClick} className={`${base} ${map[variant]}`}>
            {children}
        </button>
    );
}

function StatusBadge({ aktif }) {
    const map = aktif
        ? 'bg-black text-white border-black'
        : 'bg-white text-neutral-500 border-[#ddd]';
    return (
        <span className={`inline-flex items-center px-3 py-1 text-[10px] font-bold uppercase tracking-widest border ${map}`}>
            {aktif ? 'Aktif' : 'Nonaktif'}
        </span>
    );
}

function WajibBadge({ wajib }) {
    if (!wajib) return null;
    return (
        <span className="ml-2 inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-red-600 text-white border border-red-600">
            Wajib
        </span>
    );
}

export default function Index({ dokumenPmb, filters }) {
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('admin.dokumen-pmb.index'), { search });
    };

    const handleToggleStatus = (id) => {
        router.post(route('admin.dokumen-pmb.toggle-status', id));
    };

    const handleDelete = (id) => {
        if (confirm('Apakah Anda yakin ingin menghapus dokumen PMB ini?')) {
            router.delete(route('admin.dokumen-pmb.destroy', id));
        }
    };

    return (
        <AdminLayout title="Dokumen PMB">
            <Head title="Dokumen PMB" />

            <div className="p-6 lg:p-8 min-h-screen bg-[#fafafa]">
                <Box variant="black" className="mb-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-400 mb-1">Penerimaan Mahasiswa Baru</p>
                            <h1 className="text-xl font-bold uppercase tracking-tight text-white">Dokumen PMB</h1>
                        </div>
                        <ActionButton href={route('admin.dokumen-pmb.create')} variant="secondary">+ Tambah Dokumen</ActionButton>
                    </div>
                </Box>

                <Box className="mb-6">
                    <form onSubmit={handleSearch} className="flex gap-3">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari dokumen PMB..."
                            className="flex-1 px-3 py-2 text-xs border border-[#ccc] bg-white focus:outline-none focus:border-black"
                        />
                        <ActionButton type="submit" variant="primary">Cari</ActionButton>
                        {filters.search && (
                            <ActionButton href={route('admin.dokumen-pmb.index')} variant="secondary">Reset</ActionButton>
                        )}
                    </form>
                </Box>

                <Box>
                    <SectionTitle>Daftar Dokumen PMB</SectionTitle>

                    <div className="overflow-x-auto border border-[#e5e5e5]">
                        <table className="min-w-full text-left">
                            <thead className="bg-[#f5f5f5] border-b border-[#e5e5e5]">
                                <tr>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Dokumen</th>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Kode</th>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Jenis File</th>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Ukuran Max</th>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Status</th>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#e5e5e5]">
                                {dokumenPmb.data.map((dokumen) => (
                                    <tr key={dokumen.id} className="hover:bg-[#fafafa]">
                                        <td className="px-4 py-3">
                                            <div className="text-sm font-semibold text-neutral-900 flex items-center flex-wrap">
                                                {dokumen.nama_dokumen}
                                                <WajibBadge wajib={dokumen.wajib} />
                                            </div>
                                            {dokumen.deskripsi && (
                                                <div className="text-xs text-neutral-500 mt-1">{dokumen.deskripsi}</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <code className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest bg-[#f5f5f5] border border-[#e5e5e5] text-neutral-700">
                                                {dokumen.kode_dokumen}
                                            </code>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-neutral-600">{dokumen.jenis_file.toUpperCase()}</td>
                                        <td className="px-4 py-3 text-sm text-neutral-600">{dokumen.max_size_mb} MB</td>
                                        <td className="px-4 py-3"><StatusBadge aktif={dokumen.aktif} /></td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2 flex-wrap">
                                                <ActionButton href={route('admin.dokumen-pmb.show', dokumen.id)} variant="ghost">Lihat</ActionButton>
                                                <ActionButton href={route('admin.dokumen-pmb.edit', dokumen.id)} variant="ghost">Edit</ActionButton>
                                                <ActionButton onClick={() => handleToggleStatus(dokumen.id)} variant={dokumen.aktif ? 'secondary' : 'primary'}>
                                                    {dokumen.aktif ? 'Nonaktifkan' : 'Aktifkan'}
                                                </ActionButton>
                                                {dokumen.upload_dokumen_count === 0 && (
                                                    <ActionButton onClick={() => handleDelete(dokumen.id)} variant="danger">Hapus</ActionButton>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {dokumenPmb.data.length === 0 && (
                        <div className="text-center py-12 border border-[#e5e5e5] border-t-0">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-900">Tidak ada dokumen PMB</h3>
                            <p className="mt-2 text-xs text-neutral-500">Mulai dengan menambahkan dokumen PMB baru.</p>
                            <div className="mt-6">
                                <ActionButton href={route('admin.dokumen-pmb.create')} variant="primary">+ Tambah Dokumen PMB</ActionButton>
                            </div>
                        </div>
                    )}

                    {dokumenPmb.last_page > 1 && (
                        <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-[#e5e5e5] p-4">
                            <p className="text-xs text-neutral-500 uppercase tracking-widest">
                                Menampilkan <span className="font-bold text-neutral-900">{dokumenPmb.from}</span> sampai{' '}
                                <span className="font-bold text-neutral-900">{dokumenPmb.to}</span> dari{' '}
                                <span className="font-bold text-neutral-900">{dokumenPmb.total}</span> hasil
                            </p>
                            <div className="flex items-center gap-1">
                                {dokumenPmb.links.map((link, index) => (
                                    <Link
                                        key={index}
                                        href={link.url}
                                        className={`px-3 py-2 text-xs font-bold uppercase tracking-widest border transition-colors ${
                                            link.active
                                                ? 'bg-black text-white border-black'
                                                : 'bg-white text-neutral-700 border-[#ccc] hover:bg-[#f5f5f5]'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </Box>
            </div>
        </AdminLayout>
    );
}
