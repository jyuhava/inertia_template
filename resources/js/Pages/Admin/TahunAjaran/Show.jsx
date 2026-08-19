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

function DetailItem({ label, children }) {
    return (
        <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1.5">{label}</label>
            <div className="text-sm text-neutral-900">{children}</div>
        </div>
    );
}

function StatItem({ label, value }) {
    return (
        <div className="flex items-center justify-between py-3 border-b border-[#e5e5e5] last:border-0">
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">{label}</span>
            <span className="text-sm font-bold text-neutral-900">{value}</span>
        </div>
    );
}

function SemesterRow({ semester }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-[#f5f5f5] border border-[#e5e5e5]">
            <div>
                <h3 className="text-sm font-bold text-neutral-900">Semester {semester.nama_semester}</h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                    {new Date(semester.tanggal_mulai).toLocaleDateString('id-ID')} - {new Date(semester.tanggal_selesai).toLocaleDateString('id-ID')}
                </p>
            </div>
            <div className="flex items-center gap-3">
                <StatusBadge status={semester.status} />
                <ActionButton href={route('admin.semester.show', semester.id)} variant="secondary">Lihat</ActionButton>
            </div>
        </div>
    );
}

export default function Show({ tahunAjaran }) {
    const totalSemester = tahunAjaran.semesters ? tahunAjaran.semesters.length : 0;
    const semesterAktif = tahunAjaran.semesters ? tahunAjaran.semesters.filter(s => s.status === 'aktif').length : 0;
    const durasiHari = Math.ceil((new Date(tahunAjaran.tanggal_selesai) - new Date(tahunAjaran.tanggal_mulai)) / (1000 * 60 * 60 * 24));

    return (
        <AdminLayout title="Detail Tahun Ajaran">
            <Head title="Detail Tahun Ajaran" />

            <div className="p-6 lg:p-8 min-h-screen bg-[#fafafa]">
                <Box variant="black" className="mb-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-400 mb-1">Manajemen Akademik</p>
                            <h1 className="text-xl font-bold uppercase tracking-tight text-white">Detail Tahun Ajaran</h1>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <ActionButton href={route('admin.tahun-ajaran.edit', tahunAjaran.id)} variant="secondary">Edit</ActionButton>
                            <ActionButton href={route('admin.tahun-ajaran.index')} variant="ghost">Kembali</ActionButton>
                        </div>
                    </div>
                </Box>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <Box>
                            <SectionTitle>Informasi Dasar</SectionTitle>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <DetailItem label="Nama Tahun Ajaran">
                                    <p className="text-lg font-bold text-neutral-900">{tahunAjaran.nama_tahun_ajaran}</p>
                                </DetailItem>

                                <DetailItem label="Status">
                                    <StatusBadge status={tahunAjaran.status} />
                                </DetailItem>

                                <DetailItem label="Tanggal Mulai">
                                    {new Date(tahunAjaran.tanggal_mulai).toLocaleDateString('id-ID', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </DetailItem>

                                <DetailItem label="Tanggal Selesai">
                                    {new Date(tahunAjaran.tanggal_selesai).toLocaleDateString('id-ID', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </DetailItem>
                            </div>

                            {tahunAjaran.keterangan && (
                                <div className="mt-6 pt-6 border-t border-[#e5e5e5]">
                                    <DetailItem label="Keterangan">
                                        <div className="p-4 bg-[#f5f5f5] border border-[#e5e5e5] text-neutral-700 whitespace-pre-wrap">
                                            {tahunAjaran.keterangan}
                                        </div>
                                    </DetailItem>
                                </div>
                            )}
                        </Box>

                        <Box>
                            <SectionTitle
                                action={
                                    <ActionButton href={route('admin.semester.create')} variant="primary">+ Tambah Semester</ActionButton>
                                }
                            >
                                Daftar Semester
                            </SectionTitle>

                            {tahunAjaran.semesters && tahunAjaran.semesters.length > 0 ? (
                                <div className="space-y-3">
                                    {tahunAjaran.semesters.map((semester) => (
                                        <SemesterRow key={semester.id} semester={semester} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 border border-[#e5e5e5] bg-[#fafafa]">
                                    <p className="text-sm font-bold uppercase tracking-widest text-neutral-900 mb-1">Belum ada semester</p>
                                    <p className="text-xs text-neutral-500">Tambahkan semester untuk tahun ajaran ini.</p>
                                </div>
                            )}
                        </Box>
                    </div>

                    <div className="space-y-6">
                        <Box>
                            <SectionTitle>Statistik</SectionTitle>
                            <StatItem label="Total Semester" value={totalSemester} />
                            <StatItem label="Semester Aktif" value={semesterAktif} />
                            <StatItem label="Durasi" value={`${durasiHari} hari`} />
                        </Box>

                        <Box>
                            <SectionTitle>Timeline</SectionTitle>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="w-2 h-2 bg-neutral-900"></div>
                                    <span className="text-neutral-500">Dimulai:</span>
                                    <span className="font-bold text-neutral-900">{new Date(tahunAjaran.tanggal_mulai).toLocaleDateString('id-ID')}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="w-2 h-2 bg-red-500"></div>
                                    <span className="text-neutral-500">Berakhir:</span>
                                    <span className="font-bold text-neutral-900">{new Date(tahunAjaran.tanggal_selesai).toLocaleDateString('id-ID')}</span>
                                </div>
                            </div>
                        </Box>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
