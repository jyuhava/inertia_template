import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';

function Box({ children, className = '', padded = true, variant = 'white' }) {
    const variants = {
        white: 'bg-white border-neutral-200',
        gray: 'bg-neutral-50 border-neutral-200',
        black: 'bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 border-transparent text-white rounded-2xl shadow-lg shadow-violet-500/20',
    };
    return (
        <div className={`border ${variants[variant]} ${padded ? 'p-6' : ''} ${className}`}>
            {children}
        </div>
    );
}

function SectionTitle({ children, action }) {
    return (
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-900">{children}</h3>
            {action && <div>{action}</div>}
        </div>
    );
}

function ActionButton({ children, href, onClick, variant = 'primary', type = 'button' }) {
    const map = {
        primary: 'bg-black text-white border-black hover:bg-neutral-800',
        secondary: 'bg-white text-neutral-900 border-neutral-300 hover:bg-neutral-50',
        danger: 'bg-white text-red-600 border-red-200 hover:bg-red-50',
    };
    const className = `inline-flex items-center border px-4 py-2 text-[11px] font-bold uppercase tracking-widest transition-colors ${map[variant]}`;
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

function DetailItem({ label, children }) {
    return (
        <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">{label}</label>
            <div className="text-sm text-neutral-900">{children}</div>
        </div>
    );
}

function StatCard({ label, value }) {
    return (
        <Box className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">{label}</span>
            <span className="text-2xl font-bold text-neutral-900">{value}</span>
        </Box>
    );
}

function GradeCell({ nilai }) {
    const getClass = (nilai) => {
        if (nilai === 'A' || nilai === 'A-') return 'font-bold text-neutral-900';
        if (nilai === 'B+' || nilai === 'B' || nilai === 'B-') return 'font-bold text-neutral-700';
        if (nilai === 'C+' || nilai === 'C' || nilai === 'C-') return 'font-bold text-neutral-600';
        if (nilai === 'D') return 'font-bold text-neutral-500';
        return 'font-bold text-red-600';
    };
    return <span className={getClass(nilai)}>{nilai}</span>;
}

export default function Show({ mahasiswa, periodeKrs, krs, ips, ipk, totalSks, totalMutu }) {
    return (
        <AdminLayout>
            <Head title={`KHS - ${periodeKrs.nama_periode}`} />

            <div className="space-y-6">
                {/* Header */}
                <Box variant="black" className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/75 mb-2">Kartu Hasil Studi</p>
                        <h1 className="text-2xl font-bold text-white">{periodeKrs.nama_periode}</h1>
                        <p className="mt-1 text-sm text-white/85">
                            {mahasiswa.nama_lengkap} • {mahasiswa.nim}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <ActionButton href={route('admin.mahasiswa.khs.index', mahasiswa.id)} variant="secondary">
                            ← Kembali
                        </ActionButton>
                        <ActionButton href={route('admin.mahasiswa.khs.print', [mahasiswa.id, periodeKrs.id])} variant="primary">
                            Cetak KHS
                        </ActionButton>
                    </div>
                </Box>

                {/* Student Info */}
                <Box>
                    <SectionTitle>Informasi Mahasiswa</SectionTitle>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <DetailItem label="Nama">{mahasiswa.nama_lengkap}</DetailItem>
                        <DetailItem label="NIM">{mahasiswa.nim}</DetailItem>
                        <DetailItem label="Program Studi">{mahasiswa.prodi?.nama_prodi || '-'}</DetailItem>
                        <DetailItem label="Semester">
                            {periodeKrs.semester?.nama_semester} {periodeKrs.tahun_ajaran?.tahun_mulai}/{periodeKrs.tahun_ajaran?.tahun_selesai}
                        </DetailItem>
                    </div>
                </Box>

                {/* KHS Table */}
                <Box padded={false} className="overflow-hidden">
                    <div className="p-6 border-b border-neutral-200">
                        <SectionTitle>Daftar Nilai</SectionTitle>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm table-cards">
                            <thead className="bg-neutral-50 border-b border-neutral-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500 w-12">No</th>
                                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500">Kode</th>
                                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500">Mata Kuliah</th>
                                    <th className="px-6 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-neutral-500 w-20">SKS</th>
                                    <th className="px-6 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-neutral-500 w-20">Nilai</th>
                                    <th className="px-6 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-neutral-500 w-20">Bobot</th>
                                    <th className="px-6 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-neutral-500 w-24">Mutu</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200">
                                {krs.map((item, index) => (
                                    <tr key={index} className="hover:bg-neutral-50">
                                        <td data-label="No" className="px-6 py-4 text-center text-neutral-500">{index + 1}</td>
                                        <td data-label="Kode" className="px-6 py-4 font-mono text-neutral-900">{item.kode_mata_kuliah}</td>
                                        <td data-label="Mata Kuliah" className="px-6 py-4 text-neutral-900">{item.nama_mata_kuliah}</td>
                                        <td data-label="SKS" className="px-6 py-4 text-center text-neutral-900">{item.sks}</td>
                                        <td data-label="Nilai" className="px-6 py-4 text-center"><GradeCell nilai={item.nilai_huruf} /></td>
                                        <td data-label="Bobot" className="px-6 py-4 text-center text-neutral-900">{item.bobot}</td>
                                        <td data-label="Mutu" className="px-6 py-4 text-center font-medium text-neutral-900">{item.mutu}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-neutral-50 border-t border-neutral-200">
                                <tr className="table-cards-empty">className="table-cards-empty">
                                    <td colSpan="3" className="px-6 py-4 text-right text-sm font-bold text-neutral-900">Total</td>
                                    <td data-label="Kode" className="px-6 py-4 text-center text-sm font-bold text-neutral-900">{totalSks}</td>
                                    <td colSpan="2"></td>
                                    <td data-label="SKS" className="px-6 py-4 text-center text-sm font-bold text-neutral-900">{totalMutu}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </Box>

                {/* Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl ml-auto">
                    <StatCard label="Indeks Prestasi Semester" value={ips} />
                    <StatCard label="Indeks Prestasi Kumulatif" value={ipk} />
                </div>
            </div>
        </AdminLayout>
    );
}
