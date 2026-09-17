import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import TextInput from '@/Components/TextInput';

function Box({ children, className = '', padded = true, variant = 'white' }) {
    const variants = {
        white: 'bg-white border-[#e4e4e7]',
        dark: 'bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 border-transparent text-white rounded-2xl shadow-lg shadow-violet-500/20',
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
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
        cuti: 'bg-amber-100 text-amber-800 border-amber-200',
        nonaktif: 'bg-white text-neutral-500 border-[#e4e4e7]',
        lulus: 'bg-neutral-100 text-neutral-700 border-[#e4e4e7]',
        dropout: 'bg-red-100 text-red-700 border-red-200',
        mengundurkan_diri: 'bg-red-50 text-red-600 border-red-100',
        pindah: 'bg-blue-50 text-blue-700 border-blue-100',
        dikeluarkan: 'bg-red-100 text-red-800 border-red-200',
    };
    return (
        <span className={`inline-flex px-3 py-1 text-[10px] font-semibold uppercase tracking-wider border ${map[status] || map.nonaktif}`}>
            {status?.replace(/_/g, ' ')}
        </span>
    );
}

function PddiktiBadge({ mahasiswa }) {
    const status = mahasiswa.pddikti_mapping?.status_mapping || 'unmapped';
    const map = {
        mapped: 'bg-green-100 text-green-800 border-green-200',
        pending: 'bg-amber-100 text-amber-800 border-amber-200',
        error: 'bg-red-100 text-red-700 border-red-200',
        unmapped: 'bg-neutral-100 text-neutral-500 border-neutral-200',
    };
    const label = {
        mapped: 'Terhubung',
        pending: 'Menunggu',
        error: 'Gagal',
        unmapped: 'Belum Terhubung',
    };
    return (
        <span className={`inline-flex px-3 py-1 text-[10px] font-semibold uppercase tracking-wider border ${map[status]}`}>
            {label[status]}
        </span>
    );
}

export default function Index({ mahasiswas, filters, totalMahasiswa, filteredCount, prodis, angkatanOptions }) {
    const [search, setSearch] = useState(filters.search || '');
    const [prodiId, setProdiId] = useState(filters.prodi_id || '');
    const [angkatan, setAngkatan] = useState(filters.angkatan || '');
    const [status, setStatus] = useState(filters.status || '');
    const [jenisKelamin, setJenisKelamin] = useState(filters.jenis_kelamin || '');
    const [statusPddikti, setStatusPddikti] = useState(filters.status_pddikti || '');

    const applyFilters = (overrides = {}) => {
        router.get(route('admin.mahasiswa.index'), {
            search, prodi_id: prodiId, angkatan, status,
            jenis_kelamin: jenisKelamin, status_pddikti: statusPddikti,
            ...overrides,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        applyFilters();
    };

    const resetFilters = () => {
        setSearch(''); setProdiId(''); setAngkatan(''); setStatus(''); setJenisKelamin(''); setStatusPddikti('');
        router.get(route('admin.mahasiswa.index'), {}, { preserveState: true, preserveScroll: true });
    };

    const handleDelete = (mahasiswa) => {
        if (confirm('Apakah Anda yakin ingin menghapus mahasiswa ini? Data masih bisa dipulihkan.')) {
            router.delete(route('admin.mahasiswa.destroy', mahasiswa.id));
        }
    };

    const handleSort = (column) => {
        const dir = filters.sort_by === column && filters.sort_dir === 'asc' ? 'desc' : 'asc';
        applyFilters({ sort_by: column, sort_dir: dir });
    };

    return (
        <AdminLayout title="Manajemen Mahasiswa">
            <Head title="Manajemen Mahasiswa" />

            <div className="space-y-6">
                <Box variant="dark" className="relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-neutral-400 mb-2">Modul Mahasiswa</p>
                        <h1 className="text-2xl font-bold tracking-tight text-white">DATA MAHASISWA</h1>
                        <p className="text-sm text-neutral-400 mt-1">
                            {Object.values(filters).some(Boolean) ? (
                                <>Menampilkan {filteredCount} dari {totalMahasiswa} mahasiswa</>
                            ) : (
                                <>Total {totalMahasiswa} mahasiswa terdaftar</>
                            )}
                        </p>
                    </div>
                </Box>

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

                    <form onSubmit={handleSearch} className="space-y-3">
                        <div className="flex flex-col sm:flex-row gap-3">
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
                                <ActionButton onClick={resetFilters} variant="secondary">Reset</ActionButton>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                            <select
                                value={prodiId}
                                onChange={(e) => { setProdiId(e.target.value); applyFilters({ prodi_id: e.target.value }); }}
                                className="border-[#e4e4e7] rounded-none text-sm focus:border-black focus:ring-black"
                            >
                                <option value="">Semua Prodi</option>
                                {prodis?.map((p) => (
                                    <option key={p.id} value={p.id}>{p.kode_prodi} - {p.nama_prodi}</option>
                                ))}
                            </select>

                            <select
                                value={angkatan}
                                onChange={(e) => { setAngkatan(e.target.value); applyFilters({ angkatan: e.target.value }); }}
                                className="border-[#e4e4e7] rounded-none text-sm focus:border-black focus:ring-black"
                            >
                                <option value="">Semua Angkatan</option>
                                {angkatanOptions?.map((a) => (
                                    <option key={a} value={a}>{a}</option>
                                ))}
                            </select>

                            <select
                                value={status}
                                onChange={(e) => { setStatus(e.target.value); applyFilters({ status: e.target.value }); }}
                                className="border-[#e4e4e7] rounded-none text-sm focus:border-black focus:ring-black"
                            >
                                <option value="">Semua Status</option>
                                <option value="aktif">Aktif</option>
                                <option value="cuti">Cuti</option>
                                <option value="nonaktif">Nonaktif</option>
                                <option value="lulus">Lulus</option>
                                <option value="dropout">Dropout</option>
                                <option value="mengundurkan_diri">Mengundurkan Diri</option>
                                <option value="pindah">Pindah</option>
                                <option value="dikeluarkan">Dikeluarkan</option>
                            </select>

                            <select
                                value={jenisKelamin}
                                onChange={(e) => { setJenisKelamin(e.target.value); applyFilters({ jenis_kelamin: e.target.value }); }}
                                className="border-[#e4e4e7] rounded-none text-sm focus:border-black focus:ring-black"
                            >
                                <option value="">Semua Jenis Kelamin</option>
                                <option value="L">Laki-laki</option>
                                <option value="P">Perempuan</option>
                            </select>

                            <select
                                value={statusPddikti}
                                onChange={(e) => { setStatusPddikti(e.target.value); applyFilters({ status_pddikti: e.target.value }); }}
                                className="border-[#e4e4e7] rounded-none text-sm focus:border-black focus:ring-black"
                            >
                                <option value="">Semua Status PDDikti</option>
                                <option value="mapped">Terhubung</option>
                                <option value="pending">Menunggu</option>
                                <option value="error">Gagal</option>
                                <option value="unmapped">Belum Terhubung</option>
                            </select>
                        </div>
                    </form>
                </Box>

                <Box padded={false} className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-[#e4e4e7] table-cards">
                            <thead className="bg-[#fafafa]">
                                <tr>
                                    <th onClick={() => handleSort('nim')} className="cursor-pointer px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">NIM</th>
                                    <th onClick={() => handleSort('nama_lengkap')} className="cursor-pointer px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Nama</th>
                                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Jenis Kelamin</th>
                                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Program Studi</th>
                                    <th onClick={() => handleSort('angkatan')} className="cursor-pointer px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Angkatan</th>
                                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Status</th>
                                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Status PDDikti</th>
                                    <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-[#e4e4e7]">
                                {mahasiswas.data.map((mahasiswa) => (
                                    <tr key={mahasiswa.id} className="hover:bg-[#fafafa] transition-colors">
                                        <td data-label="NIM" className="px-5 py-4 whitespace-nowrap text-sm font-medium text-black">{mahasiswa.nim}</td>
                                        <td data-label="Nama" className="px-5 py-4 whitespace-nowrap text-sm text-neutral-700">{mahasiswa.nama_lengkap}</td>
                                        <td data-label="Jenis Kelamin" className="px-5 py-4 whitespace-nowrap text-sm text-neutral-700">{mahasiswa.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</td>
                                        <td data-label="Program Studi" className="px-5 py-4 whitespace-nowrap text-sm text-neutral-700">
                                            {mahasiswa.prodi ? `${mahasiswa.prodi.kode_prodi} - ${mahasiswa.prodi.nama_prodi}` : mahasiswa.program_studi}
                                        </td>
                                        <td data-label="Angkatan" className="px-5 py-4 whitespace-nowrap text-sm text-neutral-700">{mahasiswa.angkatan}</td>
                                        <td data-label="Status" className="px-5 py-4 whitespace-nowrap"><StatusBadge status={mahasiswa.status} /></td>
                                        <td data-label="Status PDDikti" className="px-5 py-4 whitespace-nowrap"><PddiktiBadge mahasiswa={mahasiswa} /></td>
                                        <td data-label="Aksi" className="px-5 py-4 whitespace-nowrap text-right">
                                            <div className="flex justify-end gap-2">
                                                <ActionButton href={route('admin.mahasiswa.show', mahasiswa.id)} variant="secondary">Detail</ActionButton>
                                                <ActionButton onClick={() => handleDelete(mahasiswa)} variant="danger">Hapus</ActionButton>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {mahasiswas.data.length === 0 && (
                                    <tr className="table-cards-empty">
                                        <td colSpan="8" className="px-5 py-12 text-center text-sm text-neutral-500">
                                            Tidak ada data mahasiswa.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

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
