import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';

const statusTone = {
    hadir: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
    tidak_hadir: 'bg-rose-100 text-rose-700 ring-rose-200',
    izin: 'bg-amber-100 text-amber-700 ring-amber-200',
    sakit: 'bg-sky-100 text-sky-700 ring-sky-200',
};

function Box({ children, className = '', padded = true, variant = 'white' }) {
    const variants = {
        white: 'bg-white border-neutral-200',
        gray: 'bg-neutral-50 border-neutral-200',
        dark: 'bg-neutral-900 border-neutral-900 text-white',
    };
    return (
        <div className={`border shadow-sm ${padded ? 'p-5' : ''} ${variants[variant] || variants.white} ${className}`}>
            {children}
        </div>
    );
}

function SectionTitle({ children, action }) {
    return (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight text-neutral-900">{children}</h2>
            {action ? <div>{action}</div> : null}
        </div>
    );
}

function CountPill({ label, value, tone }) {
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold ring-1 ${tone}`}>
            <span>{label}</span>
            <span>{value}</span>
        </span>
    );
}

function RatePill({ value }) {
    if (value >= 80) {
        return <span className="inline-flex bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">{value}%</span>;
    }
    if (value >= 60) {
        return <span className="inline-flex bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">{value}%</span>;
    }
    return <span className="inline-flex bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">{value}%</span>;
}

function ActionButton({ children, href, variant = 'primary' }) {
    const map = {
        primary: 'bg-neutral-900 text-white border-neutral-900 hover:bg-neutral-800',
        secondary: 'bg-white text-neutral-800 border-neutral-300 hover:bg-neutral-50',
    };
    return (
        <Link href={href} className={`inline-flex items-center justify-center border px-3 py-2 text-xs font-semibold transition ${map[variant]}`}>
            {children}
        </Link>
    );
}

export default function Rekap({ dosen, periodeAktif, jadwalKuliah, mahasiswas }) {
    const totalMahasiswa = mahasiswas.length;
    const totalPertemuan = totalMahasiswa > 0 ? mahasiswas[0].absensi_stats.total_pertemuan : 0;
    const averageKehadiran = totalMahasiswa > 0 ? mahasiswas.reduce((sum, m) => sum + m.absensi_stats.persentase, 0) / totalMahasiswa : 0;
    const belowThresholdCount = mahasiswas.filter((m) => m.absensi_stats.persentase < 75).length;

    const sortByRisk = [...mahasiswas].sort((a, b) => a.absensi_stats.persentase - b.absensi_stats.persentase);

    const formatTime = (value) => String(value || '-').slice(0, 5);

    return (
        <AdminLayout title="Rekap Absensi">
            <Head title={`Rekap Absensi - ${jadwalKuliah.mata_kuliah?.nama_mata_kuliah || 'Kelas'}`} />

            <div className="space-y-6">
                <section className="relative overflow-hidden border border-neutral-900 bg-neutral-900 p-7 text-white shadow-sm">
                    <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Analitik Kehadiran</p>
                            <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">Rekap Absensi Mahasiswa</h1>
                            <p className="mt-2 text-sm text-neutral-300">
                                {jadwalKuliah.mata_kuliah?.nama_mata_kuliah} • {jadwalKuliah.mata_kuliah?.kode_mata_kuliah}
                            </p>
                            <p className="text-sm text-neutral-300">
                                {jadwalKuliah.hari}, {formatTime(jadwalKuliah.jam_mulai)} - {formatTime(jadwalKuliah.jam_selesai)} • Ruang {jadwalKuliah.ruangan}
                            </p>
                            <p className="mt-1 text-xs text-neutral-400">
                                Dosen: {dosen?.nama_lengkap || '-'}{periodeAktif ? ` • ${periodeAktif.nama_periode || 'Periode Aktif'}` : ''}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <ActionButton href={route('dosen.absensi.index', jadwalKuliah.id)} variant="secondary">
                                ← Kembali ke Absensi
                            </ActionButton>
                            <ActionButton href={route('dosen.jadwal')} variant="secondary">
                                Semua Jadwal
                            </ActionButton>
                        </div>
                    </div>
                </section>

                <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <Box>
                        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Total Mahasiswa</p>
                        <p className="mt-1 text-3xl font-bold text-neutral-900">{totalMahasiswa}</p>
                    </Box>
                    <Box>
                        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Total Pertemuan</p>
                        <p className="mt-1 text-3xl font-bold text-neutral-900">{totalPertemuan}</p>
                    </Box>
                    <Box>
                        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Rata-rata Kehadiran</p>
                        <p className="mt-1 text-3xl font-bold text-neutral-900">{averageKehadiran.toFixed(1)}%</p>
                    </Box>
                    <Box>
                        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Kehadiran {'<'} 75%</p>
                        <p className="mt-1 text-3xl font-bold text-neutral-900">{belowThresholdCount}</p>
                    </Box>
                </section>

                <Box>
                    <div className="mb-2 flex items-center justify-between">
                        <p className="text-sm font-medium text-neutral-700">Rata-rata Kelas</p>
                        <p className="text-sm font-semibold text-neutral-900">{averageKehadiran.toFixed(1)}%</p>
                    </div>
                    <div className="h-2 overflow-hidden bg-neutral-200">
                        <div className="h-full bg-neutral-900" style={{ width: `${Math.min(100, Math.max(0, averageKehadiran))}%` }} />
                    </div>
                    <div className="mt-3 border border-neutral-300 bg-neutral-50 p-3 text-xs text-neutral-700">
                        Batas minimal kehadiran yang disarankan: 75%. Mahasiswa di bawah batas ditandai sebagai perlu perhatian.
                    </div>
                </Box>

                <Box>
                    <SectionTitle
                        action={
                            <span className="inline-flex border border-neutral-300 px-2 py-1 text-xs font-semibold text-neutral-700">
                                {totalMahasiswa} mahasiswa
                            </span>
                        }
                    >
                        Detail Rekap Mahasiswa
                    </SectionTitle>
                    <p className="mb-4 text-sm text-neutral-500">Urut berdasarkan persentase kehadiran terendah.</p>

                    {totalMahasiswa === 0 ? (
                        <div className="border border-dashed border-neutral-300 p-10 text-center text-sm text-neutral-500">
                            Belum ada mahasiswa yang mengambil mata kuliah ini.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-neutral-200">
                                <thead className="bg-neutral-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-neutral-600">Mahasiswa</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-neutral-600">Ringkasan</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-neutral-600">Persentase</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-neutral-600">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 bg-white">
                                    {sortByRisk.map((mahasiswa) => {
                                        const stats = mahasiswa.absensi_stats;
                                        const percent = Number(stats.persentase || 0);
                                        const isRisk = percent < 75;

                                        return (
                                            <tr key={mahasiswa.id} className="hover:bg-neutral-50">
                                                <td className="px-4 py-4 align-top">
                                                    <p className="text-sm font-semibold text-neutral-900">{mahasiswa.nama || mahasiswa.nama_lengkap || '-'}</p>
                                                    <p className="text-xs text-neutral-500">NIM: {mahasiswa.nim}</p>
                                                    <p className="text-xs text-neutral-500">{mahasiswa.prodi?.nama_prodi || '-'}</p>
                                                </td>
                                                <td className="px-4 py-4 align-top">
                                                    <div className="flex flex-wrap gap-2">
                                                        <CountPill label="Hadir" value={stats.hadir} tone={statusTone.hadir} />
                                                        <CountPill label="Izin" value={stats.izin} tone={statusTone.izin} />
                                                        <CountPill label="Sakit" value={stats.sakit} tone={statusTone.sakit} />
                                                        <CountPill label="Tidak Hadir" value={stats.tidak_hadir} tone={statusTone.tidak_hadir} />
                                                    </div>
                                                    <p className="mt-2 text-xs text-neutral-500">Total pertemuan: {stats.total_pertemuan}</p>
                                                </td>
                                                <td className="px-4 py-4 align-top">
                                                    <RatePill value={percent} />
                                                </td>
                                                <td className="px-4 py-4 align-top">
                                                    {isRisk ? (
                                                        <span className="inline-flex bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">
                                                            Perlu Perhatian
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                                                            Aman
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Box>
            </div>
        </AdminLayout>
    );
}
