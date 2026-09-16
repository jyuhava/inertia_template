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

function SelectInput({ id, value, onChange, error, children, ...props }) {
    return (
        <select
            id={id}
            value={value}
            onChange={onChange}
            className={`block w-full border-neutral-300 text-sm text-neutral-900 focus:border-black focus:ring-black ${error ? 'border-red-500' : ''}`}
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
            className={`block w-full border-neutral-300 text-sm text-neutral-900 placeholder-neutral-400 focus:border-black focus:ring-black ${error ? 'border-red-500' : ''}`}
            {...props}
        />
    );
}

function InputError({ message }) {
    if (!message) return null;
    return <p className="mt-2 text-xs text-red-600 font-medium">{message}</p>;
}

export default function Edit({ jadwalKuliah, mataKuliahs, dosens, semesters }) {
    const { data, setData, put, processing, errors } = useForm({
        mata_kuliah_id: jadwalKuliah.mata_kuliah_id || '',
        dosen_id: jadwalKuliah.dosen_id || '',
        semester_id: jadwalKuliah.semester_id || '',
        hari: jadwalKuliah.hari || '',
        jam_mulai: jadwalKuliah.jam_mulai || '',
        jam_selesai: jadwalKuliah.jam_selesai || '',
        ruangan: jadwalKuliah.ruangan || '',
        kapasitas: jadwalKuliah.kapasitas || '',
        keterangan: jadwalKuliah.keterangan || '',
        status: jadwalKuliah.status || 'aktif'
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(`/admin/jadwal-kuliah/${jadwalKuliah.id}`);
    };

    const hariOptions = [
        'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'
    ];

    return (
        <AdminLayout>
            <Head title="Edit Jadwal Kuliah" />

            <div className="space-y-6">
                <Box variant="black" className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/75 mb-2">Jadwal Kuliah</p>
                        <h1 className="text-2xl font-bold text-white">Edit Jadwal Kuliah</h1>
                        <p className="text-sm text-white/75 mt-1">
                            {jadwalKuliah.mata_kuliah?.nama_mata_kuliah || 'Mata Kuliah'} — {jadwalKuliah.hari}, {jadwalKuliah.jam_mulai} s/d {jadwalKuliah.jam_selesai}
                        </p>
                    </div>
                    <ActionButton href={route('admin.jadwal-kuliah.index')} variant="secondary">
                        ← Kembali
                    </ActionButton>
                </Box>

                <Box>
                    <SectionTitle>Informasi Jadwal</SectionTitle>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <InputLabel htmlFor="mata_kuliah_id">Mata Kuliah</InputLabel>
                                <SelectInput
                                    id="mata_kuliah_id"
                                    value={data.mata_kuliah_id}
                                    onChange={(e) => setData('mata_kuliah_id', e.target.value)}
                                    error={errors.mata_kuliah_id}
                                    required
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

                            <div>
                                <InputLabel htmlFor="dosen_id">Dosen</InputLabel>
                                <SelectInput
                                    id="dosen_id"
                                    value={data.dosen_id}
                                    onChange={(e) => setData('dosen_id', e.target.value)}
                                    error={errors.dosen_id}
                                    required
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

                            <div>
                                <InputLabel htmlFor="semester_id">Semester</InputLabel>
                                <SelectInput
                                    id="semester_id"
                                    value={data.semester_id}
                                    onChange={(e) => setData('semester_id', e.target.value)}
                                    error={errors.semester_id}
                                    required
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
                                    error={errors.hari}
                                    required
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
                                    error={errors.ruangan}
                                    required
                                />
                                <InputError message={errors.ruangan} />
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
                                    error={errors.kapasitas}
                                    required
                                />
                                <InputError message={errors.kapasitas} />
                            </div>

                            <div>
                                <InputLabel htmlFor="jam_mulai">Jam Mulai</InputLabel>
                                <TextInput
                                    id="jam_mulai"
                                    type="time"
                                    value={data.jam_mulai}
                                    onChange={(e) => setData('jam_mulai', e.target.value)}
                                    error={errors.jam_mulai}
                                    required
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
                                    error={errors.jam_selesai}
                                    required
                                />
                                <InputError message={errors.jam_selesai} />
                            </div>

                            <div>
                                <InputLabel htmlFor="status">Status</InputLabel>
                                <SelectInput
                                    id="status"
                                    value={data.status}
                                    onChange={(e) => setData('status', e.target.value)}
                                    error={errors.status}
                                    required
                                >
                                    <option value="aktif">Aktif</option>
                                    <option value="nonaktif">Nonaktif</option>
                                </SelectInput>
                                <InputError message={errors.status} />
                            </div>
                        </div>

                        <div>
                            <InputLabel htmlFor="keterangan">Keterangan (Opsional)</InputLabel>
                            <TextArea
                                id="keterangan"
                                rows="3"
                                value={data.keterangan}
                                onChange={(e) => setData('keterangan', e.target.value)}
                                placeholder="Keterangan tambahan untuk jadwal kuliah..."
                                error={errors.keterangan}
                            />
                            <InputError message={errors.keterangan} />
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
                            <ActionButton href={route('admin.jadwal-kuliah.index')} variant="secondary">
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
