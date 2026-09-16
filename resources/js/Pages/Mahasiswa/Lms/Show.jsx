import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import InputError from '@/Components/InputError';
import Modal from '@/Components/Modal';
import RichTextEditor from '@/Components/RichTextEditor';
import {
    AcademicCapIcon,
    ArrowDownTrayIcon,
    ArrowLeftIcon,
    BookOpenIcon,
    CalendarDaysIcon,
    ChatBubbleLeftRightIcon,
    CheckCircleIcon,
    ChevronRightIcon,
    ClipboardDocumentListIcon,
    DocumentTextIcon,
    ExclamationTriangleIcon,
    PaperClipIcon,
    Squares2X2Icon,
    UserIcon,
} from '@heroicons/react/24/outline';

/* ------------------------------------------------------------------ */
/* Design tokens                                                       */
/* ------------------------------------------------------------------ */

const TONES = {
    indigo: { icon: 'bg-brand-50 text-brand-600', chip: 'bg-brand-50 text-brand-700', bar: 'bg-brand-600' },
    emerald: { icon: 'bg-emerald-50 text-emerald-600', chip: 'bg-emerald-50 text-emerald-700', bar: 'bg-emerald-500' },
    violet: { icon: 'bg-brand-100 text-brand-700', chip: 'bg-brand-100 text-brand-700', bar: 'bg-brand-700' },
    amber: { icon: 'bg-amber-50 text-amber-600', chip: 'bg-amber-50 text-amber-700', bar: 'bg-amber-500' },
    sky: { icon: 'bg-brand-50 text-brand-600', chip: 'bg-brand-50 text-brand-700', bar: 'bg-brand-600' },
    rose: { icon: 'bg-rose-50 text-rose-600', chip: 'bg-rose-50 text-rose-700', bar: 'bg-rose-500' },
    neutral: { icon: 'bg-neutral-100 text-neutral-500', chip: 'bg-neutral-100 text-neutral-600', bar: 'bg-neutral-400' },
};

/* ------------------------------------------------------------------ */
/* Primitives                                                          */
/* ------------------------------------------------------------------ */

function ActionButton({ children, onClick, href, variant = 'primary', type = 'button', disabled = false }) {
    const map = {
        primary: 'bg-neutral-900 text-white hover:bg-neutral-800',
        secondary: 'bg-white text-neutral-900 border border-neutral-200 hover:bg-neutral-50',
    };
    const base = `inline-flex items-center justify-center rounded-lg px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${map[variant]}`;

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

function StatCell({ icon: Icon, label, value, suffix, tone = 'indigo' }) {
    const t = TONES[tone];
    return (
        <div className="flex items-center gap-2.5 bg-white p-3">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${t.icon}`}>
                <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
                <p className="flex items-baseline gap-1 leading-none">
                    <span className="text-lg font-bold text-neutral-900">{value}</span>
                    {suffix ? <span className="text-[11px] font-semibold text-neutral-400">{suffix}</span> : null}
                </p>
                <p className="mt-1 truncate text-[10px] font-bold uppercase tracking-wider text-neutral-500">{label}</p>
            </div>
        </div>
    );
}

function CountChip({ icon: Icon, count, tone }) {
    if (!count) return null;
    const t = TONES[tone];
    return (
        <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${t.chip}`}>
            <Icon className="h-3 w-3" />
            {count}
        </span>
    );
}

function EmptyMini({ text }) {
    return (
        <div className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50/60 px-2.5 py-3 text-center text-[11px] text-neutral-400">
            {text}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Rows                                                                */
/* ------------------------------------------------------------------ */

function MaterialRow({ material, done }) {
    const t = done ? TONES.emerald : TONES.indigo;
    return (
        <Link
            href={route('mahasiswa.lms.materials.show', material.id)}
            className="group flex items-center gap-2.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-2 transition hover:border-neutral-300 hover:bg-neutral-50"
        >
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${t.icon}`}>
                {done ? <CheckCircleIcon className="h-4 w-4" /> : <DocumentTextIcon className="h-4 w-4" />}
            </span>
            <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-neutral-900">{material.title}</p>
                <p className="truncate text-[10px] uppercase tracking-wider text-neutral-400">
                    {material.type || 'Materi'}
                    {done ? ' • selesai' : ''}
                </p>
            </div>
            <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 text-neutral-300 transition group-hover:translate-x-0.5 group-hover:text-neutral-500" />
        </Link>
    );
}

function AssignmentRow({ assignment, submission, onOpen }) {
    const submitted = !!submission;
    const t = submitted ? TONES.emerald : TONES.amber;
    return (
        <button
            type="button"
            onClick={onOpen}
            className="group flex w-full items-center gap-2.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-left transition hover:border-neutral-300 hover:bg-neutral-50"
        >
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${t.icon}`}>
                {submitted ? <CheckCircleIcon className="h-4 w-4" /> : <ClipboardDocumentListIcon className="h-4 w-4" />}
            </span>
            <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-neutral-900">{assignment.title}</p>
                <p className="truncate text-[10px] uppercase tracking-wider text-neutral-400">
                    {submitted ? 'Sudah dikumpulkan' : 'Belum dikumpulkan'}
                </p>
            </div>
            <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${t.chip}`}>
                {submitted ? 'Terkumpul' : 'Kumpulkan'}
            </span>
        </button>
    );
}

function ForumRow({ forum }) {
    return (
        <Link
            href={route('mahasiswa.lms.forums.show', forum.id)}
            className="group flex items-center gap-2.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-2 transition hover:border-neutral-300 hover:bg-neutral-50"
        >
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${TONES.sky.icon}`}>
                <ChatBubbleLeftRightIcon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-neutral-900">{forum.title}</p>
                <p className="truncate text-[10px] uppercase tracking-wider text-neutral-400">
                    {forum.threads_count || 0} thread
                </p>
            </div>
            {forum.is_active ? (
                <span className="shrink-0 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                    Aktif
                </span>
            ) : (
                <span className="shrink-0 rounded-md bg-neutral-100 px-1.5 py-0.5 text-[10px] font-bold text-neutral-500">
                    Nonaktif
                </span>
            )}
        </Link>
    );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function Show({ course, progress, submissions }) {
    const [selectedAssignment, setSelectedAssignment] = useState(null);

    const chapters = course?.chapters || [];
    const mataKuliah = course?.jadwal_kuliah?.mata_kuliah;
    const jadwal = course?.jadwal_kuliah;

    const stats = useMemo(() => {
        const totalMaterials = chapters.reduce((sum, c) => sum + (c.materials?.length || 0), 0);
        const totalAssignments = chapters.reduce((sum, c) => sum + (c.assignments?.length || 0), 0);
        const totalForums = chapters.reduce((sum, c) => sum + (c.forums?.length || 0), 0);
        const completedMaterials = Object.keys(progress || {}).length;
        const submittedAssignments = Object.keys(submissions || {}).length;

        return {
            totalMaterials,
            totalAssignments,
            totalForums,
            completedMaterials,
            submittedAssignments,
            pendingAssignments: Math.max(0, totalAssignments - submittedAssignments),
        };
    }, [chapters, progress, submissions]);

    const progressPercent = stats.totalMaterials ? Math.round((stats.completedMaterials / stats.totalMaterials) * 100) : 0;

    const schedule = [jadwal?.hari, jadwal?.jam_mulai].filter(Boolean).join(', ');

    return (
        <AdminLayout title={`LMS: ${mataKuliah?.nama_mata_kuliah || 'Kelas'}`}>
            <Head title={`LMS - ${mataKuliah?.nama_mata_kuliah || 'Kelas'}`} />

            <div className="space-y-3">
                {/* Hero */}
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 px-4 py-3.5 shadow-md shadow-brand-900/25">
                    <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/10" />
                    <div className="pointer-events-none absolute -bottom-12 -left-6 h-28 w-28 rounded-full bg-white/10" />

                    <div className="relative flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-white ring-1 ring-white/20">
                                <AcademicCapIcon className="h-3 w-3" />
                                Course Workspace
                            </span>

                            <h1 className="mt-2 text-lg font-bold leading-tight text-white md:text-xl">
                                {mataKuliah?.nama_mata_kuliah || 'Kelas'}
                            </h1>

                            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-white/85">
                                <span className="inline-flex items-center gap-1">
                                    <UserIcon className="h-3.5 w-3.5 text-white/70" />
                                    {jadwal?.dosen?.nama_lengkap || '-'}
                                </span>
                                {schedule ? (
                                    <span className="inline-flex items-center gap-1">
                                        <CalendarDaysIcon className="h-3.5 w-3.5 text-white/70" />
                                        {schedule}
                                    </span>
                                ) : null}
                                {jadwal?.ruangan ? (
                                    <span className="inline-flex items-center gap-1">
                                        <Squares2X2Icon className="h-3.5 w-3.5 text-white/70" />
                                        {jadwal.ruangan}
                                    </span>
                                ) : null}
                                {mataKuliah?.sks ? <span className="font-bold text-white/90">{mataKuliah.sks} SKS</span> : null}
                            </div>
                        </div>

                        <Link
                            href={route('mahasiswa.lms.index')}
                            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-900 shadow-sm transition hover:bg-white/85"
                        >
                            <ArrowLeftIcon className="h-3.5 w-3.5" />
                            Kembali
                        </Link>
                    </div>

                    {/* Inline progress */}
                    <div className="relative mt-3">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-white/80">
                            <span>Progress Belajar</span>
                            <span>
                                {stats.completedMaterials}/{stats.totalMaterials} materi • {progressPercent}%
                            </span>
                        </div>
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/25">
                            <div
                                className="h-full rounded-full bg-white transition-all duration-500"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Compact stat strip */}
                <section className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-neutral-200 shadow-sm ring-1 ring-neutral-200 lg:grid-cols-5">
                    <StatCell icon={Squares2X2Icon} label="Total Bab" value={chapters.length} tone="indigo" />
                    <StatCell
                        icon={BookOpenIcon}
                        label="Materi Selesai"
                        value={stats.completedMaterials}
                        suffix={`/${stats.totalMaterials}`}
                        tone="emerald"
                    />
                    <StatCell
                        icon={ClipboardDocumentListIcon}
                        label="Tugas Terkumpul"
                        value={stats.submittedAssignments}
                        suffix={`/${stats.totalAssignments}`}
                        tone="violet"
                    />
                    <StatCell icon={ChatBubbleLeftRightIcon} label="Forum Diskusi" value={stats.totalForums} tone="sky" />
                    <StatCell
                        icon={ExclamationTriangleIcon}
                        label="Belum Dikumpul"
                        value={stats.pendingAssignments}
                        tone={stats.pendingAssignments > 0 ? 'rose' : 'neutral'}
                    />
                </section>

                {/* Chapters */}
                {chapters.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center">
                        <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-400">
                            <BookOpenIcon className="h-5 w-5" />
                        </span>
                        <p className="mt-3 text-sm font-bold text-neutral-900">Belum ada konten</p>
                        <p className="mx-auto mt-1 max-w-sm text-[11px] text-neutral-500">
                            Dosen belum menambahkan bab, materi, atau tugas pada kelas ini.
                        </p>
                    </div>
                ) : (
                    <section className="space-y-3">
                        {chapters.map((chapter, idx) => {
                            const chapterMaterials = chapter.materials || [];
                            const chapterAssignments = chapter.assignments || [];
                            const chapterForums = chapter.forums || [];
                            const chapterCompleted = chapterMaterials.filter((m) => !!progress?.[m.id]).length;

                            return (
                                <article
                                    key={chapter.id}
                                    className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-neutral-200"
                                >
                                    {/* Chapter header */}
                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 bg-neutral-50 px-3 py-2.5">
                                        <div className="flex min-w-0 items-center gap-2.5">
                                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-[11px] font-black text-brand-700">
                                                {String(idx + 1).padStart(2, '0')}
                                            </span>
                                            <div className="min-w-0">
                                                <h2 className="truncate text-[13px] font-bold text-neutral-900">{chapter.title}</h2>
                                                <p className="text-[10px] text-neutral-500">
                                                    {chapterCompleted}/{chapterMaterials.length} materi selesai
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <CountChip icon={BookOpenIcon} count={chapterMaterials.length} tone="indigo" />
                                            <CountChip icon={ClipboardDocumentListIcon} count={chapterAssignments.length} tone="violet" />
                                            <CountChip icon={ChatBubbleLeftRightIcon} count={chapterForums.length} tone="sky" />
                                        </div>
                                    </div>

                                    {/* Chapter body */}
                                    <div className="grid grid-cols-1 gap-3 p-3 lg:grid-cols-12">
                                        <div className="lg:col-span-7">
                                            <h3 className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                                                Materi
                                            </h3>
                                            <div className="space-y-1.5">
                                                {chapterMaterials.length === 0 ? (
                                                    <EmptyMini text="Belum ada materi." />
                                                ) : (
                                                    chapterMaterials.map((material) => (
                                                        <MaterialRow
                                                            key={material.id}
                                                            material={material}
                                                            done={!!progress?.[material.id]}
                                                        />
                                                    ))
                                                )}
                                            </div>
                                        </div>

                                        <div className="lg:col-span-5">
                                            <h3 className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                                                Tugas
                                            </h3>
                                            <div className="space-y-1.5">
                                                {chapterAssignments.length === 0 ? (
                                                    <EmptyMini text="Belum ada tugas." />
                                                ) : (
                                                    chapterAssignments.map((assignment) => (
                                                        <AssignmentRow
                                                            key={assignment.id}
                                                            assignment={assignment}
                                                            submission={submissions?.[assignment.id]}
                                                            onOpen={() => setSelectedAssignment(assignment)}
                                                        />
                                                    ))
                                                )}
                                            </div>

                                            <h3 className="mb-1.5 mt-3 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                                                Forum
                                            </h3>
                                            <div className="space-y-1.5">
                                                {chapterForums.length === 0 ? (
                                                    <EmptyMini text="Belum ada forum." />
                                                ) : (
                                                    chapterForums.map((forum) => <ForumRow key={forum.id} forum={forum} />)
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </section>
                )}
            </div>

            <Modal show={!!selectedAssignment} onClose={() => setSelectedAssignment(null)} maxWidth="2xl">
                {selectedAssignment ? (
                    <AssignmentViewer
                        assignment={selectedAssignment}
                        submission={submissions[selectedAssignment.id]}
                        onClose={() => setSelectedAssignment(null)}
                    />
                ) : null}
            </Modal>
        </AdminLayout>
    );
}

/* ------------------------------------------------------------------ */
/* Assignment modal                                                    */
/* ------------------------------------------------------------------ */

function AssignmentViewer({ assignment, submission, onClose }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        file: null,
        notes: submission?.notes || '',
    });

    const [isEditing, setIsEditing] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        post(route('mahasiswa.lms.assignments.submit', assignment.id), {
            onSuccess: () => {
                reset();
                setIsEditing(false);
            },
        });
    };

    const isGraded = submission?.grade !== null && submission?.grade !== undefined;

    return (
        <div className="p-4 sm:p-5">
            <div className="flex items-start gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <ClipboardDocumentListIcon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                    <h2 className="text-base font-bold leading-tight text-neutral-900">{assignment.title}</h2>
                    <p className="text-[11px] text-neutral-500">Tugas kelas</p>
                </div>
            </div>

            <div className="mt-3 rounded-lg bg-neutral-50 p-3 text-xs leading-relaxed text-neutral-700">
                <div dangerouslySetInnerHTML={{ __html: assignment.description || '-' }} />
                {assignment.file_path ? (
                    <a
                        href={`/storage/${assignment.file_path}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-1.5 font-bold text-neutral-900 hover:underline"
                    >
                        <PaperClipIcon className="h-3.5 w-3.5" />
                        Unduh Lampiran Soal
                    </a>
                ) : null}
            </div>

            <hr className="my-3 border-neutral-200" />

            {submission && !isEditing ? (
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="inline-flex items-center gap-1.5 font-bold text-emerald-700">
                            <CheckCircleIcon className="h-4 w-4" />
                            Sudah dikumpulkan
                        </p>
                        {!isGraded ? (
                            <button
                                type="button"
                                onClick={() => setIsEditing(true)}
                                className="rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-[11px] font-bold text-neutral-900 transition hover:bg-neutral-100"
                            >
                                Edit Jawaban
                            </button>
                        ) : null}
                    </div>

                    <p className="mt-1.5 text-neutral-600">
                        Waktu: {new Date(submission.submitted_at).toLocaleString('id-ID')}
                    </p>

                    {submission.file_path ? (
                        <a
                            href={`/storage/${submission.file_path}`}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1.5 inline-flex items-center gap-1.5 font-bold text-neutral-900 hover:underline"
                        >
                            <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                            Lihat jawaban lampiran
                        </a>
                    ) : null}

                    {submission.notes ? (
                        <div className="mt-2">
                            <p className="font-bold text-neutral-800">Teks Jawaban / Catatan</p>
                            <div
                                className="prose prose-sm mt-1 max-w-none rounded-md bg-white p-2.5 shadow-inner"
                                dangerouslySetInnerHTML={{ __html: submission.notes }}
                            />
                        </div>
                    ) : null}

                    {isGraded ? (
                        <div className="mt-2 border-t border-neutral-200 pt-2">
                            <p className="font-bold text-neutral-900">
                                Nilai: <span className="text-emerald-700">{submission.grade}</span>
                            </p>
                            <p className="text-neutral-700">Feedback: {submission.feedback || '-'}</p>
                        </div>
                    ) : null}
                </div>
            ) : (
                <form onSubmit={submit} className="space-y-3">
                    <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                            Upload Jawaban (PDF/Doc/Zip) — Opsional
                        </label>
                        {submission?.file_path ? (
                            <p className="mb-1.5 text-[11px] font-semibold text-amber-700">
                                Anda sudah pernah mengunggah file. Unggah file baru hanya jika ingin menggantinya.
                            </p>
                        ) : null}
                        <input
                            type="file"
                            onChange={(e) => setData('file', e.target.files[0])}
                            className="block w-full rounded-lg border border-neutral-300 bg-white p-2 text-xs text-neutral-700"
                        />
                        <InputError message={errors.file} className="mt-1" />
                    </div>

                    <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                            Teks Jawaban / Catatan
                        </label>
                        <RichTextEditor
                            value={data.notes}
                            onChange={(value) => setData('notes', value)}
                            placeholder="Ketik jawaban Anda di sini jika tidak mengunggah file..."
                        />
                        <InputError message={errors.notes} className="mt-1" />
                    </div>

                    <div className="flex justify-end gap-2">
                        {submission ? (
                            <ActionButton
                                type="button"
                                onClick={() => setIsEditing(false)}
                                disabled={processing}
                                variant="secondary"
                            >
                                Batal
                            </ActionButton>
                        ) : null}
                        <ActionButton type="submit" disabled={processing} variant="primary">
                            {processing ? 'Menyimpan...' : 'Kumpulkan Tugas'}
                        </ActionButton>
                    </div>
                </form>
            )}

            <div className="mt-3 flex justify-end">
                {!isEditing ? (
                    <ActionButton onClick={onClose} variant="secondary">
                        Tutup
                    </ActionButton>
                ) : null}
            </div>
        </div>
    );
}
