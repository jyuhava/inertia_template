import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import {
    AcademicCapIcon,
    ArrowRightIcon,
    BookOpenIcon,
    ChatBubbleLeftRightIcon,
    CheckBadgeIcon,
    ClipboardDocumentListIcon,
    ExclamationTriangleIcon,
    Squares2X2Icon,
} from '@heroicons/react/24/outline';

/* ------------------------------------------------------------------ */
/* Design tokens                                                       */
/* ------------------------------------------------------------------ */

const ACCENTS = {
    indigo: {
        grad: 'from-brand-800 via-brand-700 to-brand-600',
        chip: 'bg-brand-50 text-brand-700',
        icon: 'bg-brand-50 text-brand-600',
        bar: 'bg-brand-600',
        hover: 'hover:ring-brand-300',
    },
    emerald: {
        grad: 'from-brand-700 via-brand-600 to-brand-500',
        chip: 'bg-brand-50 text-brand-700',
        icon: 'bg-brand-50 text-brand-600',
        bar: 'bg-brand-500',
        hover: 'hover:ring-brand-300',
    },
    violet: {
        grad: 'from-brand-900 via-brand-800 to-brand-700',
        chip: 'bg-brand-100 text-brand-800',
        icon: 'bg-brand-100 text-brand-700',
        bar: 'bg-brand-700',
        hover: 'hover:ring-brand-300',
    },
    amber: {
        grad: 'from-brand-600 via-brand-500 to-brand-400',
        chip: 'bg-brand-50 text-brand-700',
        icon: 'bg-brand-50 text-brand-600',
        bar: 'bg-brand-500',
        hover: 'hover:ring-brand-300',
    },
    sky: {
        grad: 'from-brand-800 via-brand-600 to-brand-500',
        chip: 'bg-brand-100 text-brand-800',
        icon: 'bg-brand-100 text-brand-700',
        bar: 'bg-brand-600',
        hover: 'hover:ring-brand-300',
    },
    rose: {
        grad: 'from-brand-900 via-brand-700 to-brand-500',
        chip: 'bg-brand-50 text-brand-700',
        icon: 'bg-brand-50 text-brand-600',
        bar: 'bg-brand-700',
        hover: 'hover:ring-brand-300',
    },
};

const ACCENT_ORDER = ['indigo', 'emerald', 'violet', 'amber', 'sky', 'rose'];

/* ------------------------------------------------------------------ */
/* Primitives                                                          */
/* ------------------------------------------------------------------ */

function ProgressBar({ value = 0, accent = 'indigo', className = '' }) {
    const pct = Math.max(0, Math.min(100, value));
    return (
        <div className={`h-1 w-full overflow-hidden rounded-full bg-neutral-200 ${className}`}>
            <div
                className={`h-full rounded-full transition-all duration-500 ${ACCENTS[accent]?.bar || 'bg-neutral-900'}`}
                style={{ width: `${pct}%` }}
            />
        </div>
    );
}

function StatCell({ icon: Icon, label, value, suffix, accent = 'indigo', progress }) {
    const a = ACCENTS[accent];
    return (
        <div className="flex items-center gap-2.5 bg-white p-3">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${a.icon}`}>
                <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
                <p className="flex items-baseline gap-1 leading-none">
                    <span className="text-lg font-bold text-neutral-900">{value}</span>
                    {suffix ? <span className="text-[11px] font-semibold text-neutral-400">{suffix}</span> : null}
                </p>
                <p className="mt-1 truncate text-[10px] font-bold uppercase tracking-wider text-neutral-500">{label}</p>
                {typeof progress === 'number' ? <ProgressBar value={progress} accent={accent} className="mt-1.5" /> : null}
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Course card                                                         */
/* ------------------------------------------------------------------ */

function CourseCard({ course, index }) {
    const accent = ACCENT_ORDER[index % ACCENT_ORDER.length];
    const a = ACCENTS[accent];
    const progress = course.progress_percent ?? 0;
    const pending = Math.max(0, (course.assignments_count ?? 0) - (course.submitted_assignments ?? 0));

    const schedule = [course.hari, course.jam_mulai].filter(Boolean).join(', ');

    return (
        <Link
            href={route('mahasiswa.lms.show', course.id)}
            className={`group flex flex-col overflow-hidden rounded-xl bg-white ring-1 ring-neutral-200 transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${a.hover}`}
        >
            {/* Cover */}
            <div className={`relative h-14 shrink-0 overflow-hidden bg-gradient-to-br ${a.grad}`}>
                {course.thumbnail ? (
                    <>
                        <img
                            src={course.thumbnail}
                            alt={course.mata_kuliah}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/55 to-transparent" />
                    </>
                ) : (
                    <>
                        <div className="absolute -right-4 -top-6 h-16 w-16 rounded-full bg-white/10" />
                        <div className="absolute -bottom-8 left-10 h-14 w-14 rounded-full bg-white/10" />
                    </>
                )}

                <div className="absolute inset-x-2.5 top-2.5 flex items-start justify-between gap-2">
                    <span className="rounded-md bg-white/95 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-neutral-900 shadow-sm">
                        {course.kode}
                    </span>
                    {course.sks ? (
                        <span className="rounded-md bg-brand-900/50 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur">
                            {course.sks} SKS
                        </span>
                    ) : null}
                </div>
            </div>

            {/* Body */}
            <div className="flex flex-1 flex-col p-3">
                <h3 className="line-clamp-1 text-[13px] font-bold leading-snug text-neutral-900" title={course.mata_kuliah}>
                    {course.mata_kuliah}
                </h3>
                <p className="mt-0.5 truncate text-[11px] text-neutral-500">{course.dosen}</p>

                {/* Meta line */}
                <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] font-medium text-neutral-500">
                    {schedule ? <span className="truncate">{schedule}</span> : null}
                    {course.chapters_count ? (
                        <span className="inline-flex items-center gap-1">
                            <Squares2X2Icon className="h-3 w-3 text-neutral-400" />
                            {course.chapters_count} bab
                        </span>
                    ) : null}
                    <span className="inline-flex items-center gap-1">
                        <BookOpenIcon className="h-3 w-3 text-neutral-400" />
                        {course.materials_count ?? 0} materi
                    </span>
                </div>

                {/* Progress */}
                <div className="mt-2 flex items-center gap-2">
                    <ProgressBar value={progress} accent={accent} className="flex-1" />
                    <span className="w-8 shrink-0 text-right text-[10px] font-bold text-neutral-700">{progress}%</span>
                </div>

                {/* Footer */}
                <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-neutral-100 pt-2">
                    {pending > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                            <ExclamationTriangleIcon className="h-3 w-3" />
                            {pending} tugas
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-neutral-500">
                            <ClipboardDocumentListIcon className="h-3 w-3 text-neutral-400" />
                            {course.submitted_assignments ?? 0}/{course.assignments_count ?? 0} tugas
                        </span>
                    )}

                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-brand-700">
                        Masuk
                        <ArrowRightIcon className="h-3 w-3 transition group-hover:translate-x-0.5" />
                    </span>
                </div>
            </div>
        </Link>
    );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function Index({ courses = [], summary = {} }) {
    const totalCourses = courses.length;
    const totalMaterials = summary.materials ?? 0;
    const completedMaterials = summary.completed_materials ?? 0;
    const overallProgress = totalMaterials > 0 ? Math.round((completedMaterials / totalMaterials) * 100) : 0;
    const totalAssignments = summary.assignments ?? 0;
    const submittedAssignments = summary.submitted_assignments ?? 0;
    const pendingAssignments = summary.pending_assignments ?? 0;

    return (
        <AdminLayout title="LMS Mahasiswa">
            <Head title="LMS - Dashboard" />

            <div className="space-y-3">
                {/* Hero */}
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 px-4 py-3.5 shadow-md shadow-brand-900/25">
                    <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/10" />
                    <div className="pointer-events-none absolute -bottom-12 -left-6 h-28 w-28 rounded-full bg-white/10" />

                    <div className="relative flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-0">
                            <h1 className="flex items-center gap-2 text-base font-bold text-white md:text-lg">
                                <AcademicCapIcon className="h-5 w-5 shrink-0 text-white/80" />
                                Kelas LMS Saya
                            </h1>
                            <p className="mt-0.5 text-[11px] text-white/80">
                                Materi, tugas, dan forum diskusi mata kuliah semester aktif.
                            </p>
                        </div>

                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1 text-[11px] font-bold text-white ring-1 ring-white/20">
                            <BookOpenIcon className="h-3.5 w-3.5" />
                            {totalCourses} Kelas
                        </span>
                    </div>
                </div>

                {/* Compact stat strip */}
                <section className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-neutral-200 shadow-sm ring-1 ring-neutral-200 sm:grid-cols-4">
                    <StatCell icon={BookOpenIcon} label="Kelas Aktif" value={totalCourses} accent="indigo" />
                    <StatCell
                        icon={CheckBadgeIcon}
                        label="Materi Selesai"
                        value={completedMaterials}
                        suffix={`/${totalMaterials}`}
                        accent="emerald"
                        progress={overallProgress}
                    />
                    <StatCell
                        icon={ClipboardDocumentListIcon}
                        label="Tugas Terkumpul"
                        value={submittedAssignments}
                        suffix={`/${totalAssignments}`}
                        accent="violet"
                        progress={totalAssignments > 0 ? Math.round((submittedAssignments / totalAssignments) * 100) : 0}
                    />
                    <StatCell icon={ChatBubbleLeftRightIcon} label="Forum Diskusi" value={summary.forums ?? 0} accent="amber" />
                </section>

                {/* Pending alert */}
                {pendingAssignments > 0 ? (
                    <div className="flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                        <ExclamationTriangleIcon className="h-4 w-4 shrink-0 text-amber-600" />
                        <p className="min-w-0 text-[11px] text-amber-800">
                            <span className="font-bold text-amber-900">{pendingAssignments} tugas belum dikumpulkan.</span>{' '}
                            <span className="hidden sm:inline">Buka kelas di bawah untuk mengumpulkannya.</span>
                        </p>
                    </div>
                ) : null}

                {/* Course list */}
                {courses.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center">
                        <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-400">
                            <BookOpenIcon className="h-5 w-5" />
                        </span>
                        <p className="mt-3 text-sm font-bold text-neutral-900">Belum ada kelas LMS</p>
                        <p className="mx-auto mt-1 max-w-sm text-[11px] text-neutral-500">
                            Kelas muncul di sini setelah dosen mengaktifkan LMS untuk mata kuliah yang Anda ambil.
                        </p>
                    </div>
                ) : (
                    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                        {courses.map((course, index) => (
                            <CourseCard key={course.id} course={course} index={index} />
                        ))}
                    </section>
                )}
            </div>
        </AdminLayout>
    );
}
