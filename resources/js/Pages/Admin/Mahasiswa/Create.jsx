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

export default function Create({ prodis }) {
    const { data, setData, post, processing, errors } = useForm({
        // Identitas
        nim: '',
        no_ktp: '',
        nisn: '',
        npwp: '',
        nama_lengkap: '',
        jenis_kelamin: '',
        tempat_lahir: '',
        tanggal_lahir: '',
        agama: '',
        kewarganegaraan: 'WNI',
        // Kontak & Alamat
        alamat: '',
        no_hp: '',
        email: '',
        password: '',
        password_confirmation: '',
        // Akademik
        prodi_id: '',
        angkatan: '',
        // Registrasi
        periode_masuk: '',
        tanggal_masuk: '',
        jenis_pendaftaran: 'reguler',
        jalur_masuk: '',
        asal_mahasiswa: 'baru',
        pt_asal: '',
        prodi_asal_id: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.mahasiswa.store'));
    };

    return (
        <AdminLayout title="Tambah Mahasiswa">
            <Head title="Tambah Mahasiswa" />

            <div className="space-y-6">
                <Box variant="black" className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/75 mb-2">Mahasiswa</p>
                        <h1 className="text-2xl font-bold text-white">Tambah Mahasiswa Baru</h1>
                    </div>
                    <ActionButton href={route('admin.mahasiswa.index')} variant="secondary">
                        ← Kembali
                    </ActionButton>
                </Box>

                <form onSubmit={submit} className="space-y-6">
                    <Box>
                        <SectionTitle>Identitas</SectionTitle>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <InputLabel htmlFor="nim">NIM</InputLabel>
                                <TextInput id="nim" value={data.nim} onChange={(e) => setData('nim', e.target.value)} required error={errors.nim} />
                                <InputError message={errors.nim} />
                            </div>
                            <div>
                                <InputLabel htmlFor="nama_lengkap">Nama Lengkap</InputLabel>
                                <TextInput id="nama_lengkap" value={data.nama_lengkap} onChange={(e) => setData('nama_lengkap', e.target.value)} required error={errors.nama_lengkap} />
                                <InputError message={errors.nama_lengkap} />
                            </div>
                            <div>
                                <InputLabel htmlFor="no_ktp">NIK</InputLabel>
                                <TextInput id="no_ktp" value={data.no_ktp} onChange={(e) => setData('no_ktp', e.target.value)} error={errors.no_ktp} />
                                <InputError message={errors.no_ktp} />
                            </div>
                            <div>
                                <InputLabel htmlFor="nisn">NISN</InputLabel>
                                <TextInput id="nisn" value={data.nisn} onChange={(e) => setData('nisn', e.target.value)} error={errors.nisn} />
                                <InputError message={errors.nisn} />
                            </div>
                            <div>
                                <InputLabel htmlFor="npwp">NPWP (opsional)</InputLabel>
                                <TextInput id="npwp" value={data.npwp} onChange={(e) => setData('npwp', e.target.value)} error={errors.npwp} />
                                <InputError message={errors.npwp} />
                            </div>
                            <div>
                                <InputLabel htmlFor="jenis_kelamin">Jenis Kelamin</InputLabel>
                                <SelectInput id="jenis_kelamin" value={data.jenis_kelamin} onChange={(e) => setData('jenis_kelamin', e.target.value)} required error={errors.jenis_kelamin}>
                                    <option value="">Pilih</option>
                                    <option value="L">Laki-laki</option>
                                    <option value="P">Perempuan</option>
                                </SelectInput>
                                <InputError message={errors.jenis_kelamin} />
                            </div>
                        </div>
                    </Box>

                    <Box>
                        <SectionTitle>Biodata</SectionTitle>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <InputLabel htmlFor="tempat_lahir">Tempat Lahir</InputLabel>
                                <TextInput id="tempat_lahir" value={data.tempat_lahir} onChange={(e) => setData('tempat_lahir', e.target.value)} required error={errors.tempat_lahir} />
                                <InputError message={errors.tempat_lahir} />
                            </div>
                            <div>
                                <InputLabel htmlFor="tanggal_lahir">Tanggal Lahir</InputLabel>
                                <TextInput id="tanggal_lahir" type="date" value={data.tanggal_lahir} onChange={(e) => setData('tanggal_lahir', e.target.value)} required error={errors.tanggal_lahir} />
                                <InputError message={errors.tanggal_lahir} />
                            </div>
                            <div>
                                <InputLabel htmlFor="agama">Agama</InputLabel>
                                <TextInput id="agama" value={data.agama} onChange={(e) => setData('agama', e.target.value)} error={errors.agama} />
                                <InputError message={errors.agama} />
                            </div>
                            <div>
                                <InputLabel htmlFor="kewarganegaraan">Kewarganegaraan</InputLabel>
                                <TextInput id="kewarganegaraan" value={data.kewarganegaraan} onChange={(e) => setData('kewarganegaraan', e.target.value)} error={errors.kewarganegaraan} />
                                <InputError message={errors.kewarganegaraan} />
                            </div>
                        </div>
                    </Box>

                    <Box>
                        <SectionTitle>Kontak &amp; Akun</SectionTitle>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <InputLabel htmlFor="no_hp">No. HP</InputLabel>
                                <TextInput id="no_hp" value={data.no_hp} onChange={(e) => setData('no_hp', e.target.value)} required error={errors.no_hp} />
                                <InputError message={errors.no_hp} />
                            </div>
                            <div>
                                <InputLabel htmlFor="email">Email</InputLabel>
                                <TextInput id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} required error={errors.email} />
                                <InputError message={errors.email} />
                            </div>
                            <div>
                                <InputLabel htmlFor="password">Password</InputLabel>
                                <TextInput id="password" type="password" value={data.password} onChange={(e) => setData('password', e.target.value)} required error={errors.password} />
                                <InputError message={errors.password} />
                            </div>
                            <div>
                                <InputLabel htmlFor="password_confirmation">Konfirmasi Password</InputLabel>
                                <TextInput id="password_confirmation" type="password" value={data.password_confirmation} onChange={(e) => setData('password_confirmation', e.target.value)} required error={errors.password_confirmation} />
                                <InputError message={errors.password_confirmation} />
                            </div>
                            <div className="md:col-span-2">
                                <InputLabel htmlFor="alamat">Alamat</InputLabel>
                                <TextArea id="alamat" value={data.alamat} onChange={(e) => setData('alamat', e.target.value)} rows={3} required error={errors.alamat} />
                                <InputError message={errors.alamat} />
                            </div>
                        </div>
                    </Box>

                    <Box>
                        <SectionTitle>Registrasi</SectionTitle>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <InputLabel htmlFor="prodi_id">Program Studi</InputLabel>
                                <SelectInput id="prodi_id" value={data.prodi_id} onChange={(e) => setData('prodi_id', e.target.value)} required error={errors.prodi_id}>
                                    <option value="">Pilih Program Studi</option>
                                    {prodis.map((p) => (
                                        <option key={p.id} value={p.id}>{p.kode_prodi} - {p.nama_prodi}</option>
                                    ))}
                                </SelectInput>
                                <InputError message={errors.prodi_id} />
                            </div>
                            <div>
                                <InputLabel htmlFor="angkatan">Angkatan</InputLabel>
                                <TextInput id="angkatan" value={data.angkatan} onChange={(e) => setData('angkatan', e.target.value)} required error={errors.angkatan} />
                                <InputError message={errors.angkatan} />
                            </div>
                            <div>
                                <InputLabel htmlFor="periode_masuk">Periode Masuk</InputLabel>
                                <TextInput id="periode_masuk" placeholder="cth. 2024/2025" value={data.periode_masuk} onChange={(e) => setData('periode_masuk', e.target.value)} required error={errors.periode_masuk} />
                                <InputError message={errors.periode_masuk} />
                            </div>
                            <div>
                                <InputLabel htmlFor="tanggal_masuk">Tanggal Masuk</InputLabel>
                                <TextInput id="tanggal_masuk" type="date" value={data.tanggal_masuk} onChange={(e) => setData('tanggal_masuk', e.target.value)} required error={errors.tanggal_masuk} />
                                <InputError message={errors.tanggal_masuk} />
                            </div>
                            <div>
                                <InputLabel htmlFor="jenis_pendaftaran">Jenis Pendaftaran</InputLabel>
                                <SelectInput id="jenis_pendaftaran" value={data.jenis_pendaftaran} onChange={(e) => setData('jenis_pendaftaran', e.target.value)} error={errors.jenis_pendaftaran}>
                                    <option value="reguler">Reguler</option>
                                    <option value="transfer">Transfer</option>
                                    <option value="pindahan">Pindahan</option>
                                </SelectInput>
                                <InputError message={errors.jenis_pendaftaran} />
                            </div>
                            <div>
                                <InputLabel htmlFor="jalur_masuk">Jalur Masuk</InputLabel>
                                <TextInput id="jalur_masuk" placeholder="cth. PMB, Undangan" value={data.jalur_masuk} onChange={(e) => setData('jalur_masuk', e.target.value)} error={errors.jalur_masuk} />
                                <InputError message={errors.jalur_masuk} />
                            </div>
                            <div>
                                <InputLabel htmlFor="asal_mahasiswa">Asal Mahasiswa</InputLabel>
                                <SelectInput id="asal_mahasiswa" value={data.asal_mahasiswa} onChange={(e) => setData('asal_mahasiswa', e.target.value)} error={errors.asal_mahasiswa}>
                                    <option value="baru">Baru</option>
                                    <option value="pindahan">Pindahan</option>
                                    <option value="transfer">Transfer</option>
                                </SelectInput>
                                <InputError message={errors.asal_mahasiswa} />
                            </div>
                            {data.asal_mahasiswa !== 'baru' && (
                                <>
                                    <div>
                                        <InputLabel htmlFor="pt_asal">Perguruan Tinggi Asal</InputLabel>
                                        <TextInput id="pt_asal" value={data.pt_asal} onChange={(e) => setData('pt_asal', e.target.value)} error={errors.pt_asal} />
                                        <InputError message={errors.pt_asal} />
                                    </div>
                                    <div>
                                        <InputLabel htmlFor="prodi_asal_id">Program Studi Asal</InputLabel>
                                        <SelectInput id="prodi_asal_id" value={data.prodi_asal_id} onChange={(e) => setData('prodi_asal_id', e.target.value)} error={errors.prodi_asal_id}>
                                            <option value="">-</option>
                                            {prodis.map((p) => (
                                                <option key={p.id} value={p.id}>{p.kode_prodi} - {p.nama_prodi}</option>
                                            ))}
                                        </SelectInput>
                                        <InputError message={errors.prodi_asal_id} />
                                    </div>
                                </>
                            )}
                        </div>
                    </Box>

                    <Box className="flex items-center justify-end gap-3">
                        <ActionButton href={route('admin.mahasiswa.index')} variant="secondary">
                            Batal
                        </ActionButton>
                        <ActionButton type="submit" variant="primary" disabled={processing}>
                            {processing ? 'Menyimpan...' : 'Simpan Mahasiswa'}
                        </ActionButton>
                    </Box>
                </form>
            </div>
        </AdminLayout>
    );
}
