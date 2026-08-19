import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';

function Box({ children, className = '', padded = true, variant = 'white' }) {
    const variants = {
        white: 'bg-white border-neutral-200',
        gray: 'bg-neutral-50 border-neutral-200',
        dark: 'bg-neutral-900 border-neutral-900 text-white',
        outline: 'bg-transparent border-neutral-200',
    };
    return (
        <div className={`border shadow-sm ${variants[variant]} ${padded ? 'p-5 sm:p-6' : ''} ${className}`}>
            {children}
        </div>
    );
}

function SectionTitle({ children, action, light = false }) {
    return (
        <div className="mb-4 flex items-center justify-between border-b border-neutral-200 pb-3">
            <h2 className={`text-sm font-bold uppercase tracking-[0.2em] ${light ? 'text-white' : 'text-neutral-900'}`}>
                {children}
            </h2>
            {action ? <div>{action}</div> : null}
        </div>
    );
}

function HeroBadge({ label, value }) {
    return (
        <div className="border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
            <p className="text-[10px] uppercase tracking-widest text-neutral-300">{label}</p>
            <p className="mt-1 text-sm font-semibold text-white">{value}</p>
        </div>
    );
}

function StatCard({ title, value, note }) {
    return (
        <Box className="relative overflow-hidden">
            <div className="absolute right-0 top-0 h-16 w-16 border-b border-l border-neutral-200 bg-neutral-50" />
            <p className="text-[10px] uppercase tracking-widest text-neutral-500">{title}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-neutral-900">{value}</p>
            {note ? <p className="mt-2 text-xs text-neutral-500">{note}</p> : null}
        </Box>
    );
}

function QuickLink({ href, title, subtitle }) {
    return (
        <Link
            href={href}
            className="group flex items-center justify-between border border-neutral-200 bg-white px-4 py-3 text-sm transition hover:border-neutral-900 hover:bg-neutral-100"
        >
            <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-900">{title}</p>
                <p className="text-[10px] uppercase tracking-widest text-neutral-500">{subtitle}</p>
            </div>
            <span className="text-neutral-400 transition group-hover:text-neutral-900">→</span>
        </Link>
    );
}

function StatusBadge({ status }) {
    const map = {
        aktif: 'bg-neutral-900 text-white border-neutral-900',
        nonaktif: 'bg-white text-neutral-900 border-neutral-200',
        pensiun: 'bg-neutral-100 text-neutral-900 border-neutral-200',
    };
    const cls = map[status] || map.pensiun;
    return (
        <span className={`inline-flex items-center border px-3 py-1 text-[10px] font-semibold uppercase tracking-widest ${cls}`}>
            {status || '-'}
        </span>
    );
}

export default function DosenDashboard({ dosen, periodeAktif, summary, jadwalKuliahs, todayClasses, recentUpdates }) {
    if (!periodeAktif) {
        return (
            <AdminLayout title="Dashboard Dosen">
                <Head title="Dashboard Dosen" />
                <Box className="text-center">
                    <p className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-900">Tidak ada periode KRS aktif</p>
                    <p className="mt-2 text-xs text-neutral-500">
                        Dashboard akan menampilkan data setelah admin mengaktifkan periode KRS.
                    </p>
                </Box>
            </AdminLayout>
        );
    }

    const finalTotal = summary.penilaian_final + summary.penilaian_draft;
    const finalRate = Math.min(100, Math.round((summary.penilaian_final / Math.max(finalTotal, 1)) * 100));

    return (
        <AdminLayout title="Dashboard Dosen">
            <Head title="Dashboard Dosen" />

            <div className="space-y-6">
                {/* Hero */}
                <section className="relative overflow-hidden border border-neutral-900 bg-neutral-900 p-6 text-white sm:p-8">
                    <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-400">Dashboard Pengajar</p>
                            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                                Selamat datang, {dosen.nama_lengkap}
                            </h1>
                            <p className="mt-2 text-xs text-neutral-400">
                                NIP {dosen.nip || '-'} • {dosen.jabatan_akademik || '-'} • {dosen.bidang_keahlian || '-'}
                            </p>
                            <div className="mt-4">
                                <StatusBadge status={dosen.status} />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <HeroBadge
                                label="Periode Aktif"
                                value={periodeAktif.nama || `${periodeAktif.tahun_ajaran} / ${periodeAktif.semester}`}
                            />
                            <HeroBadge label="Rentang" value={`${periodeAktif.tanggal_mulai} - ${periodeAktif.tanggal_selesai}`} />
                        </div>
                    </div>
                </section>

                {/* Stats */}
                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    <StatCard title="Mata Kuliah Aktif" value={summary.total_mata_kuliah} note={`${summary.total_sks} total SKS diajar`} />
                    <StatCard title="Total Mahasiswa" value={summary.total_mahasiswa} note="Akumulasi peserta semua kelas aktif" />
                    <StatCard
                        title="Kelas LMS"
                        value={summary.lms_course_count}
                        note={`${summary.total_mata_kuliah - summary.lms_course_count} kelas belum punya LMS`}
                    />
                    <StatCard title="Penilaian Final" value={summary.penilaian_final} note={`${summary.penilaian_draft} masih draft`} />
                    <StatCard title="Kehadiran Mahasiswa" value={`${summary.kehadiran_hadir_rate}%`} note="Rata-rata status hadir seluruh kelas" />
                    <Box className="flex flex-col justify-between">
                        <p className="text-[10px] uppercase tracking-widest text-neutral-500">Status Penilaian</p>
                        <div className="mt-3">
                            <div className="mb-2 flex items-center justify-between text-xs text-neutral-500">
                                <span>Final</span>
                                <span>{summary.penilaian_final}</span>
                            </div>
                            <div className="h-2 w-full border border-neutral-200 bg-white">
                                <div className="h-full bg-neutral-900" style={{ width: `${finalRate}%` }} />
                            </div>
                        </div>
                        <div className="mt-3 border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
                            Draft tersisa: <strong>{summary.penilaian_draft}</strong>
                        </div>
                    </Box>
                </section>

                {/* Main grid */}
                <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                    <Box className="xl:col-span-2">
                        <SectionTitle
                            action={
                                <Link href={route('dosen.jadwal')} className="text-xs font-semibold uppercase tracking-widest text-neutral-500 hover:text-neutral-900">
                                    Lihat Jadwal Lengkap →
                                </Link>
                            }
                        >
                            Kelas Hari Ini
                        </SectionTitle>

                        {todayClasses?.length ? (
                            <div className="space-y-3">
                                {todayClasses.map((item) => (
                                    <div key={item.id} className="border border-neutral-200 bg-white p-4">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div>
                                                <p className="text-sm font-bold uppercase tracking-wider text-neutral-900">{item.mata_kuliah}</p>
                                                <p className="text-[10px] uppercase tracking-widest text-neutral-500">
                                                    {item.kode} • {item.sks} SKS • Ruang {item.ruangan}
                                                </p>
                                            </div>
                                            <span className="border border-neutral-900 bg-neutral-900 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-white">
                                                {item.jam_mulai} - {item.jam_selesai}
                                            </span>
                                        </div>
                                        <div className="mt-3 flex items-center justify-between">
                                            <p className="text-xs text-neutral-600">{item.jumlah_mahasiswa} mahasiswa</p>
                                            <div className="flex gap-2">
                                                <Link
                                                    href={route('dosen.absensi.index', item.id)}
                                                    className="border border-neutral-200 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-neutral-900 transition hover:border-neutral-900 hover:bg-neutral-900 hover:text-white"
                                                >
                                                    Absensi
                                                </Link>
                                                <Link
                                                    href={route('dosen.penilaian', item.id)}
                                                    className="border border-neutral-900 bg-neutral-900 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-white transition hover:bg-white hover:text-neutral-900"
                                                >
                                                    Nilai
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="border border-dashed border-neutral-200 p-8 text-center text-xs text-neutral-500">
                                Tidak ada kelas mengajar hari ini.
                            </div>
                        )}
                    </Box>

                    <Box>
                        <SectionTitle>Aksi Cepat</SectionTitle>
                        <div className="space-y-3">
                            <QuickLink href={route('dosen.jadwal')} title="Jadwal Mengajar" subtitle="Lihat semua kelas periode aktif" />
                            <QuickLink href={route('dosen.lms.index')} title="Kelola LMS" subtitle="Materi, tugas, dan konten kelas" />
                            <QuickLink href={route('dosen.lms.login')} title="Login LMS Eksternal" subtitle="SSO ke platform learning" />
                            <QuickLink href={route('profile.edit')} title="Profil Dosen" subtitle="Perbarui data akun pribadi" />
                        </div>
                    </Box>
                </section>

                {/* Bottom grid */}
                <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                    <Box>
                        <SectionTitle>Update Nilai Terbaru</SectionTitle>
                        {recentUpdates?.length ? (
                            <div className="space-y-3">
                                {recentUpdates.map((row) => (
                                    <div key={row.id} className="border border-neutral-200 bg-white p-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-900">{row.mahasiswa}</p>
                                                <p className="text-[10px] uppercase tracking-widest text-neutral-500">{row.mata_kuliah}</p>
                                            </div>
                                            <span
                                                className={`border px-2 py-1 text-[10px] font-semibold uppercase tracking-widest ${
                                                    Number(row.nilai_akhir) >= 70
                                                        ? 'border-neutral-900 bg-neutral-900 text-white'
                                                        : 'border-neutral-200 bg-white text-neutral-900'
                                                }`}
                                            >
                                                {row.nilai_akhir}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-[10px] uppercase tracking-widest text-neutral-500">
                                            {row.status} • {row.updated_at}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="border border-dashed border-neutral-200 p-8 text-center text-xs text-neutral-500">
                                Belum ada update nilai terbaru.
                            </div>
                        )}
                    </Box>

                    <Box>
                        <SectionTitle
                            action={
                                <span className="text-[10px] uppercase tracking-widest text-neutral-500">{jadwalKuliahs?.length || 0} kelas</span>
                            }
                        >
                            Ringkasan Kelas
                        </SectionTitle>

                        {jadwalKuliahs?.length ? (
                            <div className="space-y-3">
                                {jadwalKuliahs.slice(0, 6).map((jadwal) => (
                                    <div key={jadwal.id} className="border border-neutral-200 bg-white p-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-900">
                                                    {jadwal.mata_kuliah?.nama_mata_kuliah}
                                                </p>
                                                <p className="text-[10px] uppercase tracking-widest text-neutral-500">
                                                    {jadwal.hari} • {jadwal.jam_mulai?.slice(0, 5)} - {jadwal.jam_selesai?.slice(0, 5)}
                                                </p>
                                            </div>
                                            <span className="border border-neutral-200 bg-neutral-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-neutral-900">
                                                {jadwal.jumlah_mahasiswa_aktual} mhs
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="border border-dashed border-neutral-200 p-8 text-center text-xs text-neutral-500">
                                Belum ada kelas aktif pada periode ini.
                            </div>
                        )}
                    </Box>
                </section>
            </div>
        </AdminLayout>
    );
}
