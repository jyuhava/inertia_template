import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

function Box({ children, className = '', padded = true, variant = 'white' }) {
    const variants = {
        white: 'bg-white border border-neutral-200',
        black: 'bg-black text-white border border-black',
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

function ActionButton({ children, onClick, href, variant = 'primary', type = 'button', disabled = false }) {
    const map = {
        primary: 'bg-neutral-900 text-white hover:bg-neutral-800',
        secondary: 'bg-white text-neutral-900 border border-neutral-900 hover:bg-neutral-50',
        danger: 'bg-white text-neutral-900 border border-neutral-200 hover:bg-neutral-100',
    };
    const base = `inline-flex items-center px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${map[variant]}`;

    if (href) {
        return (
            <Link href={href} className={base}>
                {children}
            </Link>
        );
    }

    return (
        <button type={type} onClick={onClick} disabled={disabled} className={`${base} disabled:opacity-50`}>
            {children}
        </button>
    );
}

function StatusBadge({ status }) {
    const map = {
        menunggu_persetujuan: { cls: 'bg-neutral-100 text-neutral-700', label: 'Menunggu Persetujuan' },
        disetujui: { cls: 'bg-neutral-900 text-white', label: 'Disetujui' },
        ditolak: { cls: 'bg-white text-neutral-900 border border-neutral-900', label: 'Ditolak' },
    };
    const { cls, label } = map[status] || { cls: 'bg-neutral-100 text-neutral-700', label: status };
    return <span className={`inline-flex px-2 py-1 text-xs font-bold ${cls}`}>{label}</span>;
}

function HariBadge({ hari }) {
    return <span className="inline-flex items-center bg-neutral-900 px-2.5 py-0.5 text-xs font-bold text-white">{hari}</span>;
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

export default function Index({ periodeAktif, krsData, jadwalTersedia, mahasiswa, message }) {
    const handleTambahKrs = (jadwalKuliahId) => {
        if (confirm('Yakin ingin mengambil mata kuliah ini?')) {
            router.post('/mahasiswa/krs', {
                jadwal_kuliah_id: jadwalKuliahId,
            });
        }
    };

    const handleBatalKrs = (krsId) => {
        if (confirm('Yakin ingin membatalkan mata kuliah ini dari KRS?')) {
            router.delete(`/mahasiswa/krs/${krsId}`);
        }
    };

    const getTotalSks = () => {
        return krsData.reduce((total, krs) => total + (krs.jadwal_kuliah?.mata_kuliah?.sks || 0), 0);
    };

    if (!periodeAktif) {
        return (
            <AdminLayout title="KRS - Kartu Rencana Studi">
                <Head title="KRS - Kartu Rencana Studi" />

                <Box variant="gray" className="py-12 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center bg-white text-neutral-900">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-900">Periode KRS Tidak Aktif</h3>
                    <p className="mx-auto mt-2 max-w-md text-xs text-neutral-500">
                        {message || 'Tidak ada periode KRS yang aktif saat ini. Silakan hubungi admin untuk informasi lebih lanjut.'}
                    </p>
                </Box>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="KRS - Kartu Rencana Studi">
            <Head title="KRS - Kartu Rencana Studi" />

            <div className="space-y-6">
                <Box variant="black" className="relative overflow-hidden">
                    <div className="absolute right-0 top-0 h-20 w-20 bg-neutral-800" />
                    <div className="relative flex flex-col justify-between gap-4 md:flex-row md:items-start">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">Kartu Rencana Studi (KRS)</p>
                            <h1 className="mt-2 text-2xl font-bold md:text-3xl">
                                {periodeAktif.nama_periode}
                            </h1>
                            <p className="mt-1 text-sm text-neutral-300">
                                {periodeAktif.tahun_ajaran?.tahun_mulai}/{periodeAktif.tahun_ajaran?.tahun_selesai} {periodeAktif.semester?.nama_semester}
                            </p>
                            <p className="mt-1 text-xs text-neutral-400">
                                Periode: {new Date(periodeAktif.tanggal_mulai).toLocaleDateString('id-ID')} - {new Date(periodeAktif.tanggal_selesai).toLocaleDateString('id-ID')}
                            </p>
                        </div>
                        <div className="text-left md:text-right">
                            <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">Total SKS Diambil</p>
                            <p className="mt-1 text-3xl font-bold">{getTotalSks()}</p>
                            {krsData.length > 0 && (
                                <div className="mt-2">
                                    <ActionButton href="/mahasiswa/krs/print" target="_blank" variant="secondary">
                                        <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                        </svg>
                                        Print KRS
                                    </ActionButton>
                                </div>
                            )}
                        </div>
                    </div>
                </Box>

                <Box>
                    <SectionTitle>Mata Kuliah yang Diambil</SectionTitle>

                    {krsData.length === 0 ? (
                        <EmptyState
                            icon={
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            }
                            title="Belum ada mata kuliah yang diambil"
                            description="Pilih mata kuliah dari daftar yang tersedia di bawah."
                        />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="border-b border-neutral-200 text-left text-xs font-bold uppercase tracking-widest text-neutral-500">
                                        <th className="py-3 pr-4">Mata Kuliah</th>
                                        <th className="py-3 pr-4">Dosen</th>
                                        <th className="py-3 pr-4">Jadwal</th>
                                        <th className="py-3 pr-4">SKS</th>
                                        <th className="py-3 pr-4">Ruangan</th>
                                        <th className="py-3 pr-4">Status</th>
                                        <th className="py-3">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100">
                                    {krsData.map((krs) => (
                                        <tr key={krs.id} className="hover:bg-neutral-50">
                                            <td className="py-4 pr-4">
                                                <p className="font-bold text-neutral-900">{krs.jadwal_kuliah?.mata_kuliah?.nama_mata_kuliah}</p>
                                                <p className="text-xs text-neutral-500">{krs.jadwal_kuliah?.mata_kuliah?.kode_mata_kuliah}</p>
                                            </td>
                                            <td className="py-4 pr-4 text-neutral-700">{krs.jadwal_kuliah?.dosen?.nama_lengkap}</td>
                                            <td className="py-4 pr-4">
                                                <HariBadge hari={krs.jadwal_kuliah?.hari} />
                                                <p className="mt-1 text-xs text-neutral-500">
                                                    {krs.jadwal_kuliah?.jam_mulai} - {krs.jadwal_kuliah?.jam_selesai}
                                                </p>
                                            </td>
                                            <td className="py-4 pr-4 font-bold text-neutral-900">{krs.jadwal_kuliah?.mata_kuliah?.sks}</td>
                                            <td className="py-4 pr-4 text-neutral-700">{krs.jadwal_kuliah?.ruangan}</td>
                                            <td className="py-4 pr-4">
                                                <StatusBadge status={krs.status} />
                                                {krs.catatan_admin && (
                                                    <p className="mt-1 text-xs text-neutral-500">Catatan: {krs.catatan_admin}</p>
                                                )}
                                            </td>
                                            <td className="py-4">
                                                {krs.status === 'menunggu_persetujuan' && (
                                                    <ActionButton onClick={() => handleBatalKrs(krs.id)} variant="danger">
                                                        Batalkan
                                                    </ActionButton>
                                                )}
                                                {krs.status === 'ditolak' && (
                                                    <ActionButton onClick={() => handleTambahKrs(krs.jadwal_kuliah.id)} variant="primary">
                                                        Ambil Lagi
                                                    </ActionButton>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Box>

                <Box>
                    <SectionTitle>Mata Kuliah yang Tersedia</SectionTitle>

                    {jadwalTersedia.length === 0 ? (
                        <EmptyState
                            icon={
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            }
                            title="Tidak ada mata kuliah yang tersedia"
                            description="Semua mata kuliah sudah diambil atau tidak ada jadwal untuk semester ini."
                        />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="border-b border-neutral-200 text-left text-xs font-bold uppercase tracking-widest text-neutral-500">
                                        <th className="py-3 pr-4">Mata Kuliah</th>
                                        <th className="py-3 pr-4">Dosen</th>
                                        <th className="py-3 pr-4">Jadwal</th>
                                        <th className="py-3 pr-4">SKS</th>
                                        <th className="py-3 pr-4">Kapasitas</th>
                                        <th className="py-3 pr-4">Ruangan</th>
                                        <th className="py-3">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100">
                                    {jadwalTersedia.map((jadwal) => (
                                        <tr key={jadwal.id} className="hover:bg-neutral-50">
                                            <td className="py-4 pr-4">
                                                <p className="font-bold text-neutral-900">{jadwal.mata_kuliah?.nama_mata_kuliah}</p>
                                                <p className="text-xs text-neutral-500">{jadwal.mata_kuliah?.kode_mata_kuliah}</p>
                                            </td>
                                            <td className="py-4 pr-4 text-neutral-700">{jadwal.dosen?.nama_lengkap}</td>
                                            <td className="py-4 pr-4">
                                                <HariBadge hari={jadwal.hari} />
                                                <p className="mt-1 text-xs text-neutral-500">
                                                    {jadwal.jam_mulai} - {jadwal.jam_selesai}
                                                </p>
                                            </td>
                                            <td className="py-4 pr-4 font-bold text-neutral-900">{jadwal.mata_kuliah?.sks}</td>
                                            <td className="py-4 pr-4">
                                                <span className={`font-bold ${jadwal.tersedia ? 'text-neutral-900' : 'text-neutral-500'}`}>
                                                    {jadwal.jumlah_mahasiswa}/{jadwal.kapasitas}
                                                </span>
                                                {!jadwal.tersedia && (
                                                    <span className="ml-2 inline-flex items-center bg-neutral-200 px-2.5 py-0.5 text-xs font-bold text-neutral-700">
                                                        Penuh
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-4 pr-4 text-neutral-700">{jadwal.ruangan}</td>
                                            <td className="py-4">
                                                <ActionButton
                                                    onClick={() => handleTambahKrs(jadwal.id)}
                                                    disabled={!jadwal.tersedia}
                                                    variant={jadwal.tersedia ? 'primary' : 'secondary'}
                                                >
                                                    {jadwal.tersedia ? 'Ambil' : 'Penuh'}
                                                </ActionButton>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Box>
            </div>
        </AdminLayout>
    );
}
