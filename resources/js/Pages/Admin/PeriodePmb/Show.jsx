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
        selesai: 'bg-[#f5f5f5] text-neutral-900 border-[#e5e5e5]',
    };
    const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : status;
    return (
        <span className={`inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-widest border ${map[status] || map.nonaktif}`}>
            {label}
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
        <div className="text-center p-4 bg-[#f5f5f5] border border-[#e5e5e5]">
            <p className="text-2xl font-bold text-neutral-900">{value}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mt-1">{label}</p>
        </div>
    );
}

function CalonRow({ calon }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-[#f5f5f5] border border-[#e5e5e5]">
            <div>
                <p className="text-sm font-bold text-neutral-900">{calon.nama_lengkap}</p>
                <p className="text-xs text-neutral-500">{calon.no_pendaftaran} • {calon.prodi_pilihan_1?.nama_prodi}</p>
            </div>
            <div className="flex items-center gap-2">
                <span className="inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-widest bg-white border border-[#e5e5e5] text-neutral-900">
                    {calon.status_pendaftaran}
                </span>
                <ActionButton href={route('admin.calon-mahasiswa.show', calon.id)} variant="secondary">Detail</ActionButton>
            </div>
        </div>
    );
}

export default function Show({ periodePmb, statistik }) {
    const persentaseKuota = Math.round((statistik.total_pendaftar / periodePmb.kuota_total) * 100);

    return (
        <AdminLayout title="Detail Periode PMB">
            <Head title="Detail Periode PMB" />

            <div className="p-6 lg:p-8 min-h-dvh bg-[#fafafa]">
                <Box variant="black" className="mb-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/75 mb-1">Manajemen PMB</p>
                            <h1 className="text-xl font-bold uppercase tracking-tight text-white">Detail Periode PMB</h1>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <ActionButton href={route('admin.periode-pmb.edit', periodePmb.id)} variant="secondary">Edit</ActionButton>
                            <ActionButton href={route('admin.periode-pmb.index')} variant="ghost">Kembali</ActionButton>
                        </div>
                    </div>
                </Box>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Box>
                        <SectionTitle>Informasi Periode</SectionTitle>
                        <div className="space-y-4">
                            <DetailItem label="Nama Periode">
                                <p className="text-lg font-bold text-neutral-900">{periodePmb.nama_periode}</p>
                            </DetailItem>

                            <DetailItem label="Tahun Akademik">
                                {periodePmb.tahun_akademik}
                            </DetailItem>

                            <DetailItem label="Status">
                                <StatusBadge status={periodePmb.status} />
                            </DetailItem>
                        </div>
                    </Box>

                    <Box>
                        <SectionTitle>Tanggal & Biaya</SectionTitle>
                        <div className="space-y-4">
                            <DetailItem label="Periode Pendaftaran">
                                {new Date(periodePmb.tanggal_buka).toLocaleDateString('id-ID')} - {new Date(periodePmb.tanggal_tutup).toLocaleDateString('id-ID')}
                            </DetailItem>

                            <DetailItem label="Biaya Pendaftaran">
                                <p className="text-lg font-bold text-neutral-900">{periodePmb.formatted_biaya}</p>
                            </DetailItem>

                            <DetailItem label="Kuota">
                                {periodePmb.kuota_total} orang
                            </DetailItem>
                        </div>
                    </Box>
                </div>

                {periodePmb.persyaratan && (
                    <Box className="mt-6">
                        <SectionTitle>Persyaratan</SectionTitle>
                        <div className="p-4 bg-[#f5f5f5] border border-[#e5e5e5] text-sm text-neutral-700 whitespace-pre-line">
                            {periodePmb.persyaratan}
                        </div>
                    </Box>
                )}

                {periodePmb.keterangan && (
                    <Box className="mt-6">
                        <SectionTitle>Keterangan</SectionTitle>
                        <div className="p-4 bg-[#f5f5f5] border border-[#e5e5e5] text-sm text-neutral-700 whitespace-pre-line">
                            {periodePmb.keterangan}
                        </div>
                    </Box>
                )}

                <Box className="mt-6">
                    <SectionTitle>Statistik Pendaftaran</SectionTitle>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                        <StatItem label="Total" value={statistik.total_pendaftar} />
                        <StatItem label="Draft" value={statistik.draft} />
                        <StatItem label="Submitted" value={statistik.submitted} />
                        <StatItem label="Verified" value={statistik.verified} />
                        <StatItem label="Diterima" value={statistik.accepted} />
                        <StatItem label="Ditolak" value={statistik.rejected} />
                        <StatItem label="Bayar" value={statistik.paid} />
                    </div>

                    <div className="mt-6">
                        <div className="w-full h-3 bg-[#f5f5f5] border border-[#e5e5e5]">
                            <div className="h-full bg-neutral-900" style={{ width: `${persentaseKuota}%` }}></div>
                        </div>
                        <p className="text-center text-xs text-neutral-500 mt-2">
                            {statistik.total_pendaftar} dari {periodePmb.kuota_total} kuota terisi ({persentaseKuota}%)
                        </p>
                    </div>
                </Box>

                <Box className="mt-6">
                    <SectionTitle
                        action={
                            <ActionButton href={route('admin.calon-mahasiswa.index', { periode_pmb_id: periodePmb.id })} variant="secondary">
                                Lihat Semua
                            </ActionButton>
                        }
                    >
                        Calon Mahasiswa
                    </SectionTitle>

                    {periodePmb.calon_mahasiswas && periodePmb.calon_mahasiswas.length > 0 ? (
                        <div className="space-y-3">
                            {periodePmb.calon_mahasiswas.slice(0, 5).map((calon) => (
                                <CalonRow key={calon.id} calon={calon} />
                            ))}
                            {periodePmb.calon_mahasiswas.length > 5 && (
                                <p className="text-center text-xs text-neutral-500 pt-2">
                                    Dan {periodePmb.calon_mahasiswas.length - 5} calon mahasiswa lainnya...
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-10 border border-[#e5e5e5] bg-[#fafafa]">
                            <p className="text-sm font-bold uppercase tracking-widest text-neutral-900 mb-1">Belum ada pendaftar</p>
                            <p className="text-xs text-neutral-500">Belum ada calon mahasiswa yang mendaftar pada periode ini.</p>
                        </div>
                    )}
                </Box>
            </div>
        </AdminLayout>
    );
}
