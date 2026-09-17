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

export default function Edit({ periodeKrs, tahunAjarans, semesters }) {
    const { data, setData, put, processing, errors } = useForm({
        nama_periode: periodeKrs.nama_periode || '',
        tahun_ajaran_id: periodeKrs.tahun_ajaran_id || '',
        semester_id: periodeKrs.semester_id || '',
        tanggal_mulai: periodeKrs.tanggal_mulai || '',
        tanggal_selesai: periodeKrs.tanggal_selesai || '',
        status: periodeKrs.status || 'tidak_aktif',
        revisi_mulai: periodeKrs.revisi_mulai || '',
        revisi_selesai: periodeKrs.revisi_selesai || '',
        wajib_persetujuan_pa: periodeKrs.wajib_persetujuan_pa || false,
        maksimal_sks: periodeKrs.maksimal_sks || '',
        minimal_sks: periodeKrs.minimal_sks || '',
        keterangan: periodeKrs.keterangan || ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(`/admin/periode-krs/${periodeKrs.id}`);
    };

    return (
        <AdminLayout>
            <Head title="Edit Periode KRS" />

            <div className="space-y-6">
                <Box variant="black" className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/75 mb-2">Periode KRS</p>
                        <h1 className="text-2xl font-bold text-white">Edit Periode KRS</h1>
                        <p className="text-sm text-white/75 mt-1">{periodeKrs.nama_periode}</p>
                    </div>
                    <ActionButton href={route('admin.periode-krs.index')} variant="secondary">
                        ← Kembali
                    </ActionButton>
                </Box>

                <Box>
                    <SectionTitle>Informasi Periode</SectionTitle>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <InputLabel htmlFor="nama_periode">Nama Periode</InputLabel>
                            <TextInput
                                id="nama_periode"
                                type="text"
                                value={data.nama_periode}
                                onChange={(e) => setData('nama_periode', e.target.value)}
                                placeholder="Contoh: KRS Ganjil 2024/2025"
                                error={errors.nama_periode}
                                required
                            />
                            <InputError message={errors.nama_periode} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <InputLabel htmlFor="tahun_ajaran_id">Tahun Ajaran</InputLabel>
                                <SelectInput
                                    id="tahun_ajaran_id"
                                    value={data.tahun_ajaran_id}
                                    onChange={(e) => setData('tahun_ajaran_id', e.target.value)}
                                    error={errors.tahun_ajaran_id}
                                    required
                                >
                                    <option value="">Pilih Tahun Ajaran</option>
                                    {tahunAjarans.map((tahun) => (
                                        <option key={tahun.id} value={tahun.id}>
                                            {tahun.tahun_mulai} - {tahun.tahun_selesai}
                                        </option>
                                    ))}
                                </SelectInput>
                                <InputError message={errors.tahun_ajaran_id} />
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
                                <InputLabel htmlFor="tanggal_mulai">Tanggal Mulai</InputLabel>
                                <TextInput
                                    id="tanggal_mulai"
                                    type="date"
                                    value={data.tanggal_mulai}
                                    onChange={(e) => setData('tanggal_mulai', e.target.value)}
                                    error={errors.tanggal_mulai}
                                    required
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
                                    error={errors.tanggal_selesai}
                                    required
                                />
                                <InputError message={errors.tanggal_selesai} />
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
                                    <option value="tidak_aktif">Tidak Aktif</option>
                                    <option value="aktif">Aktif</option>
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
                                placeholder="Keterangan tambahan untuk periode KRS ini..."
                                error={errors.keterangan}
                            />
                            <InputError message={errors.keterangan} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-neutral-200">
                            <div>
                                <InputLabel htmlFor="revisi_mulai">Revisi Mulai (Opsional)</InputLabel>
                                <TextInput id="revisi_mulai" type="date" value={data.revisi_mulai} onChange={(e) => setData('revisi_mulai', e.target.value)} error={errors.revisi_mulai} />
                                <InputError message={errors.revisi_mulai} />
                            </div>
                            <div>
                                <InputLabel htmlFor="revisi_selesai">Revisi Selesai (Opsional)</InputLabel>
                                <TextInput id="revisi_selesai" type="date" value={data.revisi_selesai} onChange={(e) => setData('revisi_selesai', e.target.value)} error={errors.revisi_selesai} />
                                <InputError message={errors.revisi_selesai} />
                            </div>
                            <div>
                                <InputLabel htmlFor="maksimal_sks">Maksimal SKS (Opsional)</InputLabel>
                                <TextInput id="maksimal_sks" type="number" value={data.maksimal_sks} onChange={(e) => setData('maksimal_sks', e.target.value)} error={errors.maksimal_sks} />
                                <InputError message={errors.maksimal_sks} />
                            </div>
                            <div>
                                <InputLabel htmlFor="minimal_sks">Minimal SKS (Opsional)</InputLabel>
                                <TextInput id="minimal_sks" type="number" value={data.minimal_sks} onChange={(e) => setData('minimal_sks', e.target.value)} error={errors.minimal_sks} />
                                <InputError message={errors.minimal_sks} />
                            </div>
                            <div className="md:col-span-2 flex items-center gap-2">
                                <input type="checkbox" id="wajib_persetujuan_pa" checked={data.wajib_persetujuan_pa} onChange={(e) => setData('wajib_persetujuan_pa', e.target.checked)} />
                                <InputLabel htmlFor="wajib_persetujuan_pa">Wajib persetujuan Dosen PA sebelum admin final approve</InputLabel>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
                            <ActionButton href={route('admin.periode-krs.index')} variant="secondary">
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
