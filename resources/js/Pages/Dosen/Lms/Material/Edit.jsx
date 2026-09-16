import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import RichTextEditor from '@/Components/RichTextEditor';

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

export default function Edit({ material, chapter, course }) {
    const { data, setData, put, processing, errors } = useForm({
        title: material.title,
        type: material.type,
        content: material.content || '',
        file: null,
        video_url: material.video_url || '',
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('dosen.lms.materials.update', material.id));
    };

    return (
        <AdminLayout title="Edit Materi LMS">
            <Head title={`Edit Materi - ${material.title}`} />

            <div className="space-y-6">
                <section className="border border-black bg-black p-6 text-white sm:p-8">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-400">Editor Materi</p>
                    <h1 className="mt-2 text-2xl font-bold uppercase tracking-tight sm:text-3xl">Edit Materi</h1>
                    <p className="mt-2 text-xs text-neutral-400">
                        Bab: {chapter.title} • Kelas: {course?.jadwal_kuliah?.mata_kuliah?.nama_mata_kuliah || '-'}
                    </p>
                </section>

                <Box>
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
                                <InputLabel htmlFor="file">Ganti File</InputLabel>
                                <input
                                    id="file"
                                    type="file"
                                    onChange={(e) => setData('file', e.target.files[0])}
                                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                                    className="block w-full border border-[#e5e5e5] bg-white px-3 py-2 text-sm text-neutral-700"
                                />
                                <p className="mt-1 text-xs text-neutral-500">Kosongkan jika tidak ingin mengganti file.</p>
                                {material.file_path ? <p className="mt-1 text-xs text-emerald-700">File saat ini tersedia.</p> : null}
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
                                {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </button>
                        </div>
                    </form>
                </Box>
            </div>
        </AdminLayout>
    );
}
