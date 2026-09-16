import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm } from '@inertiajs/react';

function Box({ children, className = '', padded = true, variant = 'white' }) {
    const variants = {
        white: 'bg-white border-[#e5e5e5]',
        black: 'bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 border-transparent text-white rounded-2xl shadow-lg shadow-violet-500/20',
        gray: 'bg-[#f4f4f5] border-[#e5e5e5]',
        outline: 'bg-transparent border-[#e5e5e5]',
    };
    return (
        <div className={`border ${variants[variant]} ${padded ? 'p-5 sm:p-6' : ''} ${className}`}>
            {children}
        </div>
    );
}

function SectionTitle({ children, action }) {
    return (
        <div className="mb-4 flex items-center justify-between border-b border-[#e5e5e5] pb-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-black">{children}</h2>
            {action ? <div>{action}</div> : null}
        </div>
    );
}

function StatCard({ title, value }) {
    return (
        <Box className="relative overflow-hidden">
            <p className="text-[10px] uppercase tracking-widest text-neutral-500">{title}</p>
            <p className="mt-2 text-3xl font-bold text-black">{value}</p>
        </Box>
    );
}

function Badge({ children, variant = 'default' }) {
    const map = {
        default: 'border-[#e5e5e5] bg-white text-black',
        active: 'border-black bg-black text-white',
        warning: 'border-[#e5e5e5] bg-[#f4f4f5] text-black',
    };
    return (
        <span className={`border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${map[variant]}`}>
            {children}
        </span>
    );
}

export default function Grading({ assignment, course, chapter, submissions, stats }) {
    const progress = stats?.total ? Math.round(((stats?.graded || 0) / stats.total) * 100) : 0;

    return (
        <AdminLayout title="Penilaian Tugas LMS">
            <Head title={`Penilaian - ${assignment.title}`} />

            <div className="space-y-6">
                <section className="border border-black bg-black p-6 text-white sm:p-8">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-400">Penilaian Tugas LMS</p>
                            <h1 className="mt-2 text-2xl font-bold uppercase tracking-tight sm:text-3xl">{assignment.title}</h1>
                            <p className="mt-2 text-xs text-neutral-400">
                                {course?.jadwal_kuliah?.mata_kuliah?.nama_mata_kuliah || '-'} • Bab {chapter?.title}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2 text-[10px] uppercase tracking-widest">
                                <Badge variant="active">Komponen: {assignment.komponen}</Badge>
                                <Badge>Bobot Internal: {assignment.bobot_komponen}</Badge>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Link
                                href={route('dosen.lms.show', course.id)}
                                className="border border-white/30 bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-white hover:text-black"
                            >
                                ← Kembali ke LMS
                            </Link>
                            <Link
                                href={route('dosen.penilaian', course?.jadwal_kuliah?.id)}
                                className="border border-white bg-white px-3 py-2 text-xs font-semibold uppercase tracking-widest text-black transition hover:bg-black hover:text-white"
                            >
                                Lihat Penilaian KHS
                            </Link>
                        </div>
                    </div>
                </section>

                <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <StatCard title="Total Pengumpulan" value={stats?.total || 0} />
                    <StatCard title="Sudah Dinilai" value={stats?.graded || 0} />
                    <StatCard title="Belum Dinilai" value={(stats?.total || 0) - (stats?.graded || 0)} />
                </section>

                <Box>
                    <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-widest text-black">Progress Penilaian</p>
                        <p className="text-xs font-semibold uppercase tracking-widest text-black">{progress}%</p>
                    </div>
                    <div className="h-2 w-full border border-[#e5e5e5] bg-white">
                        <div className="h-full bg-black" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="mt-3 text-xs text-neutral-500">
                        Nilai yang disimpan di sini akan langsung sinkron ke penilaian KHS sesuai komponen ({assignment.komponen}).
                    </p>
                </Box>

                <Box>
                    <SectionTitle>Daftar Submission Mahasiswa</SectionTitle>

                    {submissions.length === 0 ? (
                        <div className="border border-dashed border-[#e5e5e5] p-8 text-center text-xs text-neutral-500">
                            Belum ada mahasiswa yang mengumpulkan tugas ini.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {submissions.map((submission) => (
                                <SubmissionCard key={submission.id} submission={submission} />
                            ))}
                        </div>
                    )}
                </Box>
            </div>
        </AdminLayout>
    );
}

function SubmissionCard({ submission }) {
    const { data, setData, put, processing, errors } = useForm({
        grade: submission.grade ?? '',
        feedback: submission.feedback || '',
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('dosen.lms.submissions.grade', submission.id), {
            preserveScroll: true,
        });
    };

    return (
        <article className="overflow-hidden border border-[#e5e5e5] bg-white">
            <div className="flex flex-col gap-3 border-b border-[#e5e5e5] bg-[#f4f4f5] p-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-black">{submission.mahasiswa?.nama_lengkap || '-'}</p>
                    <p className="text-[10px] uppercase tracking-widest text-neutral-500">
                        {submission.mahasiswa?.nim || '-'} • {submission.mahasiswa?.prodi?.nama_prodi || '-'}
                    </p>
                    <p className="mt-1 text-[10px] uppercase tracking-widest text-neutral-500">
                        Dikumpulkan: {submission.submitted_at ? new Date(submission.submitted_at).toLocaleString('id-ID') : '-'}
                    </p>
                </div>
                {submission.file_path && (
                    <a
                        href={`/storage/${submission.file_path}`}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 border border-black bg-white px-3 py-2 text-xs font-semibold uppercase tracking-widest text-black transition hover:bg-black hover:text-white"
                    >
                        Lihat File Jawaban
                    </a>
                )}
            </div>

            {submission.notes && (
                <div className="border-b border-[#e5e5e5] p-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-black">Teks Jawaban / Catatan Mahasiswa:</p>
                    <div className="prose prose-sm max-w-none border border-[#e5e5e5] bg-[#f4f4f5] p-4 text-neutral-700" dangerouslySetInnerHTML={{ __html: submission.notes }} />
                </div>
            )}

            <form onSubmit={submit} className="grid grid-cols-1 gap-4 p-4 md:grid-cols-12 md:items-start">
                <div className="md:col-span-3">
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-black">Nilai (0-100)</label>
                    <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={data.grade}
                        onChange={(e) => setData('grade', e.target.value)}
                        className="block w-full border border-[#e5e5e5] bg-white px-3 py-2 text-right text-sm font-semibold text-neutral-700 focus:border-black focus:outline-none"
                        placeholder="Kosongkan untuk reset"
                    />
                    {errors.grade ? <p className="mt-1 text-xs text-rose-600">{errors.grade}</p> : null}
                </div>

                <div className="md:col-span-7">
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-black">Feedback</label>
                    <textarea
                        rows="3"
                        value={data.feedback}
                        onChange={(e) => setData('feedback', e.target.value)}
                        className="block w-full border border-[#e5e5e5] bg-white px-3 py-2 text-sm text-neutral-700 focus:border-black focus:outline-none"
                        placeholder="Masukan untuk mahasiswa..."
                    />
                    {errors.feedback ? <p className="mt-1 text-xs text-rose-600">{errors.feedback}</p> : null}
                </div>

                <div className="md:col-span-2 md:pt-6">
                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full border border-black bg-black px-3 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-white hover:text-black disabled:opacity-60"
                    >
                        {processing ? 'Menyimpan...' : 'Simpan'}
                    </button>
                </div>
            </form>
        </article>
    );
}
