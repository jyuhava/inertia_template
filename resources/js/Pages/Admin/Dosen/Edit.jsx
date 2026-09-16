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

export default function Edit({ dosen }) {
    const { data, setData, put, processing, errors } = useForm({
        nip: dosen.nip || '',
        nama_lengkap: dosen.nama_lengkap || '',
        jenis_kelamin: dosen.jenis_kelamin || '',
        tempat_lahir: dosen.tempat_lahir || '',
        tanggal_lahir: dosen.tanggal_lahir ? new Date(dosen.tanggal_lahir).toISOString().split('T')[0] : '',
        alamat: dosen.alamat || '',
        no_hp: dosen.no_hp || '',
        pendidikan_terakhir: dosen.pendidikan_terakhir || '',
        bidang_keahlian: dosen.bidang_keahlian || '',
        jabatan_akademik: dosen.jabatan_akademik || '',
        status: dosen.status || 'aktif',
        email: dosen.user?.email || '',
    });

    const submit = (e) => {
        e.preventDefault();
        put(`/admin/dosen/${dosen.id}`);
    };

    return (
        <AdminLayout title="Edit Dosen">
            <Head title="Edit Dosen" />

            <div className="space-y-6">
                <Box variant="black" className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/75 mb-2">Dosen</p>
                        <h1 className="text-2xl font-bold text-white">Edit Dosen</h1>
                        <p className="text-sm text-white/75 mt-1">{dosen.nama_lengkap}</p>
                    </div>
                    <ActionButton href="/admin/dosen" variant="secondary">
                        ← Kembali
                    </ActionButton>
                </Box>

                <Box>
                    <SectionTitle>Form Dosen</SectionTitle>
                    <form onSubmit={submit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <InputLabel htmlFor="nip">NIP</InputLabel>
                                <TextInput
                                    id="nip"
                                    type="text"
                                    value={data.nip}
                                    onChange={(e) => setData('nip', e.target.value)}
                                    placeholder="Nomor Induk Pegawai"
                                    error={errors.nip}
                                />
                                <InputError message={errors.nip} />
                            </div>

                            <div>
                                <InputLabel htmlFor="nama_lengkap">Nama Lengkap</InputLabel>
                                <TextInput
                                    id="nama_lengkap"
                                    type="text"
                                    value={data.nama_lengkap}
                                    onChange={(e) => setData('nama_lengkap', e.target.value)}
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
                                    placeholder="08xxxxxxxxxx"
                                    error={errors.no_hp}
                                />
                                <InputError message={errors.no_hp} />
                            </div>

                            <div>
                                <InputLabel htmlFor="pendidikan_terakhir">Pendidikan Terakhir</InputLabel>
                                <TextInput
                                    id="pendidikan_terakhir"
                                    type="text"
                                    value={data.pendidikan_terakhir}
                                    onChange={(e) => setData('pendidikan_terakhir', e.target.value)}
                                    placeholder="Contoh: S2 Teknik Informatika"
                                    error={errors.pendidikan_terakhir}
                                />
                                <InputError message={errors.pendidikan_terakhir} />
                            </div>

                            <div>
                                <InputLabel htmlFor="bidang_keahlian">Bidang Keahlian</InputLabel>
                                <TextInput
                                    id="bidang_keahlian"
                                    type="text"
                                    value={data.bidang_keahlian}
                                    onChange={(e) => setData('bidang_keahlian', e.target.value)}
                                    placeholder="Contoh: Machine Learning, Web Development"
                                    error={errors.bidang_keahlian}
                                />
                                <InputError message={errors.bidang_keahlian} />
                            </div>

                            <div>
                                <InputLabel htmlFor="jabatan_akademik">Jabatan Akademik</InputLabel>
                                <SelectInput
                                    id="jabatan_akademik"
                                    value={data.jabatan_akademik}
                                    onChange={(e) => setData('jabatan_akademik', e.target.value)}
                                    error={errors.jabatan_akademik}
                                >
                                    <option value="">Pilih Jabatan Akademik (Opsional)</option>
                                    <option value="Asisten Ahli">Asisten Ahli</option>
                                    <option value="Lektor">Lektor</option>
                                    <option value="Lektor Kepala">Lektor Kepala</option>
                                    <option value="Profesor">Profesor</option>
                                </SelectInput>
                                <InputError message={errors.jabatan_akademik} />
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
                                    <option value="pensiun">Pensiun</option>
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
                                    placeholder="email@example.com"
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
                                placeholder="Alamat lengkap"
                                error={errors.alamat}
                            />
                            <InputError message={errors.alamat} />
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
                            <ActionButton href="/admin/dosen" variant="secondary">
                                Batal
                            </ActionButton>
                            <ActionButton type="submit" variant="primary" disabled={processing}>
                                {processing ? 'Menyimpan...' : 'Perbarui'}
                            </ActionButton>
                        </div>
                    </form>
                </Box>
            </div>
        </AdminLayout>
    );
}
