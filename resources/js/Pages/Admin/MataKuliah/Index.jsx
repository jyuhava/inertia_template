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

function JenisBadge({ jenis }) {
    const map = {
        Wajib: 'bg-neutral-100 text-neutral-700 border-[#e4e4e7]',
        Pilihan: 'bg-black text-white border-black'
    };
    return (
        <span className={`inline-flex px-3 py-1 text-[10px] font-semibold uppercase tracking-wider border ${map[jenis] || 'bg-neutral-100 text-neutral-700 border-[#e4e4e7]'}`}>
            {jenis}
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

export default function Index({ mataKuliahs, prodis, filters }) {
    const { flash } = usePage().props;
    const [search, setSearch] = useState(filters.search || '');
    const [prodiFilter, setProdiFilter] = useState(filters.prodi_id || '');
    const [semesterFilter, setSemesterFilter] = useState(filters.semester || '');
    const [jenisFilter, setJenisFilter] = useState(filters.jenis || '');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [mataKuliahToDelete, setMataKuliahToDelete] = useState(null);

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('admin.mata-kuliah.index'), { 
            search, 
            prodi_id: prodiFilter, 
            semester: semesterFilter,
            jenis: jenisFilter 
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleDelete = (mataKuliah) => {
        setMataKuliahToDelete(mataKuliah);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        if (mataKuliahToDelete) {
            router.delete(route('admin.mata-kuliah.destroy', mataKuliahToDelete.id));
            setShowDeleteModal(false);
            setMataKuliahToDelete(null);
        }
    };

    const clearFilters = () => {
        setSearch('');
        setProdiFilter('');
        setSemesterFilter('');
        setJenisFilter('');
        router.get(route('admin.mata-kuliah.index'));
    };

    const hasFilters = search || prodiFilter || semesterFilter || jenisFilter;

    return (
        <AdminLayout title="Mata Kuliah">
            <Head title="Mata Kuliah" />

            <div className="space-y-6">
                {/* Header */}
                <Box variant="dark" className="relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-neutral-400 mb-2">Master Data</p>
                        <h1 className="text-2xl font-bold tracking-tight text-white">MATA KULIAH</h1>
                        <p className="text-sm text-neutral-400 mt-1">Kelola data mata kuliah per program studi</p>
                    </div>
                </Box>

                {/* Controls */}
                <Box>
                    <SectionTitle action={<ActionButton href={route('admin.mata-kuliah.create')} variant="primary">+ Tambah Mata Kuliah</ActionButton>}>
                        Daftar Mata Kuliah
                    </SectionTitle>

                    <form onSubmit={handleSearch} className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                            <div className="md:col-span-2">
                                <TextInput
                                    type="text"
                                    placeholder="Cari mata kuliah, kode, atau prodi..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full border-[#e4e4e7] focus:border-black focus:ring-black rounded-none"
                                />
                            </div>
                            <div>
                                <select
                                    value={prodiFilter}
                                    onChange={(e) => setProdiFilter(e.target.value)}
                                    className="w-full h-[42px] px-3 border border-[#e4e4e7] bg-white text-sm text-neutral-700 focus:border-black focus:ring-black rounded-none"
                                >
                                    <option value="">Semua Prodi</option>
                                    {prodis.map((prodi) => (
                                        <option key={prodi.id} value={prodi.id}>
                                            {prodi.nama_prodi}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <select
                                    value={semesterFilter}
                                    onChange={(e) => setSemesterFilter(e.target.value)}
                                    className="w-full h-[42px] px-3 border border-[#e4e4e7] bg-white text-sm text-neutral-700 focus:border-black focus:ring-black rounded-none"
                                >
                                    <option value="">Semua Semester</option>
                                    {[1,2,3,4,5,6,7,8].map((sem) => (
                                        <option key={sem} value={sem}>Semester {sem}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <select
                                    value={jenisFilter}
                                    onChange={(e) => setJenisFilter(e.target.value)}
                                    className="w-full h-[42px] px-3 border border-[#e4e4e7] bg-white text-sm text-neutral-700 focus:border-black focus:ring-black rounded-none"
                                >
                                    <option value="">Semua Jenis</option>
                                    <option value="Wajib">Wajib</option>
                                    <option value="Pilihan">Pilihan</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <ActionButton type="submit" variant="primary">Filter</ActionButton>
                            {hasFilters && (
                                <ActionButton type="button" onClick={clearFilters} variant="secondary">Reset</ActionButton>
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
                                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Mata Kuliah</th>
                                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Program Studi</th>
                                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">SKS/Semester</th>
                                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Jenis</th>
                                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Status</th>
                                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Jadwal</th>
                                    <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-[#e4e4e7]">
                                {mataKuliahs.data.length > 0 ? (
                                    mataKuliahs.data.map((mataKuliah) => (
                                        <tr key={mataKuliah.id} className="hover:bg-[#fafafa] transition-colors">
                                            <td data-label="Mata Kuliah" className="px-5 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-black">{mataKuliah.nama_mata_kuliah}</div>
                                                <div className="text-xs text-neutral-500">{mataKuliah.kode_mata_kuliah}</div>
                                            </td>
                                            <td data-label="Program Studi" className="px-5 py-4 whitespace-nowrap">
                                                <div className="text-sm text-black">{mataKuliah.prodi.nama_prodi}</div>
                                                <div className="text-xs text-neutral-500">{mataKuliah.prodi.kode_prodi}</div>
                                            </td>
                                            <td data-label="SKS/Semester" className="px-5 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <CountBadge count={mataKuliah.sks} label="SKS" />
                                                    <CountBadge count={mataKuliah.semester} label="Sem" />
                                                </div>
                                            </td>
                                            <td data-label="Jenis" className="px-5 py-4 whitespace-nowrap"><JenisBadge jenis={mataKuliah.jenis} /></td>
                                            <td data-label="Status" className="px-5 py-4 whitespace-nowrap"><StatusBadge status={mataKuliah.status} /></td>
                                            <td data-label="Jadwal" className="px-5 py-4 whitespace-nowrap"><CountBadge count={mataKuliah.jadwal_kuliahs_count} label="Jadwal" /></td>
                                            <td data-label="Aksi" className="px-5 py-4 whitespace-nowrap text-right">
                                                <div className="flex justify-end gap-2">
                                                    <ActionButton href={route('admin.mata-kuliah.show', mataKuliah.id)} variant="secondary" size="sm">Detail</ActionButton>
                                                    <ActionButton href={route('admin.mata-kuliah.edit', mataKuliah.id)} variant="primary" size="sm">Edit</ActionButton>
                                                    <ActionButton onClick={() => handleDelete(mataKuliah)} variant="danger" size="sm">Hapus</ActionButton>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr className="table-cards-empty">
                                        <td colSpan={7} className="px-5 py-12 text-center text-sm text-neutral-500">
                                            Tidak ada data mata kuliah.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {mataKuliahs.links && mataKuliahs.links.length > 3 && (
                        <div className="px-5 py-4 border-t border-[#e4e4e7] flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-xs text-neutral-500 uppercase tracking-wider">
                                Menampilkan {mataKuliahs.from || 0} sampai {mataKuliahs.to || 0} dari {mataKuliahs.total} data
                            </div>
                            <div className="flex gap-1">
                                {mataKuliahs.links.map((link, index) => (
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
                        Apakah Anda yakin ingin menghapus mata kuliah "{mataKuliahToDelete?.nama_mata_kuliah}" ({mataKuliahToDelete?.kode_mata_kuliah})? 
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
