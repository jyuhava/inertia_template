import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

function Box({ children, className = '', padded = true, variant = 'white' }) {
    const variants = {
        white: 'bg-white border border-neutral-200',
        black: 'bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 border-transparent text-white rounded-2xl shadow-lg shadow-violet-500/20',
        gray: 'bg-neutral-50 border border-neutral-200'
    };
    return (
        <div className={`${variants[variant]} ${padded ? 'p-6' : ''} ${className}`}>
            {children}
        </div>
    );
}

function SectionTitle({ children, action }) {
    return (
        <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-900">{children}</h2>
            {action}
        </div>
    );
}

function ActionButton({ children, href, onClick, variant = 'primary', type = 'button', disabled = false }) {
    const map = {
        primary: 'bg-black text-white border border-black hover:bg-neutral-800',
        secondary: 'bg-white text-black border border-neutral-300 hover:bg-neutral-50',
        danger: 'bg-white text-red-600 border border-red-200 hover:bg-red-50'
    };
    const base = `inline-flex items-center px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${map[variant]}`;
    if (href) {
        return <Link href={href} className={base}>{children}</Link>;
    }
    return <button type={type} onClick={onClick} disabled={disabled} className={`${base} disabled:opacity-50`}>{children}</button>;
}

function InputLabel({ children, htmlFor }) {
    return (
        <label htmlFor={htmlFor} className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">
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
            className={`block w-full border-neutral-300 text-sm text-neutral-900 placeholder-neutral-400 focus:border-black focus:ring-black ${error ? 'border-red-500' : ''}`}
            {...props}
        />
    );
}

function TextArea({ id, value, onChange, error, ...props }) {
    return (
        <textarea
            id={id}
            value={value}
            onChange={onChange}
            className={`block w-full border-neutral-300 text-sm text-neutral-900 placeholder-neutral-400 focus:border-black focus:ring-black ${error ? 'border-red-500' : ''}`}
            {...props}
        />
    );
}

function InputError({ message }) {
    if (!message) return null;
    return <p className="mt-2 text-xs text-red-600 font-medium">{message}</p>;
}

export default function Edit({ periodePmb }) {
    const { data, setData, put, processing, errors } = useForm({
        nama_periode: periodePmb.nama_periode || '',
        tahun_akademik: periodePmb.tahun_akademik || '',
        tanggal_buka: periodePmb.tanggal_buka || '',
        tanggal_tutup: periodePmb.tanggal_tutup || '',
        biaya_pendaftaran: periodePmb.biaya_pendaftaran || '150000',
        kuota_total: periodePmb.kuota_total || '100',
        persyaratan: periodePmb.persyaratan || '',
        keterangan: periodePmb.keterangan || '',
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('admin.periode-pmb.update', periodePmb.id));
    };

    return (
        <AdminLayout title="Edit Periode PMB">
            <Head title="Edit Periode PMB" />

            <div className="space-y-6">
                <Box variant="black" className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/75 mb-2">Periode PMB</p>
                        <h1 className="text-2xl font-bold text-white">Edit Periode PMB</h1>
                        <p className="text-sm text-white/75 mt-1">{periodePmb.nama_periode} — Tahun Akademik {periodePmb.tahun_akademik}</p>
                    </div>
                    <ActionButton href={route('admin.periode-pmb.index')} variant="secondary">
                        ← Kembali
                    </ActionButton>
                </Box>

                <Box>
                    <SectionTitle>Informasi Periode</SectionTitle>

                    <form onSubmit={submit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <InputLabel htmlFor="nama_periode">Nama Periode</InputLabel>
                                <TextInput
                                    id="nama_periode"
                                    type="text"
                                    name="nama_periode"
                                    value={data.nama_periode}
                                    autoFocus
                                    onChange={(e) => setData('nama_periode', e.target.value)}
                                    placeholder="PMB Tahun Akademik 2025/2026"
                                    error={errors.nama_periode}
                                />
                                <InputError message={errors.nama_periode} />
                            </div>

                            <div>
                                <InputLabel htmlFor="tahun_akademik">Tahun Akademik</InputLabel>
                                <TextInput
                                    id="tahun_akademik"
                                    type="text"
                                    name="tahun_akademik"
                                    value={data.tahun_akademik}
                                    onChange={(e) => setData('tahun_akademik', e.target.value)}
                                    placeholder="2025/2026"
                                    error={errors.tahun_akademik}
                                />
                                <InputError message={errors.tahun_akademik} />
                            </div>

                            <div>
                                <InputLabel htmlFor="tanggal_buka">Tanggal Buka</InputLabel>
                                <TextInput
                                    id="tanggal_buka"
                                    type="date"
                                    name="tanggal_buka"
                                    value={data.tanggal_buka}
                                    onChange={(e) => setData('tanggal_buka', e.target.value)}
                                    error={errors.tanggal_buka}
                                />
                                <InputError message={errors.tanggal_buka} />
                            </div>

                            <div>
                                <InputLabel htmlFor="tanggal_tutup">Tanggal Tutup</InputLabel>
                                <TextInput
                                    id="tanggal_tutup"
                                    type="date"
                                    name="tanggal_tutup"
                                    value={data.tanggal_tutup}
                                    onChange={(e) => setData('tanggal_tutup', e.target.value)}
                                    error={errors.tanggal_tutup}
                                />
                                <InputError message={errors.tanggal_tutup} />
                            </div>

                            <div>
                                <InputLabel htmlFor="biaya_pendaftaran">Biaya Pendaftaran (Rp)</InputLabel>
                                <TextInput
                                    id="biaya_pendaftaran"
                                    type="number"
                                    name="biaya_pendaftaran"
                                    value={data.biaya_pendaftaran}
                                    onChange={(e) => setData('biaya_pendaftaran', e.target.value)}
                                    min="0"
                                    error={errors.biaya_pendaftaran}
                                />
                                <InputError message={errors.biaya_pendaftaran} />
                            </div>

                            <div>
                                <InputLabel htmlFor="kuota_total">Kuota Total</InputLabel>
                                <TextInput
                                    id="kuota_total"
                                    type="number"
                                    name="kuota_total"
                                    value={data.kuota_total}
                                    onChange={(e) => setData('kuota_total', e.target.value)}
                                    min="1"
                                    error={errors.kuota_total}
                                />
                                <InputError message={errors.kuota_total} />
                            </div>
                        </div>

                        <div>
                            <InputLabel htmlFor="persyaratan">Persyaratan</InputLabel>
                            <TextArea
                                id="persyaratan"
                                name="persyaratan"
                                value={data.persyaratan}
                                rows="6"
                                onChange={(e) => setData('persyaratan', e.target.value)}
                                placeholder="Masukkan persyaratan pendaftaran..."
                                error={errors.persyaratan}
                            />
                            <InputError message={errors.persyaratan} />
                            <p className="mt-2 text-xs text-neutral-500">Pisahkan setiap persyaratan dengan baris baru</p>
                        </div>

                        <div>
                            <InputLabel htmlFor="keterangan">Keterangan</InputLabel>
                            <TextArea
                                id="keterangan"
                                name="keterangan"
                                value={data.keterangan}
                                rows="3"
                                onChange={(e) => setData('keterangan', e.target.value)}
                                placeholder="Keterangan tambahan..."
                                error={errors.keterangan}
                            />
                            <InputError message={errors.keterangan} />
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
                            <ActionButton href={route('admin.periode-pmb.index')} variant="secondary">
                                Batal
                            </ActionButton>
                            <ActionButton type="submit" variant="primary" disabled={processing}>
                                {processing ? 'Memperbarui...' : 'Perbarui'}
                            </ActionButton>
                        </div>
                    </form>
                </Box>
            </div>
        </AdminLayout>
    );
}
