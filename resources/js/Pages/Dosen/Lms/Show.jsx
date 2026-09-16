import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import Modal from '@/Components/Modal';

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

function SectionTitle({ children, action, light = false }) {
    return (
        <div className="mb-4 flex items-center justify-between border-b border-[#e5e5e5] pb-3">
            <h2 className={`text-sm font-bold uppercase tracking-[0.2em] ${light ? 'text-white' : 'text-black'}`}>
                {children}
            </h2>
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
        danger: 'border-black bg-white text-black',
    };
    return (
        <span className={`border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${map[variant]}`}>
            {children}
        </span>
    );
}

function ActionButton({ children, href, onClick, variant = 'primary', type = 'button' }) {
    const base = 'px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest transition border';
    const map = {
        primary: 'border-black bg-black text-white hover:bg-white hover:text-black',
        secondary: 'border-[#e5e5e5] bg-white text-black hover:border-black hover:bg-neutral-100',
        danger: 'border-black bg-white text-black hover:bg-black hover:text-white',
    };
    const className = `${base} ${map[variant]}`;
    if (href) {
        return (
            <Link href={href} className={className}>
                {children}
            </Link>
        );
    }
    return (
        <button type={type} onClick={onClick} className={className}>
            {children}
        </button>
    );
}

export default function Show({ course }) {
    const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
    const [editingChapter, setEditingChapter] = useState(null);
    const [isForumModalOpen, setIsForumModalOpen] = useState(false);
    const [editingForum, setEditingForum] = useState(null);
    const [activeChapterIdForForum, setActiveChapterIdForForum] = useState(null);

    const {
        data: chapterData,
        setData: setChapterData,
        post: postChapter,
        put: putChapter,
        reset: resetChapter,
        processing: chapterProcessing,
    } = useForm({
        title: '',
    });

    const {
        data: forumData,
        setData: setForumData,
        post: postForum,
        put: putForum,
        reset: resetForum,
        processing: forumProcessing,
    } = useForm({
        title: '',
        description: '',
        is_active: true,
    });

    const chapters = course?.chapters || [];
    const totalMaterials = useMemo(() => chapters.reduce((sum, c) => sum + (c.materials?.length || 0), 0), [chapters]);
    const totalAssignments = useMemo(() => chapters.reduce((sum, c) => sum + (c.assignments?.length || 0), 0), [chapters]);
    const totalForums = useMemo(() => chapters.reduce((sum, c) => sum + (c.forums?.length || 0), 0), [chapters]);

    const openChapterModal = (chapter = null) => {
        setEditingChapter(chapter);
        setChapterData('title', chapter ? chapter.title : '');
        setIsChapterModalOpen(true);
    };

    const closeChapterModal = () => {
        setIsChapterModalOpen(false);
        setEditingChapter(null);
        resetChapter();
    };

    const openForumModal = (chapter, forum = null) => {
        setActiveChapterIdForForum(chapter.id);
        setEditingForum(forum);
        setForumData({
            title: forum?.title || '',
            description: forum?.description || '',
            is_active: forum ? !!forum.is_active : true,
        });
        setIsForumModalOpen(true);
    };

    const closeForumModal = () => {
        setIsForumModalOpen(false);
        setEditingForum(null);
        setActiveChapterIdForForum(null);
        resetForum();
    };

    const submitChapter = (e) => {
        e.preventDefault();

        if (editingChapter) {
            putChapter(route('dosen.lms.chapters.update', editingChapter.id), {
                onSuccess: closeChapterModal,
            });
            return;
        }

        postChapter(route('dosen.lms.chapters.store', course.id), {
            onSuccess: closeChapterModal,
        });
    };

    const submitForum = (e) => {
        e.preventDefault();

        if (editingForum) {
            putForum(route('dosen.lms.forums.update', editingForum.id), {
                onSuccess: closeForumModal,
            });
            return;
        }

        if (!activeChapterIdForForum) {
            return;
        }

        postForum(route('dosen.lms.forums.store', activeChapterIdForForum), {
            onSuccess: closeForumModal,
        });
    };

    const deleteChapter = (chapterId) => {
        if (confirm('Hapus topik ini beserta semua materi dan tugas di dalamnya?')) {
            router.delete(route('dosen.lms.chapters.delete', chapterId));
        }
    };

    const deleteMaterial = (materialId) => {
        if (confirm('Hapus materi ini?')) {
            router.delete(route('dosen.lms.materials.delete', materialId));
        }
    };

    const deleteAssignment = (assignmentId) => {
        if (confirm('Hapus tugas ini?')) {
            router.delete(route('dosen.lms.assignments.delete', assignmentId));
        }
    };

    const deleteForum = (forumId) => {
        if (confirm('Hapus forum ini beserta semua thread dan balasannya?')) {
            router.delete(route('dosen.lms.forums.delete', forumId));
        }
    };

    return (
        <AdminLayout title="Kelola LMS">
            <Head title={`LMS - ${course.jadwal_kuliah?.mata_kuliah?.nama_mata_kuliah || 'Kelas'}`} />

            <div className="space-y-6">
                <section className="border border-black bg-black p-6 text-white sm:p-8">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-400">Workspace Kelas LMS</p>
                            <h1 className="mt-2 text-2xl font-bold uppercase tracking-tight sm:text-3xl">
                                {course.jadwal_kuliah?.mata_kuliah?.nama_mata_kuliah}
                            </h1>
                            <p className="mt-2 text-xs text-neutral-400">
                                {course.jadwal_kuliah?.mata_kuliah?.kode_mata_kuliah} • {course.jadwal_kuliah?.hari}, {String(
                                    course.jadwal_kuliah?.jam_mulai || '-',
                                ).slice(0, 5)}{' '}
                                - {String(course.jadwal_kuliah?.jam_selesai || '-').slice(0, 5)}
                            </p>
                            <p className="text-[10px] uppercase tracking-widest text-neutral-500">Dosen: {course.jadwal_kuliah?.dosen?.nama_lengkap || '-'}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <ActionButton href={route('dosen.lms.index')} variant="secondary">← Semua Kelas LMS</ActionButton>
                            <ActionButton onClick={() => openChapterModal()} variant="primary">+ Tambah Topik</ActionButton>
                        </div>
                    </div>
                </section>

                <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <StatCard title="Total Topik" value={chapters.length} />
                    <StatCard title="Materi" value={totalMaterials} />
                    <StatCard title="Tugas" value={totalAssignments} />
                    <StatCard title="Forum" value={totalForums} />
                </section>

                {chapters.length === 0 ? (
                    <Box className="text-center">
                        <p className="text-sm text-neutral-500">
                            Belum ada topik materi. Klik <span className="font-semibold text-black">Tambah Topik</span> untuk mulai menyusun konten kelas.
                        </p>
                    </Box>
                ) : (
                    <section className="space-y-4">
                        {chapters.map((chapter, index) => (
                            <Box key={chapter.id}>
                                <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-[#e5e5e5] pb-4">
                                    <div>
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">Topik {index + 1}</p>
                                        <h2 className="text-lg font-bold uppercase tracking-tight text-black">{chapter.title}</h2>
                                        <p className="text-[10px] uppercase tracking-widest text-neutral-500">
                                            {chapter.materials?.length || 0} materi • {chapter.assignments?.length || 0} tugas • {chapter.forums?.length || 0} forum
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <ActionButton onClick={() => openChapterModal(chapter)} variant="secondary">Edit Topik</ActionButton>
                                        <ActionButton onClick={() => deleteChapter(chapter.id)} variant="danger">Hapus Topik</ActionButton>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                                    <Box variant="gray" className="p-4">
                                        <div className="mb-3 flex items-center justify-between">
                                            <h3 className="text-xs font-bold uppercase tracking-wider text-black">Materi Pembelajaran</h3>
                                            <ActionButton href={route('dosen.lms.materials.create', chapter.id)} variant="primary">+ Materi</ActionButton>
                                        </div>

                                        <div className="space-y-2">
                                            {(chapter.materials || []).length === 0 ? (
                                                <div className="border border-dashed border-[#e5e5e5] bg-white p-3 text-xs text-neutral-500">Belum ada materi di topik ini.</div>
                                            ) : (
                                                chapter.materials.map((material) => (
                                                    <div key={material.id} className="border border-[#e5e5e5] bg-white p-3">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div>
                                                                <p className="text-xs font-semibold uppercase tracking-wider text-black">{material.title}</p>
                                                                <p className="mt-0.5 text-[10px] uppercase tracking-widest text-neutral-500">{material.type}</p>
                                                            </div>
                                                            <div className="flex gap-1">
                                                                <ActionButton href={route('dosen.lms.materials.show', material.id)} variant="secondary">Lihat</ActionButton>
                                                                <ActionButton href={route('dosen.lms.materials.edit', material.id)} variant="secondary">Edit</ActionButton>
                                                                <ActionButton onClick={() => deleteMaterial(material.id)} variant="danger">Hapus</ActionButton>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </Box>

                                    <Box variant="gray" className="p-4">
                                        <div className="mb-3 flex items-center justify-between">
                                            <h3 className="text-xs font-bold uppercase tracking-wider text-black">Tugas dan Evaluasi</h3>
                                            <ActionButton href={route('dosen.lms.assignments.create', chapter.id)} variant="primary">+ Tugas</ActionButton>
                                        </div>

                                        <div className="space-y-2">
                                            {(chapter.assignments || []).length === 0 ? (
                                                <div className="border border-dashed border-[#e5e5e5] bg-white p-3 text-xs text-neutral-500">Belum ada tugas di topik ini.</div>
                                            ) : (
                                                chapter.assignments.map((assignment) => (
                                                    <div key={assignment.id} className="border border-[#e5e5e5] bg-white p-3">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div>
                                                                <p className="text-xs font-semibold uppercase tracking-wider text-black">{assignment.title}</p>
                                                                <p className="mt-0.5 text-[10px] uppercase tracking-widest text-neutral-500">
                                                                    {assignment.deadline
                                                                        ? `Deadline: ${new Date(assignment.deadline).toLocaleString('id-ID')}`
                                                                        : 'Tanpa deadline'}
                                                                </p>
                                                                <div className="mt-2 flex flex-wrap gap-1">
                                                                    <Badge variant="warning">{assignment.komponen || 'harian'}</Badge>
                                                                    <Badge>Bobot {assignment.bobot_komponen || 1}</Badge>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-wrap gap-1">
                                                                <ActionButton href={route('dosen.lms.assignments.grading', assignment.id)} variant="primary">Nilai</ActionButton>
                                                                <ActionButton href={route('dosen.lms.assignments.edit', assignment.id)} variant="secondary">Edit</ActionButton>
                                                                <ActionButton onClick={() => deleteAssignment(assignment.id)} variant="danger">Hapus</ActionButton>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </Box>

                                    <Box variant="gray" className="p-4">
                                        <div className="mb-3 flex items-center justify-between">
                                            <h3 className="text-xs font-bold uppercase tracking-wider text-black">Forum Diskusi</h3>
                                            <ActionButton onClick={() => openForumModal(chapter)} variant="primary">+ Forum</ActionButton>
                                        </div>

                                        <div className="space-y-2">
                                            {(chapter.forums || []).length === 0 ? (
                                                <div className="border border-dashed border-[#e5e5e5] bg-white p-3 text-xs text-neutral-500">Belum ada forum di topik ini.</div>
                                            ) : (
                                                chapter.forums.map((forum) => (
                                                    <div key={forum.id} className="border border-[#e5e5e5] bg-white p-3">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div>
                                                                <p className="text-xs font-semibold uppercase tracking-wider text-black">{forum.title}</p>
                                                                <div className="mt-1 flex flex-wrap items-center gap-1">
                                                                    <Badge variant={forum.is_active ? 'active' : 'default'}>{forum.is_active ? 'Aktif' : 'Nonaktif'}</Badge>
                                                                    <Badge>{forum.threads_count || 0} thread</Badge>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-wrap gap-1">
                                                                <ActionButton href={route('dosen.lms.forums.show', forum.id)} variant="primary">Kelola</ActionButton>
                                                                <ActionButton onClick={() => openForumModal(chapter, forum)} variant="secondary">Edit</ActionButton>
                                                                <ActionButton onClick={() => deleteForum(forum.id)} variant="danger">Hapus</ActionButton>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </Box>
                                </div>
                            </Box>
                        ))}
                    </section>
                )}
            </div>

            <Modal show={isChapterModalOpen} onClose={closeChapterModal} maxWidth="md">
                <Box className="m-0 border-0">
                    <h2 className="text-lg font-bold uppercase tracking-tight text-black">{editingChapter ? 'Edit Topik' : 'Tambah Topik Baru'}</h2>
                    <p className="mt-1 text-xs text-neutral-500">Judul topik digunakan untuk mengelompokkan materi dan tugas.</p>

                    <form onSubmit={submitChapter} className="mt-4 space-y-4">
                        <div>
                            <label htmlFor="chapter_title" className="mb-1 block text-xs font-semibold uppercase tracking-widest text-black">
                                Judul Topik
                            </label>
                            <input
                                id="chapter_title"
                                type="text"
                                value={chapterData.title}
                                onChange={(e) => setChapterData('title', e.target.value)}
                                className="block w-full border border-[#e5e5e5] bg-white px-3 py-2 text-sm text-neutral-700 placeholder-neutral-400 focus:border-black focus:outline-none"
                                required
                                autoFocus
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={closeChapterModal}
                                className="border border-[#e5e5e5] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-widest text-black transition hover:border-black hover:bg-neutral-100"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={chapterProcessing}
                                className="border border-black bg-black px-3 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-white hover:text-black disabled:opacity-60"
                            >
                                {chapterProcessing ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        </div>
                    </form>
                </Box>
            </Modal>

            <Modal show={isForumModalOpen} onClose={closeForumModal} maxWidth="lg">
                <Box className="m-0 border-0">
                    <h2 className="text-lg font-bold uppercase tracking-tight text-black">{editingForum ? 'Edit Forum' : 'Tambah Forum Baru'}</h2>
                    <p className="mt-1 text-xs text-neutral-500">Forum dipakai untuk diskusi per topik. Dosen dapat mengelola thread dan balasan.</p>

                    <form onSubmit={submitForum} className="mt-4 space-y-4">
                        <div>
                            <label htmlFor="forum_title" className="mb-1 block text-xs font-semibold uppercase tracking-widest text-black">
                                Judul Forum
                            </label>
                            <input
                                id="forum_title"
                                type="text"
                                value={forumData.title}
                                onChange={(e) => setForumData('title', e.target.value)}
                                className="block w-full border border-[#e5e5e5] bg-white px-3 py-2 text-sm text-neutral-700 placeholder-neutral-400 focus:border-black focus:outline-none"
                                required
                                autoFocus
                            />
                        </div>

                        <div>
                            <label htmlFor="forum_description" className="mb-1 block text-xs font-semibold uppercase tracking-widest text-black">
                                Deskripsi Forum
                            </label>
                            <textarea
                                id="forum_description"
                                rows={4}
                                value={forumData.description}
                                onChange={(e) => setForumData('description', e.target.value)}
                                className="block w-full border border-[#e5e5e5] bg-white px-3 py-2 text-sm text-neutral-700 placeholder-neutral-400 focus:border-black focus:outline-none"
                                placeholder="Ruang diskusi untuk topik ini..."
                            />
                        </div>

                        <label className="inline-flex items-center gap-2 text-xs text-neutral-700">
                            <input
                                type="checkbox"
                                checked={!!forumData.is_active}
                                onChange={(e) => setForumData('is_active', e.target.checked)}
                                className="rounded-none border-[#e5e5e5] text-black focus:ring-black"
                            />
                            <span>Aktifkan forum</span>
                        </label>

                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={closeForumModal}
                                className="border border-[#e5e5e5] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-widest text-black transition hover:border-black hover:bg-neutral-100"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={forumProcessing}
                                className="border border-black bg-black px-3 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-white hover:text-black disabled:opacity-60"
                            >
                                {forumProcessing ? 'Menyimpan...' : 'Simpan Forum'}
                            </button>
                        </div>
                    </form>
                </Box>
            </Modal>
        </AdminLayout>
    );
}
