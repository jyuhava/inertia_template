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

export default function Create({ mataKuliahs, dosens, semesters }) {
    const { data, setData, post, processing, errors } = useForm({
        mata_kuliah_id: '',
        dosen_id: '',
        semester_id: '',
        hari: '',
        jam_mulai: '',
        jam_selesai: '',
        ruangan: '',
        kapasitas: '',
        keterangan: '',
        status: 'aktif'
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/admin/jadwal-kuliah');
    };

    const hariOptions = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

    return (
        <AdminLayout title="Tambah Jadwal Kuliah">
            <Head title="Tambah Jadwal Kuliah" />

            <div className="space-y-6">
                <Box variant="black" className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Jadwal Kuliah</p>
                        <h1 className="text-2xl font-bold text-white">Tambah Jadwal Kuliah</h1>
                    </div>
                    <ActionButton href="/admin/jadwal-kuliah" variant="secondary">
                        ← Kembali
                    </ActionButton>
                </Box>

                <Box>
                    <SectionTitle>Form Jadwal Kuliah</SectionTitle>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <InputLabel htmlFor="mata_kuliah_id">Mata Kuliah</InputLabel>
                                <SelectInput
                                    id="mata_kuliah_id"
                                    value={data.mata_kuliah_id}
                                    onChange={(e) => setData('mata_kuliah_id', e.target.value)}
                                    required
                                    error={errors.mata_kuliah_id}
                                >
                                    <option value="">Pilih Mata Kuliah</option>
                                    {mataKuliahs.map((mk) => (
                                        <option key={mk.id} value={mk.id}>
                                            {mk.kode_mata_kuliah} - {mk.nama_mata_kuliah} ({mk.sks} SKS)
                                        </option>
                                    ))}
                                </SelectInput>
                                <InputError message={errors.mata_kuliah_id} />
                            </div>

                            <div className="md:col-span-2">
                                <InputLabel htmlFor="dosen_id">Dosen</InputLabel>
                                <SelectInput
                                    id="dosen_id"
                                    value={data.dosen_id}
                                    onChange={(e) => setData('dosen_id', e.target.value)}
                                    required
                                    error={errors.dosen_id}
                                >
                                    <option value="">Pilih Dosen</option>
                                    {dosens.map((dosen) => (
                                        <option key={dosen.id} value={dosen.id}>
                                            {dosen.nama_lengkap} - {dosen.nip}
                                        </option>
                                    ))}
                                </SelectInput>
                                <InputError message={errors.dosen_id} />
                            </div>

                            <div className="md:col-span-2">
                                <InputLabel htmlFor="semester_id">Semester</InputLabel>
                                <SelectInput
                                    id="semester_id"
                                    value={data.semester_id}
                                    onChange={(e) => setData('semester_id', e.target.value)}
                                    required
                                    error={errors.semester_id}
                                >
                                    <option value="">Pilih Semester</option>
                                    {semesters.map((semester) => (
                                        <option key={semester.id} value={semester.id}>
                                            {semester.nama_semester}
                                        </option>
                                    ))}
                                </SelectInput>
                                <InputError message={errors.semester_id} />
                            </div>

                            <div>
                                <InputLabel htmlFor="hari">Hari</InputLabel>
                                <SelectInput
                                    id="hari"
                                    value={data.hari}
                                    onChange={(e) => setData('hari', e.target.value)}
                                    required
                                    error={errors.hari}
                                >
                                    <option value="">Pilih Hari</option>
                                    {hariOptions.map((hari) => (
                                        <option key={hari} value={hari}>
                                            {hari}
                                        </option>
                                    ))}
                                </SelectInput>
                                <InputError message={errors.hari} />
                            </div>

                            <div>
                                <InputLabel htmlFor="ruangan">Ruangan</InputLabel>
                                <TextInput
                                    id="ruangan"
                                    type="text"
                                    value={data.ruangan}
                                    onChange={(e) => setData('ruangan', e.target.value)}
                                    placeholder="Contoh: A101"
                                    required
                                    error={errors.ruangan}
                                />
                                <InputError message={errors.ruangan} />
                            </div>

                            <div>
                                <InputLabel htmlFor="jam_mulai">Jam Mulai</InputLabel>
                                <TextInput
                                    id="jam_mulai"
                                    type="time"
                                    value={data.jam_mulai}
                                    onChange={(e) => setData('jam_mulai', e.target.value)}
                                    required
                                    error={errors.jam_mulai}
                                />
                                <InputError message={errors.jam_mulai} />
                            </div>

                            <div>
                                <InputLabel htmlFor="jam_selesai">Jam Selesai</InputLabel>
                                <TextInput
                                    id="jam_selesai"
                                    type="time"
                                    value={data.jam_selesai}
                                    onChange={(e) => setData('jam_selesai', e.target.value)}
                                    required
                                    error={errors.jam_selesai}
                                />
                                <InputError message={errors.jam_selesai} />
                            </div>

                            <div>
                                <InputLabel htmlFor="kapasitas">Kapasitas</InputLabel>
                                <TextInput
                                    id="kapasitas"
                                    type="number"
                                    min="1"
                                    value={data.kapasitas}
                                    onChange={(e) => setData('kapasitas', e.target.value)}
                                    placeholder="40"
                                    required
                                    error={errors.kapasitas}
                                />
                                <InputError message={errors.kapasitas} />
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
                                <InputLabel htmlFor="keterangan">Keterangan (Opsional)</InputLabel>
                                <TextArea
                                    id="keterangan"
                                    value={data.keterangan}
                                    onChange={(e) => setData('keterangan', e.target.value)}
                                    rows={3}
                                    placeholder="Keterangan tambahan untuk jadwal kuliah..."
                                    error={errors.keterangan}
                                />
                                <InputError message={errors.keterangan} />
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
                            <ActionButton href="/admin/jadwal-kuliah" variant="secondary">
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
