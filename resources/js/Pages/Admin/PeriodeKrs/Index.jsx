import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useState } from 'react';

function Box({ children, className = '', padded = true, variant = 'white' }) {
    const variants = {
        white: 'bg-white border-[#e5e5e5]',
        black: 'bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 border-transparent text-white rounded-2xl shadow-lg shadow-violet-500/20',
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
        aktif: 'bg-black text-white border-black',
        tidak_aktif: 'bg-white text-neutral-500 border-[#ddd]',
    };
    const label = status === 'aktif' ? 'Aktif' : 'Tidak Aktif';
    return (
        <span className={`inline-flex items-center px-3 py-1 text-[10px] font-bold uppercase tracking-widest border ${map[status] || map.tidak_aktif}`}>
            {label}
        </span>
    );
}

export default function Index({ periodeKrs }) {
    const [search, setSearch] = useState('');

    const handleActivate = (id) => {
        if (confirm('Yakin ingin mengaktifkan periode KRS ini? Periode lain akan dinonaktifkan.')) {
            router.post(`/admin/periode-krs/${id}/activate`);
        }
    };

    const handleDeactivate = (id) => {
        if (confirm('Yakin ingin menonaktifkan periode KRS ini?')) {
            router.post(`/admin/periode-krs/${id}/deactivate`);
        }
    };

    const handleDelete = (id) => {
        if (confirm('Yakin ingin menghapus periode KRS ini? Data KRS mahasiswa akan ikut terhapus.')) {
            router.delete(`/admin/periode-krs/${id}`);
        }
    };

    const handleOpenKrs = (id) => {
        if (confirm('Buka KRS untuk periode ini? Mahasiswa akan dapat mulai mengisi KRS.')) {
            router.post(route('admin.periode-krs.open-krs', id));
        }
    };

    const handleCloseKrs = (id) => {
        if (confirm('Tutup KRS untuk periode ini?')) {
            router.post(route('admin.periode-krs.close-krs', id));
        }
    };

    const filtered = periodeKrs.data.filter((p) =>
        p.nama_periode?.toLowerCase().includes(search.toLowerCase()) ||
        p.tahun_ajaran?.tahun_mulai?.toString().includes(search) ||
        p.semester?.nama_semester?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <AdminLayout>
            <Head title="Periode KRS" />

            <div className="p-6 lg:p-8 min-h-dvh bg-[#fafafa]">
                <Box variant="black" className="mb-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/75 mb-1">Manajemen Akademik</p>
                            <h1 className="text-xl font-bold uppercase tracking-tight text-white">Periode KRS</h1>
                        </div>
                        <ActionButton href="/admin/periode-krs/create" variant="secondary">+ Tambah Periode KRS</ActionButton>
                    </div>
                </Box>

                <Box>
                    <SectionTitle action={
                        <div className="flex items-center gap-3">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari periode..."
                                className="px-3 py-2 text-xs border border-[#ccc] bg-white focus:outline-none focus:border-black w-48"
                            />
                        </div>
                    }>
                        Daftar Periode KRS
                    </SectionTitle>

                    <div className="overflow-x-auto border border-[#e5e5e5]">
                        <table className="min-w-full text-left table-cards">
                            <thead className="bg-[#f5f5f5] border-b border-[#e5e5e5]">
                                <tr>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Nama Periode</th>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Tahun Ajaran</th>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Semester</th>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Tanggal</th>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Status</th>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Status KRS</th>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#e5e5e5]">
                                {filtered.length === 0 ? (
                                    <tr className="table-cards-empty">
                                        <td colSpan="6" className="px-4 py-8 text-center text-xs text-neutral-400 uppercase tracking-widest">
                                            Belum ada periode KRS yang sesuai.
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((periode) => (
                                        <tr key={periode.id} className="hover:bg-[#fafafa]">
                                            <td data-label="Nama Periode" className="px-4 py-3 text-sm font-semibold text-neutral-900">{periode.nama_periode}</td>
                                            <td data-label="Tahun Ajaran" className="px-4 py-3 text-sm text-neutral-600">
                                                {periode.tahun_ajaran?.tahun_mulai} - {periode.tahun_ajaran?.tahun_selesai}
                                            </td>
                                            <td data-label="Semester" className="px-4 py-3 text-sm text-neutral-600">{periode.semester?.nama_semester}</td>
                                            <td data-label="Tanggal" className="px-4 py-3 text-sm text-neutral-600">
                                                {new Date(periode.tanggal_mulai).toLocaleDateString('id-ID')} - {new Date(periode.tanggal_selesai).toLocaleDateString('id-ID')}
                                            </td>
                                            <td data-label="Status" className="px-4 py-3"><StatusBadge status={periode.status} /></td>
                                            <td data-label="Status KRS" className="px-4 py-3 uppercase text-xs font-bold">{periode.krs_status || 'draft'}</td>
                                            <td data-label="Aksi" className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2 flex-wrap">
                                                    <ActionButton href={`/admin/periode-krs/${periode.id}`} variant="ghost">Lihat</ActionButton>
                                                    <ActionButton href={`/admin/periode-krs/${periode.id}/edit`} variant="ghost">Edit</ActionButton>
                                                    {periode.status === 'tidak_aktif' ? (
                                                        <ActionButton onClick={() => handleActivate(periode.id)} variant="primary">Aktifkan</ActionButton>
                                                    ) : (
                                                        <ActionButton onClick={() => handleDeactivate(periode.id)} variant="secondary">Nonaktifkan</ActionButton>
                                                    )}
                                                    {periode.krs_status !== 'open' ? (
                                                        <ActionButton onClick={() => handleOpenKrs(periode.id)} variant="primary">Buka KRS</ActionButton>
                                                    ) : (
                                                        <ActionButton onClick={() => handleCloseKrs(periode.id)} variant="secondary">Tutup KRS</ActionButton>
                                                    )}
                                                    <ActionButton onClick={() => handleDelete(periode.id)} variant="danger">Hapus</ActionButton>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {periodeKrs.links && (
                        <div className="mt-6 flex justify-center">
                            <div className="flex items-center gap-1">
                                {periodeKrs.links.map((link, index) => (
                                    <Link
                                        key={index}
                                        href={link.url || '#'}
                                        className={`px-3 py-2 text-xs font-bold uppercase tracking-widest border transition-colors ${
                                            link.active
                                                ? 'bg-black text-white border-black'
                                                : link.url
                                                ? 'bg-white text-neutral-700 border-[#ccc] hover:bg-[#f5f5f5]'
                                                : 'bg-[#f5f5f5] text-neutral-400 border-[#e5e5e5] cursor-not-allowed'
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
