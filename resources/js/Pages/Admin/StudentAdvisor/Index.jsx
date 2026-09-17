import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function Index({ advisors, filters, mahasiswas, dosens }) {
    const [search, setSearch] = useState(filters.search || '');
    const { data, setData, post, processing, reset } = useForm({ mahasiswa_id: '', dosen_id: '', tanggal_mulai: '' });
    const submit = e => { e.preventDefault(); router.get(route('admin.student-advisor.index'), { search }, { preserveState: true }); };
    const assign = e => { e.preventDefault(); post(route('admin.student-advisor.store'), { onSuccess: () => reset() }); };
    const remove = (a) => confirm('Akhiri penugasan pembimbing ini?') && router.delete(route('admin.student-advisor.destroy', a.id));

    return (
        <AdminLayout title="Dosen Pembimbing Akademik">
            <Head title="Dosen Pembimbing Akademik" />
            <div className="p-6 space-y-6 bg-neutral-50 min-h-dvh">
                <div className="bg-gradient-to-r from-slate-800 to-indigo-700 p-6 text-white">
                    <p className="text-xs uppercase tracking-widest">Akademik</p>
                    <h1 className="text-2xl font-bold">DOSEN PEMBIMBING AKADEMIK</h1>
                </div>

                <form onSubmit={assign} className="bg-white border p-6 grid grid-cols-1 md:grid-cols-4 gap-3">
                    <select required value={data.mahasiswa_id} onChange={e => setData('mahasiswa_id', e.target.value)} className="text-sm border-neutral-300">
                        <option value="">Pilih Mahasiswa</option>
                        {mahasiswas.map(m => <option key={m.id} value={m.id}>{m.nim} - {m.nama_lengkap}</option>)}
                    </select>
                    <select required value={data.dosen_id} onChange={e => setData('dosen_id', e.target.value)} className="text-sm border-neutral-300">
                        <option value="">Pilih Dosen</option>
                        {dosens.map(d => <option key={d.id} value={d.id}>{d.nama_lengkap}</option>)}
                    </select>
                    <input type="date" required value={data.tanggal_mulai} onChange={e => setData('tanggal_mulai', e.target.value)} className="text-sm border-neutral-300" />
                    <button disabled={processing} className="bg-black text-white px-4 py-2 text-xs font-bold">Tetapkan Pembimbing</button>
                </form>

                <form onSubmit={submit} className="bg-white border p-4 flex gap-3">
                    <input placeholder="Cari NIM/nama..." value={search} onChange={e => setSearch(e.target.value)} className="text-sm border-neutral-300 flex-1" />
                    <button className="bg-black text-white px-4 py-2 text-xs font-bold">Cari</button>
                </form>

                <div className="bg-white border overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
                            <tr><th className="px-4 py-3">Mahasiswa</th><th className="px-4 py-3">Dosen PA</th><th className="px-4 py-3">Mulai</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Aksi</th></tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {advisors.data.map(a => (
                                <tr key={a.id}>
                                    <td className="px-4 py-3">{a.mahasiswa?.nim} - {a.mahasiswa?.nama_lengkap}</td>
                                    <td className="px-4 py-3">{a.dosen?.nama_lengkap}</td>
                                    <td className="px-4 py-3">{a.tanggal_mulai}</td>
                                    <td className="px-4 py-3 capitalize">{a.status}</td>
                                    <td className="px-4 py-3">{a.status === 'aktif' && <button onClick={() => remove(a)} className="text-red-600 text-xs">Akhiri</button>}</td>
                                </tr>
                            ))}
                            {advisors.data.length === 0 && <tr><td colSpan="5" className="px-4 py-8 text-center text-neutral-500">Belum ada penugasan pembimbing.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
