import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';

function StatusBadge({ status }) {
    const map = { draft: 'bg-amber-100 text-amber-800', aktif: 'bg-black text-white', arsip: 'bg-neutral-200 text-neutral-600' };
    return <span className={`inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${map[status] || map.arsip}`}>{status}</span>;
}

export default function Index({ kurikulums, prodis, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [prodiId, setProdiId] = useState(filters.prodi_id || '');
    const [status, setStatus] = useState(filters.status || '');

    const submit = e => { e.preventDefault(); router.get(route('admin.kurikulum.index'), { search, prodi_id: prodiId, status }, { preserveState: true }); };

    return (
        <AdminLayout title="Kurikulum">
            <Head title="Kurikulum" />
            <div className="p-6 space-y-6 bg-neutral-50 min-h-dvh">
                <div className="bg-gradient-to-r from-slate-800 to-indigo-700 p-6 text-white flex justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-widest">Fondasi Akademik</p>
                        <h1 className="text-2xl font-bold">KURIKULUM</h1>
                    </div>
                    <Link href={route('admin.kurikulum.create')} className="bg-white text-black px-4 py-2 text-sm font-bold h-fit">+ Tambah Kurikulum</Link>
                </div>
                <form onSubmit={submit} className="bg-white border border-neutral-200 p-4 flex flex-wrap gap-3">
                    <input placeholder="Cari kode/nama..." value={search} onChange={e => setSearch(e.target.value)} className="border-neutral-300 text-sm flex-1 min-w-[200px]" />
                    <select value={prodiId} onChange={e => setProdiId(e.target.value)} className="border-neutral-300 text-sm">
                        <option value="">Semua Prodi</option>
                        {prodis.map(p => <option key={p.id} value={p.id}>{p.nama_prodi}</option>)}
                    </select>
                    <select value={status} onChange={e => setStatus(e.target.value)} className="border-neutral-300 text-sm">
                        <option value="">Semua Status</option>
                        <option value="draft">Draft</option>
                        <option value="aktif">Aktif</option>
                        <option value="arsip">Arsip</option>
                    </select>
                    <button className="bg-black text-white px-4 py-2 text-xs font-bold">Cari</button>
                </form>
                <div className="bg-white border border-neutral-200 overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
                            <tr><th className="px-4 py-3">Kode</th><th className="px-4 py-3">Nama</th><th className="px-4 py-3">Prodi</th><th className="px-4 py-3">Total SKS</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Aksi</th></tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {kurikulums.data.map(k => (
                                <tr key={k.id}>
                                    <td className="px-4 py-3 font-bold">{k.kode}</td>
                                    <td className="px-4 py-3">{k.nama}</td>
                                    <td className="px-4 py-3">{k.prodi?.nama_prodi}</td>
                                    <td className="px-4 py-3">{k.total_sks_wajib}</td>
                                    <td className="px-4 py-3"><StatusBadge status={k.status} /></td>
                                    <td className="px-4 py-3"><Link href={route('admin.kurikulum.show', k.id)} className="underline">Detail</Link></td>
                                </tr>
                            ))}
                            {kurikulums.data.length === 0 && <tr><td colSpan="6" className="px-4 py-8 text-center text-neutral-500">Belum ada kurikulum.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
