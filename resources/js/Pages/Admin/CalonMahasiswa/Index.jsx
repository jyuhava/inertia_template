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

function StatusBadge({ status }) {
    const map = {
        draft: 'bg-white text-neutral-500 border-[#ddd]',
        submitted: 'bg-[#f5f5f5] text-neutral-900 border-[#ccc]',
        verified: 'bg-black text-white border-black',
        accepted: 'bg-neutral-800 text-white border-neutral-800',
        rejected: 'bg-white text-red-600 border-red-200',
    };
    const labels = {
        draft: 'Draft',
        submitted: 'Disubmit',
        verified: 'Diverifikasi',
        accepted: 'Diterima',
        rejected: 'Ditolak',
    };
    return (
        <span className={`inline-flex items-center px-3 py-1 text-[10px] font-bold uppercase tracking-widest border ${map[status] || map.draft}`}>
            {labels[status] || status}
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

export default function Index({ calonMahasiswa = {}, filters = {}, periodePmb }) {
    const [search, setSearch] = useState(filters.search || '');
    const [filterStatus, setFilterStatus] = useState(filters.status || '');
    const [selectedItems, setSelectedItems] = useState([]);

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('admin.calon-mahasiswa.index'), {
            search,
            status: filterStatus,
            periode_pmb_id: filters.periode_pmb_id
        });
    };

    const handleFilterStatus = (status) => {
        setFilterStatus(status);
        router.get(route('admin.calon-mahasiswa.index'), {
            search,
            status,
            periode_pmb_id: filters.periode_pmb_id
        });
    };

    const handleBulkAction = (action) => {
        if (selectedItems.length === 0) {
            alert('Pilih minimal satu calon mahasiswa');
            return;
        }

        if (confirm(`Apakah Anda yakin ingin ${action} ${selectedItems.length} calon mahasiswa yang dipilih?`)) {
            router.post(route('admin.calon-mahasiswa.bulk-update-status'), {
                ids: selectedItems,
                status: action
            });
        }
    };

    const toggleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedItems(calonMahasiswa?.data?.map(item => item.id) || []);
        } else {
            setSelectedItems([]);
        }
    };

    const toggleSelectItem = (id) => {
        setSelectedItems(prev =>
            prev.includes(id)
                ? prev.filter(item => item !== id)
                : [...prev, id]
        );
    };

    return (
        <AdminLayout title="Calon Mahasiswa">
            <Head title="Calon Mahasiswa" />

            <div className="p-6 lg:p-8 min-h-screen bg-[#fafafa]">
                <Box variant="black" className="mb-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-400 mb-1">Penerimaan Mahasiswa Baru</p>
                            <h1 className="text-xl font-bold uppercase tracking-tight text-white">Calon Mahasiswa</h1>
                        </div>
                        <ActionButton href={route('admin.calon-mahasiswa.export')} variant="secondary">Export CSV</ActionButton>
                    </div>
                </Box>

                <Box className="mb-6">
                    <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari nama, nomor pendaftaran, atau NIK..."
                            className="px-3 py-2 text-xs border border-[#ccc] bg-white focus:outline-none focus:border-black"
                        />
                        <select
                            value={filterStatus}
                            onChange={(e) => handleFilterStatus(e.target.value)}
                            className="px-3 py-2 text-xs border border-[#ccc] bg-white focus:outline-none focus:border-black"
                        >
                            <option value="">Semua Status</option>
                            <option value="draft">Draft</option>
                            <option value="submitted">Disubmit</option>
                            <option value="verified">Diverifikasi</option>
                            <option value="accepted">Diterima</option>
                            <option value="rejected">Ditolak</option>
                        </select>
                        <div className="md:col-span-2 flex gap-2">
                            <ActionButton type="submit" variant="primary">Cari</ActionButton>
                            {(filters.search || filters.status) && (
                                <ActionButton href={route('admin.calon-mahasiswa.index')} variant="secondary">Reset</ActionButton>
                            )}
                        </div>
                    </form>

                    {selectedItems.length > 0 && (
                        <div className="mt-4 p-4 border border-[#e5e5e5] bg-[#f5f5f5]">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <span className="text-xs font-bold uppercase tracking-widest text-neutral-900">
                                    {selectedItems.length} item dipilih
                                </span>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <ActionButton onClick={() => handleBulkAction('verified')} variant="primary">Verifikasi</ActionButton>
                                    <ActionButton onClick={() => handleBulkAction('accepted')} variant="secondary">Terima</ActionButton>
                                    <ActionButton onClick={() => handleBulkAction('rejected')} variant="danger">Tolak</ActionButton>
                                </div>
                            </div>
                        </div>
                    )}
                </Box>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                    <StatCard label="Total" count={calonMahasiswa?.total || 0} />
                    <StatCard label="Draft" count={calonMahasiswa?.stats?.draft || 0} />
                    <StatCard label="Disubmit" count={calonMahasiswa?.stats?.submitted || 0} />
                    <StatCard label="Diverifikasi" count={calonMahasiswa?.stats?.verified || 0} />
                    <StatCard label="Diterima" count={calonMahasiswa?.stats?.accepted || 0} />
                </div>

                <Box>
                    <SectionTitle>Daftar Calon Mahasiswa</SectionTitle>

                    <div className="overflow-x-auto border border-[#e5e5e5]">
                        <table className="min-w-full text-left">
                            <thead className="bg-[#f5f5f5] border-b border-[#e5e5e5]">
                                <tr>
                                    <th className="px-4 py-3">
                                        <input
                                            type="checkbox"
                                            onChange={toggleSelectAll}
                                            checked={selectedItems.length === (calonMahasiswa?.data?.length || 0) && (calonMahasiswa?.data?.length || 0) > 0}
                                            className="w-4 h-4 border-[#ccc] text-black focus:ring-black"
                                        />
                                    </th>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Calon Mahasiswa</th>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Kontak</th>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Pilihan Prodi</th>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Status</th>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Tanggal</th>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#e5e5e5]">
                                {(calonMahasiswa?.data || []).map((calon) => (
                                    <tr key={calon.id} className="hover:bg-[#fafafa]">
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedItems.includes(calon.id)}
                                                onChange={() => toggleSelectItem(calon.id)}
                                                className="w-4 h-4 border-[#ccc] text-black focus:ring-black"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-sm font-semibold text-neutral-900">{calon.nama_lengkap}</div>
                                            <div className="text-xs text-neutral-500">{calon.no_pendaftaran}</div>
                                            <div className="text-[10px] uppercase tracking-widest text-neutral-400 mt-0.5">NIK: {calon.nik}</div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-neutral-600">
                                            <div>{calon.email}</div>
                                            <div>{calon.no_hp}</div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-neutral-600">
                                            <div className="font-medium">1. {calon.prodi_pilihan_1?.nama_prodi}</div>
                                            {calon.prodi_pilihan_2 && (
                                                <div>2. {calon.prodi_pilihan_2?.nama_prodi}</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3"><StatusBadge status={calon.status_pendaftaran} /></td>
                                        <td className="px-4 py-3 text-sm text-neutral-600">
                                            <div>Daftar: {calon.tanggal_daftar ? new Date(calon.tanggal_daftar).toLocaleDateString('id-ID') : '-'}</div>
                                            {calon.tanggal_verifikasi && (
                                                <div>Verifikasi: {new Date(calon.tanggal_verifikasi).toLocaleDateString('id-ID')}</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <ActionButton href={route('admin.calon-mahasiswa.show', calon.id)} variant="ghost">Detail</ActionButton>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {(calonMahasiswa?.data?.length || 0) === 0 && (
                        <div className="text-center py-12 border border-[#e5e5e5] border-t-0">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-900">Tidak ada calon mahasiswa</h3>
                            <p className="mt-2 text-xs text-neutral-500">Belum ada pendaftar untuk periode PMB ini.</p>
                        </div>
                    )}

                    {(calonMahasiswa?.last_page || 0) > 1 && (
                        <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-[#e5e5e5] p-4">
                            <p className="text-xs text-neutral-500 uppercase tracking-widest">
                                Menampilkan <span className="font-bold text-neutral-900">{calonMahasiswa?.from || 0}</span> sampai{' '}
                                <span className="font-bold text-neutral-900">{calonMahasiswa?.to || 0}</span> dari{' '}
                                <span className="font-bold text-neutral-900">{calonMahasiswa?.total || 0}</span> hasil
                            </p>
                            <div className="flex items-center gap-1">
                                {(calonMahasiswa?.links || []).map((link, index) => (
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
