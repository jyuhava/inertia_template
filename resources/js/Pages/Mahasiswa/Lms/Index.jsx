import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import {
    AcademicCapIcon,
    ArrowRightIcon,
    BookOpenIcon,
    ChatBubbleLeftRightIcon,
    CheckBadgeIcon,
    ClipboardDocumentListIcon,
    ClockIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

/* ------------------------------------------------------------------ */
/* Design tokens                                                       */
/*                                                                    */
/* Satu warna brand (gold) + warna status semantik. Tidak memakai      */
/* warna acak per kartu supaya makna warna selalu konsisten:           */
/* brand = identitas, emerald = selesai/aktif, amber = perlu          */
/* tindakan, slate = belum mulai.                                      */
/* ------------------------------------------------------------------ */

const TONE = {
    brand: {
        icon: 'bg-brand-50 text-brand-700',
        bar: 'bg-brand-600',
        text: 'text-brand-700',
        chip: 'bg-brand-50 text-brand-700 ring-brand-200',
    },
    done: {
        icon: 'bg-emerald-50 text-emerald-600',
        bar: 'bg-emerald-500',
        text: 'text-emerald-700',
        chip: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    },
    todo: {
        icon: 'bg-brand-50 text-brand-700',
        bar: 'bg-brand-500',
        text: 'text-brand-700',
        chip: 'bg-brand-50 text-brand-700 ring-brand-200',
    },
    warn: {
        icon: 'bg-amber-50 text-amber-600',
        bar: 'bg-amber-500',
        text: 'text-amber-700',
        chip: 'bg-amber-50 text-amber-700 ring-amber-200',
    },
    idle: {
        icon: 'bg-slate-100 text-slate-500',
        bar: 'bg-slate-300',
        text: 'text-slate-600',
        chip: 'bg-slate-100 text-slate-600 ring-slate-200',
    },
};

/* ------------------------------------------------------------------ */
/* Primitives                                                          */
/* ------------------------------------------------------------------ */

function ProgressBar({ value = 0, tone = 'todo' }) {
    const pct = Math.max(0, Math.min(100, value));
    return (
        <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
        >
            <div
                className={`h-full rounded-full transition-all duration-500 ${TONE[tone]?.bar || TONE.todo.bar}`}
                style={{ width: `${pct}%` }}
            />
        </div>
    );
}

function Stat({ icon: Icon, label, value, suffix }) {
    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-slate-400">
                <Icon className="h-3.5 w-3.5" />
                <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
            </div>
            <p className="text-lg font-bold leading-none text-slate-900">
                {value}
                {suffix ? <span className="ml-0.5 text-xs font-semibold text-slate-400">{suffix}</span> : null}
            </p>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Course card                                                         */
/*                                                                    */
/* Tata letak mengikuti marketplace (Coursera/edX): identitas mata     */
/* kuliah di kiri, angka，遇 progress di kanan dalam satu baris       */
/* horizontal yang mudah dipindai mata.                                 */
/* ------------------------------------------------------------------ */

function CourseCard({ course, muted = false }) {
    const progress = course.progress_percent ?? 0;
    const pending = Math.max(0, (course.assignments_count ?? 0) - (course.submitted_assignments ?? 0));
    const clickable = Boolean(course.has_lms && course.can_access);

    const tone = progress >= 100 ? 'done' : progress > 0 ? 'todo' : 'idle';
    const Wrapper = clickable ? Link : 'div';
    const wrapperProps = clickable ? { href: route('mahasiswa.lms.show', course.lms_course_id) } : {};

    const periodLabel = [course.periode?.tahun_ajaran, course.periode?.semester].filter(Boolean).join(' · ');
    const schedule = [course.hari, course.jam_mulai && `${course.jam_mulai}–${course.jam_selesai}`]
        .filter(Boolean)
        .join(' · ');

    const statusLabel = !course.has_lms
        ? 'LMS belum tersedia'
        : !course.can_access
            ? 'Menunggu persetujuan'
            : progress >= 100
                ? 'Selesai'
                : progress > 0
                    ? 'Sedang berjalan'
                    : 'Belum dimulai';

    const metrics = [
        { icon: BookOpenIcon, label: 'Bab', value: course.chapters_count ?? 0 },
        { icon: DocumentIcon, label: 'Materi', value: course.materials_count ?? 0 },
        { icon: ClipboardDocumentListIcon, label: 'Tugas', value: course.assignments_count ?? 0 },
        { icon: ChatBubbleLeftRightIcon, label: 'Forum', value: course.forums_count ?? 0 },
    ];

    return (
        <Wrapper
            {...wrapperProps}
            aria-label={course.mata_kuliah}
            className={`group flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 transition sm:flex-row sm:items-center sm:gap-5 ${
                clickable
                    ? 'cursor-pointer hover:border-brand-300 hover:shadow-md hover:shadow-slate-200/60'
                    : 'opacity-90'
            } ${muted ? 'bg-slate-50/70' : ''}`}
        >
            {/* Identitas */}
            <div className="flex min-w-0 flex-1 items-start gap-3.5">
                <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ring-1 ${TONE[tone].icon} ring-inset ${muted ? 'opacity-70' : ''}`}
                >
                    <BookOpenIcon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wider text-slate-600">
                            {course.kode}
                        </span>
                        {course.sks ? (
                            <span className="text-[10px] font-semibold text-slate-400">{course.sks} SKS</span>
                        ) : null}
                    </div>
                    <h3 className="mt-1 text-sm font-bold leading-snug text-slate-900">{course.mata_kuliah}</h3>
                    <p className="mt-0.5 truncate text-xs text-slate-600">{course.dosen}</p>
                    {schedule ? <p className="mt-1 text-[11px] text-slate-400">{schedule}</p> : null}
                    {periodLabel ? <p className="mt-0.5 text-[11px] text-slate-400">{periodLabel}</p> : null}
                </div>
            </div>

            {/* Angka & progress */}
            <div className="w-full shrink-0 sm:w-64">
                <div className="mb-3 grid grid-cols-4 gap-2">
                    {metrics.map(({ icon: Icon, label, value }) => (
                        <div key={label} className="text-center">
                            <Icon className="mx-auto h-3.5 w-3.5 text-slate-300" />
                            <p className="mt-1 text-sm font-bold leading-none text-slate-800">{value}</p>
                            <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                {label}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    <ProgressBar value={progress} tone={tone} />
                    <span className="w-9 shrink-0 text-right text-xs font-bold tabular-nums text-slate-700">
                        {progress}%
                    </span>
                </div>

                <div className="mt-2.5 flex items-center justify-between gap-2">
                    <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${TONE[tone].chip}`}
                    >
                        {progress >= 100 ? <CheckBadgeIcon className="h-3 w-3" /> : null}
                        {statusLabel}
                    </span>
                    {pending > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700">
                            <ExclamationTriangleIcon className="h-3 w-3" />
                            {pending} tugas menunggu
                        </span>
                    ) : clickable ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-brand-700">
                            Masuk
                            <ArrowRightIcon className="h-3 w-3 transition group-hover:translate-x-0.5" />
                        </span>
                    ) : null}
                </div>
            </div>
        </Wrapper>
    );
}

function DocumentIcon(props) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h9l5 5v11a2 2 0 01-2 2z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5M8 13h8M8 17h5" />
        </svg>
    );
}

/* ------------------------------------------------------------------ */
/* Section wrapper                                                     */
/* ------------------------------------------------------------------ */

function CourseSection({ title, count, icon: Icon, tone, children, emptyText }) {
    return (
        <section>
            <div className="mb-3 flex items-center gap-2 border-b border-slate-200 pb-2">
                <Icon className={`h-4 w-4 ${tone === 'past' ? 'text-slate-400' : 'text-brand-600'}`} />
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-800">{title}</h2>
                <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        tone === 'past' ? 'bg-slate-200 text-slate-600' : 'bg-brand-50 text-brand-700'
                    }`}
                >
                    {count}
                </span>
            </div>
            {count === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-xs text-slate-500">
                    {emptyText}
                </p>
            ) : (
                <div className="space-y-3">{children}</div>
            )}
        </section>
    );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function Index({ courses = [], summary = {}, periodeAktif = null }) {
    const activeNow = courses.filter((course) => course.is_active_period);
    const pastCourses = courses.filter((course) => !course.is_active_period);

    const totalMaterials = summary.materials ?? 0;
    const completedMaterials = summary.completed_materials ?? 0;
    const totalAssignments = summary.assignments ?? 0;
    const submittedAssignments = summary.submitted_assignments ?? 0;
    const overallProgress = totalMaterials > 0 ? Math.round((completedMaterials / totalMaterials) * 100) : 0;
    const pendingAssignments = summary.pending_assignments ?? 0;

    return (
        <AdminLayout title="LMS Mahasiswa">
            <Head title="LMS - Dashboard" />

            <div className="space-y-6">
                {/* Page header */}
                <header className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-600">
                            Learning Management System
                        </p>
                        <h1 className="mt-1 flex items-center gap-2 text-xl font-bold text-slate-900">
                            <AcademicCapIcon className="h-6 w-6 text-slate-400" />
                            Kursus Saya
                        </h1>
                        <p className="mt-1 text-xs text-slate-500">
                            Materi, tugas, dan forum dari mata kuliah yang Anda ambil.
                        </p>
                    </div>
                    {periodeAktif ? (
                        <div className="shrink-0 rounded-lg border border-slate-200 bg-white px-3.5 py-2">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                Periode KRS aktif
                            </p>
                            <p className="mt-0.5 text-xs font-bold text-slate-800">{periodeAktif.nama}</p>
                            <p className="text-[11px] text-slate-500">
                                {periodeAktif.tahun_ajaran} · {periodeAktif.semester}
                            </p>
                        </div>
                    ) : null}
                </header>

                {/* Ringkasan belajar */}
                <section className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-4">
                    <Stat icon={BookOpenIcon} label="Course aktif" value={activeNow.length} />
                    <Stat
                        icon={CheckBadgeIcon}
                        label="Materi selesai"
                        value={completedMaterials}
                        suffix={`/${totalMaterials}`}
                    />
                    <Stat
                        icon={ClipboardDocumentListIcon}
                        label="Tugas terkumpul"
                        value={submittedAssignments}
                        suffix={`/${totalAssignments}`}
                    />
                    <Stat icon={ChatBubbleLeftRightIcon} label="Forum diskusi" value={summary.forums ?? 0} />
                    <div className="col-span-2 flex items-center gap-3 border-t border-slate-100 pt-3 sm:col-span-4 sm:pt-3">
                        <span className="w-32 shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Progres belajar
                        </span>
                        <ProgressBar value={overallProgress} tone={overallProgress >= 100 ? 'done' : 'todo'} />
                        <span className="w-10 shrink-0 text-right text-xs font-bold tabular-nums text-slate-700">
                            {overallProgress}%
                        </span>
                    </div>
                </section>

                {pendingAssignments > 0 ? (
                    <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5">
                        <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                        <p className="text-xs text-amber-900">
                            <span className="font-bold">{pendingAssignments} tugas belum dikumpulkan.</span>{' '}
                            Buka course terkait untuk mengirim sebelum batas waktu.
                        </p>
                    </div>
                ) : null}

                {/* Mata kuliah aktif */}
                <CourseSection
                    title="Mata Kuliah Aktif Saat Ini"
                    count={activeNow.length}
                    icon={BookOpenIcon}
                    tone="active"
                    emptyText="Tidak ada mata kuliah pada periode KRS aktif."
                >
                    {activeNow.map((course) => (
                        <CourseCard key={course.lms_course_id ?? `krs-${course.krs_id}`} course={course} />
                    ))}
                </CourseSection>

                {/* Mata kuliah lampau */}
                {pastCourses.length > 0 ? (
                    <CourseSection
                        title="Mata Kuliah Lampau"
                        count={pastCourses.length}
                        icon={ClockIcon}
                        tone="past"
                    >
                        {pastCourses.map((course) => (
                            <CourseCard
                                key={course.lms_course_id ?? `krs-${course.krs_id}`}
                                course={course}
                                muted
                            />
                        ))}
                    </CourseSection>
                ) : null}
            </div>
        </AdminLayout>
    );
}
