import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { useMemo } from 'react';
import {
    AcademicCapIcon,
    ArrowRightIcon,
    BookOpenIcon,
    CalendarDaysIcon,
    CheckBadgeIcon,
    ChevronRightIcon,
    ClipboardDocumentListIcon,
    ClockIcon,
    MapPinIcon,
    SparklesIcon,
    TrophyIcon,
    UserGroupIcon,
} from '@heroicons/react/24/outline';

/* ------------------------------------------------------------------ *
 * Token warna — dipakai konsisten di seluruh beranda mahasiswa
 * ------------------------------------------------------------------ */
const ACCENTS = {
    indigo: { chip: 'bg-brand-50 text-brand-700', value: 'text-brand-700', bar: 'bg-brand-500', ring: 'border-brand-200' },
    emerald: { chip: 'bg-emerald-50 text-emerald-600', value: 'text-emerald-700', bar: 'bg-emerald-500', ring: 'border-emerald-200' },
    violet: { chip: 'bg-violet-50 text-violet-600', value: 'text-violet-700', bar: 'bg-violet-500', ring: 'border-violet-200' },
    amber: { chip: 'bg-amber-50 text-amber-600', value: 'text-amber-700', bar: 'bg-amber-500', ring: 'border-amber-200' },
    sky: { chip: 'bg-sky-50 text-sky-600', value: 'text-sky-700', bar: 'bg-sky-500', ring: 'border-sky-200' },
    rose: { chip: 'bg-rose-50 text-rose-600', value: 'text-rose-700', bar: 'bg-rose-500', ring: 'border-rose-200' },
};

const SCHEDULE_ACCENTS = ['indigo', 'emerald', 'violet', 'amber', 'sky', 'rose'];

function StatCard({ label, value, note, icon: Icon, accent = 'indigo', progress = null }) {
    const a = ACCENTS[accent] || ACCENTS.indigo;

    return (
        <div className="rounded-2xl border border-neutral-200 bg-white p-3.5 shadow-sm">
            <div className="flex items-start justify-between gap-2">
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${a.chip}`}>
                    <Icon className="h-[18px] w-[18px]" />
                </span>
                <p className={`text-[22px] font-extrabold leading-none tracking-tight ${a.value}`}>{value}</p>
            </div>

            <p className="mt-2.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-neutral-500">{label}</p>
            {note ? <p className="mt-0.5 text-[11px] font-semibold leading-snug text-neutral-400">{note}</p> : null}

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
                <h2 className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-neutral-500">
                    <span className="h-3.5 w-1 shrink-0 rounded-full bg-brand-500" />
                    {title}
                </h2>
                {action}
            </div>
            {children}
        </section>
    );
}

function StatusPill({ status }) {
    const map = {
        aktif: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
        nonaktif: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
        lulus: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
    };

    const cls = map[status] || 'bg-neutral-100 text-neutral-600 ring-1 ring-neutral-200';
    const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : '-';

    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] ${cls}`}>
            {label}
        </span>
    );
}

function GradeBadge({ score }) {
    const num = Number(score || 0);

    if (num >= 85) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (num >= 70) return 'bg-sky-50 text-sky-700 border-sky-200';
    if (num >= 60) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-rose-50 text-rose-700 border-rose-200';
}

function KrsSummaryChip({ label, value, accent }) {
    const a = ACCENTS[accent] || ACCENTS.indigo;

    return (
        <div className={`rounded-xl border ${a.ring} ${a.chip} px-2 py-2 text-center`}>
            <p className="text-lg font-extrabold leading-none">{value}</p>
            <p className="mt-1 text-[9px] font-extrabold uppercase tracking-[0.1em] opacity-80">{label}</p>
        </div>
    );
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
    const periodeLabel = periodeAktif
        ? periodeAktif.nama || `${periodeAktif.tahun_ajaran || '-'} / ${periodeAktif.semester || '-'}`
        : null;

    const quickActions = [
        {
            label: 'KRS Online',
            desc: 'Ambil & atur mata kuliah',
            href: route('mahasiswa.krs.index'),
            icon: ClipboardDocumentListIcon,
            accent: 'indigo',
        },
        {
            label: 'KHS & IPK',
            desc: 'Hasil studi per semester',
            href: route('mahasiswa.khs.index'),
            icon: AcademicCapIcon,
            accent: 'emerald',
        },
        {
            label: 'Kehadiran',
            desc: 'Rekap absensi kelas',
            href: route('mahasiswa.absensi.index'),
            icon: CheckBadgeIcon,
            accent: 'amber',
        },
        {
            label: "LMS Let's",
            desc: 'Materi, tugas & forum',
            href: route('mahasiswa.lms.index'),
            icon: BookOpenIcon,
            accent: 'sky',
        },
    ];

    return (
        <AdminLayout title="Dashboard Mahasiswa">
            <Head title="Dashboard Mahasiswa" />

            <div className="space-y-3.5">
                {/* ---------------- Hero berwarna ---------------- */}
                <section className="relative overflow-hidden rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-white p-4 shadow-sm sm:p-5">
                    <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-brand-400 via-brand-500 to-brand-700" />

                    <div className="relative">
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-brand-700">
                            Ringkasan Akademik
                        </p>
                        <h1 className="mt-1.5 text-xl font-extrabold leading-tight text-neutral-900 sm:text-2xl">
                            Halo, {profile?.nama_lengkap || 'Mahasiswa'}
                        </h1>
                        <p className="mt-1 text-[11px] font-semibold leading-relaxed text-neutral-500 sm:text-xs">
                            NIM {profile?.nim || '-'} • {profile?.prodi || '-'} • Angkatan {profile?.angkatan || '-'}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            <StatusPill status={profile?.status} />
                            <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-brand-700 ring-1 ring-brand-200">
                                <CalendarDaysIcon className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">{periodeLabel || 'Belum ada periode aktif'}</span>
                            </span>
                        </div>

                        {periodeAktif && (
                            <p className="mt-2 text-[10px] font-semibold text-neutral-400">
                                {periodeAktif.tanggal_mulai} — {periodeAktif.tanggal_selesai}
                            </p>
                        )}
                    </div>
                </section>

                {/* ---------------- Statistik ---------------- */}
                <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                    <StatCard
                        label="SKS Aktif"
                        value={stats.total_sks_aktif}
                        note={`${stats.mata_kuliah_aktif} mata kuliah berjalan`}
                        icon={ClipboardDocumentListIcon}
                        accent="indigo"
                    />
                    <StatCard
                        label="SKS Lulus"
                        value={stats.total_sks_lulus}
                        note="Akumulasi mata kuliah lulus"
                        icon={AcademicCapIcon}
                        accent="emerald"
                    />
                    <StatCard
                        label="IPK Sementara"
                        value={ipkText}
                        note="Dari nilai akhir tersedia"
                        icon={TrophyIcon}
                        accent="violet"
                        progress={stats.ipk > 0 ? (Number(stats.ipk) / 4) * 100 : 0}
                    />
                    <StatCard
                        label="Kehadiran"
                        value={`${stats.kehadiran}%`}
                        note="Rata-rata periode aktif"
                        icon={CheckBadgeIcon}
                        accent="amber"
                        progress={Number(stats.kehadiran) || 0}
                    />
                </section>

                {/* ---------------- Jadwal hari ini ---------------- */}
                <SectionCard
                    title="Jadwal Hari Ini"
                    action={
                        <Link
                            href={route('mahasiswa.absensi.index')}
                            className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-brand-700 hover:text-brand-800"
                        >
                            Lihat Absensi
                            <ArrowRightIcon className="h-3 w-3" />
                        </Link>
                    }
                >
                    <p className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold text-neutral-400">
                        <ClockIcon className="h-3.5 w-3.5" />
                        {todayLabel}
                    </p>

                    {todaySchedule?.length ? (
                        <div className="space-y-2.5">
                            {todaySchedule.map((item, index) => {
                                const a = ACCENTS[SCHEDULE_ACCENTS[index % SCHEDULE_ACCENTS.length]];

                                return (
                                    <div
                                        key={item.id}
                                        className="flex gap-3 rounded-xl border border-neutral-200 bg-neutral-50/60 p-3"
                                    >
                                        <div className={`w-1 shrink-0 rounded-full ${a.bar}`} />

                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-[13px] font-extrabold text-neutral-900">
                                                {item.mata_kuliah}
                                            </p>
                                            <p className="mt-0.5 truncate text-[11px] font-semibold text-neutral-500">
                                                {item.kode} • {item.sks} SKS • {item.dosen}
                                            </p>

                                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${a.chip}`}>
                                                    <ClockIcon className="h-3 w-3" />
                                                    {item.jam_mulai}–{item.jam_selesai}
                                                </span>
                                                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-neutral-600 ring-1 ring-neutral-200">
                                                    <MapPinIcon className="h-3 w-3" />
                                                    {item.ruangan}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center">
                            <SparklesIcon className="mx-auto h-6 w-6 text-neutral-300" />
                            <p className="mt-2 text-[12px] font-bold text-neutral-500">
                                Tidak ada jadwal kuliah hari ini
                            </p>
                            <p className="mt-0.5 text-[11px] font-semibold text-neutral-400">
                                Manfaatkan waktu untuk membaca materi di LMS.
                            </p>
                        </div>
                    )}
                </SectionCard>

                {/* ---------------- Aksi cepat ---------------- */}
                <section>
                    <h2 className="mb-2.5 flex items-center gap-2 px-0.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-neutral-500">
                        <span className="h-3.5 w-1 shrink-0 rounded-full bg-brand-500" />
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
                                    className="group flex flex-col rounded-2xl border border-neutral-200 bg-white p-3.5 shadow-sm transition hover:border-neutral-300 active:scale-[0.98]"
                                >
                                    <span className={`grid h-10 w-10 place-items-center rounded-xl ${a.chip}`}>
                                        <Icon className="h-5 w-5" />
                                    </span>
                                    <span className="mt-2.5 text-[13px] font-extrabold leading-tight text-neutral-900">
                                        {item.label}
                                    </span>
                                    <span className="mt-0.5 text-[11px] font-semibold leading-snug text-neutral-400">
                                        {item.desc}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </section>

                {/* ---------------- Status KRS ---------------- */}
                <SectionCard
                    title="Status KRS Periode Ini"
                    action={
                        <Link
                            href={route('mahasiswa.krs.index')}
                            className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-brand-700 hover:text-brand-800"
                        >
                            Buka KRS
                            <ArrowRightIcon className="h-3 w-3" />
                        </Link>
                    }
                >
                    <div className="grid grid-cols-4 gap-2">
                        <KrsSummaryChip label="Disetujui" value={krsSummary.disetujui} accent="emerald" />
                        <KrsSummaryChip label="Menunggu" value={krsSummary.menunggu} accent="amber" />
                        <KrsSummaryChip label="Ditolak" value={krsSummary.ditolak} accent="rose" />
                        <KrsSummaryChip label="Batal" value={krsSummary.dibatalkan} accent="sky" />
                    </div>
                </SectionCard>

                {/* ---------------- Nilai terbaru ---------------- */}
                <SectionCard
                    title="Nilai Terbaru"
                    action={
                        <Link
                            href={route('mahasiswa.khs.index')}
                            className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-brand-700 hover:text-brand-800"
                        >
                            Buka KHS
                            <ArrowRightIcon className="h-3 w-3" />
                        </Link>
                    }
                >
                    {recentScores?.length ? (
                        <div className="divide-y divide-neutral-100">
                            {recentScores.map((row) => (
                                <div key={row.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                                    <span
                                        className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border text-[13px] font-extrabold ${GradeBadge(
                                            row.nilai_akhir,
                                        )}`}
                                    >
                                        {row.nilai_huruf}
                                    </span>

                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-[13px] font-bold text-neutral-900">
                                            {row.mata_kuliah}
                                        </p>
                                        <p className="mt-0.5 truncate text-[11px] font-semibold text-neutral-400">
                                            {row.kode} • {row.status} • {row.updated_at}
                                        </p>
                                    </div>

                                    <span className="shrink-0 text-[15px] font-extrabold text-neutral-900">
                                        {row.nilai_akhir}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center">
                            <TrophyIcon className="mx-auto h-6 w-6 text-neutral-300" />
                            <p className="mt-2 text-[12px] font-bold text-neutral-500">
                                Belum ada nilai dipublikasikan
                            </p>
                        </div>
                    )}
                </SectionCard>

                {/* ---------------- Info tambahan ---------------- */}
                <section className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-3.5">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-brand-600">
                            <BookOpenIcon className="h-[18px] w-[18px]" />
                        </span>
                        <div className="min-w-0">
                            <p className="text-lg font-extrabold leading-none text-brand-700">{stats.lms_course_count}</p>
                            <p className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.1em] text-brand-600/80">
                                Kelas LMS
                            </p>
                        </div>
                    </div>

                    <Link
                        href={route('mahasiswa.surat-aktif.index')}
                        className="flex items-center gap-3 rounded-2xl border border-violet-200 bg-violet-50 p-3.5 transition active:scale-[0.98]"
                    >
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-violet-600">
                            <UserGroupIcon className="h-[18px] w-[18px]" />
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-extrabold leading-tight text-violet-800">Surat Aktif</p>
                            <p className="mt-0.5 text-[10px] font-semibold text-violet-600/80">Ajukan & cetak</p>
                        </div>
                        <ChevronRightIcon className="h-4 w-4 shrink-0 text-violet-400" />
                    </Link>
                </section>
            </div>
        </AdminLayout>
    );
}
