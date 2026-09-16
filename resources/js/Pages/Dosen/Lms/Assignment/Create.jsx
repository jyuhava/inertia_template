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

export default function Create({ chapter, course }) {
    const { data, setData, post, processing, errors } = useForm({
        title: '',
        description: '',
        komponen: 'harian',
        bobot_komponen: '1',
        deadline: '',
        file: null,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('dosen.lms.assignments.store', chapter.id));
    };

    return (
        <AdminLayout title="Tambah Tugas LMS">
            <Head title={`Tambah Tugas - ${chapter.title}`} />

            <div className="space-y-6">
                <section className="border border-black bg-black p-6 text-white sm:p-8">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-400">Assignment Builder</p>
                    <h1 className="mt-2 text-2xl font-bold uppercase tracking-tight sm:text-3xl">Tambah Tugas / Evaluasi</h1>
                    <p className="mt-2 text-xs text-neutral-400">
                        Bab: {chapter.title} • Kelas: {course?.jadwal_kuliah?.mata_kuliah?.nama_mata_kuliah || '-'}
                    </p>
                </section>

                <Box>
                    <form onSubmit={submit} className="space-y-5">
                        <div>
                            <InputLabel htmlFor="title">Judul Tugas</InputLabel>
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
                            <InputLabel htmlFor="description">Deskripsi / Instruksi</InputLabel>
                            <div className="min-h-[320px] border border-[#e5e5e5] bg-white p-2">
                                <RichTextEditor
                                    value={data.description}
                                    onChange={(content) => setData('description', content)}
                                    placeholder="Tuliskan instruksi tugas secara jelas..."
                                />
                            </div>
                            {errors.description ? <p className="mt-1 text-xs text-rose-600">{errors.description}</p> : null}
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="komponen">Komponen Nilai</InputLabel>
                                <SelectInput
                                    id="komponen"
                                    value={data.komponen}
                                    onChange={(e) => setData('komponen', e.target.value)}
                                    error={errors.komponen}
                                >
                                    <option value="harian">Harian / Tugas</option>
                                    <option value="uts">UTS</option>
                                    <option value="uas">UAS</option>
                                </SelectInput>
                            </div>
                            <div>
                                <InputLabel htmlFor="bobot_komponen">Bobot Internal Tugas</InputLabel>
                                <TextInput
                                    id="bobot_komponen"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={data.bobot_komponen}
                                    onChange={(e) => setData('bobot_komponen', e.target.value)}
                                    error={errors.bobot_komponen}
                                />
                                <p className="mt-1 text-xs text-neutral-500">Dipakai saat ada lebih dari satu tugas di komponen yang sama.</p>
                            </div>
                        </div>

                        <div>
                            <InputLabel htmlFor="deadline">Deadline (Opsional)</InputLabel>
                            <TextInput
                                id="deadline"
                                type="datetime-local"
                                value={data.deadline}
                                onChange={(e) => setData('deadline', e.target.value)}
                                error={errors.deadline}
                            />
                        </div>

                        <div>
                            <InputLabel htmlFor="file">Lampiran Soal (Opsional)</InputLabel>
                            <input
                                id="file"
                                type="file"
                                onChange={(e) => setData('file', e.target.files[0])}
                                className="block w-full border border-[#e5e5e5] bg-white px-3 py-2 text-sm text-neutral-700"
                            />
                            <p className="mt-1 text-xs text-neutral-500">Maksimal 10MB.</p>
                            {errors.file ? <p className="mt-1 text-xs text-rose-600">{errors.file}</p> : null}
                        </div>

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
                                {processing ? 'Menyimpan...' : 'Simpan Tugas'}
                            </button>
                        </div>
                    </form>
                </Box>
            </div>
        </AdminLayout>
    );
}
