import { Head, Link, router, usePage } from '@inertiajs/react';
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

function StatusBadge({ status, label }) {
    const map = {
        menunggu_persetujuan: 'bg-[#f5f5f5] text-neutral-900 border-[#ccc]',
        disetujui: 'bg-black text-white border-black',
        ditolak: 'bg-white text-red-600 border-red-200',
        dibatalkan: 'bg-white text-neutral-400 border-[#ddd]',
    };
    return (
        <span className={`inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-widest border ${map[status] || map.menunggu_persetujuan}`}>
            {label || status || 'N/A'}
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

export default function Index({ krsData = {}, filters = {}, periodeKrsList = [], prodis = [], selectedPeriode, stats = {} }) {
    const { flash } = usePage().props;
    const [selectedItems, setSelectedItems] = useState([]);
    const [bulkAction, setBulkAction] = useState('');
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [bulkCatatan, setBulkCatatan] = useState('');

    const safeKrsData = {
        data: krsData.data || [],
        links: krsData.links || [],
        from: krsData.from || 0,
        to: krsData.to || 0,
        total: krsData.total || 0
    };

    const safeStats = {
        total: stats.total || 0,
        menunggu_persetujuan: stats.menunggu_persetujuan || 0,
        disetujui: stats.disetujui || 0,
        ditolak: stats.ditolak || 0,
        dibatalkan: stats.dibatalkan || 0
    };

    const handleFilter = (key, value) => {
        router.get('/admin/krs', {
            ...filters,
            [key]: value,
            page: 1
        }, {
            preserveState: true,
            replace: true
        });
    };

    const handleApprove = (krsId, catatan = '') => {
        if (confirm('Yakin ingin menyetujui KRS ini?')) {
            router.patch(`/admin/krs/${krsId}/approve`, {
                catatan_admin: catatan
            });
        }
    };

    const handleReject = (krsId, catatan) => {
        if (!catatan.trim()) {
            alert('Catatan penolakan wajib diisi');
            return;
        }

        if (confirm('Yakin ingin menolak KRS ini?')) {
            router.patch(`/admin/krs/${krsId}/reject`, {
                catatan_admin: catatan
            });
        }
    };

    const handleBulkAction = () => {
        if (selectedItems.length === 0) {
            alert('Pilih minimal 1 KRS');
            return;
        }

        if (bulkAction === 'reject' && !bulkCatatan.trim()) {
            alert('Catatan penolakan wajib diisi');
            return;
        }

        const url = bulkAction === 'approve' ? '/admin/krs/bulk-approve' : '/admin/krs/bulk-reject';

        router.post(url, {
            krs_ids: selectedItems,
            catatan_admin: bulkCatatan
        });

        setShowBulkModal(false);
        setSelectedItems([]);
        setBulkCatatan('');
    };

    const toggleSelectAll = () => {
        const pendingKrs = safeKrsData.data.filter(krs => krs.status === 'menunggu_persetujuan');
        if (selectedItems.length === pendingKrs.length && pendingKrs.length > 0) {
            setSelectedItems([]);
        } else {
            setSelectedItems(pendingKrs.map(krs => krs.id));
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
        <AdminLayout title="Manajemen KRS">
            <Head title="Manajemen KRS" />

            <div className="p-6 lg:p-8 min-h-screen bg-[#fafafa]">
                {flash.message && (
                    <Box variant="black" className="mb-6">
                        <p className="text-xs font-bold uppercase tracking-widest">{flash.message}</p>
                    </Box>
                )}

                <Box variant="black" className="mb-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-400 mb-1">Manajemen Akademik</p>
                            <h1 className="text-xl font-bold uppercase tracking-tight text-white">KRS Mahasiswa</h1>
                        </div>
                        {selectedItems.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap">
                                <ActionButton onClick={() => { setBulkAction('approve'); setShowBulkModal(true); }} variant="secondary">
                                    Setujui ({selectedItems.length})
                                </ActionButton>
                                <ActionButton onClick={() => { setBulkAction('reject'); setShowBulkModal(true); }} variant="danger">
                                    Tolak ({selectedItems.length})
                                </ActionButton>
                            </div>
                        )}
                    </div>
                </Box>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                    <StatCard label="Total KRS" count={safeStats.total} />
                    <StatCard label="Menunggu" count={safeStats.menunggu_persetujuan} />
                    <StatCard label="Disetujui" count={safeStats.disetujui} />
                    <StatCard label="Ditolak" count={safeStats.ditolak} />
                    <StatCard label="Dibatalkan" count={safeStats.dibatalkan} />
                </div>

                <Box>
                    <SectionTitle>Daftar KRS Mahasiswa</SectionTitle>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1.5">Periode KRS</label>
                            <select
                                value={selectedPeriode || ''}
                                onChange={(e) => handleFilter('periode_krs_id', e.target.value)}
                                className="w-full px-3 py-2 text-xs border border-[#ccc] bg-white focus:outline-none focus:border-black"
                            >
                                <option value="">Pilih Periode</option>
                                {periodeKrsList.map(periode => (
                                    <option key={periode.id} value={periode.id}>
                                        {periode.nama_periode} - {periode.tahun_ajaran.tahun} {periode.semester.nama_semester}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1.5">Cari Mahasiswa</label>
                            <input
                                type="text"
                                placeholder="Nama atau NIM..."
                                value={filters.search || ''}
                                onChange={(e) => handleFilter('search', e.target.value)}
                                className="w-full px-3 py-2 text-xs border border-[#ccc] bg-white focus:outline-none focus:border-black"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1.5">Program Studi</label>
                            <select
                                value={filters.prodi_id || ''}
                                onChange={(e) => handleFilter('prodi_id', e.target.value)}
                                className="w-full px-3 py-2 text-xs border border-[#ccc] bg-white focus:outline-none focus:border-black"
                            >
                                <option value="">Semua Prodi</option>
                                {prodis.map(prodi => (
                                    <option key={prodi.id} value={prodi.id}>
                                        {prodi.kode_prodi} - {prodi.nama_prodi}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1.5">Status</label>
                            <select
                                value={filters.status || ''}
                                onChange={(e) => handleFilter('status', e.target.value)}
                                className="w-full px-3 py-2 text-xs border border-[#ccc] bg-white focus:outline-none focus:border-black"
                            >
                                <option value="">Semua Status</option>
                                <option value="menunggu_persetujuan">Menunggu Persetujuan</option>
                                <option value="disetujui">Disetujui</option>
                                <option value="ditolak">Ditolak</option>
                                <option value="dibatalkan">Dibatalkan</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto border border-[#e5e5e5]">
                        <table className="min-w-full text-left">
                            <thead className="bg-[#f5f5f5] border-b border-[#e5e5e5]">
                                <tr>
                                    <th className="px-4 py-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedItems.length === safeKrsData.data.filter(krs => krs.status === 'menunggu_persetujuan').length && safeKrsData.data.filter(krs => krs.status === 'menunggu_persetujuan').length > 0}
                                            onChange={toggleSelectAll}
                                            className="w-4 h-4 border-[#ccc] text-black focus:ring-black"
                                        />
                                    </th>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Mahasiswa</th>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Mata Kuliah</th>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Jadwal</th>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Status</th>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Tanggal Pengajuan</th>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#e5e5e5]">
                                {safeKrsData.data.map((krs) => (
                                    <tr key={krs.id} className="hover:bg-[#fafafa]">
                                        <td className="px-4 py-3">
                                            {krs.status === 'menunggu_persetujuan' && (
                                                <input
                                                    type="checkbox"
                                                    checked={selectedItems.includes(krs.id)}
                                                    onChange={() => toggleSelectItem(krs.id)}
                                                    className="w-4 h-4 border-[#ccc] text-black focus:ring-black"
                                                />
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-sm font-semibold text-neutral-900">{krs.mahasiswa?.nama_lengkap || 'N/A'}</div>
                                            <div className="text-xs text-neutral-500">{krs.mahasiswa?.nim || 'N/A'} • {krs.mahasiswa?.prodi?.nama_prodi || 'N/A'}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-sm font-semibold text-neutral-900">{krs.jadwal_kuliah?.mata_kuliah?.nama_mata_kuliah || 'N/A'}</div>
                                            <div className="text-xs text-neutral-500">{krs.jadwal_kuliah?.mata_kuliah?.kode_mata_kuliah || 'N/A'} • {krs.jadwal_kuliah?.mata_kuliah?.sks || 0} SKS</div>
                                            <div className="text-xs text-neutral-500">Dosen: {krs.jadwal_kuliah?.dosen?.nama_lengkap || 'N/A'}</div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-neutral-600">
                                            <div>{krs.jadwal_kuliah?.hari || 'N/A'}</div>
                                            <div>{krs.jadwal_kuliah?.jam_mulai || 'N/A'} - {krs.jadwal_kuliah?.jam_selesai || 'N/A'}</div>
                                            <div>Ruang: {krs.jadwal_kuliah?.ruangan || 'N/A'}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge status={krs.status} label={krs.status_display || krs.status} />
                                            {krs.catatan_admin && (
                                                <div className="text-[10px] uppercase tracking-widest text-neutral-400 mt-1">
                                                    Catatan: {krs.catatan_admin}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-neutral-600">
                                            {krs.created_at ? new Date(krs.created_at).toLocaleDateString('id-ID') : 'N/A'}
                                            {krs.tanggal_approval && (
                                                <div className="text-xs">Disetujui: {new Date(krs.tanggal_approval).toLocaleDateString('id-ID')}</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-2 flex-wrap">
                                                <ActionButton
                                                    href={`/admin/krs/mahasiswa/${krs.mahasiswa?.id || 0}?periode_krs_id=${krs.periode_krs_id || 0}`}
                                                    variant="ghost"
                                                >
                                                    Detail
                                                </ActionButton>

                                                {krs.status === 'menunggu_persetujuan' && (
                                                    <>
                                                        <ActionButton onClick={() => handleApprove(krs.id)} variant="primary">Setujui</ActionButton>
                                                        <ActionButton
                                                            onClick={() => {
                                                                const catatan = prompt('Masukkan alasan penolakan:');
                                                                if (catatan) handleReject(krs.id, catatan);
                                                            }}
                                                            variant="danger"
                                                        >
                                                            Tolak
                                                        </ActionButton>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {safeKrsData.data.length === 0 && (
                        <div className="text-center py-12 border border-[#e5e5e5] border-t-0">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-900">Tidak ada data KRS</h3>
                            <p className="mt-2 text-xs text-neutral-500">Belum ada pengajuan KRS untuk filter yang dipilih.</p>
                        </div>
                    )}

                    {krsData.links && krsData.links.length > 0 && (
                        <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-[#e5e5e5] p-4">
                            <p className="text-xs text-neutral-500 uppercase tracking-widest">
                                Menampilkan <span className="font-bold text-neutral-900">{safeKrsData.from || 0}</span> sampai{' '}
                                <span className="font-bold text-neutral-900">{safeKrsData.to || 0}</span> dari{' '}
                                <span className="font-bold text-neutral-900">{safeKrsData.total || 0}</span> data
                            </p>
                            <div className="flex items-center gap-1">
                                {safeKrsData.links.map((link, index) => {
                                    if (!link.url) {
                                        return (
                                            <span
                                                key={index}
                                                className={`px-3 py-2 text-xs font-bold uppercase tracking-widest border ${
                                                    link.active ? 'bg-black text-white border-black' : 'bg-[#f5f5f5] text-neutral-400 border-[#e5e5e5] cursor-not-allowed'
                                                }`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        );
                                    }
                                    return (
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
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </Box>
            </div>

            {showBulkModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <Box className="w-full max-w-md">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-900 mb-4">
                            {bulkAction === 'approve' ? 'Setujui KRS Terpilih' : 'Tolak KRS Terpilih'}
                        </h3>

                        <div className="mb-4">
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1.5">
                                Catatan {bulkAction === 'reject' ? '(Wajib)' : '(Opsional)'}
                            </label>
                            <textarea
                                value={bulkCatatan}
                                onChange={(e) => setBulkCatatan(e.target.value)}
                                placeholder={`Masukkan catatan ${bulkAction === 'approve' ? 'persetujuan' : 'penolakan'}...`}
                                className="w-full px-3 py-2 text-xs border border-[#ccc] bg-white focus:outline-none focus:border-black"
                                rows={3}
                                required={bulkAction === 'reject'}
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            <ActionButton onClick={() => setShowBulkModal(false)} variant="secondary">Batal</ActionButton>
                            <ActionButton onClick={handleBulkAction} variant={bulkAction === 'reject' ? 'danger' : 'primary'}>
                                {bulkAction === 'approve' ? 'Setujui' : 'Tolak'} ({selectedItems.length})
                            </ActionButton>
                        </div>
                    </Box>
                </div>
            )}
        </AdminLayout>
    );
}
