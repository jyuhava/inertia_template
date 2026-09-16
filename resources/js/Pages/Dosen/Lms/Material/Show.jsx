import MaterialChatRoom from '@/Components/MaterialChatRoom';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

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

export default function Show({ material, chapter, course }) {
    const [chatOpen, setChatOpen] = useState(true);

    return (
        <AdminLayout title={`Materi: ${material.title}`}>
            <Head title={`Materi Dosen - ${material.title}`} />

            <div className="space-y-6">
                <section className="border border-black bg-black p-6 text-white sm:p-8">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-400">Pratinjau Materi</p>
                            <h1 className="mt-2 text-2xl font-bold uppercase tracking-tight sm:text-3xl">{material.title}</h1>
                            <p className="mt-2 text-xs text-neutral-400">
                                {course?.jadwal_kuliah?.mata_kuliah?.nama_mata_kuliah || '-'} • Bab: {chapter?.title || '-'}
                            </p>
                            <p className="mt-2 text-[10px] uppercase tracking-widest text-neutral-500">Tipe: {material.type}</p>
                        </div>
                        <div className="flex gap-2">
                            <ActionButton href={route('dosen.lms.show', course?.id)} variant="secondary">← Kembali ke Kelas</ActionButton>
                            <ActionButton href={route('dosen.lms.materials.edit', material.id)} variant="primary">Edit Materi</ActionButton>
                        </div>
                    </div>
                </section>

                <section className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-start">
                    <div className={chatOpen ? 'lg:col-span-7' : 'lg:col-span-12'}>
                        <Box>
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e5e5] pb-4">
                                <div className="text-xs uppercase tracking-widest text-neutral-500">
                                    Dosen: <span className="font-semibold text-black">{course?.jadwal_kuliah?.dosen?.nama_lengkap || '-'}</span>
                                </div>
                                <Badge variant="active">Mode Pratinjau</Badge>
                            </div>

                            <article className="prose max-w-none text-neutral-700">
                                {material.type === 'text' ? <div dangerouslySetInnerHTML={{ __html: material.content || '' }} /> : null}

                                {material.type === 'video' && material.content ? <div dangerouslySetInnerHTML={{ __html: material.content }} /> : null}

                                {material.type === 'video' && material.file_path ? (
                                    <video controls className="w-full">
                                        <source src={`/storage/${material.file_path}`} />
                                        Browser Anda tidak mendukung video.
                                    </video>
                                ) : null}

                                {material.type === 'file' && material.file_path ? (
                                    <div className="border border-[#e5e5e5] bg-[#f4f4f5] p-4">
                                        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-black">Lampiran Materi</p>
                                        <a
                                            href={`/storage/${material.file_path}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex border border-black bg-black px-3 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-white hover:text-black"
                                        >
                                            Download File
                                        </a>
                                    </div>
                                ) : null}
                            </article>
                        </Box>
                    </div>

                    {chatOpen ? (
                        <div className="lg:col-span-5">
                            <MaterialChatRoom
                                materialId={material.id}
                                endpointRoute="dosen.lms.materials.assistant"
                                title="Chat Materi (Dosen)"
                                overlay
                                open={chatOpen}
                                onOpenChange={setChatOpen}
                            />
                        </div>
                    ) : null}
                </section>

                {!chatOpen ? (
                    <MaterialChatRoom
                        materialId={material.id}
                        endpointRoute="dosen.lms.materials.assistant"
                        title="Chat Materi (Dosen)"
                        open={chatOpen}
                        onOpenChange={setChatOpen}
                    />
                ) : null}
            </div>
        </AdminLayout>
    );
}
