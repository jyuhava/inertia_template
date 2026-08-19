import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import MaterialChatRoom from '@/Components/MaterialChatRoom';
import { useState } from 'react';

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
        danger: 'bg-white text-neutral-900 border border-neutral-900 hover:bg-neutral-100',
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

function MetaChip({ icon, label }) {
    return (
        <span className="inline-flex items-center gap-2 border border-neutral-200 bg-white px-2.5 py-1 text-xs text-neutral-700">
            {icon}
            <span>{label}</span>
        </span>
    );
}

function TypeGlyph({ type }) {
    if (type === 'video') {
        return <PlayGlyph />;
    }
    if (type === 'file') {
        return <FileGlyph />;
    }
    return <BookGlyph />;
}

function StatusDot({ done }) {
    return <span className={`h-2 w-2 ${done ? 'bg-neutral-900' : 'bg-neutral-400'}`} />;
}

export default function MaterialShow({ material, chapter, course, isCompleted }) {
    const { post, processing } = useForm();
    const [chatOpen, setChatOpen] = useState(true);

    const toggleProgress = () => {
        post(route('mahasiswa.lms.materials.toggle', material.id), {
            preserveScroll: true,
        });
    };

    return (
        <AdminLayout title={`Materi: ${material.title}`}>
            <Head title={`Materi - ${material.title}`} />

            <div className="space-y-6">
                <Box variant="black" className="relative overflow-hidden">
                    <div className="absolute right-0 top-0 h-32 w-32 bg-neutral-800/30" />
                    <div className="absolute bottom-0 left-0 h-24 w-24 bg-neutral-800/20" />
                    <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">Detail Materi</p>
                            <h1 className="mt-1 text-2xl font-bold md:text-3xl">{material.title}</h1>
                            <p className="mt-2 text-sm text-neutral-300">
                                {course?.jadwal_kuliah?.mata_kuliah?.nama_mata_kuliah || '-'} • Bab: {chapter?.title || '-'}
                            </p>
                            <div className="mt-3 inline-flex items-center gap-2 border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase text-neutral-200">
                                <TypeGlyph type={material.type} />
                                <span>{material.type}</span>
                            </div>
                        </div>
                        <ActionButton href={route('mahasiswa.lms.show', course?.id)} variant="secondary">
                            ← Kembali ke Kelas
                        </ActionButton>
                    </div>
                </Box>

                <section className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-start">
                    <div className={chatOpen ? 'lg:col-span-7' : 'lg:col-span-12'}>
                        <Box padded={false} className="overflow-hidden">
                            <div className="border-b border-neutral-200 bg-neutral-50 px-5 py-4">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">Materi Aktif</p>
                                        <h2 className="text-lg font-bold text-neutral-900">{material.title}</h2>
                                    </div>
                                    <span
                                        className={`inline-flex items-center gap-2 px-2.5 py-1 text-xs font-bold ${
                                            isCompleted ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-900 border border-neutral-900'
                                        }`}
                                    >
                                        <StatusDot done={isCompleted} />
                                        {isCompleted ? 'Sudah Dipelajari' : 'Belum Selesai'}
                                    </span>
                                </div>
                                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-neutral-600">
                                    <MetaChip icon={<TeacherGlyph />} label={`Dosen: ${course?.jadwal_kuliah?.dosen?.nama_lengkap || '-'}`} />
                                    <MetaChip icon={<BookGlyph />} label={`Bab: ${chapter?.title || '-'}`} />
                                </div>
                            </div>

                            <div className="px-5 py-5">
                                <article className="prose max-w-none text-neutral-700">
                                    {material.type === 'text' ? <div dangerouslySetInnerHTML={{ __html: material.content || '' }} /> : null}

                                    {material.type === 'video' && material.content ? <div dangerouslySetInnerHTML={{ __html: material.content }} /> : null}

                                    {material.type === 'video' && material.file_path ? (
                                        <div className="border border-neutral-200 bg-neutral-50 p-2">
                                            <video controls className="w-full">
                                                <source src={`/storage/${material.file_path}`} />
                                                Browser Anda tidak mendukung video.
                                            </video>
                                        </div>
                                    ) : null}

                                    {material.type === 'file' && material.file_path ? (
                                        <div className="border border-neutral-200 bg-neutral-50 p-4">
                                            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-neutral-700">
                                                <FileGlyph />
                                                <span>Lampiran Materi</span>
                                            </div>
                                            <a
                                                href={`/storage/${material.file_path}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-2 bg-black px-3 py-2 text-xs font-bold uppercase tracking-widest text-white hover:bg-neutral-800"
                                            >
                                                <DownloadGlyph />
                                                <span>Download File</span>
                                            </a>
                                        </div>
                                    ) : null}
                                </article>
                            </div>

                            <div className="flex justify-end border-t border-neutral-200 bg-neutral-50 px-5 py-4">
                                <ActionButton
                                    onClick={toggleProgress}
                                    disabled={processing}
                                    variant={isCompleted ? 'danger' : 'primary'}
                                >
                                    {processing ? 'Menyimpan...' : isCompleted ? 'Tandai Belum Selesai' : 'Tandai Sudah Dipelajari'}
                                </ActionButton>
                            </div>
                        </Box>
                    </div>

                    {chatOpen ? (
                        <div className="lg:col-span-5">
                            <MaterialChatRoom
                                materialId={material.id}
                                endpointRoute="mahasiswa.lms.materials.assistant"
                                title="Chat Materi"
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
                        endpointRoute="mahasiswa.lms.materials.assistant"
                        title="Chat Materi"
                        open={chatOpen}
                        onOpenChange={setChatOpen}
                    />
                ) : null}
            </div>
        </AdminLayout>
    );
}

function TeacherGlyph() {
    return (
        <svg className="h-3.5 w-3.5 text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14a4 4 0 100-8 4 4 0 000 8zM4 20a8 8 0 0116 0" />
        </svg>
    );
}

function BookGlyph() {
    return (
        <svg className="h-3.5 w-3.5 text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 19.5A2.5 2.5 0 016.5 17H20M6.5 17A2.5 2.5 0 014 14.5V5a2 2 0 012-2h14v14" />
        </svg>
    );
}

function PlayGlyph() {
    return (
        <svg className="h-3.5 w-3.5 text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-4.586-2.65A1 1 0 009 9.382v5.236a1 1 0 001.166.986l4.586-2.586a1 1 0 000-1.85z" />
            <circle cx="12" cy="12" r="9" strokeWidth="2" />
        </svg>
    );
}

function FileGlyph() {
    return (
        <svg className="h-3.5 w-3.5 text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 2H7a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V8z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 2v6h6" />
        </svg>
    );
}

function DownloadGlyph() {
    return (
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v12m0 0l-4-4m4 4l4-4M5 19h14" />
        </svg>
    );
}
