import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';

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

export default function Index({ mahasiswa, periodeKrs, ipk }) {
    return (
        <AdminLayout>
            <Head title="KHS Mahasiswa" />

            <div className="p-6 lg:p-8 min-h-screen bg-[#fafafa]">
                <Box variant="black" className="mb-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-400 mb-1">Manajemen Akademik</p>
                            <h1 className="text-xl font-bold uppercase tracking-tight text-white">Kartu Hasil Studi (KHS)</h1>
                            <div className="mt-2 text-xs text-neutral-300">
                                {mahasiswa.nama_lengkap} ({mahasiswa.nim}) • {mahasiswa.prodi?.nama_prodi}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">IPK Saat Ini</div>
                            <div className="text-3xl font-bold text-white">{ipk}</div>
                        </div>
                    </div>
                </Box>

                <Box>
                    <SectionTitle>Daftar Periode</SectionTitle>

                    <div className="space-y-3">
                        {periodeKrs.length === 0 ? (
                            <div className="text-center py-12 border border-[#e5e5e5]">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-900">Belum ada data KHS</h3>
                                <p className="mt-2 text-xs text-neutral-500">Belum ada data KHS untuk mahasiswa ini.</p>
                            </div>
                        ) : (
                            periodeKrs.map((periode) => (
                                <div
                                    key={periode.id}
                                    className="border border-[#e5e5e5] p-4 hover:bg-[#fafafa] transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                                >
                                    <div>
                                        <h4 className="text-sm font-bold text-neutral-900">
                                            {periode.semester?.nama_semester} {periode.tahun_ajaran?.tahun_mulai}/{periode.tahun_ajaran?.tahun_selesai}
                                        </h4>
                                        <p className="text-xs text-neutral-500 mt-0.5">{periode.nama_periode}</p>
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <ActionButton href={route('admin.mahasiswa.khs.show', [mahasiswa.id, periode.id])} variant="secondary">
                                            Lihat Detail
                                        </ActionButton>
                                        <a
                                            href={route('admin.mahasiswa.khs.print', [mahasiswa.id, periode.id])}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center justify-center px-4 py-2 text-[10px] font-bold uppercase tracking-widest border bg-black text-white border-black hover:bg-neutral-800 transition-colors"
                                        >
                                            Cetak
                                        </a>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Box>
            </div>
        </AdminLayout>
    );
}
