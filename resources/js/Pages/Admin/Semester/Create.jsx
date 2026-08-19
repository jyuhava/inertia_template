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

export default function Create({ tahunAjarans }) {
    const { data, setData, post, processing, errors } = useForm({
        tahun_ajaran_id: '',
        nama_semester: '',
        tanggal_mulai: '',
        tanggal_selesai: '',
        status: 'nonaktif',
        keterangan: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.semester.store'));
    };

    return (
        <AdminLayout title="Tambah Semester">
            <Head title="Tambah Semester" />

            <div className="space-y-6">
                <Box variant="black" className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Semester</p>
                        <h1 className="text-2xl font-bold text-white">Tambah Semester</h1>
                    </div>
                    <ActionButton href={route('admin.semester.index')} variant="secondary">
                        ← Kembali
                    </ActionButton>
                </Box>

                <Box>
                    <SectionTitle>Form Semester</SectionTitle>
                    <form onSubmit={submit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <InputLabel htmlFor="tahun_ajaran_id">Tahun Ajaran</InputLabel>
                                <SelectInput
                                    id="tahun_ajaran_id"
                                    value={data.tahun_ajaran_id}
                                    onChange={(e) => setData('tahun_ajaran_id', e.target.value)}
                                    required
                                    error={errors.tahun_ajaran_id}
                                >
                                    <option value="">Pilih Tahun Ajaran</option>
                                    {tahunAjarans.map((tahunAjaran) => (
                                        <option key={tahunAjaran.id} value={tahunAjaran.id}>
                                            {tahunAjaran.nama_tahun_ajaran} - {tahunAjaran.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                                        </option>
                                    ))}
                                </SelectInput>
                                <InputError message={errors.tahun_ajaran_id} />
                            </div>

                            <div>
                                <InputLabel htmlFor="nama_semester">Semester</InputLabel>
                                <SelectInput
                                    id="nama_semester"
                                    value={data.nama_semester}
                                    onChange={(e) => setData('nama_semester', e.target.value)}
                                    required
                                    error={errors.nama_semester}
                                >
                                    <option value="">Pilih Semester</option>
                                    <option value="Ganjil">Ganjil</option>
                                    <option value="Genap">Genap</option>
                                </SelectInput>
                                <InputError message={errors.nama_semester} />
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
                                    <option value="nonaktif">Nonaktif</option>
                                    <option value="aktif">Aktif</option>
                                </SelectInput>
                                <InputError message={errors.status} />
                                <p className="mt-1.5 text-xs text-neutral-500">Hanya satu semester yang dapat aktif dalam satu waktu</p>
                            </div>

                            <div>
                                <InputLabel htmlFor="tanggal_mulai">Tanggal Mulai</InputLabel>
                                <TextInput
                                    id="tanggal_mulai"
                                    type="date"
                                    value={data.tanggal_mulai}
                                    onChange={(e) => setData('tanggal_mulai', e.target.value)}
                                    required
                                    error={errors.tanggal_mulai}
                                />
                                <InputError message={errors.tanggal_mulai} />
                            </div>

                            <div>
                                <InputLabel htmlFor="tanggal_selesai">Tanggal Selesai</InputLabel>
                                <TextInput
                                    id="tanggal_selesai"
                                    type="date"
                                    value={data.tanggal_selesai}
                                    onChange={(e) => setData('tanggal_selesai', e.target.value)}
                                    required
                                    error={errors.tanggal_selesai}
                                />
                                <InputError message={errors.tanggal_selesai} />
                            </div>

                            <div className="md:col-span-2">
                                <InputLabel htmlFor="keterangan">Keterangan</InputLabel>
                                <TextArea
                                    id="keterangan"
                                    value={data.keterangan}
                                    onChange={(e) => setData('keterangan', e.target.value)}
                                    rows={4}
                                    placeholder="Keterangan tambahan (opsional)"
                                    error={errors.keterangan}
                                />
                                <InputError message={errors.keterangan} />
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
                            <ActionButton href={route('admin.semester.index')} variant="secondary">
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
