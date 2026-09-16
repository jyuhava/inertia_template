import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

const Input = ({ label, field, data, setData, errors, type = 'text', required = false, ...rest }) => (
    <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">{label}</label>
        <input type={type} required={required} value={data[field] ?? ''} onChange={e => setData(field, e.target.value)} className="w-full border-neutral-300 text-sm" {...rest} />
        <p className="text-xs text-red-600">{errors[field]}</p>
    </div>
);
const Select = ({ label, field, data, setData, errors, children }) => (
    <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">{label}</label>
        <select value={data[field] ?? ''} onChange={e => setData(field, e.target.value)} className="w-full border-neutral-300 text-sm">{children}</select>
        <p className="text-xs text-red-600">{errors[field]}</p>
    </div>
);
const Section = ({ title, children }) => (
    <section className="bg-white border border-neutral-200 p-6">
        <h2 className="font-bold text-sm uppercase tracking-widest mb-5">{title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{children}</div>
    </section>
);

export default function Create({ prodis, kategoris, mataKuliahOptions }) {
    const { data, setData, post, processing, errors } = useForm({
        kode_mata_kuliah: '', nama_mata_kuliah: '', short_name: '', english_name: '',
        sks: '', theory_credits: '', practical_credits: '', field_credits: '',
        semester: '', prodi_id: '', jenis: 'Wajib', course_type: '',
        kategori_mata_kuliah_id: '', deskripsi: '', status: 'aktif', prasyarat_ids: [],
    });

    const submit = e => { e.preventDefault(); post(route('admin.mata-kuliah.store')); };

    const togglePrasyarat = (id) => {
        const ids = data.prasyarat_ids.includes(id) ? data.prasyarat_ids.filter(x => x !== id) : [...data.prasyarat_ids, id];
        setData('prasyarat_ids', ids);
    };

    return (
        <AdminLayout title="Tambah Mata Kuliah">
            <Head title="Tambah Mata Kuliah" />
            <div className="p-6 space-y-6 bg-neutral-50 min-h-dvh">
                <div className="bg-gradient-to-r from-slate-800 to-indigo-700 p-6 text-white flex justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-widest">Master Mata Kuliah</p>
                        <h1 className="text-2xl font-bold">Tambah Mata Kuliah</h1>
                    </div>
                    <Link href={route('admin.mata-kuliah.index')} className="text-sm">Kembali</Link>
                </div>
                <form onSubmit={submit} className="space-y-6">
                    <Section title="Identitas Mata Kuliah">
                        <Input label="Kode Mata Kuliah" field="kode_mata_kuliah" data={data} setData={setData} errors={errors} required placeholder="Contoh: IF101" />
                        <Input label="Nama Mata Kuliah" field="nama_mata_kuliah" data={data} setData={setData} errors={errors} required />
                        <Input label="Nama Singkat" field="short_name" data={data} setData={setData} errors={errors} />
                        <Input label="Nama Inggris" field="english_name" data={data} setData={setData} errors={errors} />
                        <Select label="Program Studi" field="prodi_id" data={data} setData={setData} errors={errors}>
                            <option value="">Pilih Prodi</option>
                            {prodis.map(p => <option key={p.id} value={p.id}>{p.kode_prodi} - {p.nama_prodi}</option>)}
                        </Select>
                        <Input label="Semester Rekomendasi" field="semester" type="number" min="1" max="8" data={data} setData={setData} errors={errors} required />
                    </Section>
                    <Section title="SKS">
                        <Input label="Total SKS" field="sks" type="number" min="1" max="6" data={data} setData={setData} errors={errors} required />
                        <Input label="SKS Teori" field="theory_credits" type="number" step="0.5" data={data} setData={setData} errors={errors} />
                        <Input label="SKS Praktik" field="practical_credits" type="number" step="0.5" data={data} setData={setData} errors={errors} />
                        <Input label="SKS Lapangan" field="field_credits" type="number" step="0.5" data={data} setData={setData} errors={errors} />
                    </Section>
                    <Section title="Jenis dan Kategori">
                        <Select label="Jenis" field="jenis" data={data} setData={setData} errors={errors}>
                            <option value="Wajib">Wajib</option>
                            <option value="Pilihan">Pilihan</option>
                        </Select>
                        <Input label="Tipe Mata Kuliah" field="course_type" data={data} setData={setData} errors={errors} placeholder="mis. Praktikum, Seminar" />
                        <Select label="Kategori" field="kategori_mata_kuliah_id" data={data} setData={setData} errors={errors}>
                            <option value="">Tidak ditentukan</option>
                            {kategoris.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                        </Select>
                        <Select label="Status" field="status" data={data} setData={setData} errors={errors}>
                            <option value="aktif">Aktif</option>
                            <option value="nonaktif">Nonaktif</option>
                        </Select>
                    </Section>
                    <section className="bg-white border border-neutral-200 p-6">
                        <h2 className="font-bold text-sm uppercase tracking-widest mb-5">Prasyarat Mata Kuliah</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-56 overflow-y-auto">
                            {mataKuliahOptions.map(mk => (
                                <label key={mk.id} className="flex items-center gap-2 text-sm">
                                    <input type="checkbox" checked={data.prasyarat_ids.includes(mk.id)} onChange={() => togglePrasyarat(mk.id)} />
                                    {mk.kode_mata_kuliah} - {mk.nama_mata_kuliah}
                                </label>
                            ))}
                        </div>
                    </section>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">Deskripsi</label>
                        <textarea value={data.deskripsi} onChange={e => setData('deskripsi', e.target.value)} className="w-full border-neutral-300" rows="4" />
                    </div>
                    <button disabled={processing} className="bg-black text-white px-5 py-3 text-sm font-bold">{processing ? 'Menyimpan...' : 'Simpan Mata Kuliah'}</button>
                </form>
            </div>
        </AdminLayout>
    );
}
