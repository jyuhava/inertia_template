import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';

function Box({ children, className = '', padded = true, variant = 'white' }) {
    const variants = {
        white: 'bg-white border border-neutral-200',
        black: 'bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 border-transparent text-white rounded-2xl shadow-lg shadow-violet-500/20',
        gray: 'bg-neutral-50 border border-neutral-200',
    };
    return (
        <div className={`${variants[variant] || variants.white} ${padded ? 'p-5' : ''} ${className}`}>
            {children}
        </div>
    );
}

function SectionTitle({ children, action }) {
    return (
        <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-900">{children}</h2>
            {action ? <div>{action}</div> : null}
        </div>
    );
}

function ActionButton({ children, href, variant = 'primary' }) {
    const map = {
        primary: 'bg-neutral-900 text-white hover:bg-neutral-800',
        secondary: 'bg-white text-neutral-900 border border-neutral-200 hover:bg-neutral-50',
    };
    return (
        <Link href={href} className={`inline-flex items-center px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${map[variant]}`}>
            {children}
        </Link>
    );
}

function EmptyState({ icon, title, description }) {
    return (
        <div className="border border-dashed border-neutral-300 p-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center bg-neutral-100 text-neutral-600">
                {icon}
            </div>
            <h3 className="text-sm font-bold text-neutral-900">{title}</h3>
            <p className="mt-1 text-xs text-neutral-500">{description}</p>
        </div>
    );
}

export default function Index({ mahasiswa, periodeKrs, ipk }) {
    return (
        <AdminLayout title="Kartu Hasil Studi (KHS)">
            <Head title="Kartu Hasil Studi (KHS)" />

            <div className="space-y-6">
                <Box variant="black" className="relative overflow-hidden">
                    <div className="absolute right-0 top-0 h-20 w-20 bg-white/10" />
                    <div className="relative flex flex-col justify-between gap-4 md:flex-row md:items-start">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-white/75">Kartu Hasil Studi (KHS)</p>
                            <h1 className="mt-2 text-2xl font-bold md:text-3xl">{mahasiswa.nama_lengkap}</h1>
                            <p className="mt-1 text-sm text-white/85">
                                NIM {mahasiswa.nim} • {mahasiswa.prodi?.nama_prodi}
                            </p>
                        </div>
                        <Box variant="gray" className="min-w-[200px]">
                            <p className="text-xs font-bold uppercase tracking-widest text-white/70">Indeks Prestasi Kumulatif (IPK)</p>
                            <div className="mt-1 flex items-baseline">
                                <span className="text-3xl font-bold text-neutral-900">{ipk}</span>
                                <span className="ml-2 text-sm font-bold text-white/70">/ 4.00</span>
                            </div>
                        </Box>
                    </div>
                </Box>

                <Box>
                    <SectionTitle>Daftar KHS per Semester</SectionTitle>

                    {periodeKrs.length === 0 ? (
                        <EmptyState
                            icon={
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            }
                            title="Belum ada KHS"
                            description="Anda belum memiliki data KHS. Silakan ambil mata kuliah terlebih dahulu."
                        />
                    ) : (
                        <div className="space-y-3">
                            {periodeKrs.map((periode) => (
                                <div key={periode.id} className="flex flex-col items-start justify-between gap-4 border border-neutral-200 p-4 transition-colors hover:bg-neutral-50 md:flex-row md:items-center">
                                    <div>
                                        <h4 className="font-bold text-neutral-900">
                                            {periode.semester?.nama_semester} {periode.tahun_ajaran?.tahun_mulai}/{periode.tahun_ajaran?.tahun_selesai}
                                        </h4>
                                        <p className="text-sm text-neutral-600">{periode.nama_periode}</p>
                                        <p className="text-xs text-neutral-500">
                                            {new Date(periode.tanggal_mulai).toLocaleDateString('id-ID')} - {new Date(periode.tanggal_selesai).toLocaleDateString('id-ID')}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <ActionButton href={`/mahasiswa/khs/${periode.id}`} variant="secondary">
                                            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                            Lihat KHS
                                        </ActionButton>
                                        <ActionButton href={`/mahasiswa/khs/${periode.id}/cetak`} variant="primary">
                                            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                            </svg>
                                            Cetak KHS
                                        </ActionButton>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Box>
            </div>
        </AdminLayout>
    );
}
