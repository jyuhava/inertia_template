import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    AcademicCapIcon,
    BookOpenIcon,
    ChartBarIcon,
    CheckCircleIcon,
    ClipboardDocumentCheckIcon,
    ClockIcon,
    CalendarDaysIcon,
    DocumentCheckIcon,
    UserGroupIcon,
    UsersIcon,
    UserCircleIcon,
    XCircleIcon,
} from '@heroicons/react/24/outline';

const ACCENT = {
    indigo: 'text-indigo-600',
    emerald: 'text-emerald-600',
    sky: 'text-sky-600',
    amber: 'text-amber-600',
    rose: 'text-rose-600',
    violet: 'text-violet-600',
    slate: 'text-slate-500',
};

const BAR_STYLES = {
    indigo: 'bg-indigo-500',
    emerald: 'bg-emerald-500',
    sky: 'bg-sky-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    violet: 'bg-violet-500',
    slate: 'bg-slate-300',
};

function Box({ children, className = '' }) {
    return (
        <div className={`rounded-lg border border-slate-200 bg-white p-3.5 sm:p-4 ${className}`}>
            {children}
        </div>
    );
}

function SectionTitle({ children, action, icon, color = 'text-slate-700' }) {
    return (
        <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
                {icon ? <span className={`h-3.5 w-3.5 ${ACCENT[color] || color}`}>{icon}</span> : null}
                <h2 className={`text-xs font-semibold text-slate-700 ${color}`}>{children}</h2>
            </div>
            {action ? <div className="text-[11px] text-slate-400">{action}</div> : null}
        </div>
    );
}

/* Kartu statistik compact */
function Stat({ title, value, note, icon, color }) {
    return (
        <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white p-2.5 sm:p-3">
            <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-md border bg-slate-50 ${ACCENT[color] || 'text-slate-500'}`}>
                {icon}
            </span>
            <div className="min-w-0">
                <p className="truncate text-[10px] font-medium uppercase tracking-wide text-slate-400">{title}</p>
                <p className="truncate text-base font-bold leading-tight text-slate-800">
                    {value}
                    {note ? <span className="ml-1 text-[10px] font-normal text-slate-400">{note}</span> : null}
                </p>
            </div>
        </div>
    );
}

/* Single accent bar untuk progress */
function Progress({ percent, color = 'indigo', height = 'h-1.5', label, right }) {
    return (
        <div>
            {label ? (
                <div className="mb-1 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{label}</span>
                    <span className="font-semibold text-slate-700">{right}</span>
                </div>
            ) : null}
            <div className={`w-full overflow-hidden rounded-full bg-slate-100 ${height}`}>
                <div
                    className={`h-full rounded-full transition-all duration-700 ${BAR_STYLES[color]}`}
                    style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
                />
            </div>
        </div>
    );
}

/* Mini bar chart (horizontal, per item) */
function MiniBars({ data, max, color = 'bg-indigo-500' }) {
    return (
        <div className="space-y-2.5">
            {data.map((d, i) => (
                <div key={i} className="flex items-center gap-3 text-[12px]">
                    <span className="w-24 truncate text-slate-600">{d.label}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, (d.value / (max || 1)) * 100)}%` }} />
                    </div>
                    <span className="w-8 text-right font-semibold text-slate-800">{d.value}</span>
                </div>
            ))}
        </div>
    );
}

/* Donut kompak */
function Donut({ data, size = 96, thickness = 10 }) {
    const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
    const radius = (size - thickness) / 2;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;

    if (total === 0) {
        return (
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={thickness} />
            </svg>
        );
    }

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={thickness} />
            {data.map((d, i) => {
                const fraction = d.value / total;
                const dash = fraction * circumference;
                const el = (
                    <circle
                        key={i}
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke={d.color}
                        strokeWidth={thickness}
                        strokeDasharray={`${dash} ${circumference - dash}`}
                        strokeDashoffset={-offset}
                        transform={`rotate(-90 ${size / 2} ${size / 2})`}
                    />
                );
                offset += dash;
                return el;
            })}
        </svg>
    );
}

function Badge({ status }) {
    const map = {
        disetujui: 'bg-emerald-50 text-emerald-700',
        menunggu_persetujuan: 'bg-amber-50 text-amber-700',
        ditolak: 'bg-rose-50 text-rose-700',
        diambil: 'bg-sky-50 text-sky-700',
        dibatalkan: 'bg-slate-100 text-slate-500',
    };
    const labelMap = {
        disetujui: 'Disetujui',
        menunggu_persetujuan: 'Menunggu',
        ditolak: 'Ditolak',
        diambil: 'Diambil',
        dibatalkan: 'Dibatalkan',
    };
    return (
        <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold ${map[status] || 'bg-slate-100 text-slate-500'}`}>
            {labelMap[status] || status}
        </span>
    );
}

function gradeColor(grade) {
    const map = {
        A: '#10b981',
        'A-': '#34d399',
        'B+': '#0ea5e9',
        B: '#38bdf8',
        'B-': '#7dd3fc',
        'C+': '#f59e0b',
        C: '#fbbf24',
        'C-': '#fcd34d',
        D: '#f43f5e',
        E: '#ef4444',
    };
    return map[grade] || '#94a3b8';
}

function Empty({ message }) {
    return (
        <div className="py-8 text-center text-[12px] text-slate-400">{message}</div>
    );
}

function Quick({ href, title, subtitle }) {
    return (
        <Link
            href={href}
            className="group flex items-center justify-between rounded-md border border-slate-200 px-3 py-2.5 transition-colors hover:border-slate-400"
        >
            <div>
                <p className="text-[12px] font-semibold text-slate-700">{title}</p>
                <p className="text-[11px] text-slate-400">{subtitle}</p>
            </div>
            <span className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500">→</span>
        </Link>
    );
}

function Row({ icon, iconBg, children }) {
    return (
        <div className="flex items-center gap-3 border-b border-slate-100 py-2.5 last:border-0">
            <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-md ${iconBg}`}>{icon}</span>
            <div className="min-w-0 flex-1">{children}</div>
        </div>
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
        penilaianStatistics,
        kehadiranStatistics,
        dosenStatistics,
        krsDetail,
        mahasiswaByGender,
    } = usePage().props;

    const pSt = penilaianStatistics || {};
    const aSt = kehadiranStatistics || {};
    const dSt = dosenStatistics || {};
    const krsDet = krsDetail || {};

    const totalKrs = krsStatistics?.total || 0;
    const krsApprovedPct = totalKrs > 0 ? Math.round((krsStatistics.disetujui / totalKrs) * 100) : 0;

    const krsDonut = krsStatistics
        ? [
              { label: 'Disetujui', value: krsStatistics.disetujui, color: '#10b981' },
              { label: 'Menunggu', value: krsStatistics.menunggu, color: '#f59e0b' },
              { label: 'Ditolak', value: krsStatistics.ditolak, color: '#f43f5e' },
          ]
        : [];

    const absensiDonut = [
        { label: 'Hadir', value: aSt.hadir || 0, color: '#10b981' },
        { label: 'Izin', value: aSt.izin || 0, color: '#f59e0b' },
        { label: 'Sakit', value: aSt.sakit || 0, color: '#0ea5e9' },
        { label: 'Tidak Hadir', value: aSt.tidak_hadir || 0, color: '#f43f5e' },
    ];

    const gradeData = (pSt.gradeDistribution || []).slice(0, 7).map((g) => ({ label: g.label, value: g.value }));
    const mkData = (pSt.perMataKuliah || []).map((d) => ({ label: d.label, value: d.value }));
    const jabatanData = (dSt.byJabatan || []).map((d) => ({ label: d.label, value: d.value }));
    const prodiTop = (mahasiswaByProdi || []).slice(0, 5);
    const angkatanData = (mahasiswaByAngkatan || []).slice(0, 6);
    const genderData = (mahasiswaByGender || []).map((g, i) => ({
        label: g.label,
        value: g.value,
        color: i === 0 ? '#6366f1' : '#ec4899',
    }));

    const maxAngkatan = Math.max(...angkatanData.map((d) => d.jumlah), 1);

    return (
        <AdminLayout title="Dashboard">
            <Head title="Dashboard Admin" />

            <div className="space-y-3.5">
                {/* Header ringkas */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-indigo-700 to-indigo-600 px-4 py-3.5 text-white shadow-lg shadow-indigo-500/20">
                    <div className="pointer-events-none absolute -right-12 -top-14 h-40 w-40 rounded-full bg-white/10" />
                    <div className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-white/10" />

                    <div className="relative flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0">
                            <h1 className="text-base font-bold leading-tight sm:text-lg">Dashboard Admin</h1>
                            <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-white/80">
                                {periodeAktif ? (
                                    <>
                                        <CalendarDaysIcon className="h-3.5 w-3.5" />
                                        {periodeAktif.nama} — {periodeAktif.tanggal_mulai} s/d {periodeAktif.tanggal_selesai}
                                    </>
                                ) : (
                                    'Belum ada periode KRS aktif'
                                )}
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[11px]">
                            <span className="rounded-full bg-white/15 px-2.5 py-1 font-semibold backdrop-blur">
                                Users {statistics.users}
                            </span>
                            <span className="rounded-full bg-white/15 px-2.5 py-1 font-semibold backdrop-blur">
                                Mahasiswa {statistics.mahasiswa.total}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Statistik inti */}
                <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-6">
                    <Stat title="Mahasiswa" value={statistics.mahasiswa.aktif} note={`/ ${statistics.mahasiswa.total}`} icon={<AcademicCapIcon className="h-4.5 w-4.5" />} color="indigo" />
                    <Stat title="Dosen" value={dSt.total || statistics.dosen} note={`${dSt.aktif || 0} aktif`} icon={<UserGroupIcon className="h-4.5 w-4.5" />} color="emerald" />
                    <Stat title="Program Studi" value={statistics.prodi} icon={<BookOpenIcon className="h-4.5 w-4.5" />} color="sky" />
                    <Stat title="Mata Kuliah" value={statistics.mataKuliah} icon={<ChartBarIcon className="h-4.5 w-4.5" />} color="violet" />
                    <Stat title="Penilaian" value={pSt.total || 0} note={`${pSt.final || 0} final`} icon={<DocumentCheckIcon className="h-4.5 w-4.5" />} color="amber" />
                    <Stat title="Calon Mahasiswa" value={pmbStatistics.total_calon} note={`${pmbStatistics.accepted} diterima`} icon={<UserCircleIcon className="h-4.5 w-4.5" />} color="rose" />
                </div>

                {/* Baris 1: KRS + Penilaian */}
                <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
                    {/* KRS */}
                    <Box>
                        <SectionTitle icon={<ClipboardDocumentCheckIcon className="h-full w-full" />} color="text-slate-700">
                            KRS Periode Aktif
                        </SectionTitle>
                        {krsStatistics ? (
                            <div className="flex items-center gap-4">
                                <div className="shrink-0">
                                    <Donut data={krsDonut} size={92} thickness={11} />
                                    <p className="mt-1 text-center text-[10px] font-medium text-slate-500">{totalKrs} total</p>
                                </div>
                                <div className="flex-1 space-y-3">
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div className="rounded-md bg-slate-50 py-2">
                                            <p className="text-lg font-bold text-slate-800">{krsStatistics.disetujui}</p>
                                            <p className="text-[10px] uppercase tracking-wide text-slate-400">Disetujui</p>
                                        </div>
                                        <div className="rounded-md bg-slate-50 py-2">
                                            <p className="text-lg font-bold text-slate-800">{krsStatistics.menunggu}</p>
                                            <p className="text-[10px] uppercase tracking-wide text-slate-400">Menunggu</p>
                                        </div>
                                        <div className="rounded-md bg-slate-50 py-2">
                                            <p className="text-lg font-bold text-slate-800">{krsStatistics.ditolak}</p>
                                            <p className="text-[10px] uppercase tracking-wide text-slate-400">Ditolak</p>
                                        </div>
                                    </div>
                                    <Progress
                                        label="Tingkat persetujuan"
                                        right={`${krsApprovedPct}%`}
                                        percent={krsApprovedPct}
                                        color="emerald"
                                    />
                                    <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-[12px] text-slate-500">
                                        <span>Disetujui bulan ini</span>
                                        <span className="font-semibold text-slate-700">{krsDet.total_disetujui || 0} KRS</span>
                                        <span>Total SKS</span>
                                        <span className="font-semibold text-slate-700">{krsDet.total_sks || 0}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <Empty message="Tidak ada periode KRS aktif." />
                        )}
                    </Box>

                    {/* Penilaian */}
                    <Box>
                        <SectionTitle
                            icon={<DocumentCheckIcon className="h-full w-full" />}
                            action={
                                pSt.rata_nilai !== null && pSt.rata_nilai !== undefined ? (
                                    <span className="font-semibold text-slate-600">Rata-rata: {pSt.rata_nilai}</span>
                                ) : null
                            }
                        >
                            Penilaian
                        </SectionTitle>
                        <div className="flex items-center gap-5">
                            <div className="w-24 shrink-0 space-y-3">
                                <div className="text-center">
                                    <p className="text-xl font-bold text-slate-800">{pSt.final || 0}</p>
                                    <p className="text-[10px] uppercase tracking-wide text-slate-400">Final</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xl font-bold text-slate-800">{pSt.draft || 0}</p>
                                    <p className="text-[10px] uppercase tracking-wide text-slate-400">Draft</p>
                                </div>
                            </div>
                            <div className="flex-1 border-l border-slate-100 pl-5">
                                {gradeData.length ? (
                                    <div className="space-y-2">
                                        {gradeData.map((g, i) => (
                                            <div key={i} className="flex items-center gap-2">
                                                <span className="w-7 text-[12px] font-semibold text-slate-600">{g.label}</span>
                                                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                                                    <div
                                                        className="h-full rounded-full"
                                                        style={{ width: `${Math.min(100, (g.value / Math.max(...gradeData.map((x) => x.value), 1)) * 100)}%`, backgroundColor: gradeColor(g.label) }}
                                                    />
                                                </div>
                                                <span className="w-7 text-right text-[12px] text-slate-400">{g.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <Empty message="Belum ada data nilai." />
                                )}
                            </div>
                        </div>
                    </Box>
                </div>

                {/* Baris 2: Kehadiran + Dosen + PMB */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    {/* Kehadiran */}
                    <Box>
                        <SectionTitle
                            icon={<CalendarDaysIcon className="h-full w-full" />}
                            action={<span className="font-semibold text-emerald-600">{aSt.tingkat || 0}% hadir</span>}
                        >
                            Kehadiran
                        </SectionTitle>
                        {aSt.total > 0 ? (
                            <div className="flex items-center gap-4">
                                <Donut data={absensiDonut} size={92} thickness={11} />
                                <div className="flex-1 space-y-1.5">
                                    {absensiDonut.map((d, i) => (
                                        <div key={i} className="flex items-center gap-2 text-[12px]">
                                            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: d.color }} />
                                            <span className="flex-1 text-slate-600">{d.label}</span>
                                            <span className="font-semibold text-slate-800">{d.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <Empty message="Belum ada data kehadiran." />
                        )}
                    </Box>

                    {/* Dosen */}
                    <Box>
                        <SectionTitle icon={<UserGroupIcon className="h-full w-full" />}>Dosen</SectionTitle>
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="rounded-md bg-slate-50 py-2">
                                <p className="text-lg font-bold text-emerald-600">{dSt.aktif || 0}</p>
                                <p className="text-[10px] uppercase tracking-wide text-slate-400">Aktif</p>
                            </div>
                            <div className="rounded-md bg-slate-50 py-2">
                                <p className="text-lg font-bold text-rose-500">{dSt.nonaktif || 0}</p>
                                <p className="text-[10px] uppercase tracking-wide text-slate-400">Nonaktif</p>
                            </div>
                            <div className="rounded-md bg-slate-50 py-2">
                                <p className="text-lg font-bold text-slate-500">{dSt.pensiun || 0}</p>
                                <p className="text-[10px] uppercase tracking-wide text-slate-400">Pensiun</p>
                            </div>
                        </div>
                        {jabatanData.length ? (
                            <div className="mt-4 border-t border-slate-100 pt-3.5">
                                <p className="mb-2.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">Jabatan Akademik</p>
                                <MiniBars data={jabatanData} max={Math.max(...jabatanData.map((d) => d.value))} color="bg-emerald-500" />
                            </div>
                        ) : null}
                    </Box>

                    {/* PMB */}
                    <Box>
                        <SectionTitle icon={<UserCircleIcon className="h-full w-full" />}>PMB</SectionTitle>
                        {pmbStatistics.periode_aktif ? (
                            <div className="space-y-3">
                                <div>
                                    <p className="text-[13px] font-semibold text-slate-700">{pmbStatistics.periode_aktif.nama}</p>
                                    <p className="text-[11px] text-slate-400">
                                        {pmbStatistics.periode_aktif.tanggal_buka} - {pmbStatistics.periode_aktif.tanggal_tutup}
                                    </p>
                                </div>
                                <Progress
                                    label="Pendaftar vs kuota"
                                    right={`${pmbStatistics.periode_aktif.pendaftar}/${pmbStatistics.periode_aktif.kuota_total}`}
                                    percent={Math.round(((pmbStatistics.periode_aktif.pendaftar || 0) / (pmbStatistics.periode_aktif.kuota_total || 1)) * 100)}
                                    color="violet"
                                />
                                <div className="grid grid-cols-2 gap-2 text-center">
                                    <div className="rounded-md bg-slate-50 py-2">
                                        <p className="text-lg font-bold text-slate-800">{pmbStatistics.draft}</p>
                                        <p className="text-[10px] uppercase tracking-wide text-slate-400">Draft</p>
                                    </div>
                                    <div className="rounded-md bg-slate-50 py-2">
                                        <p className="text-lg font-bold text-emerald-600">{pmbStatistics.accepted}</p>
                                        <p className="text-[10px] uppercase tracking-wide text-slate-400">Diterima</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <Empty message="Tidak ada periode PMB aktif." />
                        )}
                    </Box>
                </div>

                {/* Baris 3: Mahasiswa (angkatan, prodi, gender) */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    {/* Angkatan */}
                    <Box>
                        <SectionTitle icon={<ChartBarIcon className="h-full w-full" />}>Mahasiswa per Angkatan</SectionTitle>
                        {angkatanData.length ? (
                            <div className="space-y-2.5">
                                {angkatanData.map((d, i) => (
                                    <div key={i} className="flex items-center gap-3 text-[12px]">
                                        <span className="w-14 text-slate-600">Angkatan {d.angkatan}</span>
                                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                                            <div
                                                className="h-full rounded-full bg-indigo-500"
                                                style={{ width: `${(d.jumlah / maxAngkatan) * 100}%` }}
                                            />
                                        </div>
                                        <span className="w-6 text-right font-semibold text-slate-800">{d.jumlah}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <Empty message="Belum ada data angkatan." />
                        )}
                    </Box>

                    {/* Prodi */}
                    <Box>
                        <SectionTitle icon={<AcademicCapIcon className="h-full w-full" />}>Mahasiswa per Prodi</SectionTitle>
                        {prodiTop.length ? (
                            <div className="space-y-2.5">
                                {prodiTop.map((d, i) => (
                                    <div key={i} className="flex items-center gap-3 text-[12px]">
                                        <span className="w-24 truncate text-slate-600">{d.nama}</span>
                                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                                            <div
                                                className="rounded-full bg-sky-500"
                                                style={{ width: `${(d.jumlah / Math.max(prodiTop[0].jumlah, 1)) * 100}%` }}
                                            />
                                        </div>
                                        <span className="w-8 text-right font-semibold text-slate-800">{d.jumlah}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <Empty message="Belum ada data prodi." />
                        )}
                    </Box>

                    {/* Gender + User */}
                    <Box>
                        <SectionTitle icon={<UsersIcon className="h-full w-full" />}>Distribusi</SectionTitle>
                        <div className="grid grid-cols-2 gap-2 text-center">
                            {[
                                { label: 'Admin', value: userByRole.admin },
                                { label: 'Dosen', value: userByRole.dosen },
                                { label: 'Mahasiswa', value: userByRole.mahasiswa },
                                { label: 'Calon Mhs', value: userByRole.calon_mahasiswa },
                            ].map((u, i) => (
                                <div key={i} className="rounded-md bg-slate-50 py-2">
                                    <p className="text-lg font-bold text-slate-800">{u.value}</p>
                                    <p className="text-[10px] uppercase tracking-wide text-slate-400">{u.label}</p>
                                </div>
                            ))}
                        </div>
                        {genderData.length ? (
                            <div className="mt-3.5 flex items-center gap-3 border-t border-slate-100 pt-3.5">
                                <Donut data={genderData} size={56} thickness={8} />
                                <div className="flex-1 space-y-1">
                                    {genderData.map((g, i) => (
                                        <div key={i} className="flex items-center gap-2 text-[12px]">
                                            <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: g.color }} />
                                            <span className="flex-1 text-slate-600">{g.label}</span>
                                            <span className="font-semibold text-slate-800">{g.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </Box>
                </div>

                {/* Baris 4: Jadwal, KRS terbaru, Aksi */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    {/* Jadwal hari ini */}
                    <Box>
                        <SectionTitle
                            icon={<ClockIcon className="h-full w-full" />}
                            action={<span className="font-semibold text-slate-600">{jadwalHariIni?.length || 0} kelas</span>}
                        >
                            Jadwal Hari Ini
                        </SectionTitle>
                        {jadwalHariIni?.length ? (
                            <div className="divide-y divide-slate-100">
                                {jadwalHariIni.map((item, idx) => (
                                    <Row key={idx} icon={<ClockIcon className="h-4 w-4" />} iconBg="bg-sky-50 text-sky-600">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="truncate text-[12px] font-semibold text-slate-700">{item.mata_kuliah}</p>
                                                <p className="truncate text-[11px] text-slate-400">{item.dosen}</p>
                                            </div>
                                            <div className="shrink-0 text-right text-[11px] text-slate-500">
                                                {item.waktu}
                                                <br />
                                                <span className="text-slate-400">Ruang {item.ruangan}</span>
                                            </div>
                                        </div>
                                    </Row>
                                ))}
                            </div>
                        ) : (
                            <Empty message="Tidak ada jadwal hari ini." />
                        )}
                    </Box>

                    {/* KRS terbaru */}
                    <Box>
                        <SectionTitle icon={<CheckCircleIcon className="h-full w-full" />}>Aktivitas KRS Terbaru</SectionTitle>
                        {recentKrs?.length ? (
                            <div className="divide-y divide-slate-100">
                                {recentKrs.slice(0, 5).map((item) => (
                                    <Row key={item.id} icon={item.status === 'disetujui' ? <CheckCircleIcon className="h-4 w-4" /> : <XCircleIcon className="h-4 w-4" />} iconBg={item.status === 'disetujui' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}>
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="truncate text-[12px] font-semibold text-slate-700">{item.mahasiswa}</p>
                                                <p className="truncate text-[11px] text-slate-400">{item.mata_kuliah}</p>
                                            </div>
                                            <div className="flex shrink-0 items-center gap-2">
                                                <Badge status={item.status} />
                                                <span className="hidden text-[10px] text-slate-400 sm:block">{item.tanggal}</span>
                                            </div>
                                        </div>
                                    </Row>
                                ))}
                            </div>
                        ) : (
                            <Empty message="Belum ada aktivitas KRS." />
                        )}
                    </Box>

                    {/* Aksi cepat */}
                    <Box>
                        <SectionTitle icon={<BookOpenIcon className="h-full w-full" />}>Aksi Cepat</SectionTitle>
                        <div className="space-y-2">
                            <Quick href="/admin/mahasiswa" title="Data Mahasiswa" subtitle="Kelola akun mahasiswa" />
                            <Quick href="/admin/dosen" title="Data Dosen" subtitle="Kelola dosen" />
                            <Quick href="/admin/krs" title="Persetujuan KRS" subtitle="Approve pengajuan" />
                            <Quick href="/admin/calon-mahasiswa" title="PMB" subtitle="Verifikasi calon mahasiswa" />
                            <Quick href="/admin/lms-courses" title="LMS Courses" subtitle="Kelas LMS aktif" />
                            <Quick href="/admin/jadwal-kuliah" title="Jadwal Kuliah" subtitle="Kelola jadwal" />
                        </div>
                    </Box>
                </div>
            </div>
        </AdminLayout>
    );
}