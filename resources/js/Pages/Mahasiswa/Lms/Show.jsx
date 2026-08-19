import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import InputError from '@/Components/InputError';
import Modal from '@/Components/Modal';
import RichTextEditor from '@/Components/RichTextEditor';

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

function ActionButton({ children, onClick, href, variant = 'primary', type = 'button', disabled = false }) {
    const map = {
        primary: 'bg-neutral-900 text-white hover:bg-neutral-800',
        secondary: 'bg-white text-neutral-900 border border-neutral-200 hover:bg-neutral-50',
    };
    const base = `inline-flex items-center px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${map[variant]}`;

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

function StatCard({ label, value, variant = 'white' }) {
    return (
        <Box variant={variant} className="relative overflow-hidden text-center">
            <div className="absolute right-0 top-0 h-10 w-10 bg-neutral-100" />
            <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">{label}</p>
            <p className="mt-2 text-3xl font-bold">{value}</p>
        </Box>
    );
}

function Pill({ label, variant = 'default' }) {
    const map = {
        default: 'bg-neutral-100 text-neutral-700',
        success: 'bg-neutral-900 text-white',
        warning: 'bg-neutral-200 text-neutral-900',
        info: 'bg-neutral-50 text-neutral-700 border border-neutral-200',
    };
    return <span className={`px-2.5 py-1 text-xs font-bold ${map[variant] || map.default}`}>{label}</span>;
}

function EmptyMini({ text }) {
    return <div className="bg-neutral-50 p-3 text-sm text-neutral-500">{text}</div>;
}

export default function Show({ course, progress, submissions }) {
    const [selectedAssignment, setSelectedAssignment] = useState(null);

    const chapters = course?.chapters || [];

    const stats = useMemo(() => {
        const totalMaterials = chapters.reduce((sum, chapter) => sum + (chapter.materials?.length || 0), 0);
        const totalAssignments = chapters.reduce((sum, chapter) => sum + (chapter.assignments?.length || 0), 0);
        const totalForums = chapters.reduce((sum, chapter) => sum + (chapter.forums?.length || 0), 0);
        const completedMaterials = Object.keys(progress || {}).length;
        const submittedAssignments = Object.keys(submissions || {}).length;
        const pendingAssignments = Math.max(0, totalAssignments - submittedAssignments);

        return {
            totalMaterials,
            totalAssignments,
            totalForums,
            completedMaterials,
            submittedAssignments,
            pendingAssignments,
        };
    }, [chapters, progress, submissions]);

    const progressPercent = stats.totalMaterials ? Math.round((stats.completedMaterials / stats.totalMaterials) * 100) : 0;

    return (
        <AdminLayout title={`LMS: ${course.jadwal_kuliah?.mata_kuliah?.nama_mata_kuliah || 'Kelas'}`}>
            <Head title={`LMS - ${course.jadwal_kuliah?.mata_kuliah?.nama_mata_kuliah || 'Kelas'}`} />

            <div className="space-y-6">
                <Box variant="black" className="relative overflow-hidden">
                    <div className="absolute right-0 top-0 h-24 w-24 bg-neutral-800" />
                    <div className="absolute bottom-0 left-0 h-16 w-16 bg-neutral-800" />

                    <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-3xl">
                            <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">Course Workspace</p>
                            <h1 className="mt-2 text-2xl font-bold md:text-3xl">{course.jadwal_kuliah?.mata_kuliah?.nama_mata_kuliah}</h1>
                            <p className="mt-2 text-sm text-neutral-300">
                                Dosen: {course.jadwal_kuliah?.dosen?.nama_lengkap || '-'} • {course.jadwal_kuliah?.hari || '-'}
                            </p>
                            <p className="mt-1 text-sm text-neutral-300">{course.description || 'Tidak ada deskripsi kelas.'}</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <span className="border border-white/30 bg-white/10 px-2.5 py-1 text-xs font-bold">{chapters.length} Bab</span>
                            <span className="border border-white/30 bg-white/10 px-2.5 py-1 text-xs font-bold">{progressPercent}% Progress</span>
                            <ActionButton href={route('mahasiswa.lms.index')} variant="secondary">← Kembali</ActionButton>
                        </div>
                    </div>
                </Box>

                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
                    <StatCard label="Total Materi" value={stats.totalMaterials} />
                    <StatCard label="Sudah Dipelajari" value={stats.completedMaterials} variant="black" />
                    <StatCard label="Total Tugas" value={stats.totalAssignments} />
                    <StatCard label="Forum" value={stats.totalForums} variant="gray" />
                    <StatCard label="Terkumpul" value={stats.submittedAssignments} variant="black" />
                    <StatCard label="Belum Terkumpul" value={stats.pendingAssignments} />
                </section>

                <Box>
                    <div className="mb-2 flex items-center justify-between">
                        <p className="text-sm font-bold text-neutral-600">Progress Belajar Materi</p>
                        <p className="text-sm font-bold text-neutral-800">{progressPercent}%</p>
                    </div>
                    <div className="h-2.5 w-full bg-neutral-100">
                        <div
                            className="h-full bg-neutral-900 transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                    <p className="mt-2 text-xs text-neutral-500">
                        {stats.completedMaterials} dari {stats.totalMaterials} materi sudah dipelajari.
                    </p>
                </Box>

                {chapters.length === 0 ? (
                    <div className="border border-dashed border-neutral-300 bg-white p-12 text-center text-sm text-neutral-500">
                        Belum ada konten di kelas ini.
                    </div>
                ) : (
                    <section className="space-y-5">
                        {chapters.map((chapter, idx) => {
                            const chapterMaterials = chapter.materials || [];
                            const chapterAssignments = chapter.assignments || [];
                            const chapterForums = chapter.forums || [];
                            const chapterCompleted = chapterMaterials.filter((material) => !!progress?.[material.id]).length;

                            return (
                                <article key={chapter.id} className="overflow-hidden bg-white shadow-sm ring-1 ring-neutral-200">
                                    <div className="border-b border-neutral-200 bg-neutral-50 p-4 sm:p-5">
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div>
                                                <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">Bab {idx + 1}</p>
                                                <h2 className="text-lg font-bold text-neutral-900">{chapter.title}</h2>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <Pill label={`${chapterMaterials.length} Materi`} />
                                                <Pill label={`${chapterAssignments.length} Tugas`} variant="warning" />
                                                <Pill label={`${chapterForums.length} Forum`} variant="info" />
                                                <Pill label={`${chapterCompleted} Selesai`} variant="success" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 p-4 sm:p-5 lg:grid-cols-12">
                                        <div className="lg:col-span-7">
                                            <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-neutral-500">Materi</h3>
                                            <div className="space-y-2">
                                                {chapterMaterials.length === 0 ? (
                                                    <EmptyMini text="Belum ada materi di bab ini." />
                                                ) : (
                                                    chapterMaterials.map((material) => (
                                                        <Link
                                                            key={material.id}
                                                            href={route('mahasiswa.lms.materials.show', material.id)}
                                                            className={`flex items-center justify-between border p-3 transition ${
                                                                progress?.[material.id]
                                                                    ? 'border-neutral-900 bg-neutral-50 hover:bg-neutral-100'
                                                                    : 'border-neutral-200 hover:bg-neutral-50'
                                                            }`}
                                                        >
                                                            <div className="min-w-0 pr-2">
                                                                <p className="truncate text-sm font-bold text-neutral-900">{material.title}</p>
                                                                <p className="text-xs uppercase text-neutral-500">{material.type}</p>
                                                            </div>
                                                            <span
                                                                className={`shrink-0 px-2.5 py-1 text-[11px] font-bold ${
                                                                    progress?.[material.id]
                                                                        ? 'bg-neutral-900 text-white'
                                                                        : 'bg-neutral-100 text-neutral-600'
                                                                }`}
                                                            >
                                                                {progress?.[material.id] ? 'Selesai' : 'Buka'}
                                                            </span>
                                                        </Link>
                                                    ))
                                                )}
                                            </div>
                                        </div>

                                        <div className="lg:col-span-5">
                                            <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-neutral-500">Tugas</h3>
                                            <div className="space-y-2">
                                                {chapterAssignments.length === 0 ? (
                                                    <EmptyMini text="Belum ada tugas di bab ini." />
                                                ) : (
                                                    chapterAssignments.map((assignment) => (
                                                        <button
                                                            key={assignment.id}
                                                            type="button"
                                                            onClick={() => setSelectedAssignment(assignment)}
                                                            className="flex w-full items-center justify-between border border-neutral-200 bg-neutral-50 p-3 text-left transition hover:bg-neutral-100"
                                                        >
                                                            <div className="min-w-0 pr-2">
                                                                <p className="truncate text-sm font-bold text-neutral-900">{assignment.title}</p>
                                                                <p className="text-xs text-neutral-500">
                                                                    {submissions?.[assignment.id] ? 'Tugas sudah dikumpulkan' : 'Belum dikumpulkan'}
                                                                </p>
                                                            </div>
                                                            <span
                                                                className={`shrink-0 px-2.5 py-1 text-[11px] font-bold ${
                                                                    submissions?.[assignment.id]
                                                                        ? 'bg-neutral-900 text-white'
                                                                        : 'bg-neutral-200 text-neutral-800'
                                                                }`}
                                                            >
                                                                {submissions?.[assignment.id] ? 'Terkumpul' : 'Pending'}
                                                            </span>
                                                        </button>
                                                    ))
                                                )}
                                            </div>

                                            <div className="mt-4">
                                                <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-neutral-500">Forum</h3>
                                                <div className="space-y-2">
                                                    {chapterForums.length === 0 ? (
                                                        <EmptyMini text="Belum ada forum di bab ini." />
                                                    ) : (
                                                        chapterForums.map((forum) => (
                                                            <Link
                                                                key={forum.id}
                                                                href={route('mahasiswa.lms.forums.show', forum.id)}
                                                                className="block border border-neutral-200 bg-neutral-50 p-3 transition hover:bg-neutral-100"
                                                            >
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <div className="min-w-0 pr-2">
                                                                        <p className="truncate text-sm font-bold text-neutral-900">{forum.title}</p>
                                                                        <p className="text-xs text-neutral-500">{forum.threads_count || 0} thread diskusi</p>
                                                                    </div>
                                                                    <span
                                                                        className={`shrink-0 px-2.5 py-1 text-[11px] font-bold ${
                                                                            forum.is_active ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600'
                                                                        }`}
                                                                    >
                                                                        {forum.is_active ? 'Aktif' : 'Nonaktif'}
                                                                    </span>
                                                                </div>
                                                            </Link>
                                                        ))
                                                    )}
                                                </div>
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
        <div className="p-6">
            <h2 className="text-xl font-bold text-neutral-900">{assignment.title}</h2>

            <div className="mt-4 text-sm text-neutral-700">
                <div dangerouslySetInnerHTML={{ __html: assignment.description || '-' }} />
                {assignment.file_path ? (
                    <a href={`/storage/${assignment.file_path}`} target="_blank" rel="noreferrer" className="mt-2 inline-block font-bold text-neutral-900 hover:underline">
                        Unduh Lampiran Soal
                    </a>
                ) : null}
            </div>

            <hr className="my-4" />

            {submission && !isEditing ? (
                <div className="border border-neutral-200 bg-neutral-50 p-4 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-bold text-neutral-900">Status: Sudah dikumpulkan</p>
                        {!isGraded && (
                            <button type="button" onClick={() => setIsEditing(true)} className="border border-neutral-300 bg-white px-3 py-1 text-xs font-bold text-neutral-900 hover:bg-neutral-100">
                                Edit Jawaban
                            </button>
                        )}
                    </div>
                    <p className="mt-1 text-neutral-700">Waktu: {new Date(submission.submitted_at).toLocaleString('id-ID')}</p>
                    {submission.file_path ? (
                        <p className="mt-1 text-neutral-700">
                            File:{' '}
                            <a href={`/storage/${submission.file_path}`} target="_blank" rel="noreferrer" className="font-bold underline">
                                Lihat jawaban lampiran
                            </a>
                        </p>
                    ) : null}
                    {submission.notes ? (
                        <div className="mt-2 text-neutral-800">
                            <p className="font-bold">Teks Jawaban / Catatan:</p>
                            <div className="prose prose-sm mt-1 max-w-none rounded-md bg-white p-3 shadow-inner" dangerouslySetInnerHTML={{ __html: submission.notes }} />
                        </div>
                    ) : null}
                    {isGraded ? (
                        <div className="mt-2 border-t border-neutral-200 pt-2">
                            <p className="font-bold text-neutral-900">Nilai: {submission.grade}</p>
                            <p className="text-neutral-700">Feedback: {submission.feedback || '-'}</p>
                        </div>
                    ) : null}
                </div>
            ) : (
                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-neutral-500">Upload Jawaban (PDF/Doc/Zip) - Opsional</label>
                        {submission?.file_path && (
                            <p className="mb-2 text-xs font-bold text-neutral-600">
                                Anda sudah pernah mengupload file. Upload file baru HANYA jika ingin mengganti file yang lama.
                            </p>
                        )}
                        <input
                            type="file"
                            onChange={(e) => setData('file', e.target.files[0])}
                            className="block w-full border border-neutral-300 bg-white p-2.5 text-sm text-neutral-700"
                        />
                        <InputError message={errors.file} className="mt-1" />
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-neutral-500">Teks Jawaban / Catatan</label>
                        <RichTextEditor
                            value={data.notes}
                            onChange={(value) => setData('notes', value)}
                            placeholder="Ketik jawaban Anda di sini jika tidak mengupload file..."
                        />
                        <InputError message={errors.notes} className="mt-1" />
                    </div>

                    <div className="flex justify-end gap-2">
                        {submission && (
                            <ActionButton type="button" onClick={() => setIsEditing(false)} disabled={processing} variant="secondary">Batal</ActionButton>
                        )}
                        <ActionButton type="submit" disabled={processing} variant="primary">{processing ? 'Menyimpan...' : 'Kumpulkan Tugas'}</ActionButton>
                    </div>
                </form>
            )}

            <div className="mt-4 flex justify-end">
                {!isEditing && <ActionButton onClick={onClose} variant="secondary">Tutup</ActionButton>}
            </div>
        </div>
    );
}
