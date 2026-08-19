import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

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
        aktif: 'bg-black text-white border-black',
        nonaktif: 'bg-white text-red-600 border-red-200',
    };
    return (
        <span className={`inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-widest border ${map[status] || map.nonaktif}`}>
            {status === 'aktif' ? 'Aktif' : 'Nonaktif'}
        </span>
    );
}

function HariBadge({ hari }) {
    return (
        <span className="inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-widest bg-[#f5f5f5] border border-[#e5e5e5] text-neutral-900">
            {hari}
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

export default function Show({ jadwalKuliah }) {
    const okupansi = Math.round(((jadwalKuliah.jumlah_mahasiswa || 0) / jadwalKuliah.kapasitas) * 100);

    return (
        <AdminLayout title={`Detail Jadwal Kuliah - ${jadwalKuliah.mata_kuliah?.nama_mata_kuliah}`}>
            <Head title={`Detail Jadwal Kuliah - ${jadwalKuliah.mata_kuliah?.nama_mata_kuliah}`} />

            <div className="p-6 lg:p-8 min-h-screen bg-[#fafafa]">
                <Box variant="black" className="mb-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-400 mb-1">Manajemen Akademik</p>
                            <h1 className="text-xl font-bold uppercase tracking-tight text-white">Detail Jadwal Kuliah</h1>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <ActionButton href={route('admin.jadwal-kuliah.edit', jadwalKuliah.id)} variant="secondary">Edit</ActionButton>
                            <ActionButton href={route('admin.jadwal-kuliah.index')} variant="ghost">Kembali</ActionButton>
                        </div>
                    </div>
                </Box>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Box>
                        <SectionTitle>Informasi Mata Kuliah</SectionTitle>
                        <div className="space-y-4">
                            <DetailItem label="Nama Mata Kuliah">
                                <p className="text-lg font-bold text-neutral-900">{jadwalKuliah.mata_kuliah?.nama_mata_kuliah}</p>
                            </DetailItem>

                            <DetailItem label="Kode Mata Kuliah">
                                {jadwalKuliah.mata_kuliah?.kode_mata_kuliah}
                            </DetailItem>

                            <DetailItem label="SKS">
                                {jadwalKuliah.mata_kuliah?.sks} SKS
                            </DetailItem>
                        </div>
                    </Box>

                    <Box>
                        <SectionTitle>Informasi Pengampu</SectionTitle>
                        <div className="space-y-4">
                            <DetailItem label="Dosen Pengampu">
                                <p className="text-lg font-bold text-neutral-900">{jadwalKuliah.dosen?.nama_lengkap}</p>
                                <p className="text-xs text-neutral-500">NIP: {jadwalKuliah.dosen?.nip}</p>
                            </DetailItem>

                            <DetailItem label="Semester">
                                {jadwalKuliah.semester?.nama_semester}
                            </DetailItem>

                            <DetailItem label="Status">
                                <StatusBadge status={jadwalKuliah.status} />
                            </DetailItem>
                        </div>
                    </Box>
                </div>

                <Box className="mt-6">
                    <SectionTitle>Informasi Jadwal</SectionTitle>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <DetailItem label="Hari">
                            <HariBadge hari={jadwalKuliah.hari} />
                        </DetailItem>

                        <DetailItem label="Waktu">
                            <p className="text-lg font-bold text-neutral-900">{jadwalKuliah.jam_mulai} - {jadwalKuliah.jam_selesai}</p>
                        </DetailItem>

                        <DetailItem label="Ruangan">
                            <p className="text-lg font-bold text-neutral-900">{jadwalKuliah.ruangan}</p>
                        </DetailItem>
                    </div>

                    <div className="mt-6">
                        <DetailItem label="Kapasitas">
                            <p className="text-lg font-bold text-neutral-900">{jadwalKuliah.kapasitas} mahasiswa</p>
                        </DetailItem>
                    </div>

                    {jadwalKuliah.keterangan && (
                        <div className="mt-6 pt-6 border-t border-[#e5e5e5]">
                            <DetailItem label="Keterangan">
                                <div className="p-4 bg-[#f5f5f5] border border-[#e5e5e5] text-neutral-700 whitespace-pre-wrap">
                                    {jadwalKuliah.keterangan}
                                </div>
                            </DetailItem>
                        </div>
                    )}
                </Box>

                <Box className="mt-6">
                    <SectionTitle>Statistik Mahasiswa</SectionTitle>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <StatCard label="Mahasiswa Terdaftar" value={jadwalKuliah.jumlah_mahasiswa || 0} />
                        <StatCard label="Sisa Kapasitas" value={jadwalKuliah.kapasitas - (jadwalKuliah.jumlah_mahasiswa || 0)} />
                        <StatCard label="Tingkat Okupansi" value={`${okupansi}%`} />
                    </div>
                </Box>

                <Box className="mt-6">
                    <SectionTitle>Informasi Tambahan</SectionTitle>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <DetailItem label="Dibuat">
                            {new Date(jadwalKuliah.created_at).toLocaleDateString('id-ID', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </DetailItem>

                        <DetailItem label="Terakhir Diperbarui">
                            {new Date(jadwalKuliah.updated_at).toLocaleDateString('id-ID', {
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
        </AdminLayout>
    );
}
