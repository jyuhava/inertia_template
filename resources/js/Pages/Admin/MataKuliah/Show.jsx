import { Head, Link, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

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
        nonaktif: 'bg-white text-red-600 border-red-200',
    };
    return (
        <span className={`inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-widest border ${map[status] || map.nonaktif}`}>
            {status === 'aktif' ? 'Aktif' : 'Nonaktif'}
        </span>
    );
}

function JenisBadge({ jenis }) {
    return (
        <span className="inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-widest bg-[#f5f5f5] border border-[#e5e5e5] text-neutral-900">
            {jenis === 'Wajib' ? 'Mata Kuliah Wajib' : 'Mata Kuliah Pilihan'}
        </span>
    );
}

function DetailItem({ label, children }) {
    return (
        <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1.5">{label}</label>
            <div className="text-sm text-neutral-900">{children}</div>
        </div>
    );
}

function StatCard({ label, value }) {
    return (
        <div className="p-4 bg-[#f5f5f5] border border-[#e5e5e5]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">{label}</p>
            <p className="text-2xl font-bold text-neutral-900">{value}</p>
        </div>
    );
}

export default function Show({ mataKuliah }) {
    return (
        <AdminLayout title={`Detail Mata Kuliah - ${mataKuliah.nama_mata_kuliah}`}>
            <Head title={`Detail Mata Kuliah - ${mataKuliah.nama_mata_kuliah}`} />

            <div className="p-6 lg:p-8 min-h-dvh bg-[#fafafa]">
                <Box variant="black" className="mb-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/75 mb-1">Manajemen Akademik</p>
                            <h1 className="text-xl font-bold uppercase tracking-tight text-white">Detail Mata Kuliah</h1>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <ActionButton href={route('admin.mata-kuliah.edit', mataKuliah.id)} variant="secondary">Edit</ActionButton>
                            <ActionButton href={route('admin.mata-kuliah.index')} variant="ghost">Kembali</ActionButton>
                        </div>
                    </div>
                </Box>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <Box>
                            <SectionTitle>Informasi Mata Kuliah</SectionTitle>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <DetailItem label="Kode Mata Kuliah">
                                        <p className="text-lg font-bold text-neutral-900">{mataKuliah.kode_mata_kuliah}</p>
                                    </DetailItem>

                                    <DetailItem label="Nama Mata Kuliah">
                                        {mataKuliah.nama_mata_kuliah}
                                    </DetailItem>

                                    <DetailItem label="SKS">
                                        {mataKuliah.sks} SKS
                                    </DetailItem>

                                    <DetailItem label="Program Studi">
                                        <p className="font-bold text-neutral-900">{mataKuliah.prodi?.nama_prodi}</p>
                                        <p className="text-xs text-neutral-500">{mataKuliah.prodi?.kode_prodi}</p>
                                    </DetailItem>
                                </div>

                                <div className="space-y-4">
                                    <DetailItem label="Semester">
                                        Semester {mataKuliah.semester}
                                    </DetailItem>

                                    <DetailItem label="Jenis Mata Kuliah">
                                        <JenisBadge jenis={mataKuliah.jenis} />
                                    </DetailItem>

                                    <DetailItem label="Status">
                                        <StatusBadge status={mataKuliah.status} />
                                    </DetailItem>
                                </div>
                            </div>

                            {mataKuliah.deskripsi && (
                                <div className="mt-6 pt-6 border-t border-[#e5e5e5]">
                                    <DetailItem label="Deskripsi">
                                        <div className="p-4 bg-[#f5f5f5] border border-[#e5e5e5] text-neutral-700 whitespace-pre-wrap">
                                            {mataKuliah.deskripsi}
                                        </div>
                                    </DetailItem>
                                </div>
                            )}
                        </Box>

                        {mataKuliah.jadwal_kuliahs && mataKuliah.jadwal_kuliahs.length > 0 && (
                            <Box>
                                <SectionTitle>Jadwal Kuliah ({mataKuliah.jadwal_kuliahs.length})</SectionTitle>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full border border-[#e5e5e5] table-cards">
                                        <thead className="bg-[#f5f5f5]">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500 border-b border-[#e5e5e5]">Dosen</th>
                                                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500 border-b border-[#e5e5e5]">Hari & Waktu</th>
                                                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500 border-b border-[#e5e5e5]">Ruangan</th>
                                                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500 border-b border-[#e5e5e5]">Kapasitas</th>
                                                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500 border-b border-[#e5e5e5]">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-[#e5e5e5]">
                                            {mataKuliah.jadwal_kuliahs.map((jadwal) => (
                                                <tr key={jadwal.id} className="hover:bg-[#fafafa]">
                                                    <td data-label="Dosen" className="px-4 py-3 text-sm font-bold text-neutral-900">{jadwal.dosen?.nama_lengkap}</td>
                                                    <td data-label="Hari & Waktu" className="px-4 py-3 text-sm text-neutral-900">
                                                        {jadwal.hari}
                                                        <div className="text-xs text-neutral-500">{jadwal.jam_mulai} - {jadwal.jam_selesai}</div>
                                                    </td>
                                                    <td data-label="Ruangan" className="px-4 py-3 text-sm text-neutral-900">{jadwal.ruangan}</td>
                                                    <td data-label="Kapasitas" className="px-4 py-3 text-sm text-neutral-900">{jadwal.kapasitas}</td>
                                                    <td data-label="Status" className="px-4 py-3"><StatusBadge status={jadwal.status} /></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Box>
                        )}

                        <Box>
                            <SectionTitle>Prasyarat dan Kurikulum</SectionTitle>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <DetailItem label="Prasyarat Mata Kuliah">
                                    {mataKuliah.prasyarats?.length
                                        ? mataKuliah.prasyarats.map(p => <div key={p.id}>{p.kode_mata_kuliah} - {p.nama_mata_kuliah}</div>)
                                        : '-'}
                                </DetailItem>
                                <DetailItem label="Menjadi Prasyarat Untuk">
                                    {mataKuliah.menjadi_prasyarat_untuk?.length
                                        ? mataKuliah.menjadi_prasyarat_untuk.map(p => <div key={p.id}>{p.kode_mata_kuliah} - {p.nama_mata_kuliah}</div>)
                                        : '-'}
                                </DetailItem>
                                <DetailItem label="Digunakan pada Kurikulum">
                                    {mataKuliah.kurikulums?.length
                                        ? mataKuliah.kurikulums.map(k => <div key={k.id}>{k.kode} - {k.nama}</div>)
                                        : '-'}
                                </DetailItem>
                                <DetailItem label="Status PDDikti">
                                    {mataKuliah.pddikti_mapping?.sync_status || 'not_synced'}
                                </DetailItem>
                            </div>
                        </Box>

                        <Box>
                            <SectionTitle>Informasi Tambahan</SectionTitle>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <DetailItem label="Dibuat">
                                    {new Date(mataKuliah.created_at).toLocaleDateString('id-ID', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </DetailItem>

                                <DetailItem label="Terakhir Diperbarui">
                                    {new Date(mataKuliah.updated_at).toLocaleDateString('id-ID', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </DetailItem>
                            </div>
                        </Box>
                    </div>

                    <div className="space-y-6">
                        <Box>
                            <SectionTitle>Statistik</SectionTitle>
                            <div className="grid grid-cols-1 gap-3">
                                <StatCard label="Jadwal Kuliah" value={mataKuliah.jadwal_kuliah_count || 0} />
                                <StatCard label="Mahasiswa Mengambil" value={mataKuliah.mahasiswa_count || 0} />
                                <StatCard label="Bobot SKS" value={mataKuliah.sks} />
                            </div>
                        </Box>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
