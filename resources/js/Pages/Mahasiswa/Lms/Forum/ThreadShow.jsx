import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
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
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-900">{children}</h2>
            {action ? <div>{action}</div> : null}
        </div>
    );
}

function ActionButton({ children, href, onClick, variant = 'primary', type = 'button', disabled = false }) {
    const map = {
        primary: 'bg-black text-white border border-black hover:bg-neutral-800',
        secondary: 'bg-white text-neutral-900 border border-neutral-300 hover:bg-neutral-50',
        outline: 'bg-white text-neutral-900 border border-neutral-900 hover:bg-neutral-100',
    };
    const className = `inline-flex items-center px-3 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${map[variant] || map.primary} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`;
    if (href) {
        return (
            <Link href={href} className={className}>
                {children}
            </Link>
        );
    }
    return (
        <button type={type} onClick={onClick} disabled={disabled} className={className}>
            {children}
        </button>
    );
}

function Badge({ children, variant = 'default' }) {
    const map = {
        default: 'bg-neutral-100 text-neutral-700',
        primary: 'bg-neutral-900 text-white',
        muted: 'bg-white text-neutral-700 border border-neutral-200',
    };
    return <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-bold ${map[variant] || map.default}`}>{children}</span>;
}

export default function ThreadShow({ thread, forum, chapter, course }) {
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [replyAnchorKey, setReplyAnchorKey] = useState('thread');
    const [replyParentId, setReplyParentId] = useState(null);
    const replies = thread?.replies || [];
    const replyTree = useMemo(() => buildReplyTree(replies), [replies]);
    const authorMap = useMemo(() => {
        const map = new Map();
        replies.forEach((reply) => {
            map.set(reply.id, resolveAuthorName(reply));
        });
        return map;
    }, [replies]);
    const threadAuthor = resolveAuthorName(thread, course?.jadwal_kuliah?.dosen?.nama_lengkap || 'Dosen Pengampu');
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

    const submitReply = (e) => {
        e.preventDefault();
        postReply(route('mahasiswa.lms.forums.replies.store', thread.id), {
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
        if (showReplyForm && replyAnchorKey === 'thread') {
            setShowReplyForm(false);
            setReplyParentId(null);
            setReplyData('parent_reply_id', null);
            resetReply();
            return;
        }

        setReplyParentId(null);
        setReplyAnchorKey('thread');
        setReplyData('parent_reply_id', null);
        setShowReplyForm(true);
    };

    const openReplyFormForReply = (replyId) => {
        if (showReplyForm && replyAnchorKey === `reply-${replyId}`) {
            setShowReplyForm(false);
            setReplyParentId(null);
            setReplyData('parent_reply_id', null);
            resetReply();
            return;
        }

        setReplyParentId(replyId);
        setReplyAnchorKey(`reply-${replyId}`);
        setReplyData('parent_reply_id', replyId);
        setShowReplyForm(true);
    };

    return (
        <AdminLayout title="Detail Thread Forum">
            <Head title={`Thread - ${thread.title}`} />

            <div className="space-y-6">
                <Box variant="black" className="relative overflow-hidden">
                    <div className="absolute right-0 top-0 h-32 w-32 bg-neutral-800/30" />
                    <div className="absolute bottom-0 left-0 h-24 w-24 bg-neutral-800/20" />
                    <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">Detail Thread</p>
                    <h1 className="mt-1 text-2xl font-bold">{thread.title}</h1>
                    <p className="mt-2 text-sm text-neutral-300">
                        Forum: {forum?.title || '-'} • Bab: {chapter?.title || '-'}
                    </p>
                    <div className="mt-4">
                        <ActionButton href={route('mahasiswa.lms.forums.show', forum.id)} variant="secondary">
                            ← Kembali ke Forum
                        </ActionButton>
                    </div>
                </Box>

                <Box>
                    <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                        <span>Oleh: {threadAuthor}</span>
                        <span>•</span>
                        <span>{new Date(thread.created_at).toLocaleString('id-ID')}</span>
                        {thread.is_pinned ? <Badge variant="primary">Pinned</Badge> : null}
                        {thread.is_locked ? <Badge variant="muted">Locked</Badge> : null}
                    </div>
                    <div className="prose max-w-none text-neutral-700" dangerouslySetInnerHTML={{ __html: thread.content || '' }} />

                    <div className="mt-4 border-t border-neutral-200 pt-4">
                        <ActionButton onClick={openReplyFormForThread} variant="outline">
                            {showReplyForm ? 'Tutup Form Balasan' : 'Balas'}
                        </ActionButton>
                    </div>
                </Box>

                {showReplyForm && replyAnchorKey === 'thread' ? (
                    <Box>
                        <SectionTitle>Balas Thread</SectionTitle>
                        <form onSubmit={submitReply} className="space-y-3">
                            <div className="min-h-[110px] border border-neutral-200 p-2">
                                <RichTextEditor
                                    value={replyData.content}
                                    onChange={(content) => setReplyData('content', content)}
                                    placeholder={replyParentId ? 'Tulis balasan untuk komentar ini...' : 'Tulis balasan dengan rich text...'}
                                />
                            </div>
                            {replyErrors.content ? <p className="text-xs text-rose-600">{replyErrors.content}</p> : null}
                            <div className="flex justify-end">
                                <ActionButton type="submit" disabled={replyProcessing}>
                                    {replyProcessing ? 'Mengirim...' : 'Kirim Balasan'}
                                </ActionButton>
                            </div>
                        </form>
                    </Box>
                ) : null}

                <section className="space-y-3">
                    <SectionTitle>Balasan</SectionTitle>
                    {replyTree.length === 0 ? (
                        <Box className="border-dashed text-center">
                            <p className="text-sm text-neutral-500">Belum ada balasan.</p>
                        </Box>
                    ) : (
                        replyTree.map((node) => (
                            <ReplyNode
                                key={node.id}
                                node={node}
                                depth={0}
                                showReplyForm={showReplyForm}
                                replyAnchorKey={replyAnchorKey}
                                replyData={replyData}
                                setReplyData={setReplyData}
                                replyErrors={replyErrors}
                                replyProcessing={replyProcessing}
                                submitReply={submitReply}
                                openReplyFormForReply={openReplyFormForReply}
                                authorMap={authorMap}
                            />
                        ))
                    )}
                </section>
            </div>
        </AdminLayout>
    );
}

function ReplyNode({ node, depth, showReplyForm, replyAnchorKey, replyData, setReplyData, replyErrors, replyProcessing, submitReply, openReplyFormForReply, authorMap }) {
    const indentClass = depth > 0 ? 'ml-6 border-l-2 border-neutral-200 pl-4' : '';
    const authorName = resolveAuthorName(node);
    const parentAuthorName = node.parent_reply_id ? (authorMap.get(node.parent_reply_id) || 'Akun Tidak Ditemukan') : null;

    return (
        <div className={indentClass}>
            <article className="border border-neutral-200 bg-white p-4">
                <div className="mb-2 flex items-center justify-between gap-2 text-xs text-neutral-500">
                    <span>
                        {authorName} • {new Date(node.created_at).toLocaleString('id-ID')}
                    </span>
                    <button
                        type="button"
                        onClick={() => openReplyFormForReply(node.id)}
                        className="border border-neutral-900 px-2 py-1 text-[11px] font-bold uppercase tracking-widest text-neutral-900 hover:bg-neutral-100"
                    >
                        Balas
                    </button>
                </div>
                {parentAuthorName ? (
                    <div className="mb-2 inline-flex items-center bg-neutral-100 px-2.5 py-1 text-[11px] font-bold text-neutral-600">
                        Membalas {parentAuthorName}
                    </div>
                ) : null}
                <div className="prose max-w-none text-sm text-neutral-700" dangerouslySetInnerHTML={{ __html: node.content || '' }} />

                {showReplyForm && replyAnchorKey === `reply-${node.id}` ? (
                    <form onSubmit={submitReply} className="mt-3 space-y-2 border border-neutral-200 bg-neutral-50 p-3">
                        <p className="text-xs font-bold uppercase tracking-widest text-neutral-900">Balas Komentar</p>
                        <div className="min-h-[100px] border border-neutral-200 bg-white p-2">
                            <RichTextEditor
                                value={replyData.content}
                                onChange={(content) => setReplyData('content', content)}
                                placeholder="Tulis balasan untuk komentar ini..."
                            />
                        </div>
                        {replyErrors.content ? <p className="text-xs text-rose-600">{replyErrors.content}</p> : null}
                        <div className="flex justify-end">
                            <ActionButton type="submit" disabled={replyProcessing}>
                                {replyProcessing ? 'Mengirim...' : 'Kirim Balasan'}
                            </ActionButton>
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
                          showReplyForm={showReplyForm}
                          replyAnchorKey={replyAnchorKey}
                          replyData={replyData}
                          setReplyData={setReplyData}
                          replyErrors={replyErrors}
                          replyProcessing={replyProcessing}
                          submitReply={submitReply}
                          openReplyFormForReply={openReplyFormForReply}
                          authorMap={authorMap}
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

function resolveAuthorName(node, fallback = 'Peserta Kelas') {
    return node?.mahasiswa?.nama_lengkap || node?.dosen?.nama_lengkap || fallback;
}
