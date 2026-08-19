import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

function Box({ children, className = '', padded = true, variant = 'white' }) {
    const variants = {
        white: 'bg-white border-neutral-200',
        gray: 'bg-neutral-50 border-neutral-200',
        black: 'bg-black text-white border-black',
    };
    return (
        <div className={`border ${variants[variant]} ${padded ? 'p-6' : ''} ${className}`}>
            {children}
        </div>
    );
}

function SectionTitle({ children, action }) {
    return (
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-900">{children}</h3>
            {action && <div>{action}</div>}
        </div>
    );
}

function ActionButton({ children, href, onClick, variant = 'primary', type = 'button', disabled = false }) {
    const map = {
        primary: 'bg-black text-white border-black hover:bg-neutral-800 disabled:bg-neutral-400 disabled:border-neutral-400',
        secondary: 'bg-white text-neutral-900 border-neutral-300 hover:bg-neutral-50',
    };
    const className = `inline-flex items-center border px-4 py-2 text-[11px] font-bold uppercase tracking-widest transition-colors ${map[variant]} ${disabled ? 'cursor-not-allowed' : ''}`;
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

function InputLabel({ children, htmlFor }) {
    return (
        <label htmlFor={htmlFor} className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1.5">
            {children}
        </label>
    );
}

function TextInput({ id, type = 'text', value, onChange, error, ...props }) {
    return (
        <input
            id={id}
            type={type}
            value={value}
            onChange={onChange}
            className={`block w-full border px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-black focus:outline-none ${
                error ? 'border-red-300' : 'border-neutral-300'
            }`}
            {...props}
        />
    );
}

function SelectInput({ id, value, onChange, error, children, ...props }) {
    return (
        <select
            id={id}
            value={value}
            onChange={onChange}
            className={`block w-full border px-3 py-2 text-sm text-neutral-900 focus:border-black focus:outline-none ${
                error ? 'border-red-300' : 'border-neutral-300'
            }`}
            {...props}
        >
            {children}
        </select>
    );
}

function TextArea({ id, value, onChange, error, ...props }) {
    return (
        <textarea
            id={id}
            value={value}
            onChange={onChange}
            className={`block w-full border px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-black focus:outline-none ${
                error ? 'border-red-300' : 'border-neutral-300'
            }`}
            {...props}
        />
    );
}

function InputError({ message }) {
    if (!message) return null;
    return <p className="mt-1.5 text-xs text-red-600">{message}</p>;
}

export default function Create({ prodis }) {
    const { data, setData, post, processing, errors } = useForm({
        kode_mata_kuliah: '',
        nama_mata_kuliah: '',
        sks: '',
        semester: '',
        prodi_id: '',
        jenis: 'Wajib',
        deskripsi: '',
        status: 'aktif'
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/admin/mata-kuliah');
    };

    return (
        <AdminLayout title="Tambah Mata Kuliah">
            <Head title="Tambah Mata Kuliah" />

            <div className="space-y-6">
                <Box variant="black" className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Mata Kuliah</p>
                        <h1 className="text-2xl font-bold text-white">Tambah Mata Kuliah</h1>
                    </div>
                    <ActionButton href="/admin/mata-kuliah" variant="secondary">
                        ← Kembali
                    </ActionButton>
                </Box>

                <Box>
                    <SectionTitle>Form Mata Kuliah</SectionTitle>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <InputLabel htmlFor="kode_mata_kuliah">Kode Mata Kuliah</InputLabel>
                                <TextInput
                                    id="kode_mata_kuliah"
                                    type="text"
                                    value={data.kode_mata_kuliah}
                                    onChange={(e) => setData('kode_mata_kuliah', e.target.value)}
                                    placeholder="Contoh: IF101"
                                    required
                                    error={errors.kode_mata_kuliah}
                                />
                                <InputError message={errors.kode_mata_kuliah} />
                            </div>

                            <div>
                                <InputLabel htmlFor="sks">SKS</InputLabel>
                                <SelectInput
                                    id="sks"
                                    value={data.sks}
                                    onChange={(e) => setData('sks', e.target.value)}
                                    required
                                    error={errors.sks}
                                >
                                    <option value="">Pilih SKS</option>
                                    <option value="1">1 SKS</option>
                                    <option value="2">2 SKS</option>
                                    <option value="3">3 SKS</option>
                                    <option value="4">4 SKS</option>
                                    <option value="6">6 SKS</option>
                                </SelectInput>
                                <InputError message={errors.sks} />
                            </div>

                            <div className="md:col-span-2">
                                <InputLabel htmlFor="nama_mata_kuliah">Nama Mata Kuliah</InputLabel>
                                <TextInput
                                    id="nama_mata_kuliah"
                                    type="text"
                                    value={data.nama_mata_kuliah}
                                    onChange={(e) => setData('nama_mata_kuliah', e.target.value)}
                                    placeholder="Contoh: Pemrograman Dasar"
                                    required
                                    error={errors.nama_mata_kuliah}
                                />
                                <InputError message={errors.nama_mata_kuliah} />
                            </div>

                            <div className="md:col-span-2">
                                <InputLabel htmlFor="prodi_id">Program Studi</InputLabel>
                                <SelectInput
                                    id="prodi_id"
                                    value={data.prodi_id}
                                    onChange={(e) => setData('prodi_id', e.target.value)}
                                    required
                                    error={errors.prodi_id}
                                >
                                    <option value="">Pilih Program Studi</option>
                                    {prodis.map((prodi) => (
                                        <option key={prodi.id} value={prodi.id}>
                                            {prodi.nama_prodi} ({prodi.kode_prodi})
                                        </option>
                                    ))}
                                </SelectInput>
                                <InputError message={errors.prodi_id} />
                            </div>

                            <div>
                                <InputLabel htmlFor="semester">Semester</InputLabel>
                                <SelectInput
                                    id="semester"
                                    value={data.semester}
                                    onChange={(e) => setData('semester', e.target.value)}
                                    required
                                    error={errors.semester}
                                >
                                    <option value="">Pilih Semester</option>
                                    <option value="1">Semester 1</option>
                                    <option value="2">Semester 2</option>
                                    <option value="3">Semester 3</option>
                                    <option value="4">Semester 4</option>
                                    <option value="5">Semester 5</option>
                                    <option value="6">Semester 6</option>
                                    <option value="7">Semester 7</option>
                                    <option value="8">Semester 8</option>
                                </SelectInput>
                                <InputError message={errors.semester} />
                            </div>

                            <div>
                                <InputLabel htmlFor="jenis">Jenis Mata Kuliah</InputLabel>
                                <SelectInput
                                    id="jenis"
                                    value={data.jenis}
                                    onChange={(e) => setData('jenis', e.target.value)}
                                    required
                                    error={errors.jenis}
                                >
                                    <option value="Wajib">Wajib</option>
                                    <option value="Pilihan">Pilihan</option>
                                </SelectInput>
                                <InputError message={errors.jenis} />
                            </div>

                            <div>
                                <InputLabel htmlFor="status">Status</InputLabel>
                                <SelectInput
                                    id="status"
                                    value={data.status}
                                    onChange={(e) => setData('status', e.target.value)}
                                    required
                                    error={errors.status}
                                >
                                    <option value="aktif">Aktif</option>
                                    <option value="nonaktif">Nonaktif</option>
                                </SelectInput>
                                <InputError message={errors.status} />
                            </div>

                            <div className="md:col-span-2">
                                <InputLabel htmlFor="deskripsi">Deskripsi (Opsional)</InputLabel>
                                <TextArea
                                    id="deskripsi"
                                    value={data.deskripsi}
                                    onChange={(e) => setData('deskripsi', e.target.value)}
                                    rows={4}
                                    placeholder="Deskripsi mata kuliah, tujuan pembelajaran, dan materi yang akan dipelajari..."
                                    error={errors.deskripsi}
                                />
                                <InputError message={errors.deskripsi} />
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
                            <ActionButton href="/admin/mata-kuliah" variant="secondary">
                                Batal
                            </ActionButton>
                            <ActionButton type="submit" variant="primary" disabled={processing}>
                                {processing ? 'Menyimpan...' : 'Simpan'}
                            </ActionButton>
                        </div>
                    </form>
                </Box>
            </div>
        </AdminLayout>
    );
}
