import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import TextInput from '@/Components/TextInput';
import { useState } from 'react';

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

function HariBadge({ hari }) {
    const map = {
        Senin: 'bg-neutral-100 text-neutral-700 border-[#e4e4e7]',
        Selasa: 'bg-black text-white border-black',
        Rabu: 'bg-neutral-100 text-neutral-700 border-[#e4e4e7]',
        Kamis: 'bg-black text-white border-black',
        Jumat: 'bg-neutral-100 text-neutral-700 border-[#e4e4e7]',
        Sabtu: 'bg-black text-white border-black',
    };
    return (
        <span className={`inline-flex px-3 py-1 text-[10px] font-semibold uppercase tracking-wider border ${map[hari] || 'bg-neutral-100 text-neutral-700 border-[#e4e4e7]'}`}>
            {hari}
        </span>
    );
}

export default function Index({ jadwalKuliahs, filters = {} }) {
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = (e) => {
        e.preventDefault();
        router.get('/admin/jadwal-kuliah', { search }, { preserveState: true });
    };

    const handleDelete = (id) => {
        if (confirm('Yakin ingin menghapus jadwal kuliah ini?')) {
            router.delete(`/admin/jadwal-kuliah/${id}`);
        }
    };

    return (
        <AdminLayout title="Jadwal Kuliah">
            <Head title="Jadwal Kuliah" />

            <div className="space-y-6">
                {/* Header */}
                <Box variant="dark" className="relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-neutral-400 mb-2">Perkuliahan</p>
                        <h1 className="text-2xl font-bold tracking-tight text-white">JADWAL KULIAH</h1>
                        <p className="text-sm text-neutral-400 mt-1">Kelola jadwal perkuliahan per semester</p>
                    </div>
                </Box>

                {/* Controls */}
                <Box>
                    <SectionTitle action={<ActionButton href="/admin/jadwal-kuliah/create" variant="primary">+ Tambah Jadwal</ActionButton>}>
                        Daftar Jadwal Kuliah
                    </SectionTitle>

                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                            <TextInput
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari mata kuliah, dosen, hari, ruangan..."
                                className="w-full border-[#e4e4e7] focus:border-black focus:ring-black rounded-none"
                            />
                        </div>
                        <div className="flex gap-2">
                            <ActionButton type="submit" variant="primary">Cari</ActionButton>
                            {filters.search && (
                                <ActionButton
                                    type="button"
                                    onClick={() => {
                                        setSearch('');
                                        router.get('/admin/jadwal-kuliah');
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
                                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Mata Kuliah</th>
                                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Dosen</th>
                                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Semester</th>
                                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Jadwal</th>
                                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Ruangan</th>
                                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Kapasitas</th>
                                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Status</th>
                                    <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-[#e4e4e7]">
                                {jadwalKuliahs.data.length === 0 ? (
                                    <tr className="table-cards-empty">
                                        <td colSpan="8" className="px-5 py-12 text-center text-sm text-neutral-500">
                                            {filters.search ? 'Tidak ada jadwal kuliah yang ditemukan.' : 'Belum ada jadwal kuliah yang dibuat.'}
                                        </td>
                                    </tr>
                                ) : (
                                    jadwalKuliahs.data.map((jadwal) => (
                                        <tr key={jadwal.id} className="hover:bg-[#fafafa] transition-colors">
                                            <td data-label="Mata Kuliah" className="px-5 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-black">{jadwal.mata_kuliah?.nama_mata_kuliah}</div>
                                                <div className="text-xs text-neutral-500">{jadwal.mata_kuliah?.kode_mata_kuliah} - {jadwal.mata_kuliah?.sks} SKS</div>
                                            </td>
                                            <td data-label="Dosen" className="px-5 py-4 whitespace-nowrap">
                                                <div className="text-sm text-neutral-700">{jadwal.dosen?.nama_lengkap}</div>
                                                <div className="text-xs text-neutral-500">{jadwal.dosen?.nip}</div>
                                            </td>
                                            <td data-label="Semester" className="px-5 py-4 whitespace-nowrap text-sm text-neutral-700">{jadwal.semester?.nama_semester}</td>
                                            <td data-label="Jadwal" className="px-5 py-4 whitespace-nowrap">
                                                <HariBadge hari={jadwal.hari} />
                                                <div className="text-xs text-neutral-500 mt-1">{jadwal.jam_mulai} - {jadwal.jam_selesai}</div>
                                            </td>
                                            <td data-label="Ruangan" className="px-5 py-4 whitespace-nowrap text-sm text-neutral-700">{jadwal.ruangan}</td>
                                            <td data-label="Kapasitas" className="px-5 py-4 whitespace-nowrap text-sm text-neutral-700">{jadwal.kapasitas}</td>
                                            <td data-label="Status" className="px-5 py-4 whitespace-nowrap"><StatusBadge status={jadwal.status} /></td>
                                            <td data-label="Aksi" className="px-5 py-4 whitespace-nowrap text-right">
                                                <div className="flex justify-end gap-2">
                                                    <ActionButton href={`/admin/jadwal-kuliah/${jadwal.id}`} variant="secondary" size="sm">Detail</ActionButton>
                                                    <ActionButton href={`/admin/jadwal-kuliah/${jadwal.id}/edit`} variant="primary" size="sm">Edit</ActionButton>
                                                    <ActionButton onClick={() => handleDelete(jadwal.id)} variant="danger" size="sm">Hapus</ActionButton>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {jadwalKuliahs.links && (
                        <div className="px-5 py-4 border-t border-[#e4e4e7] flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-xs text-neutral-500 uppercase tracking-wider">
                                Menampilkan {jadwalKuliahs.from || 0} sampai {jadwalKuliahs.to || 0} dari {jadwalKuliahs.total} data
                            </div>
                            <div className="flex gap-1">
                                {jadwalKuliahs.links.map((link, index) => (
                                    <Link
                                        key={index}
                                        href={link.url || '#'}
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
        </AdminLayout>
    );
}
