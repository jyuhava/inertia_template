import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import TextInput from '@/Components/TextInput';
import Modal from '@/Components/Modal';

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
            {status === 'aktif' ? 'Aktif' : 'Nonaktif'}
        </span>
    );
}

function CountBadge({ count, label }) {
    return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider border bg-neutral-100 text-neutral-700 border-[#e4e4e7]">
            {count} {label}
        </span>
    );
}

export default function Index({ tahunAjarans, filters }) {
    const { flash } = usePage().props;
    const [search, setSearch] = useState(filters.search || '');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [tahunAjaranToDelete, setTahunAjaranToDelete] = useState(null);

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('admin.tahun-ajaran.index'), { search }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleDelete = (tahunAjaran) => {
        setTahunAjaranToDelete(tahunAjaran);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        if (tahunAjaranToDelete) {
            router.delete(route('admin.tahun-ajaran.destroy', tahunAjaranToDelete.id));
            setShowDeleteModal(false);
            setTahunAjaranToDelete(null);
        }
    };

    return (
        <AdminLayout title="Tahun Ajaran">
            <Head title="Tahun Ajaran" />

            <div className="space-y-6">
                {/* Header */}
                <Box variant="dark" className="relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-neutral-400 mb-2">Master Data</p>
                        <h1 className="text-2xl font-bold tracking-tight text-white">TAHUN AJARAN</h1>
                        <p className="text-sm text-neutral-400 mt-1">Kelola data tahun ajaran akademik</p>
                    </div>
                </Box>

                {/* Controls */}
                <Box>
                    <SectionTitle action={<ActionButton href={route('admin.tahun-ajaran.create')} variant="primary">+ Tambah Tahun Ajaran</ActionButton>}>
                        Daftar Tahun Ajaran
                    </SectionTitle>

                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                            <TextInput
                                type="text"
                                placeholder="Cari tahun ajaran..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full border-[#e4e4e7] focus:border-black focus:ring-black rounded-none"
                            />
                        </div>
                        <div className="flex gap-2">
                            <ActionButton type="submit" variant="primary">Cari</ActionButton>
                            {search && (
                                <ActionButton
                                    type="button"
                                    onClick={() => {
                                        setSearch('');
                                        router.get(route('admin.tahun-ajaran.index'));
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
                                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Tahun Ajaran</th>
                                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Periode</th>
                                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Status</th>
                                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Semester</th>
                                    <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-[#e4e4e7]">
                                {tahunAjarans.data.length > 0 ? (
                                    tahunAjarans.data.map((tahunAjaran) => (
                                        <tr key={tahunAjaran.id} className="hover:bg-[#fafafa] transition-colors">
                                            <td data-label="Tahun Ajaran" className="px-5 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-black">{tahunAjaran.nama_tahun_ajaran}</div>
                                                {tahunAjaran.keterangan && (
                                                    <div className="text-xs text-neutral-500 mt-0.5">{tahunAjaran.keterangan}</div>
                                                )}
                                            </td>
                                            <td data-label="Periode" className="px-5 py-4 whitespace-nowrap text-sm text-neutral-700">
                                                <div>{new Date(tahunAjaran.tanggal_mulai).toLocaleDateString('id-ID')}</div>
                                                <div className="text-neutral-400 text-xs">s/d {new Date(tahunAjaran.tanggal_selesai).toLocaleDateString('id-ID')}</div>
                                            </td>
                                            <td data-label="Status" className="px-5 py-4 whitespace-nowrap"><StatusBadge status={tahunAjaran.status} /></td>
                                            <td data-label="Semester" className="px-5 py-4 whitespace-nowrap"><CountBadge count={tahunAjaran.semesters_count} label="Semester" /></td>
                                            <td data-label="Aksi" className="px-5 py-4 whitespace-nowrap text-right">
                                                <div className="flex justify-end gap-2">
                                                    <ActionButton href={route('admin.tahun-ajaran.show', tahunAjaran.id)} variant="secondary" size="sm">Detail</ActionButton>
                                                    <ActionButton href={route('admin.tahun-ajaran.edit', tahunAjaran.id)} variant="primary" size="sm">Edit</ActionButton>
                                                    <ActionButton onClick={() => handleDelete(tahunAjaran)} variant="danger" size="sm">Hapus</ActionButton>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr className="table-cards-empty">
                                        <td colSpan={5} className="px-5 py-12 text-center text-sm text-neutral-500">
                                            Tidak ada data tahun ajaran.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {tahunAjarans.links && tahunAjarans.links.length > 3 && (
                        <div className="px-5 py-4 border-t border-[#e4e4e7] flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-xs text-neutral-500 uppercase tracking-wider">
                                Menampilkan {tahunAjarans.from || 0} sampai {tahunAjarans.to || 0} dari {tahunAjarans.total} data
                            </div>
                            <div className="flex gap-1">
                                {tahunAjarans.links.map((link, index) => (
                                    <button
                                        key={index}
                                        onClick={() => link.url && router.get(link.url)}
                                        disabled={!link.url}
                                        className={`px-3 py-2 text-xs font-medium border transition-colors ${
                                            link.active
                                                ? 'bg-black text-white border-black'
                                                : link.url
                                                ? 'bg-white text-neutral-700 border-[#e4e4e7] hover:border-black hover:text-black'
                                                : 'bg-[#fafafa] text-neutral-400 border-[#e4e4e7] cursor-not-allowed'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </Box>
            </div>

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
                <div className="p-6 border border-[#e4e4e7] bg-white">
                    <div className="flex items-center mb-4">
                        <div className="h-10 w-10 bg-red-50 border border-red-100 flex items-center justify-center mr-3">
                            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-black">Konfirmasi Hapus</h3>
                    </div>
                    <p className="text-sm text-neutral-600 mb-6">
                        Apakah Anda yakin ingin menghapus tahun ajaran "{tahunAjaranToDelete?.nama_tahun_ajaran}"? 
                        Tindakan ini tidak dapat dibatalkan.
                    </p>
                    <div className="flex justify-end gap-2">
                        <ActionButton onClick={() => setShowDeleteModal(false)} variant="secondary">Batal</ActionButton>
                        <ActionButton onClick={confirmDelete} variant="danger">Hapus</ActionButton>
                    </div>
                </div>
            </Modal>
        </AdminLayout>
    );
}
