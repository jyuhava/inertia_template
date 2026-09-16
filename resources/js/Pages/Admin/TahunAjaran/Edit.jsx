import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

function Box({ children, className = '', padded = true, variant = 'white' }) {
    const variants = {
        white: 'bg-white border-neutral-200',
        gray: 'bg-neutral-50 border-neutral-200',
        black: 'bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 border-transparent text-white rounded-2xl shadow-lg shadow-violet-500/20',
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

export default function Edit({ tahunAjaran }) {
    const { data, setData, put, processing, errors } = useForm({
        nama_tahun_ajaran: tahunAjaran.nama_tahun_ajaran || '',
        tanggal_mulai: tahunAjaran.tanggal_mulai || '',
        tanggal_selesai: tahunAjaran.tanggal_selesai || '',
        status: tahunAjaran.status || 'nonaktif',
        keterangan: tahunAjaran.keterangan || '',
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('admin.tahun-ajaran.update', tahunAjaran.id));
    };

    return (
        <AdminLayout title="Edit Tahun Ajaran">
            <Head title="Edit Tahun Ajaran" />

            <div className="space-y-6">
                <Box variant="black" className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/75 mb-2">Tahun Ajaran</p>
                        <h1 className="text-2xl font-bold text-white">Edit Tahun Ajaran</h1>
                        <p className="text-sm text-white/75 mt-1">{tahunAjaran.nama_tahun_ajaran}</p>
                    </div>
                    <ActionButton href={route('admin.tahun-ajaran.index')} variant="secondary">
                        ← Kembali
                    </ActionButton>
                </Box>

                <Box>
                    <SectionTitle>Form Tahun Ajaran</SectionTitle>
                    <form onSubmit={submit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <InputLabel htmlFor="nama_tahun_ajaran">Nama Tahun Ajaran</InputLabel>
                                <TextInput
                                    id="nama_tahun_ajaran"
                                    type="text"
                                    value={data.nama_tahun_ajaran}
                                    onChange={(e) => setData('nama_tahun_ajaran', e.target.value)}
                                    placeholder="Contoh: 2024/2025"
                                    required
                                    error={errors.nama_tahun_ajaran}
                                />
                                <InputError message={errors.nama_tahun_ajaran} />
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
                                <p className="mt-1.5 text-xs text-neutral-500">Hanya satu tahun ajaran yang dapat aktif dalam satu waktu</p>
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
                            <ActionButton href={route('admin.tahun-ajaran.index')} variant="secondary">
                                Batal
                            </ActionButton>
                            <ActionButton type="submit" variant="primary" disabled={processing}>
                                {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </ActionButton>
                        </div>
                    </form>
                </Box>
            </div>
        </AdminLayout>
    );
}
