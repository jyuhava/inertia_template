import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import RichTextEditor from '@/Components/RichTextEditor';

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

function InputLabel({ children, htmlFor }) {
    return (
        <label htmlFor={htmlFor} className="mb-1 block text-xs font-semibold uppercase tracking-widest text-black">
            {children}
        </label>
    );
}

function TextInput({ id, type = 'text', value, onChange, error, ...props }) {
    return (
        <>
            <input
                id={id}
                type={type}
                value={value}
                onChange={onChange}
                className="block w-full border border-[#e5e5e5] bg-white px-3 py-2 text-sm text-neutral-700 placeholder-neutral-400 focus:border-black focus:outline-none"
                {...props}
            />
            {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : null}
        </>
    );
}

function SelectInput({ id, value, onChange, error, children, ...props }) {
    return (
        <>
            <select
                id={id}
                value={value}
                onChange={onChange}
                className="block w-full border border-[#e5e5e5] bg-white px-3 py-2 text-sm text-neutral-700 focus:border-black focus:outline-none"
                {...props}
            >
                {children}
            </select>
            {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : null}
        </>
    );
}

export default function Create({ chapter, course }) {
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState('');

    const { data, setData, post, processing, errors } = useForm({
        title: '',
        type: 'text',
        content: '',
        file: null,
        video_url: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('dosen.lms.materials.store', chapter.id));
    };

    const handleGenerateWithAI = async () => {
        if (!aiPrompt.trim()) {
            setAiError('Prompt AI tidak boleh kosong.');
            return;
        }

        setAiLoading(true);
        setAiError('');

        try {
            const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const response = await fetch(route('dosen.lms.materials.generate', chapter.id), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': token || '',
                },
                body: JSON.stringify({
                    prompt: aiPrompt,
                }),
            });

            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload?.message || 'Gagal membuat materi dari AI.');
            }

            if (payload?.content) {
                setData('content', payload.content);
                if (!data.title?.trim()) {
                    setData('title', `Materi ${chapter.title}`);
                }
            } else {
                throw new Error('Konten AI kosong.');
            }
        } catch (error) {
            setAiError(error.message || 'Terjadi kesalahan saat generate materi.');
        } finally {
            setAiLoading(false);
        }
    };

    return (
        <AdminLayout title="Tambah Materi LMS">
            <Head title={`Tambah Materi - ${chapter.title}`} />

            <div className="space-y-6">
                <section className="border border-black bg-black p-6 text-white sm:p-8">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-400">Editor Materi</p>
                    <h1 className="mt-2 text-2xl font-bold uppercase tracking-tight sm:text-3xl">Tambah Materi Baru</h1>
                    <p className="mt-2 text-xs text-neutral-400">
                        Bab: {chapter.title} • Kelas: {course?.jadwal_kuliah?.mata_kuliah?.nama_mata_kuliah || '-'}
                    </p>
                </section>

                <Box>
                    <Box variant="gray" className="mb-5 p-4">
                        <div className="mb-3 flex items-start gap-3">
                            <span className="inline-flex h-9 w-9 items-center justify-center border border-black bg-black text-white">
                                <SparkPanelGlyph />
                            </span>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-black">AI Assistant Pembuatan Materi</p>
                                <p className="mt-1 text-[10px] uppercase tracking-widest text-neutral-500">
                                    Tulis instruksi materi lalu klik generate. Hasil akan langsung masuk ke editor konten.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2 text-[10px] uppercase tracking-widest text-neutral-500 sm:grid-cols-3">
                            <span className="border border-[#e5e5e5] bg-white px-3 py-1.5 font-medium">Gunakan tujuan pembelajaran</span>
                            <span className="border border-[#e5e5e5] bg-white px-3 py-1.5 font-medium">Minta contoh studi kasus</span>
                            <span className="border border-[#e5e5e5] bg-white px-3 py-1.5 font-medium">Tambahkan latihan diskusi</span>
                        </div>

                        <textarea
                            rows="3"
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            className="mt-3 block w-full border border-[#e5e5e5] bg-white px-3 py-2 text-sm text-neutral-700 placeholder-neutral-400 focus:border-black focus:outline-none"
                            placeholder="Contoh: Buat materi Bab ini mencakup definisi, tujuan pembelajaran, contoh kasus, dan latihan diskusi."
                        />
                        {aiError ? <p className="mt-2 text-xs text-rose-600">{aiError}</p> : null}
                        <div className="mt-3 flex items-center justify-between gap-3">
                            <p className="text-[10px] uppercase tracking-widest text-neutral-500">Tips: semakin spesifik instruksi, semakin terstruktur hasil materi.</p>
                            <button
                                type="button"
                                onClick={handleGenerateWithAI}
                                disabled={aiLoading}
                                className="inline-flex items-center gap-2 border border-black bg-black px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-white hover:text-black disabled:opacity-60"
                            >
                                <SparkPanelGlyph />
                                {aiLoading ? 'Membuat Materi...' : 'Generate Materi'}
                            </button>
                        </div>
                    </Box>

                    <form onSubmit={submit} className="space-y-5">
                        <div>
                            <InputLabel htmlFor="title">Judul Materi</InputLabel>
                            <TextInput
                                id="title"
                                value={data.title}
                                onChange={(e) => setData('title', e.target.value)}
                                error={errors.title}
                                required
                                autoFocus
                            />
                        </div>

                        <div>
                            <InputLabel htmlFor="type">Tipe Materi</InputLabel>
                            <SelectInput
                                id="type"
                                value={data.type}
                                onChange={(e) => setData('type', e.target.value)}
                                error={errors.type}
                            >
                                <option value="text">Teks / Artikel</option>
                                <option value="file">File / PDF</option>
                                <option value="video">Link Video</option>
                            </SelectInput>
                        </div>

                        {data.type === 'text' ? (
                            <div>
                                <InputLabel htmlFor="content">Konten Materi</InputLabel>
                                <div className="min-h-[420px] border border-[#e5e5e5] bg-white p-2">
                                    <RichTextEditor
                                        value={data.content}
                                        onChange={(content) => setData('content', content)}
                                        placeholder="Tulis konten materi lengkap di sini..."
                                    />
                                </div>
                                {errors.content ? <p className="mt-1 text-xs text-rose-600">{errors.content}</p> : null}
                            </div>
                        ) : null}

                        {data.type === 'file' ? (
                            <div>
                                <InputLabel htmlFor="file">Upload File</InputLabel>
                                <input
                                    id="file"
                                    type="file"
                                    onChange={(e) => setData('file', e.target.files[0])}
                                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                                    className="block w-full border border-[#e5e5e5] bg-white px-3 py-2 text-sm text-neutral-700"
                                />
                                <p className="mt-1 text-xs text-neutral-500">Format: PDF/DOC/PPT, maksimal 10MB.</p>
                                {errors.file ? <p className="mt-1 text-xs text-rose-600">{errors.file}</p> : null}
                            </div>
                        ) : null}

                        {data.type === 'video' ? (
                            <div>
                                <InputLabel htmlFor="video_url">URL Video</InputLabel>
                                <TextInput
                                    id="video_url"
                                    type="url"
                                    value={data.video_url}
                                    onChange={(e) => setData('video_url', e.target.value)}
                                    error={errors.video_url}
                                    placeholder="https://..."
                                />
                            </div>
                        ) : null}

                        <div className="flex justify-end gap-2 border-t border-[#e5e5e5] pt-4">
                            <Link
                                href={route('dosen.lms.show', course.id)}
                                className="border border-[#e5e5e5] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-widest text-black transition hover:border-black hover:bg-neutral-100"
                            >
                                Batal
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="border border-black bg-black px-3 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-white hover:text-black disabled:opacity-60"
                            >
                                {processing ? 'Menyimpan...' : 'Simpan Materi'}
                            </button>
                        </div>
                    </form>
                </Box>
            </div>
        </AdminLayout>
    );
}

function SparkPanelGlyph() {
    return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z" />
        </svg>
    );
}
