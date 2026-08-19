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

export default function Edit({ mahasiswa, prodis }) {
    const { data, setData, put, processing, errors } = useForm({
        nim: mahasiswa.nim,
        nama_lengkap: mahasiswa.nama_lengkap,
        jenis_kelamin: mahasiswa.jenis_kelamin,
        tempat_lahir: mahasiswa.tempat_lahir,
        tanggal_lahir: mahasiswa.tanggal_lahir ? new Date(mahasiswa.tanggal_lahir).toISOString().split('T')[0] : '',
        alamat: mahasiswa.alamat,
        no_hp: mahasiswa.no_hp,
        prodi_id: mahasiswa.prodi_id || '',
        program_studi: mahasiswa.program_studi,
        angkatan: mahasiswa.angkatan,
        status: mahasiswa.status,
        email: mahasiswa.user.email,
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('admin.mahasiswa.update', mahasiswa.id));
    };

    return (
        <AdminLayout title="Edit Mahasiswa">
            <Head title="Edit Mahasiswa" />

            <div className="space-y-6">
                <Box variant="black" className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Mahasiswa</p>
                        <h1 className="text-2xl font-bold text-white">Edit Data Mahasiswa</h1>
                        <p className="text-sm text-neutral-400 mt-1">{mahasiswa.nama_lengkap} ({mahasiswa.nim})</p>
                    </div>
                    <ActionButton href={route('admin.mahasiswa.show', mahasiswa.id)} variant="secondary">
                        ← Kembali
                    </ActionButton>
                </Box>

                <Box>
                    <SectionTitle>Form Mahasiswa</SectionTitle>
                    <form onSubmit={submit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <InputLabel htmlFor="nim">NIM</InputLabel>
                                <TextInput
                                    id="nim"
                                    type="text"
                                    value={data.nim}
                                    onChange={(e) => setData('nim', e.target.value)}
                                    required
                                    error={errors.nim}
                                />
                                <InputError message={errors.nim} />
                            </div>

                            <div>
                                <InputLabel htmlFor="nama_lengkap">Nama Lengkap</InputLabel>
                                <TextInput
                                    id="nama_lengkap"
                                    type="text"
                                    value={data.nama_lengkap}
                                    onChange={(e) => setData('nama_lengkap', e.target.value)}
                                    required
                                    error={errors.nama_lengkap}
                                />
                                <InputError message={errors.nama_lengkap} />
                            </div>

                            <div>
                                <InputLabel htmlFor="jenis_kelamin">Jenis Kelamin</InputLabel>
                                <SelectInput
                                    id="jenis_kelamin"
                                    value={data.jenis_kelamin}
                                    onChange={(e) => setData('jenis_kelamin', e.target.value)}
                                    required
                                    error={errors.jenis_kelamin}
                                >
                                    <option value="">Pilih Jenis Kelamin</option>
                                    <option value="L">Laki-laki</option>
                                    <option value="P">Perempuan</option>
                                </SelectInput>
                                <InputError message={errors.jenis_kelamin} />
                            </div>

                            <div>
                                <InputLabel htmlFor="tempat_lahir">Tempat Lahir</InputLabel>
                                <TextInput
                                    id="tempat_lahir"
                                    type="text"
                                    value={data.tempat_lahir}
                                    onChange={(e) => setData('tempat_lahir', e.target.value)}
                                    required
                                    error={errors.tempat_lahir}
                                />
                                <InputError message={errors.tempat_lahir} />
                            </div>

                            <div>
                                <InputLabel htmlFor="tanggal_lahir">Tanggal Lahir</InputLabel>
                                <TextInput
                                    id="tanggal_lahir"
                                    type="date"
                                    value={data.tanggal_lahir}
                                    onChange={(e) => setData('tanggal_lahir', e.target.value)}
                                    required
                                    error={errors.tanggal_lahir}
                                />
                                <InputError message={errors.tanggal_lahir} />
                            </div>

                            <div>
                                <InputLabel htmlFor="no_hp">No. HP</InputLabel>
                                <TextInput
                                    id="no_hp"
                                    type="text"
                                    value={data.no_hp}
                                    onChange={(e) => setData('no_hp', e.target.value)}
                                    required
                                    error={errors.no_hp}
                                />
                                <InputError message={errors.no_hp} />
                            </div>

                            <div>
                                <InputLabel htmlFor="prodi_id">Program Studi</InputLabel>
                                <SelectInput
                                    id="prodi_id"
                                    value={data.prodi_id}
                                    onChange={(e) => {
                                        setData('prodi_id', e.target.value);
                                        const selectedProdi = prodis.find((p) => p.id == e.target.value);
                                        setData('program_studi', selectedProdi ? selectedProdi.nama_prodi : '');
                                    }}
                                    required
                                    error={errors.prodi_id}
                                >
                                    <option value="">Pilih Program Studi</option>
                                    {prodis.map((prodi) => (
                                        <option key={prodi.id} value={prodi.id}>
                                            {prodi.kode_prodi} - {prodi.nama_prodi} ({prodi.jenjang})
                                        </option>
                                    ))}
                                </SelectInput>
                                <InputError message={errors.prodi_id} />
                            </div>

                            <div>
                                <InputLabel htmlFor="angkatan">Angkatan</InputLabel>
                                <TextInput
                                    id="angkatan"
                                    type="text"
                                    value={data.angkatan}
                                    onChange={(e) => setData('angkatan', e.target.value)}
                                    placeholder="Contoh: 2024"
                                    required
                                    error={errors.angkatan}
                                />
                                <InputError message={errors.angkatan} />
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
                                    <option value="">Pilih Status</option>
                                    <option value="aktif">Aktif</option>
                                    <option value="nonaktif">Nonaktif</option>
                                    <option value="lulus">Lulus</option>
                                </SelectInput>
                                <InputError message={errors.status} />
                            </div>

                            <div>
                                <InputLabel htmlFor="email">Email</InputLabel>
                                <TextInput
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    required
                                    error={errors.email}
                                />
                                <InputError message={errors.email} />
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <InputLabel htmlFor="alamat">Alamat</InputLabel>
                            <TextArea
                                id="alamat"
                                value={data.alamat}
                                onChange={(e) => setData('alamat', e.target.value)}
                                rows={3}
                                required
                                error={errors.alamat}
                            />
                            <InputError message={errors.alamat} />
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
                            <ActionButton href={route('admin.mahasiswa.show', mahasiswa.id)} variant="secondary">
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
