import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';

function StatusBadge({ status }) {
    const map = { draft: 'bg-amber-100 text-amber-800', aktif: 'bg-black text-white', arsip: 'bg-neutral-200 text-neutral-600' };
    return <span className={`inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${map[status] || map.arsip}`}>{status}</span>;
}

function AddCourseForm({ kurikulum, mataKuliahOptions, kelompokOptions }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        mata_kuliah_id: '', semester: 1, kelompok_mata_kuliah_id: '', is_wajib: true, sks_override: '', nilai_minimum: '',
    });
    const submit = e => { e.preventDefault(); post(route('admin.kurikulum.mata-kuliah.store', kurikulum.id), { onSuccess: () => reset() }); };

    return (
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-6 gap-3 border-t pt-4 mt-4">
            <div className="md:col-span-2">
                <label className="text-xs font-bold uppercase text-neutral-500">Mata Kuliah</label>
                <select required value={data.mata_kuliah_id} onChange={e => setData('mata_kuliah_id', e.target.value)} className="w-full text-sm border-neutral-300">
                    <option value="">Pilih mata kuliah</option>
                    {mataKuliahOptions.map(mk => <option key={mk.id} value={mk.id}>{mk.kode_mata_kuliah} - {mk.nama_mata_kuliah}</option>)}
                </select>
                <p className="text-xs text-red-600">{errors.mata_kuliah_id}</p>
            </div>
            <div>
                <label className="text-xs font-bold uppercase text-neutral-500">Semester</label>
                <input type="number" min="1" max="14" required value={data.semester} onChange={e => setData('semester', e.target.value)} className="w-full text-sm border-neutral-300" />
            </div>
            <div>
                <label className="text-xs font-bold uppercase text-neutral-500">Kelompok</label>
                <select value={data.kelompok_mata_kuliah_id} onChange={e => setData('kelompok_mata_kuliah_id', e.target.value)} className="w-full text-sm border-neutral-300">
                    <option value="">-</option>
                    {kelompokOptions.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                </select>
            </div>
            <div>
                <label className="text-xs font-bold uppercase text-neutral-500">Wajib?</label>
                <select value={data.is_wajib ? '1' : '0'} onChange={e => setData('is_wajib', e.target.value === '1')} className="w-full text-sm border-neutral-300">
                    <option value="1">Wajib</option>
                    <option value="0">Pilihan</option>
                </select>
            </div>
            <div className="flex items-end">
                <button disabled={processing} className="bg-black text-white px-4 py-2 text-xs font-bold w-full">Tambah</button>
            </div>
        </form>
    );
}

export default function Show({ kurikulum, bySemester, totalSks, totalSksWajib, totalSksPilihan, mataKuliahOptions, kelompokOptions }) {
    const [tab, setTab] = useState('Struktur');
    const removeCourse = (item) => confirm('Hapus mata kuliah ini dari kurikulum?') && router.delete(route('admin.kurikulum.mata-kuliah.destroy', [kurikulum.id, item.id]));

    return (
        <AdminLayout title="Detail Kurikulum">
            <Head title={`Kurikulum - ${kurikulum.nama}`} />
            <div className="p-6 space-y-6 bg-neutral-50 min-h-dvh">
                <div className="bg-gradient-to-r from-slate-800 to-indigo-700 p-6 text-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs uppercase tracking-widest">Kurikulum</p>
                            <h1 className="text-2xl font-bold">{kurikulum.nama}</h1>
                            <p className="text-sm mt-1">{kurikulum.prodi?.nama_prodi} · <StatusBadge status={kurikulum.status} /></p>
                        </div>
                        <div className="space-x-2 flex flex-wrap gap-2">
                            {kurikulum.status === 'draft' && (
                                <button onClick={() => router.post(route('admin.kurikulum.activate', kurikulum.id))} className="bg-white text-black px-3 py-2 text-xs font-bold">Aktifkan</button>
                            )}
                            {kurikulum.status === 'aktif' && (
                                <button onClick={() => router.post(route('admin.kurikulum.archive', kurikulum.id))} className="bg-white text-black px-3 py-2 text-xs font-bold">Arsipkan</button>
                            )}
                            <Link href={route('admin.kurikulum.edit', kurikulum.id)} className="bg-white text-black px-3 py-2 text-xs font-bold">Edit</Link>
                            <Link href={route('admin.kurikulum.index')} className="text-sm underline self-center">Kembali</Link>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white border p-4"><p className="text-xs uppercase text-neutral-500">Total SKS</p><p className="text-2xl font-bold">{totalSks}</p></div>
                    <div className="bg-white border p-4"><p className="text-xs uppercase text-neutral-500">SKS Wajib</p><p className="text-2xl font-bold">{totalSksWajib}</p></div>
                    <div className="bg-white border p-4"><p className="text-xs uppercase text-neutral-500">SKS Pilihan</p><p className="text-2xl font-bold">{totalSksPilihan}</p></div>
                </div>

                <div className="bg-white border flex">
                    {['Struktur', 'PDDikti'].map(t => (
                        <button key={t} onClick={() => setTab(t)} className={`px-4 py-3 text-xs font-bold ${tab === t ? 'border-b-2 border-black' : 'text-neutral-500'}`}>{t}</button>
                    ))}
                </div>

                {tab === 'Struktur' && (
                    <div className="bg-white border p-6 space-y-6">
                        {Object.keys(bySemester).length === 0 && <p className="text-sm text-neutral-500">Kurikulum belum memiliki mata kuliah.</p>}
                        {Object.entries(bySemester).map(([semester, items]) => (
                            <div key={semester}>
                                <h3 className="font-bold text-sm uppercase mb-2">Semester {semester}</h3>
                                <table className="min-w-full text-sm border-t">
                                    <thead className="text-left text-xs uppercase text-neutral-500">
                                        <tr><th className="py-2">Kode</th><th>Mata Kuliah</th><th>SKS</th><th>Status</th><th>Aksi</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100">
                                        {items.map(item => (
                                            <tr key={item.id}>
                                                <td className="py-2">{item.mata_kuliah?.kode_mata_kuliah}</td>
                                                <td>{item.mata_kuliah?.nama_mata_kuliah}</td>
                                                <td>{item.sks_override ?? item.mata_kuliah?.sks}</td>
                                                <td>{item.is_wajib ? 'Wajib' : 'Pilihan'}</td>
                                                <td><button onClick={() => removeCourse(item)} className="text-red-600 text-xs">Hapus</button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ))}
                        {kurikulum.status !== 'arsip' && (
                            <AddCourseForm kurikulum={kurikulum} mataKuliahOptions={mataKuliahOptions} kelompokOptions={kelompokOptions} />
                        )}
                    </div>
                )}

                {tab === 'PDDikti' && (
                    <div className="bg-white border p-6">
                        <p className="text-sm mb-3">Status integrasi: <b>{kurikulum.pddikti_mapping?.sync_status || 'not_synced'}</b>. Client Neo Feeder belum tersedia; sinkronisasi tidak akan mengklaim keberhasilan.</p>
                        <button onClick={() => router.post(route('admin.kurikulum.pddikti.sync', kurikulum.id))} className="border px-3 py-2 text-xs">Coba Sinkronisasi</button>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
