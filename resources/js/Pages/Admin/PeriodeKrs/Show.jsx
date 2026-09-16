import { Head, Link } from '@inertiajs/react';
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
            {status === 'aktif' ? 'Aktif' : 'Tidak Aktif'}
        </span>
    );
}

function KrsStatusBadge({ status }) {
    const map = {
        diambil: 'bg-black text-white border-black',
        dibatalkan: 'bg-white text-red-600 border-red-200',
    };
    return (
        <span className={`inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-widest border ${map[status] || map.dibatalkan}`}>
            {status === 'diambil' ? 'Diambil' : 'Dibatalkan'}
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

export default function Show({ periodeKrs }) {
    const totalKrs = periodeKrs.krs?.length || 0;
    const krsAktif = periodeKrs.krs?.filter(k => k.status === 'diambil').length || 0;
    const krsDibatalkan = periodeKrs.krs?.filter(k => k.status === 'dibatalkan').length || 0;

    return (
        <AdminLayout title={`Detail Periode KRS - ${periodeKrs.nama_periode}`}>
            <Head title={`Detail Periode KRS - ${periodeKrs.nama_periode}`} />

            <div className="p-6 lg:p-8 min-h-dvh bg-[#fafafa]">
                <Box variant="black" className="mb-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/75 mb-1">Manajemen KRS</p>
                            <h1 className="text-xl font-bold uppercase tracking-tight text-white">Detail Periode KRS</h1>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <ActionButton href={route('admin.periode-krs.edit', periodeKrs.id)} variant="secondary">Edit</ActionButton>
                            <ActionButton href={route('admin.periode-krs.index')} variant="ghost">Kembali</ActionButton>
                        </div>
                    </div>
                </Box>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Box>
                        <SectionTitle>Informasi Periode KRS</SectionTitle>
                        <div className="space-y-4">
                            <DetailItem label="Nama Periode">
                                <p className="text-lg font-bold text-neutral-900">{periodeKrs.nama_periode}</p>
                            </DetailItem>

                            <DetailItem label="Tahun Ajaran">
                                {periodeKrs.tahun_ajaran?.tahun_mulai} - {periodeKrs.tahun_ajaran?.tahun_selesai}
                            </DetailItem>

                            <DetailItem label="Semester">
                                {periodeKrs.semester?.nama_semester}
                            </DetailItem>
                        </div>
                    </Box>

                    <Box>
                        <SectionTitle>Periode & Status</SectionTitle>
                        <div className="space-y-4">
                            <DetailItem label="Tanggal Mulai">
                                {new Date(periodeKrs.tanggal_mulai).toLocaleDateString('id-ID', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </DetailItem>

                            <DetailItem label="Tanggal Selesai">
                                {new Date(periodeKrs.tanggal_selesai).toLocaleDateString('id-ID', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </DetailItem>

                            <DetailItem label="Status">
                                <StatusBadge status={periodeKrs.status} />
                            </DetailItem>
                        </div>
                    </Box>
                </div>

                {periodeKrs.keterangan && (
                    <Box className="mt-6">
                        <SectionTitle>Keterangan</SectionTitle>
                        <div className="p-4 bg-[#f5f5f5] border border-[#e5e5e5] text-sm text-neutral-700 whitespace-pre-wrap">
                            {periodeKrs.keterangan}
                        </div>
                    </Box>
                )}

                <Box className="mt-6">
                    <SectionTitle>Statistik KRS</SectionTitle>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <StatCard label="Total KRS Diambil" value={totalKrs} />
                        <StatCard label="KRS Aktif" value={krsAktif} />
                        <StatCard label="KRS Dibatalkan" value={krsDibatalkan} />
                    </div>
                </Box>

                {periodeKrs.krs && periodeKrs.krs.length > 0 && (
                    <Box className="mt-6">
                        <SectionTitle>Daftar KRS Mahasiswa ({krsAktif} aktif)</SectionTitle>
                        <div className="overflow-x-auto">
                            <table className="min-w-full border border-[#e5e5e5]">
                                <thead className="bg-[#f5f5f5]">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500 border-b border-[#e5e5e5]">Mahasiswa</th>
                                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500 border-b border-[#e5e5e5]">Mata Kuliah</th>
                                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500 border-b border-[#e5e5e5]">Status</th>
                                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500 border-b border-[#e5e5e5]">Tanggal Ambil</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-[#e5e5e5]">
                                    {periodeKrs.krs.map((krs) => (
                                        <tr key={krs.id} className="hover:bg-[#fafafa]">
                                            <td className="px-4 py-3 text-sm text-neutral-900">
                                                <p className="font-bold">{krs.mahasiswa?.nama_lengkap}</p>
                                                <p className="text-xs text-neutral-500">{krs.mahasiswa?.nim}</p>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-neutral-900">
                                                <p className="font-bold">{krs.jadwal_kuliah?.mata_kuliah?.nama_mata_kuliah}</p>
                                                <p className="text-xs text-neutral-500">{krs.jadwal_kuliah?.mata_kuliah?.kode_mata_kuliah} - {krs.jadwal_kuliah?.mata_kuliah?.sks} SKS</p>
                                            </td>
                                            <td className="px-4 py-3"><KrsStatusBadge status={krs.status} /></td>
                                            <td className="px-4 py-3 text-sm text-neutral-900">{new Date(krs.created_at).toLocaleDateString('id-ID')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Box>
                )}
            </div>
        </AdminLayout>
    );
}
