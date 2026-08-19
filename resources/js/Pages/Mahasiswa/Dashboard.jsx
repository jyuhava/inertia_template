import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { useMemo } from 'react';

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

function StatCard({ label, value, note }) {
    return (
        <Box className="relative overflow-hidden">
            <div className="absolute right-0 top-0 h-10 w-10 bg-neutral-100" />
            <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">{label}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-neutral-900">{value}</p>
            {note ? <p className="mt-2 text-xs text-neutral-500">{note}</p> : null}
        </Box>
    );
}

function StatusPill({ status }) {
    const map = {
        aktif: 'bg-neutral-900 text-white',
        nonaktif: 'bg-white text-neutral-900 border border-neutral-900',
        lulus: 'bg-neutral-200 text-neutral-900',
    };

    const cls = map[status] || 'bg-neutral-100 text-neutral-700';
    const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : '-';

    return (
        <span className={`inline-flex items-center px-3 py-1 text-xs font-bold uppercase tracking-wider ${cls}`}>
            {label}
        </span>
    );
}

function ScoreBadge({ value }) {
    const num = Number(value || 0);
    if (num >= 85) return 'bg-neutral-900 text-white';
    if (num >= 70) return 'bg-neutral-300 text-neutral-900';
    return 'bg-white text-neutral-900 border border-neutral-900';
}

export default function MahasiswaDashboard({
    profile,
    periodeAktif,
    stats,
    krsSummary,
    todaySchedule,
    recentScores,
}) {
    const todayLabel = useMemo(() => {
        return new Date().toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    }, []);

    const ipkText = stats.ipk > 0 ? stats.ipk.toFixed(2) : '-';

    return (
        <AdminLayout title="Dashboard Mahasiswa">
            <Head title="Dashboard Mahasiswa" />

            <div className="space-y-6">
                <Box variant="black" className="relative overflow-hidden">
                    <div className="absolute right-0 top-0 h-24 w-24 bg-neutral-800" />
                    <div className="absolute bottom-0 left-0 h-16 w-16 bg-neutral-800" />
                    <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">Ringkasan Akademik</p>
                            <h1 className="mt-2 text-2xl font-bold leading-tight md:text-3xl">
                                Halo, {profile?.nama_lengkap}
                            </h1>
                            <p className="mt-2 text-sm text-neutral-300">
                                NIM {profile?.nim || '-'} • {profile?.prodi || '-'} • Angkatan {profile?.angkatan || '-'}
                            </p>
                            <div className="mt-3">
                                <StatusPill status={profile?.status} />
                            </div>
                        </div>
                        <Box variant="gray" className="min-w-[240px]">
                            <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">Periode Aktif</p>
                            {periodeAktif ? (
                                <>
                                    <p className="mt-1 font-bold text-neutral-900">
                                        {periodeAktif.nama || `${periodeAktif.tahun_ajaran || '-'} / ${periodeAktif.semester || '-'}`}
                                    </p>
                                    <p className="text-xs text-neutral-500">
                                        {periodeAktif.tanggal_mulai} - {periodeAktif.tanggal_selesai}
                                    </p>
                                </>
                            ) : (
                                <p className="mt-1 text-sm text-neutral-500">Belum ada periode KRS aktif</p>
                            )}
                        </Box>
                    </div>
                </Box>

                <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <StatCard
                        label="SKS Aktif"
                        value={stats.total_sks_aktif}
                        note={`${stats.mata_kuliah_aktif} mata kuliah berjalan`}
                    />
                    <StatCard
                        label="SKS Lulus"
                        value={stats.total_sks_lulus}
                        note="Akumulasi mata kuliah yang sudah lulus"
                    />
                    <StatCard
                        label="IPK Sementara"
                        value={ipkText}
                        note="Dihitung dari nilai akhir yang sudah tersedia"
                    />
                    <StatCard
                        label="Kehadiran"
                        value={`${stats.kehadiran}%`}
                        note="Rata-rata kehadiran pada periode aktif"
                    />
                    <StatCard
                        label="Kelas LMS"
                        value={stats.lms_course_count}
                        note="Kelas yang sudah punya konten LMS"
                    />
                    <Box>
                        <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">Status KRS</p>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                            <div className="bg-neutral-900 px-3 py-2 text-white">
                                Disetujui: <strong>{krsSummary.disetujui}</strong>
                            </div>
                            <div className="bg-neutral-200 px-3 py-2 text-neutral-900">
                                Menunggu: <strong>{krsSummary.menunggu}</strong>
                            </div>
                            <div className="border border-neutral-900 bg-white px-3 py-2 text-neutral-900">
                                Ditolak: <strong>{krsSummary.ditolak}</strong>
                            </div>
                            <div className="bg-neutral-100 px-3 py-2 text-neutral-700">
                                Batal: <strong>{krsSummary.dibatalkan}</strong>
                            </div>
                        </div>
                    </Box>
                </section>

                <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                    <Box className="xl:col-span-2">
                        <SectionTitle
                            action={
                                <Link
                                    href={route('mahasiswa.absensi.index')}
                                    className="text-xs font-bold uppercase tracking-widest text-neutral-900 hover:underline"
                                >
                                    Lihat Absensi
                                </Link>
                            }
                        >
                            Jadwal Hari Ini
                        </SectionTitle>
                        <p className="mb-4 text-xs text-neutral-500">{todayLabel}</p>

                        {todaySchedule?.length ? (
                            <div className="space-y-3">
                                {todaySchedule.map((item) => (
                                    <div key={item.id} className="border border-neutral-200 p-4">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div>
                                                <p className="font-bold text-neutral-900">{item.mata_kuliah}</p>
                                                <p className="text-xs text-neutral-500">
                                                    {item.kode} • {item.sks} SKS • {item.dosen}
                                                </p>
                                            </div>
                                            <span className="bg-neutral-900 px-3 py-1 text-xs font-bold text-white">
                                                {item.jam_mulai} - {item.jam_selesai}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-sm text-neutral-600">Ruang: {item.ruangan}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
                                Tidak ada jadwal kuliah untuk hari ini.
                            </div>
                        )}
                    </Box>

                    <Box>
                        <SectionTitle>Aksi Cepat</SectionTitle>
                        <div className="mt-4 space-y-3">
                            <Link
                                href={route('mahasiswa.krs.index')}
                                className="flex items-center justify-between border border-neutral-200 bg-white px-4 py-3 text-sm font-bold text-neutral-900 hover:bg-neutral-50"
                            >
                                KRS Online
                                <span>→</span>
                            </Link>
                            <Link
                                href={route('mahasiswa.khs.index')}
                                className="flex items-center justify-between border border-neutral-200 bg-white px-4 py-3 text-sm font-bold text-neutral-900 hover:bg-neutral-50"
                            >
                                KHS & IPK
                                <span>→</span>
                            </Link>
                            <Link
                                href={route('mahasiswa.absensi.index')}
                                className="flex items-center justify-between border border-neutral-200 bg-white px-4 py-3 text-sm font-bold text-neutral-900 hover:bg-neutral-50"
                            >
                                Rekap Kehadiran
                                <span>→</span>
                            </Link>
                            <Link
                                href={route('mahasiswa.lms.index')}
                                className="flex items-center justify-between border border-neutral-200 bg-white px-4 py-3 text-sm font-bold text-neutral-900 hover:bg-neutral-50"
                            >
                                LMS Mahasiswa
                                <span>→</span>
                            </Link>
                        </div>
                    </Box>
                </section>

                <Box>
                    <SectionTitle
                        action={
                            <Link href={route('mahasiswa.khs.index')} className="text-xs font-bold uppercase tracking-widest text-neutral-900 hover:underline">
                                Buka KHS
                            </Link>
                        }
                    >
                        Nilai Terbaru
                    </SectionTitle>

                    {recentScores?.length ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="border-b border-neutral-200 text-left text-xs font-bold uppercase tracking-widest text-neutral-500">
                                        <th className="py-2 pr-4">Mata Kuliah</th>
                                        <th className="py-2 pr-4">Nilai</th>
                                        <th className="py-2 pr-4">Huruf</th>
                                        <th className="py-2 pr-4">Status</th>
                                        <th className="py-2">Update</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100">
                                    {recentScores.map((row) => (
                                        <tr key={row.id}>
                                            <td className="py-3 pr-4">
                                                <p className="font-bold text-neutral-900">{row.mata_kuliah}</p>
                                                <p className="text-xs text-neutral-500">{row.kode}</p>
                                            </td>
                                            <td className="py-3 pr-4">
                                                <span className={`px-2 py-1 text-xs font-bold ${ScoreBadge(Number(row.nilai_akhir || 0))}`}>
                                                    {row.nilai_akhir}
                                                </span>
                                            </td>
                                            <td className="py-3 pr-4 font-bold text-neutral-800">{row.nilai_huruf}</td>
                                            <td className="py-3 pr-4">
                                                <span className="bg-neutral-100 px-2 py-1 text-xs text-neutral-700">
                                                    {row.status}
                                                </span>
                                            </td>
                                            <td className="py-3 text-xs text-neutral-500">{row.updated_at}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
                            Belum ada data nilai yang dipublikasikan.
                        </div>
                    )}
                </Box>
            </div>
        </AdminLayout>
    );
}
