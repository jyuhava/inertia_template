import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import RichTextEditor from '@/Components/RichTextEditor';
import Modal from '@/Components/Modal';

function Box({ children, className = '', padded = true, variant = 'white' }) {
    const variants = {
        white: 'bg-white border-[#e5e5e5]',
        black: 'bg-black border-black text-white',
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

export default function Show({ forum, chapter, course }) {
    const [editingThreadId, setEditingThreadId] = useState(null);
    const [isThreadModalOpen, setIsThreadModalOpen] = useState(false);

    const {
        data: threadData,
        setData: setThreadData,
        post: postThread,
        put: putThread,
        reset: resetThread,
        processing: threadProcessing,
        errors: threadErrors,
    } = useForm({
        title: '',
        content: '',
        is_pinned: false,
        is_locked: false,
    });

    const threads = forum?.threads || [];
    const totalReplies = useMemo(() => threads.reduce((sum, t) => sum + (t.replies_count || 0), 0), [threads]);

    const openCreateThreadModal = () => {
        setEditingThreadId(null);
        resetThread();
        setIsThreadModalOpen(true);
    };

    const startEditThread = (thread) => {
        setEditingThreadId(thread.id);
        setThreadData({
            title: thread.title || '',
            content: thread.content || '',
            is_pinned: !!thread.is_pinned,
            is_locked: !!thread.is_locked,
        });
        setIsThreadModalOpen(true);
    };

    const closeThreadModal = () => {
        setEditingThreadId(null);
        setIsThreadModalOpen(false);
        resetThread();
    };

    const submitThread = (e) => {
        e.preventDefault();

        if (editingThreadId) {
            putThread(route('dosen.lms.forums.threads.update', editingThreadId), {
                preserveScroll: true,
                onSuccess: closeThreadModal,
            });
            return;
        }

        postThread(route('dosen.lms.forums.threads.store', forum.id), {
            preserveScroll: true,
            onSuccess: closeThreadModal,
        });
    };

    const deleteThread = (threadId) => {
        if (confirm('Hapus thread ini beserta semua balasan?')) {
            router.delete(route('dosen.lms.forums.threads.delete', threadId), {
                preserveScroll: true,
            });
        }
    };

    return (
        <AdminLayout title="Kelola Forum LMS">
            <Head title={`Forum - ${forum.title}`} />

            <div className="space-y-6">
                <section className="border border-black bg-black p-6 text-white sm:p-8">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-400">Forum Bab</p>
                    <h1 className="mt-2 text-2xl font-bold uppercase tracking-tight sm:text-3xl">{forum.title}</h1>
                    <p className="mt-2 text-xs text-neutral-400">
                        {course?.jadwal_kuliah?.mata_kuliah?.nama_mata_kuliah || '-'} • Bab: {chapter?.title || '-'}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                        <ActionButton href={route('dosen.lms.show', course.id)} variant="secondary">← Kembali ke LMS</ActionButton>
                    </div>
                </section>

                <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <StatCard title="Total Thread" value={threads.length} />
                    <StatCard title="Total Balasan" value={totalReplies} />
                    <Box className="relative overflow-hidden">
                        <p className="text-[10px] uppercase tracking-widest text-neutral-500">Status Forum</p>
                        <div className="mt-2">
                            <Badge variant={forum.is_active ? 'active' : 'default'}>{forum.is_active ? 'Aktif' : 'Nonaktif'}</Badge>
                        </div>
                    </Box>
                </section>

                <Box>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-black">Daftar Thread</h2>
                            <p className="mt-1 text-xs text-neutral-500">Klik buka thread untuk masuk ke halaman detail diskusi.</p>
                        </div>
                        <ActionButton onClick={openCreateThreadModal} variant="primary">+ Thread Baru</ActionButton>
                    </div>
                </Box>

                <section className="space-y-4">
                    {threads.length === 0 ? (
                        <Box className="text-center">
                            <p className="text-sm text-neutral-500">Belum ada thread pada forum ini.</p>
                        </Box>
                    ) : (
                        threads.map((thread) => (
                            <Box key={thread.id}>
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <h3 className="text-base font-bold uppercase tracking-tight text-black">{thread.title}</h3>
                                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-widest text-neutral-500">
                                            <span>Oleh: {thread.dosen?.nama_lengkap || 'Dosen'}</span>
                                            <span>•</span>
                                            <span>{new Date(thread.created_at).toLocaleString('id-ID')}</span>
                                        </div>
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {thread.is_pinned ? <Badge variant="active">Pinned</Badge> : null}
                                            {thread.is_locked ? <Badge>Locked</Badge> : null}
                                            <Badge>{thread.replies_count || 0} balasan</Badge>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        <ActionButton href={route('dosen.lms.forums.threads.show', thread.id)} variant="primary">Buka Thread</ActionButton>
                                        <ActionButton onClick={() => startEditThread(thread)} variant="secondary">Edit</ActionButton>
                                        <ActionButton onClick={() => deleteThread(thread.id)} variant="danger">Hapus</ActionButton>
                                    </div>
                                </div>
                            </Box>
                        ))
                    )}
                </section>
            </div>

            <Modal show={isThreadModalOpen} onClose={closeThreadModal} maxWidth="lg">
                <Box className="m-0 border-0">
                    <h2 className="text-lg font-bold uppercase tracking-tight text-black">{editingThreadId ? 'Edit Thread' : 'Buat Thread Baru'}</h2>
                    <p className="mt-1 text-xs text-neutral-500">Judul dan isi thread menggunakan rich text agar diskusi lebih terstruktur.</p>

                    <form onSubmit={submitThread} className="mt-4 space-y-4">
                        <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-black">Judul Thread</label>
                            <input
                                type="text"
                                value={threadData.title}
                                onChange={(e) => setThreadData('title', e.target.value)}
                                className="block w-full border border-[#e5e5e5] bg-white px-3 py-2 text-sm text-neutral-700 placeholder-neutral-400 focus:border-black focus:outline-none"
                                required
                            />
                            {threadErrors.title ? <p className="mt-1 text-xs text-rose-600">{threadErrors.title}</p> : null}
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-black">Isi Thread</label>
                            <div className="min-h-[220px] border border-[#e5e5e5] bg-white p-2">
                                <RichTextEditor
                                    value={threadData.content}
                                    onChange={(content) => setThreadData('content', content)}
                                    placeholder="Tuliskan pembuka diskusi, pertanyaan, atau arahan forum..."
                                />
                            </div>
                            {threadErrors.content ? <p className="mt-1 text-xs text-rose-600">{threadErrors.content}</p> : null}
                        </div>

                        <div className="flex flex-wrap gap-4">
                            <label className="inline-flex items-center gap-2 text-xs text-neutral-700">
                                <input
                                    type="checkbox"
                                    checked={!!threadData.is_pinned}
                                    onChange={(e) => setThreadData('is_pinned', e.target.checked)}
                                    className="rounded-none border-[#e5e5e5] text-black focus:ring-black"
                                />
                                <span>Pin thread</span>
                            </label>
                            <label className="inline-flex items-center gap-2 text-xs text-neutral-700">
                                <input
                                    type="checkbox"
                                    checked={!!threadData.is_locked}
                                    onChange={(e) => setThreadData('is_locked', e.target.checked)}
                                    className="rounded-none border-[#e5e5e5] text-black focus:ring-black"
                                />
                                <span>Kunci thread</span>
                            </label>
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={closeThreadModal}
                                className="border border-[#e5e5e5] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-widest text-black transition hover:border-black hover:bg-neutral-100"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={threadProcessing}
                                className="border border-black bg-black px-3 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-white hover:text-black disabled:opacity-60"
                            >
                                {threadProcessing ? 'Menyimpan...' : editingThreadId ? 'Update Thread' : 'Publikasikan Thread'}
                            </button>
                        </div>
                    </form>
                </Box>
            </Modal>
        </AdminLayout>
    );
}
