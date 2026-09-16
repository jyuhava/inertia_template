import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import RichTextEditor from '@/Components/RichTextEditor';
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

function SectionTitle({ children, action }) {
    return (
        <div className="mb-4 flex items-center justify-between border-b border-[#e5e5e5] pb-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-black">{children}</h2>
            {action ? <div>{action}</div> : null}
        </div>
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

export default function ThreadShow({ thread, forum, chapter, course }) {
    const [editingReplyId, setEditingReplyId] = useState(null);
    const [isThreadEditOpen, setIsThreadEditOpen] = useState(false);
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [replyAnchorKey, setReplyAnchorKey] = useState('thread');
    const [replyParentId, setReplyParentId] = useState(null);

    const {
        data: threadData,
        setData: setThreadData,
        put: putThread,
        processing: threadProcessing,
        errors: threadErrors,
    } = useForm({
        title: thread.title || '',
        content: thread.content || '',
        is_pinned: !!thread.is_pinned,
        is_locked: !!thread.is_locked,
    });

    const {
        data: replyData,
        setData: setReplyData,
        post: postReply,
        reset: resetReply,
        processing: replyProcessing,
        errors: replyErrors,
    } = useForm({
        content: '',
        parent_reply_id: null,
    });

    const {
        data: editReplyData,
        setData: setEditReplyData,
        put: putReply,
        reset: resetEditReply,
        processing: editReplyProcessing,
        errors: editReplyErrors,
    } = useForm({
        content: '',
    });

    const submitThreadEdit = (e) => {
        e.preventDefault();
        putThread(route('dosen.lms.forums.threads.update', thread.id), {
            preserveScroll: true,
            onSuccess: () => setIsThreadEditOpen(false),
        });
    };

    const submitReply = (e) => {
        e.preventDefault();
        postReply(route('dosen.lms.forums.replies.store', thread.id), {
            preserveScroll: true,
            onSuccess: () => {
                resetReply();
                setReplyParentId(null);
                setReplyAnchorKey('thread');
                setShowReplyForm(false);
            },
        });
    };

    const openReplyFormForThread = () => {
        setReplyParentId(null);
        setReplyAnchorKey('thread');
        setShowReplyForm((prev) => {
            if (!prev) {
                setReplyData('parent_reply_id', null);
                return true;
            }
            return replyAnchorKey === 'thread' ? false : true;
        });
        if (!showReplyForm || replyAnchorKey !== 'thread') {
            setReplyData('parent_reply_id', null);
        } else {
            resetReply();
        }
    };

    const openReplyFormForReply = (replyId) => {
        setReplyParentId(replyId);
        setReplyAnchorKey(`reply-${replyId}`);
        setReplyData('parent_reply_id', replyId);
        setShowReplyForm(true);
    };

    const startEditReply = (reply) => {
        setEditingReplyId(reply.id);
        setEditReplyData('content', reply.content || '');
    };

    const cancelEditReply = () => {
        setEditingReplyId(null);
        resetEditReply();
    };

    const submitEditReply = (e) => {
        e.preventDefault();
        if (!editingReplyId) {
            return;
        }
        putReply(route('dosen.lms.forums.replies.update', editingReplyId), {
            preserveScroll: true,
            onSuccess: cancelEditReply,
        });
    };

    const deleteReply = (replyId) => {
        if (confirm('Hapus balasan ini?')) {
            router.delete(route('dosen.lms.forums.replies.delete', replyId), {
                preserveScroll: true,
            });
        }
    };

    const deleteThread = () => {
        if (confirm('Hapus thread ini beserta semua balasan?')) {
            router.delete(route('dosen.lms.forums.threads.delete', thread.id));
        }
    };

    const replies = thread.replies || [];
    const replyTree = useMemo(() => buildReplyTree(replies), [replies]);

    return (
        <AdminLayout title="Detail Thread Forum">
            <Head title={`Thread - ${thread.title}`} />

            <div className="space-y-6">
                <section className="border border-black bg-black p-6 text-white sm:p-8">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-400">Detail Thread</p>
                    <h1 className="mt-2 text-2xl font-bold uppercase tracking-tight sm:text-3xl">{thread.title}</h1>
                    <p className="mt-2 text-xs text-neutral-400">
                        Forum: {forum?.title || '-'} • Bab: {chapter?.title || '-'}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                        <ActionButton href={route('dosen.lms.forums.show', forum.id)} variant="secondary">← Kembali ke Forum</ActionButton>
                        <ActionButton onClick={() => setIsThreadEditOpen(true)} variant="secondary">Edit Thread</ActionButton>
                        <ActionButton onClick={deleteThread} variant="danger">Hapus Thread</ActionButton>
                    </div>
                </section>

                <Box>
                    <div className="mb-3 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-widest text-neutral-500">
                        <span>Oleh: {thread.dosen?.nama_lengkap || 'Pengguna'}</span>
                        <span>•</span>
                        <span>{new Date(thread.created_at).toLocaleString('id-ID')}</span>
                        {thread.is_pinned ? <Badge variant="active">Pinned</Badge> : null}
                        {thread.is_locked ? <Badge>Locked</Badge> : null}
                    </div>
                    <div className="prose max-w-none text-neutral-700" dangerouslySetInnerHTML={{ __html: thread.content || '' }} />

                    <div className="mt-4 border-t border-[#e5e5e5] pt-4">
                        <ActionButton onClick={openReplyFormForThread} variant="secondary">
                            {showReplyForm ? 'Tutup Form Balasan' : 'Balas'}
                        </ActionButton>
                    </div>
                </Box>

                {showReplyForm && replyAnchorKey === 'thread' ? (
                    <Box>
                        <SectionTitle>Balas Thread</SectionTitle>
                        <form onSubmit={submitReply} className="space-y-2">
                            <div className="min-h-[110px] border border-[#e5e5e5] bg-white p-2">
                                <RichTextEditor
                                    value={replyData.content}
                                    onChange={(content) => setReplyData('content', content)}
                                    placeholder={replyParentId ? 'Tulis balasan untuk komentar ini...' : 'Tulis balasan dengan rich text...'}
                                />
                            </div>
                            {replyErrors.content ? <p className="text-xs text-rose-600">{replyErrors.content}</p> : null}
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={replyProcessing}
                                    className="border border-black bg-black px-3 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-white hover:text-black disabled:opacity-60"
                                >
                                    {replyProcessing ? 'Mengirim...' : 'Kirim Balasan'}
                                </button>
                            </div>
                        </form>
                    </Box>
                ) : null}

                <section className="space-y-3">
                    {replies.length === 0 ? (
                        <Box className="text-center">
                            <p className="text-sm text-neutral-500">Belum ada balasan.</p>
                        </Box>
                    ) : (
                        replyTree.map((node) => (
                            <ReplyNode
                                key={node.id}
                                node={node}
                                depth={0}
                                editingReplyId={editingReplyId}
                                editReplyData={editReplyData}
                                setEditReplyData={setEditReplyData}
                                editReplyErrors={editReplyErrors}
                                editReplyProcessing={editReplyProcessing}
                                submitEditReply={submitEditReply}
                                cancelEditReply={cancelEditReply}
                                startEditReply={startEditReply}
                                deleteReply={deleteReply}
                                showReplyForm={showReplyForm}
                                replyAnchorKey={replyAnchorKey}
                                replyData={replyData}
                                setReplyData={setReplyData}
                                replyErrors={replyErrors}
                                replyProcessing={replyProcessing}
                                submitReply={submitReply}
                                openReplyFormForReply={openReplyFormForReply}
                            />
                        ))
                    )}
                </section>
            </div>

            <Modal show={isThreadEditOpen} onClose={() => setIsThreadEditOpen(false)} maxWidth="lg">
                <Box className="m-0 border-0">
                    <h2 className="text-lg font-bold uppercase tracking-tight text-black">Edit Thread</h2>
                    <form onSubmit={submitThreadEdit} className="mt-4 space-y-4">
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
                                <RichTextEditor value={threadData.content} onChange={(content) => setThreadData('content', content)} />
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
                                onClick={() => setIsThreadEditOpen(false)}
                                className="border border-[#e5e5e5] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-widest text-black transition hover:border-black hover:bg-neutral-100"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={threadProcessing}
                                className="border border-black bg-black px-3 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-white hover:text-black disabled:opacity-60"
                            >
                                {threadProcessing ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </button>
                        </div>
                    </form>
                </Box>
            </Modal>
        </AdminLayout>
    );
}

function ReplyNode({
    node,
    depth,
    editingReplyId,
    editReplyData,
    setEditReplyData,
    editReplyErrors,
    editReplyProcessing,
    submitEditReply,
    cancelEditReply,
    startEditReply,
    deleteReply,
    showReplyForm,
    replyAnchorKey,
    replyData,
    setReplyData,
    replyErrors,
    replyProcessing,
    submitReply,
    openReplyFormForReply,
}) {
    const indentClass = depth > 0 ? 'ml-6 border-l-2 border-[#e5e5e5] pl-4' : '';

    return (
        <div className={indentClass}>
            <article className="border border-[#e5e5e5] bg-white p-4 shadow-sm">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-[10px] uppercase tracking-widest text-neutral-500">
                    <span>
                        {node.mahasiswa?.nama_lengkap || node.dosen?.nama_lengkap || 'Pengguna'} • {new Date(node.created_at).toLocaleString('id-ID')}
                    </span>
                    <div className="flex gap-1">
                        <ActionButton onClick={() => openReplyFormForReply(node.id)} variant="secondary">Balas</ActionButton>
                        <ActionButton onClick={() => startEditReply(node)} variant="secondary">Edit</ActionButton>
                        <ActionButton onClick={() => deleteReply(node.id)} variant="danger">Hapus</ActionButton>
                    </div>
                </div>

                {editingReplyId === node.id ? (
                    <form onSubmit={submitEditReply} className="space-y-2">
                        <div className="min-h-[100px] border border-[#e5e5e5] bg-white p-2">
                            <RichTextEditor
                                value={editReplyData.content}
                                onChange={(content) => setEditReplyData('content', content)}
                                placeholder="Edit balasan..."
                            />
                        </div>
                        {editReplyErrors.content ? <p className="text-xs text-rose-600">{editReplyErrors.content}</p> : null}
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={cancelEditReply}
                                className="border border-[#e5e5e5] bg-white px-2.5 py-1.5 text-xs font-semibold uppercase tracking-widest text-black transition hover:border-black hover:bg-neutral-100"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={editReplyProcessing}
                                className="border border-black bg-black px-2.5 py-1.5 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-white hover:text-black disabled:opacity-60"
                            >
                                {editReplyProcessing ? 'Menyimpan...' : 'Simpan Edit'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="prose max-w-none text-sm text-neutral-700" dangerouslySetInnerHTML={{ __html: node.content || '' }} />
                )}

                {showReplyForm && replyAnchorKey === `reply-${node.id}` ? (
                    <form onSubmit={submitReply} className="mt-3 space-y-2 border border-[#e5e5e5] bg-[#f4f4f5] p-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-black">Balas Komentar</p>
                        <div className="min-h-[100px] border border-[#e5e5e5] bg-white p-2">
                            <RichTextEditor
                                value={replyData.content}
                                onChange={(content) => setReplyData('content', content)}
                                placeholder="Tulis balasan untuk komentar ini..."
                            />
                        </div>
                        {replyErrors.content ? <p className="text-xs text-rose-600">{replyErrors.content}</p> : null}
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={replyProcessing}
                                className="border border-black bg-black px-3 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-white hover:text-black disabled:opacity-60"
                            >
                                {replyProcessing ? 'Mengirim...' : 'Kirim Balasan'}
                            </button>
                        </div>
                    </form>
                ) : null}
            </article>

            {node.children?.length
                ? node.children.map((child) => (
                      <ReplyNode
                          key={child.id}
                          node={child}
                          depth={depth + 1}
                          editingReplyId={editingReplyId}
                          editReplyData={editReplyData}
                          setEditReplyData={setEditReplyData}
                          editReplyErrors={editReplyErrors}
                          editReplyProcessing={editReplyProcessing}
                          submitEditReply={submitEditReply}
                          cancelEditReply={cancelEditReply}
                          startEditReply={startEditReply}
                          deleteReply={deleteReply}
                          showReplyForm={showReplyForm}
                          replyAnchorKey={replyAnchorKey}
                          replyData={replyData}
                          setReplyData={setReplyData}
                          replyErrors={replyErrors}
                          replyProcessing={replyProcessing}
                          submitReply={submitReply}
                          openReplyFormForReply={openReplyFormForReply}
                      />
                  ))
                : null}
        </div>
    );
}

function buildReplyTree(items) {
    const byId = new Map();
    const roots = [];

    items.forEach((item) => {
        byId.set(item.id, { ...item, children: [] });
    });

    items.forEach((item) => {
        const node = byId.get(item.id);
        if (item.parent_reply_id && byId.has(item.parent_reply_id)) {
            byId.get(item.parent_reply_id).children.push(node);
            return;
        }
        roots.push(node);
    });

    return roots;
}
