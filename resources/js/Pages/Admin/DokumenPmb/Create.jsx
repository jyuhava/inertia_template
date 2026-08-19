import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

function Box({ children, className = '', padded = true, variant = 'white' }) {
    const variants = {
        white: 'bg-white border border-neutral-200',
        black: 'bg-black border border-black',
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

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        nama_dokumen: '',
        kode_dokumen: '',
        deskripsi: '',
        jenis_file: 'pdf',
        max_size_kb: '2048',
        wajib: true,
        urutan: '1',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.dokumen-pmb.store'));
    };

    const fileTypes = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'];

    return (
        <AdminLayout title="Tambah Dokumen PMB">
            <Head title="Tambah Dokumen PMB" />

            <div className="space-y-6">
                <Box variant="black" className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Dokumen PMB</p>
                        <h1 className="text-2xl font-bold text-white">Tambah Dokumen PMB Baru</h1>
                        <p className="text-sm text-neutral-400 mt-1">Tentukan dokumen yang wajib atau opsional untuk pendaftar.</p>
                    </div>
                    <ActionButton href={route('admin.dokumen-pmb.index')} variant="secondary">
                        ← Kembali
                    </ActionButton>
                </Box>

                <Box>
                    <SectionTitle>Informasi Dokumen</SectionTitle>

                    <form onSubmit={submit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <InputLabel htmlFor="nama_dokumen">Nama Dokumen</InputLabel>
                                <TextInput
                                    id="nama_dokumen"
                                    type="text"
                                    name="nama_dokumen"
                                    value={data.nama_dokumen}
                                    autoFocus
                                    onChange={(e) => setData('nama_dokumen', e.target.value)}
                                    placeholder="Contoh: Pas Foto 3x4"
                                    error={errors.nama_dokumen}
                                    required
                                />
                                <InputError message={errors.nama_dokumen} />
                            </div>

                            <div>
                                <InputLabel htmlFor="kode_dokumen">Kode Dokumen</InputLabel>
                                <TextInput
                                    id="kode_dokumen"
                                    type="text"
                                    name="kode_dokumen"
                                    value={data.kode_dokumen}
                                    onChange={(e) => setData('kode_dokumen', e.target.value)}
                                    placeholder="FOTO, KTP, IJAZAH, dsb."
                                    error={errors.kode_dokumen}
                                    required
                                />
                                <InputError message={errors.kode_dokumen} />
                                <p className="mt-2 text-xs text-neutral-500">Kode unik untuk identifikasi dokumen</p>
                            </div>

                            <div>
                                <InputLabel htmlFor="max_size_kb">Ukuran Maksimal (KB)</InputLabel>
                                <TextInput
                                    id="max_size_kb"
                                    type="number"
                                    name="max_size_kb"
                                    value={data.max_size_kb}
                                    onChange={(e) => setData('max_size_kb', e.target.value)}
                                    min="100"
                                    max="10240"
                                    error={errors.max_size_kb}
                                    required
                                />
                                <InputError message={errors.max_size_kb} />
                                <p className="mt-2 text-xs text-neutral-500">1024 KB = 1 MB (Maksimal 10 MB)</p>
                            </div>

                            <div>
                                <InputLabel htmlFor="urutan">Urutan</InputLabel>
                                <TextInput
                                    id="urutan"
                                    type="number"
                                    name="urutan"
                                    value={data.urutan}
                                    onChange={(e) => setData('urutan', e.target.value)}
                                    min="0"
                                    error={errors.urutan}
                                    required
                                />
                                <InputError message={errors.urutan} />
                                <p className="mt-2 text-xs text-neutral-500">Urutan tampil dokumen (angka kecil tampil lebih awal)</p>
                            </div>
                        </div>

                        <div>
                            <InputLabel htmlFor="jenis_file">Jenis File yang Diterima</InputLabel>
                            <div className="flex flex-wrap gap-4 p-4 bg-neutral-50 border border-neutral-200">
                                {fileTypes.map((type) => (
                                    <label key={type} className="inline-flex items-center">
                                        <input
                                            type="checkbox"
                                            value={type}
                                            checked={data.jenis_file.includes(type)}
                                            onChange={(e) => {
                                                const currentTypes = data.jenis_file.split(',').filter(Boolean);
                                                if (e.target.checked) {
                                                    setData('jenis_file', [...currentTypes, type].join(','));
                                                } else {
                                                    setData('jenis_file', currentTypes.filter((t) => t !== type).join(','));
                                                }
                                            }}
                                            className="border-neutral-300 text-black focus:ring-black"
                                        />
                                        <span className="ml-2 text-xs font-bold uppercase tracking-wider text-neutral-700">{type}</span>
                                    </label>
                                ))}
                            </div>
                            <InputError message={errors.jenis_file} />
                            <p className="mt-2 text-xs text-neutral-500">Pilih satu atau lebih format file yang bisa diupload untuk dokumen ini</p>
                        </div>

                        <div>
                            <InputLabel htmlFor="wajib">Status Dokumen</InputLabel>
                            <div className="flex items-center gap-6 p-4 bg-neutral-50 border border-neutral-200">
                                <label className="inline-flex items-center">
                                    <input
                                        type="radio"
                                        name="wajib"
                                        value="1"
                                        checked={data.wajib === true}
                                        onChange={() => setData('wajib', true)}
                                        className="border-neutral-300 text-black focus:ring-black"
                                    />
                                    <span className="ml-2 text-sm text-neutral-900">Wajib</span>
                                </label>
                                <label className="inline-flex items-center">
                                    <input
                                        type="radio"
                                        name="wajib"
                                        value="0"
                                        checked={data.wajib === false}
                                        onChange={() => setData('wajib', false)}
                                        className="border-neutral-300 text-black focus:ring-black"
                                    />
                                    <span className="ml-2 text-sm text-neutral-900">Opsional</span>
                                </label>
                            </div>
                            <InputError message={errors.wajib} />
                        </div>

                        <div>
                            <InputLabel htmlFor="deskripsi">Deskripsi</InputLabel>
                            <TextArea
                                id="deskripsi"
                                name="deskripsi"
                                value={data.deskripsi}
                                rows={4}
                                onChange={(e) => setData('deskripsi', e.target.value)}
                                placeholder="Deskripsi dokumen dan ketentuan yang harus dipenuhi..."
                                error={errors.deskripsi}
                            />
                            <InputError message={errors.deskripsi} />
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
                            <ActionButton href={route('admin.dokumen-pmb.index')} variant="secondary">
                                Batal
                            </ActionButton>
                            <ActionButton type="submit" variant="primary" disabled={processing}>
                                {processing ? 'Menyimpan...' : 'Simpan Dokumen'}
                            </ActionButton>
                        </div>
                    </form>
                </Box>
            </div>
        </AdminLayout>
    );
}
