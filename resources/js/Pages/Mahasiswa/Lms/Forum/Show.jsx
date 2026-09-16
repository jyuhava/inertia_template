import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';

function Box({ children, className = '', padded = true, variant = 'white' }) {
    const variants = {
        white: 'bg-white border border-neutral-200',
        black: 'bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 border-transparent text-white rounded-2xl shadow-lg shadow-violet-500/20',
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

export default function Show({ forum, chapter, course }) {
    const threads = forum?.threads || [];

    return (
        <AdminLayout title="Forum Diskusi">
            <Head title={`Forum - ${forum.title}`} />

            <div className="space-y-6">
                <Box variant="black" className="relative overflow-hidden">
                    <div className="absolute right-0 top-0 h-32 w-32 bg-white/10" />
                    <div className="absolute bottom-0 left-0 h-24 w-24 bg-white/10" />
                    <p className="text-xs font-bold uppercase tracking-widest text-white/75">Forum Bab</p>
                    <h1 className="mt-1 text-2xl font-bold">{forum.title}</h1>
                    <p className="mt-2 text-sm text-white/85">
                        {course?.jadwal_kuliah?.mata_kuliah?.nama_mata_kuliah || '-'} • Bab: {chapter?.title || '-'}
                    </p>
                    <div className="mt-4">
                        <ActionButton href={route('mahasiswa.lms.show', course.id)} variant="secondary">
                            ← Kembali ke LMS
                        </ActionButton>
                    </div>
                </Box>

                <section className="space-y-3">
                    <SectionTitle>Daftar Thread</SectionTitle>
                    {threads.length === 0 ? (
                        <Box className="border-dashed text-center">
                            <p className="text-sm text-neutral-500">Belum ada thread pada forum ini.</p>
                        </Box>
                    ) : (
                        threads.map((thread) => (
                            <article key={thread.id} className="bg-white p-5 border border-neutral-200">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h3 className="text-lg font-bold text-neutral-900">{thread.title}</h3>
                                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                                            <span>Oleh: {thread.dosen?.nama_lengkap || 'Dosen'}</span>
                                            <span>•</span>
                                            <span>{new Date(thread.created_at).toLocaleString('id-ID')}</span>
                                        </div>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {thread.is_pinned ? <Badge variant="primary">Pinned</Badge> : null}
                                            <Badge variant="muted">{thread.replies_count || 0} balasan</Badge>
                                        </div>
                                    </div>
                                    <ActionButton href={route('mahasiswa.lms.forums.threads.show', thread.id)} variant="outline">
                                        Buka Thread
                                    </ActionButton>
                                </div>
                            </article>
                        ))
                    )}
                </section>
            </div>
        </AdminLayout>
    );
}
