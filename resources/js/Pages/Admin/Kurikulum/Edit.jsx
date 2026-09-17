import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function Edit({ kurikulum, prodis, semesters }) {
    const { data, setData, put, processing, errors } = useForm({
        kode: kurikulum.kode, nama: kurikulum.nama, deskripsi: kurikulum.deskripsi || '',
        prodi_id: kurikulum.prodi_id, semester_mulai_id: kurikulum.semester_mulai_id,
        semester_selesai_id: kurikulum.semester_selesai_id || '', total_sks_wajib: kurikulum.total_sks_wajib,
    });
    const submit = e => { e.preventDefault(); put(route('admin.kurikulum.update', kurikulum.id)); };

    return (
        <AdminLayout title="Edit Kurikulum">
            <Head title="Edit Kurikulum" />
            <div className="p-6 space-y-6 bg-neutral-50 min-h-dvh">
                <div className="bg-gradient-to-r from-slate-800 to-indigo-700 p-6 text-white flex justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-widest">Kurikulum</p>
                        <h1 className="text-2xl font-bold">{kurikulum.kode} - {kurikulum.nama}</h1>
                    </div>
                    <Link href={route('admin.kurikulum.show', kurikulum.id)} className="text-sm">Kembali</Link>
                </div>
                <form onSubmit={submit} className="bg-white border border-neutral-200 p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase mb-1">Kode Kurikulum</label>
                            <input required value={data.kode} onChange={e => setData('kode', e.target.value)} className="w-full border-neutral-300 text-sm" />
                            <p className="text-xs text-red-600">{errors.kode}</p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase mb-1">Nama Kurikulum</label>
                            <input required value={data.nama} onChange={e => setData('nama', e.target.value)} className="w-full border-neutral-300 text-sm" />
                            <p className="text-xs text-red-600">{errors.nama}</p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase mb-1">Program Studi</label>
                            <select required value={data.prodi_id} onChange={e => setData('prodi_id', e.target.value)} className="w-full border-neutral-300 text-sm">
                                {prodis.map(p => <option key={p.id} value={p.id}>{p.kode_prodi} - {p.nama_prodi}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase mb-1">Total SKS Wajib</label>
                            <input type="number" step="0.5" value={data.total_sks_wajib} onChange={e => setData('total_sks_wajib', e.target.value)} className="w-full border-neutral-300 text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase mb-1">Mulai Berlaku</label>
                            <select required value={data.semester_mulai_id} onChange={e => setData('semester_mulai_id', e.target.value)} className="w-full border-neutral-300 text-sm">
                                {semesters.map(s => <option key={s.id} value={s.id}>{s.tahun_ajaran?.nama_tahun_ajaran} - {s.nama_semester}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase mb-1">Selesai Berlaku</label>
                            <select value={data.semester_selesai_id} onChange={e => setData('semester_selesai_id', e.target.value)} className="w-full border-neutral-300 text-sm">
                                <option value="">Belum ditentukan</option>
                                {semesters.map(s => <option key={s.id} value={s.id}>{s.tahun_ajaran?.nama_tahun_ajaran} - {s.nama_semester}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase mb-1">Deskripsi</label>
                        <textarea value={data.deskripsi} onChange={e => setData('deskripsi', e.target.value)} className="w-full border-neutral-300" rows="3" />
                    </div>
                    <button disabled={processing} className="bg-black text-white px-5 py-3 text-sm font-bold">{processing ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
                </form>
            </div>
        </AdminLayout>
    );
}
