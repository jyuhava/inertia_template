import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, usePage } from '@inertiajs/react';

const gridPattern = {
    backgroundImage: `
        linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(0,0,0,0.04) 1px, transparent 1px)
    `,
    backgroundSize: '24px 24px'
};

function Box({ children, className = '', padded = true, variant = 'white' }) {
    const variants = {
        white: 'bg-white border-[#e4e4e7]',
        dark: 'bg-[#0a0a0a] border-[#222] text-white',
        accent: 'bg-black text-white border-black'
    };
    return (
        <div className={`border ${variants[variant]} ${padded ? 'p-5' : ''} ${className}`}>
            {children}
        </div>
    );
}

function SectionTitle({ children, action, light = false }) {
    return (
        <div className={`mb-4 flex items-center justify-between border-b pb-3 ${light ? 'border-black/10' : 'border-[#222]'}`}>
            <h2 className={`text-xs font-bold uppercase tracking-[0.2em] ${light ? 'text-black' : 'text-white'}`}>{children}</h2>
            {action}
        </div>
    );
}

function HeroBadge({ label, value }) {
    return (
        <div className="border border-black bg-white px-4 py-3">
            <p className="text-[10px] uppercase tracking-widest text-neutral-500">{label}</p>
            <p className="mt-1 text-xl font-bold text-black">{value}</p>
        </div>
    );
}

function StatCard({ title, value, note }) {
    return (
        <Box>
            <div className="mb-3 h-px w-12 bg-black" />
            <p className="text-[10px] uppercase tracking-widest text-neutral-500">{title}</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-black">{value}</p>
            {note ? <p className="mt-2 text-[11px] text-neutral-500">{note}</p> : null}
        </Box>
    );
}

function QuickLink({ href, title, subtitle }) {
    return (
        <Link
            href={href}
            className="group flex items-center justify-between border border-[#e4e4e7] bg-white px-4 py-3 text-sm hover:border-black hover:bg-black transition-colors duration-200"
        >
            <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-black group-hover:text-white transition-colors">{title}</p>
                <p className="text-[10px] uppercase tracking-wider text-neutral-500 group-hover:text-neutral-400 transition-colors">{subtitle}</p>
            </div>
            <span className="text-neutral-400 group-hover:text-white transition-colors">→</span>
        </Link>
    );
}

function StatusBadge({ status }) {
    const isApproved = status === 'disetujui';
    return (
        <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider border ${isApproved ? 'border-black bg-black text-white' : 'border-[#e4e4e7] bg-white text-neutral-600'}`}>
            {status}
        </span>
    );
}

export default function AdminDashboard() {
    const {
        statistics,
        periodeAktif,
        krsStatistics,
        mahasiswaByProdi,
        mahasiswaByAngkatan,
        recentKrs,
        jadwalHariIni,
        pmbStatistics,
        userByRole,
    } = usePage().props;

    const totalKrs = krsStatistics?.total || 0;
    const krsApprovedPct = totalKrs > 0 ? Math.round((krsStatistics.disetujui / totalKrs) * 100) : 0;
    const krsPendingPct = totalKrs > 0 ? Math.round((krsStatistics.menunggu / totalKrs) * 100) : 0;
    const krsRejectedPct = totalKrs > 0 ? Math.round((krsStatistics.ditolak / totalKrs) * 100) : 0;

    return (
        <AdminLayout title="Dashboard Admin">
            <Head title="Dashboard Admin" />

            <div className="space-y-6">
                {/* Hero */}
                <section className="relative overflow-hidden border border-black bg-white p-6 text-black" style={gridPattern}>
                    <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">Pusat Kendali Akademik</p>
                            <h1 className="mt-2 text-2xl font-bold uppercase tracking-wider md:text-3xl">Dashboard Admin</h1>
                            {periodeAktif ? (
                                <p className="mt-2 text-xs uppercase tracking-widest text-neutral-500">
                                    {periodeAktif.nama || `${periodeAktif.tahun_ajaran} - ${periodeAktif.semester}`} •{' '}
                                    {periodeAktif.tanggal_mulai} s/d {periodeAktif.tanggal_selesai}
                                </p>
                            ) : (
                                <p className="mt-2 text-xs uppercase tracking-widest text-neutral-500">Belum ada periode KRS aktif.</p>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            <HeroBadge label="Users" value={statistics.users} />
                            <HeroBadge label="Mahasiswa" value={statistics.mahasiswa.total} />
                            <HeroBadge label="Dosen" value={statistics.dosen} />
                            <HeroBadge label="Kelas LMS" value={statistics.lmsCourse} />
                        </div>
                    </div>
                </section>

                {/* Stats */}
                <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        title="Mahasiswa Aktif"
                        value={statistics.mahasiswa.aktif}
                        note={`${statistics.mahasiswa.nonaktif} nonaktif • ${statistics.mahasiswa.lulus} lulus`}
                    />
                    <StatCard
                        title="Program Studi"
                        value={statistics.prodi}
                        note={`${statistics.mataKuliah} mata kuliah terdaftar`}
                    />
                    <StatCard
                        title="Jadwal Kuliah"
                        value={statistics.jadwalKuliah}
                        note="Total jadwal seluruh semester"
                    />
                    <StatCard
                        title="Calon Mahasiswa"
                        value={pmbStatistics.total_calon}
                        note={`${pmbStatistics.submitted} submitted • ${pmbStatistics.accepted} accepted`}
                    />
                </section>

                {/* Monitoring KRS + Quick Links */}
                <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                    <Box className="xl:col-span-2">
                        <SectionTitle
                            light
                            action={
                                <Link href="/admin/krs" className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500 hover:text-black transition-colors">
                                    Buka Manajemen KRS →
                                </Link>
                            }
                        >
                            Monitoring KRS
                        </SectionTitle>

                        {krsStatistics ? (
                            <div className="space-y-5">
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                                    <div className="border border-[#e4e4e7] bg-[#f4f4f5] px-3 py-3 text-xs uppercase tracking-wider text-neutral-600">
                                        Total <strong className="ml-1 text-black">{krsStatistics.total}</strong>
                                    </div>
                                    <div className="border border-black bg-black px-3 py-3 text-xs uppercase tracking-wider text-white">
                                        Disetujui <strong className="ml-1">{krsStatistics.disetujui}</strong>
                                    </div>
                                    <div className="border border-[#e4e4e7] bg-[#f4f4f5] px-3 py-3 text-xs uppercase tracking-wider text-neutral-600">
                                        Menunggu <strong className="ml-1 text-black">{krsStatistics.menunggu}</strong>
                                    </div>
                                    <div className="border border-[#e4e4e7] bg-[#f4f4f5] px-3 py-3 text-xs uppercase tracking-wider text-neutral-600">
                                        Ditolak <strong className="ml-1 text-black">{krsStatistics.ditolak}</strong>
                                    </div>
                                </div>

                                <div>
                                    <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-widest text-neutral-500">
                                        <span>Approval rate</span>
                                        <span>{krsApprovedPct}%</span>
                                    </div>
                                    <div className="h-2 bg-[#f4f4f5] border border-[#e4e4e7]">
                                        <div className="h-full bg-black" style={{ width: `${krsApprovedPct}%` }} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-widest text-neutral-500">
                                            <span>Pending</span>
                                            <span>{krsPendingPct}%</span>
                                        </div>
                                        <div className="h-2 bg-[#f4f4f5] border border-[#e4e4e7]">
                                            <div className="h-full bg-neutral-500" style={{ width: `${krsPendingPct}%` }} />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-widest text-neutral-500">
                                            <span>Rejected</span>
                                            <span>{krsRejectedPct}%</span>
                                        </div>
                                        <div className="h-2 bg-[#f4f4f5] border border-[#e4e4e7]">
                                            <div className="h-full bg-neutral-700" style={{ width: `${krsRejectedPct}%` }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="border border-dashed border-[#e4e4e7] p-8 text-center text-xs uppercase tracking-widest text-neutral-500">
                                Tidak ada periode KRS aktif untuk ditampilkan.
                            </div>
                        )}
                    </Box>

                    <Box>
                        <SectionTitle light>Aksi Cepat</SectionTitle>
                        <div className="space-y-3">
                            <QuickLink href="/admin/mahasiswa" title="Data Mahasiswa" subtitle="Kelola data dan akun mahasiswa" />
                            <QuickLink href="/admin/dosen" title="Data Dosen" subtitle="Kelola dosen dan status akun" />
                            <QuickLink href="/admin/krs" title="Persetujuan KRS" subtitle="Review dan approve pengajuan KRS" />
                            <QuickLink href="/admin/calon-mahasiswa" title="PMB" subtitle="Verifikasi dan konversi calon mahasiswa" />
                            <QuickLink href="/admin/lms-courses" title="LMS Courses" subtitle="Monitoring kelas LMS aktif" />
                        </div>
                    </Box>
                </section>

                {/* Distribution + PMB + Top Prodi */}
                <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                    <Box>
                        <SectionTitle light>Distribusi User</SectionTitle>
                        <div className="space-y-2 text-xs uppercase tracking-wider">
                            <div className="flex items-center justify-between border border-[#e4e4e7] bg-[#f4f4f5] px-3 py-2 text-neutral-600">
                                <span>Admin</span>
                                <strong className="text-black">{userByRole.admin}</strong>
                            </div>
                            <div className="flex items-center justify-between border border-[#e4e4e7] bg-[#f4f4f5] px-3 py-2 text-neutral-600">
                                <span>Dosen</span>
                                <strong className="text-black">{userByRole.dosen}</strong>
                            </div>
                            <div className="flex items-center justify-between border border-[#e4e4e7] bg-[#f4f4f5] px-3 py-2 text-neutral-600">
                                <span>Mahasiswa</span>
                                <strong className="text-black">{userByRole.mahasiswa}</strong>
                            </div>
                            <div className="flex items-center justify-between border border-[#e4e4e7] bg-[#f4f4f5] px-3 py-2 text-neutral-600">
                                <span>Calon Mahasiswa</span>
                                <strong className="text-black">{userByRole.calon_mahasiswa}</strong>
                            </div>
                        </div>
                    </Box>

                    <Box>
                        <SectionTitle light>PMB Snapshot</SectionTitle>
                        <div className="space-y-3 text-xs uppercase tracking-wider">
                            {pmbStatistics.periode_aktif ? (
                                <div className="border border-black bg-black p-3 text-white">
                                    <p className="font-bold">{pmbStatistics.periode_aktif.nama}</p>
                                    <p className="text-[10px] mt-1">
                                        {pmbStatistics.periode_aktif.tanggal_buka} - {pmbStatistics.periode_aktif.tanggal_tutup}
                                    </p>
                                    <p className="mt-2 text-[10px]">
                                        Kuota: {pmbStatistics.periode_aktif.pendaftar}/{pmbStatistics.periode_aktif.kuota_total}
                                    </p>
                                </div>
                            ) : (
                                <div className="border border-dashed border-[#e4e4e7] p-3 text-neutral-500">Tidak ada periode PMB aktif.</div>
                            )}
                            <div className="grid grid-cols-2 gap-2">
                                <div className="border border-[#e4e4e7] bg-[#f4f4f5] px-3 py-2 text-neutral-600">Draft: <strong className="text-black">{pmbStatistics.draft}</strong></div>
                                <div className="border border-[#e4e4e7] bg-[#f4f4f5] px-3 py-2 text-neutral-600">Submitted: <strong className="text-black">{pmbStatistics.submitted}</strong></div>
                                <div className="border border-black bg-black px-3 py-2 text-white">Accepted: <strong>{pmbStatistics.accepted}</strong></div>
                                <div className="border border-[#e4e4e7] bg-[#f4f4f5] px-3 py-2 text-neutral-600">Rejected: <strong className="text-black">{pmbStatistics.rejected}</strong></div>
                            </div>
                        </div>
                    </Box>

                    <Box>
                        <SectionTitle light>Top Prodi</SectionTitle>
                        <div className="space-y-4">
                            {(mahasiswaByProdi || []).slice(0, 5).map((item, idx) => (
                                <div key={`${item.nama}-${idx}`}>
                                    <div className="mb-1 flex items-center justify-between text-xs uppercase tracking-wider">
                                        <span className="text-neutral-600">{item.nama}</span>
                                        <span className="font-bold text-black">{item.jumlah}</span>
                                    </div>
                                    <div className="h-2 bg-[#f4f4f5] border border-[#e4e4e7]">
                                        <div
                                            className="h-full bg-black"
                                            style={{
                                                width: `${Math.min(
                                                    100,
                                                    Math.round((item.jumlah / Math.max(mahasiswaByProdi?.[0]?.jumlah || 1, 1)) * 100)
                                                )}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Box>
                </section>

                {/* Recent KRS + Jadwal Hari Ini */}
                <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                    <Box>
                        <SectionTitle light>Aktivitas KRS Terbaru</SectionTitle>
                        {recentKrs?.length ? (
                            <div className="space-y-3">
                                {recentKrs.map((item) => (
                                    <div key={item.id} className="border border-[#e4e4e7] bg-[#f4f4f5] p-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-wider text-black">
                                                    {item.mahasiswa} <span className="text-neutral-500">({item.nim})</span>
                                                </p>
                                                <p className="text-[10px] uppercase tracking-wider text-neutral-500">{item.mata_kuliah}</p>
                                            </div>
                                            <StatusBadge status={item.status} />
                                        </div>
                                        <p className="mt-2 text-[10px] uppercase tracking-wider text-neutral-500">
                                            {item.tanggal}
                                            {item.approved_by ? ` • oleh ${item.approved_by}` : ''}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="border border-dashed border-[#e4e4e7] p-8 text-center text-xs uppercase tracking-widest text-neutral-500">
                                Belum ada aktivitas KRS terbaru.
                            </div>
                        )}
                    </Box>

                    <Box>
                        <SectionTitle light>Jadwal Kuliah Hari Ini</SectionTitle>
                        {jadwalHariIni?.length ? (
                            <div className="space-y-3">
                                {jadwalHariIni.map((item, idx) => (
                                    <div key={`${item.mata_kuliah}-${idx}`} className="border border-[#e4e4e7] bg-[#f4f4f5] p-3">
                                        <p className="text-xs font-semibold uppercase tracking-wider text-black">{item.mata_kuliah}</p>
                                        <p className="text-[10px] uppercase tracking-wider text-neutral-500">{item.dosen}</p>
                                        <p className="mt-2 text-[10px] uppercase tracking-wider text-neutral-600">{item.waktu} • Ruang {item.ruangan}</p>
                                        <p className="text-[10px] uppercase tracking-wider text-neutral-400">{item.semester}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="border border-dashed border-[#e4e4e7] p-8 text-center text-xs uppercase tracking-widest text-neutral-500">
                                Tidak ada jadwal kuliah hari ini.
                            </div>
                        )}
                    </Box>
                </section>

                {/* Mahasiswa per Angkatan */}
                <section className="border border-[#e4e4e7] bg-white p-5">
                    <SectionTitle light>Mahasiswa per Angkatan</SectionTitle>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                        {(mahasiswaByAngkatan || []).map((item, idx) => (
                            <div key={`${item.angkatan}-${idx}`} className="border border-[#e4e4e7] bg-[#f4f4f5] px-4 py-3">
                                <p className="text-[10px] uppercase tracking-widest text-neutral-500">Angkatan {item.angkatan}</p>
                                <p className="mt-1 text-2xl font-bold text-black">{item.jumlah}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
}
