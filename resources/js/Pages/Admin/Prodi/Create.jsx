import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, Link } from '@inertiajs/react';

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

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        kode_prodi: '',
        nama_prodi: '',
        deskripsi: '',
        jenjang: '',
        status: 'aktif',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.prodi.store'));
    };

    return (
        <AdminLayout title="Tambah Program Studi">
            <Head title="Tambah Program Studi" />

            <div className="space-y-6">
                <Box variant="black" className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Program Studi</p>
                        <h1 className="text-2xl font-bold text-white">Tambah Program Studi Baru</h1>
                    </div>
                    <ActionButton href={route('admin.prodi.index')} variant="secondary">
                        ← Kembali
                    </ActionButton>
                </Box>

                <Box>
                    <SectionTitle>Form Program Studi</SectionTitle>
                    <form onSubmit={submit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <InputLabel htmlFor="kode_prodi">Kode Program Studi</InputLabel>
                                <TextInput
                                    id="kode_prodi"
                                    value={data.kode_prodi}
                                    onChange={(e) => setData('kode_prodi', e.target.value)}
                                    placeholder="Contoh: TI, SI, MI"
                                    error={errors.kode_prodi}
                                />
                                <InputError message={errors.kode_prodi} />
                            </div>

                            <div>
                                <InputLabel htmlFor="nama_prodi">Nama Program Studi</InputLabel>
                                <TextInput
                                    id="nama_prodi"
                                    value={data.nama_prodi}
                                    onChange={(e) => setData('nama_prodi', e.target.value)}
                                    placeholder="Contoh: Teknik Informatika"
                                    error={errors.nama_prodi}
                                />
                                <InputError message={errors.nama_prodi} />
                            </div>

                            <div>
                                <InputLabel htmlFor="jenjang">Jenjang</InputLabel>
                                <SelectInput
                                    id="jenjang"
                                    value={data.jenjang}
                                    onChange={(e) => setData('jenjang', e.target.value)}
                                    error={errors.jenjang}
                                >
                                    <option value="">Pilih Jenjang</option>
                                    <option value="D3">D3 (Diploma 3)</option>
                                    <option value="D4">D4 (Diploma 4)</option>
                                    <option value="S1">S1 (Sarjana)</option>
                                    <option value="S2">S2 (Magister)</option>
                                    <option value="S3">S3 (Doktor)</option>
                                </SelectInput>
                                <InputError message={errors.jenjang} />
                            </div>

                            <div>
                                <InputLabel htmlFor="status">Status</InputLabel>
                                <SelectInput
                                    id="status"
                                    value={data.status}
                                    onChange={(e) => setData('status', e.target.value)}
                                    error={errors.status}
                                >
                                    <option value="aktif">Aktif</option>
                                    <option value="nonaktif">Nonaktif</option>
                                </SelectInput>
                                <InputError message={errors.status} />
                            </div>
                        </div>

                        <div>
                            <InputLabel htmlFor="deskripsi">Deskripsi</InputLabel>
                            <TextArea
                                id="deskripsi"
                                value={data.deskripsi}
                                onChange={(e) => setData('deskripsi', e.target.value)}
                                rows="4"
                                placeholder="Deskripsi program studi (opsional)"
                                error={errors.deskripsi}
                            />
                            <InputError message={errors.deskripsi} />
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
                            <ActionButton href={route('admin.prodi.index')} variant="secondary">
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
