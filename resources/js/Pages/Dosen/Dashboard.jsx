import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import {
    AcademicCapIcon,
    ArrowRightIcon,
    BeakerIcon,
    BookOpenIcon,
    CalendarDaysIcon,
    CheckBadgeIcon,
    ClipboardDocumentListIcon,
    ClockIcon,
    MapPinIcon,
    PencilSquareIcon,
    UserGroupIcon,
} from '@heroicons/react/24/outline';

const ACCENTS = {
    indigo: { chip: 'bg-indigo-50 text-indigo-600', value: 'text-indigo-700', bar: 'bg-indigo-500', ring: 'border-indigo-200' },
    emerald: { chip: 'bg-emerald-50 text-emerald-600', value: 'text-emerald-700', bar: 'bg-emerald-500', ring: 'border-emerald-200' },
    violet: { chip: 'bg-violet-50 text-violet-600', value: 'text-violet-700', bar: 'bg-violet-500', ring: 'border-violet-200' },
    amber: { chip: 'bg-amber-50 text-amber-600', value: 'text-amber-700', bar: 'bg-amber-500', ring: 'border-amber-200' },
    sky: { chip: 'bg-sky-50 text-sky-600', value: 'text-sky-700', bar: 'bg-sky-500', ring: 'border-sky-200' },
    rose: { chip: 'bg-rose-50 text-rose-600', value: 'text-rose-700', bar: 'bg-rose-500', ring: 'border-rose-200' },
};

const SCHEDULE_ACCENTS = ['emerald', 'sky', 'violet', 'amber', 'indigo', 'rose'];

function StatCard({ label, value, note, icon: Icon, accent = 'indigo', progress = null }) {
    const a = ACCENTS[accent] || ACCENTS.indigo;

    return (
        <div className="rounded-2xl border border-neutral-200 bg-white p-3.5 shadow-sm">
            <div className="flex items-start justify-between gap-2">
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${a.chip}`}>
                    <Icon className="h-[18px] w-[18px]" />
                </span>
                <p className={`text-[22px] font-bold leading-none tracking-tight ${a.value}`}>{value}</p>
            </div>

            <p className="mt-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-500">{label}</p>
            {note ? <p className="mt-0.5 text-[11px] leading-snug text-neutral-400">{note}</p> : null}

            {progress !== null && (
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                    <div
                        className={`h-full rounded-full ${a.bar}`}
                        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                    />
                </div>
            )}
        </div>
    );
}

function SectionCard({ title, action, children, className = '' }) {
    return (
        <section className={`rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm ${className}`}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-500">{title}</h2>
                {action}
            </div>
            {children}
        </section>
    );
}

function StatusBadge({ status }) {
    const map = {
        aktif: 'bg-emerald-400/95 text-emerald-950',
        nonaktif: 'bg-rose-400/95 text-rose-950',
        pensiun: 'bg-white/20 text-white',
    };

    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] backdrop-blur ${map[status] || map.pensiun}`}>
            {status || '-'}
        </span>
    );
}

function ScoreBadge({ score }) {
    const num = Number(score || 0);

    if (num >= 85) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (num >= 70) return 'bg-sky-50 text-sky-700 border-sky-200';
    if (num >= 60) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-rose-50 text-rose-700 border-rose-200';
}

export default function DosenDashboard({ dosen, periodeAktif, summary, jadwalKuliahs, todayClasses, recentUpdates }) {
    if (!periodeAktif) {
        return (
            <AdminLayout title="Dashboard Dosen">
                <Head title="Dashboard Dosen" />

                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center shadow-sm">
                    <span className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-white text-amber-600">
                        <CalendarDaysIcon className="h-5 w-5" />
                    </span>
                    <p className="mt-3 text-sm font-bold uppercase tracking-[0.15em] text-amber-800">
                        Tidak ada periode KRS aktif
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed text-amber-700/80">
                        Dashboard akan menampilkan data setelah admin mengaktifkan periode KRS.
                    </p>
                </div>
            </AdminLayout>
        );
    }

    const finalTotal = summary.penilaian_final + summary.penilaian_draft;
    const finalRate = Math.min(100, Math.round((summary.penilaian_final / Math.max(finalTotal, 1)) * 100));

    const quickActions = [
        {
            label: 'Jadwal Mengajar',
            desc: 'Semua kelas periode aktif',
            href: route('dosen.jadwal'),
            icon: CalendarDaysIcon,
            accent: 'emerald',
        },
        {
            label: 'Kelola LMS',
            desc: 'Materi, tugas & forum',
            href: route('dosen.lms.index'),
            icon: BookOpenIcon,
            accent: 'sky',
        },
        {
            label: 'Proposal LPM',
            desc: 'Pengabdian & review',
            href: route('dosen.lpm.proposals.index'),
            icon: BeakerIcon,
            accent: 'violet',
        },
        {
            label: 'Profil Dosen',
            desc: 'Perbarui data akun',
            href: route('profile.edit'),
            icon: PencilSquareIcon,
            accent: 'amber',
        },
    ];

    return (
        <AdminLayout title="Dashboard Dosen">
            <Head title="Dashboard Dosen" />

            <div className="space-y-3.5">
                {/* ---------------- Hero berwarna ---------------- */}
                <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-4 text-white shadow-lg shadow-teal-500/20 sm:p-5">
                    <div className="pointer-events-none absolute -right-12 -top-14 h-44 w-44 rounded-full bg-white/10" />
                    <div className="pointer-events-none absolute -bottom-20 -left-10 h-44 w-44 rounded-full bg-white/10" />

                    <div className="relative">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
                            Dashboard Pengajar
                        </p>
                        <h1 className="mt-1.5 text-xl font-bold leading-tight sm:text-2xl">
                            Selamat datang, {dosen.nama_lengkap}
                        </h1>
                        <p className="mt-1 text-[11px] leading-relaxed text-white/80 sm:text-xs">
                            NIP {dosen.nip || '-'} • {dosen.jabatan_akademik || '-'} • {dosen.bidang_keahlian || '-'}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            <StatusBadge status={dosen.status} />
                            <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-white backdrop-blur">
                                <CalendarDaysIcon className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">
                                    {periodeAktif.nama || `${periodeAktif.tahun_ajaran} / ${periodeAktif.semester}`}
                                </span>
                            </span>
                        </div>

                        <p className="mt-2 text-[10px] text-white/70">
                            {periodeAktif.tanggal_mulai} — {periodeAktif.tanggal_selesai}
                        </p>
                    </div>
                </section>

                {/* ---------------- Statistik ---------------- */}
                <section className="grid grid-cols-2 gap-3 xl:grid-cols-3">
                    <StatCard
                        label="Mata Kuliah Aktif"
                        value={summary.total_mata_kuliah}
                        note={`${summary.total_sks} total SKS diajar`}
                        icon={ClipboardDocumentListIcon}
                        accent="emerald"
                    />
                    <StatCard
                        label="Total Mahasiswa"
                        value={summary.total_mahasiswa}
                        note="Peserta semua kelas aktif"
                        icon={UserGroupIcon}
                        accent="sky"
                    />
                    <StatCard
                        label="Kelas LMS"
                        value={summary.lms_course_count}
                        note={`${Math.max(0, summary.total_mata_kuliah - summary.lms_course_count)} kelas belum ada LMS`}
                        icon={BookOpenIcon}
                        accent="violet"
                    />
                    <StatCard
                        label="Penilaian Final"
                        value={summary.penilaian_final}
                        note={`${summary.penilaian_draft} masih draft`}
                        icon={CheckBadgeIcon}
                        accent="indigo"
                        progress={finalRate}
                    />
                    <StatCard
                        label="Kehadiran Mahasiswa"
                        value={`${summary.kehadiran_hadir_rate}%`}
                        note="Rata-rata status hadir"
                        icon={AcademicCapIcon}
                        accent="amber"
                        progress={Number(summary.kehadiran_hadir_rate) || 0}
                    />

                    <div className="col-span-2 rounded-2xl border border-neutral-200 bg-white p-3.5 shadow-sm xl:col-span-1">
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-500">
                                Status Penilaian
                            </p>
                            <span className="text-[11px] font-bold text-indigo-700">{finalRate}%</span>
                        </div>
                        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                            <div className="h-full rounded-full bg-indigo-500" style={{ width: `${finalRate}%` }} />
                        </div>
                        <div className="mt-3 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                            <span className="text-[11px] font-semibold text-amber-700">Draft tersisa</span>
                            <span className="text-sm font-bold text-amber-700">{summary.penilaian_draft}</span>
                        </div>
                    </div>
                </section>

                {/* ---------------- Kelas hari ini ---------------- */}
                <SectionCard
                    title="Kelas Hari Ini"
                    action={
                        <Link
                            href={route('dosen.jadwal')}
                            className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-600 hover:text-emerald-700"
                        >
                            Jadwal Lengkap
                            <ArrowRightIcon className="h-3 w-3" />
                        </Link>
                    }
                >
                    {todayClasses?.length ? (
                        <div className="space-y-2.5">
                            {todayClasses.map((item, index) => {
                                const a = ACCENTS[SCHEDULE_ACCENTS[index % SCHEDULE_ACCENTS.length]];

                                return (
                                    <div
                                        key={item.id}
                                        className="flex gap-3 rounded-xl border border-neutral-200 bg-neutral-50/60 p-3"
                                    >
                                        <div className={`w-1 shrink-0 rounded-full ${a.bar}`} />

                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-[13px] font-bold text-neutral-900">
                                                {item.mata_kuliah}
                                            </p>
                                            <p className="mt-0.5 truncate text-[11px] text-neutral-500">
                                                {item.kode} • {item.sks} SKS • {item.jumlah_mahasiswa} mahasiswa
                                            </p>

                                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${a.chip}`}>
                                                    <ClockIcon className="h-3 w-3" />
                                                    {item.jam_mulai}–{item.jam_selesai}
                                                </span>
                                                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-neutral-600 ring-1 ring-neutral-200">
                                                    <MapPinIcon className="h-3 w-3" />
                                                    {item.ruangan}
                                                </span>
                                            </div>

                                            <div className="mt-2.5 flex flex-wrap gap-2">
                                                <Link
                                                    href={route('dosen.absensi.index', item.id)}
                                                    className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-neutral-700 transition hover:border-emerald-400 hover:text-emerald-700"
                                                >
                                                    <CheckBadgeIcon className="h-3.5 w-3.5" />
                                                    Absensi
                                                </Link>
                                                <Link
                                                    href={route('dosen.penilaian', item.id)}
                                                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-white transition hover:bg-emerald-700"
                                                >
                                                    <PencilSquareIcon className="h-3.5 w-3.5" />
                                                    Nilai
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center">
                            <CalendarDaysIcon className="mx-auto h-6 w-6 text-neutral-300" />
                            <p className="mt-2 text-[12px] font-semibold text-neutral-500">
                                Tidak ada kelas mengajar hari ini
                            </p>
                        </div>
                    )}
                </SectionCard>

                {/* ---------------- Aksi cepat ---------------- */}
                <section>
                    <h2 className="mb-2.5 px-0.5 text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-500">
                        Aksi Cepat
                    </h2>

                    <div className="grid grid-cols-2 gap-3">
                        {quickActions.map((item) => {
                            const a = ACCENTS[item.accent];
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-3.5 shadow-sm transition hover:border-neutral-300 active:scale-[0.98]"
                                >
                                    <span className={`grid h-10 w-10 place-items-center rounded-xl ${a.chip}`}>
                                        <Icon className="h-5 w-5" />
                                    </span>
                                    <span className="mt-2.5 text-[13px] font-bold leading-tight text-neutral-900">
                                        {item.label}
                                    </span>
                                    <span className="mt-0.5 text-[11px] leading-snug text-neutral-400">
                                        {item.desc}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </section>

                {/* ---------------- Update nilai + ringkasan kelas ---------------- */}
                <div className="grid grid-cols-1 gap-3.5 xl:grid-cols-2">
                    <SectionCard title="Update Nilai Terbaru">
                        {recentUpdates?.length ? (
                            <div className="divide-y divide-neutral-100">
                                {recentUpdates.map((row) => (
                                    <div key={row.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                                        <span
                                            className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border text-[13px] font-bold ${ScoreBadge(
                                                row.nilai_akhir,
                                            )}`}
                                        >
                                            {row.nilai_akhir}
                                        </span>

                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-[13px] font-semibold text-neutral-900">
                                                {row.mahasiswa}
                                            </p>
                                            <p className="mt-0.5 truncate text-[11px] text-neutral-400">
                                                {row.mata_kuliah} • {row.status}
                                            </p>
                                        </div>

                                        <span className="shrink-0 text-[10px] text-neutral-400">{row.updated_at}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center">
                                <p className="text-[12px] font-semibold text-neutral-500">
                                    Belum ada update nilai terbaru
                                </p>
                            </div>
                        )}
                    </SectionCard>

                    <SectionCard
                        title="Ringkasan Kelas"
                        action={
                            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-400">
                                {jadwalKuliahs?.length || 0} kelas
                            </span>
                        }
                    >
                        {jadwalKuliahs?.length ? (
                            <div className="space-y-2">
                                {jadwalKuliahs.slice(0, 6).map((jadwal, index) => {
                                    const a = ACCENTS[SCHEDULE_ACCENTS[index % SCHEDULE_ACCENTS.length]];

                                    return (
                                        <div
                                            key={jadwal.id}
                                            className="flex items-center gap-3 rounded-xl border border-neutral-200 p-2.5"
                                        >
                                            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${a.chip}`}>
                                                <BookOpenIcon className="h-[18px] w-[18px]" />
                                            </span>

                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-[12px] font-semibold text-neutral-900">
                                                    {jadwal.mata_kuliah?.nama_mata_kuliah}
                                                </p>
                                                <p className="mt-0.5 truncate text-[10px] text-neutral-400">
                                                    {jadwal.hari} • {jadwal.jam_mulai?.slice(0, 5)}–{jadwal.jam_selesai?.slice(0, 5)}
                                                </p>
                                            </div>

                                            <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-600">
                                                {jadwal.jumlah_mahasiswa_aktual} mhs
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center">
                                <p className="text-[12px] font-semibold text-neutral-500">
                                    Belum ada kelas aktif pada periode ini
                                </p>
                            </div>
                        )}
                    </SectionCard>
                </div>
            </div>
        </AdminLayout>
    );
}
