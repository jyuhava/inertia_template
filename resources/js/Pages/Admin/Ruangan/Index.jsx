import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function Index({ ruangans, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const submit = e => { e.preventDefault(); router.get(route('admin.ruangan.index'), { search }, { preserveState: true }); };
    const remove = (r) => confirm(`Hapus ruangan ${r.nama}?`) && router.delete(route('admin.ruangan.destroy', r.id));

    return (
        <AdminLayout title="Ruangan">
            <Head title="Ruangan" />
            <div className="p-6 space-y-6 bg-neutral-50 min-h-dvh">
                <div className="bg-gradient-to-r from-emerald-700 to-teal-700 p-6 text-white flex justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-widest">Master Data</p>
                        <h1 className="text-2xl font-bold">RUANGAN</h1>
                    </div>
                    <Link href={route('admin.ruangan.create')} className="bg-white text-black px-4 py-2 text-sm font-bold h-fit">+ Tambah Ruangan</Link>
                </div>
                <form onSubmit={submit} className="bg-white border p-4 flex gap-3">
                    <input placeholder="Cari kode/nama/gedung..." value={search} onChange={e => setSearch(e.target.value)} className="border-neutral-300 text-sm flex-1" />
                    <button className="bg-black text-white px-4 py-2 text-xs font-bold">Cari</button>
                </form>
                <div className="bg-white border overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
                            <tr><th className="px-4 py-3">Kode</th><th className="px-4 py-3">Nama</th><th className="px-4 py-3">Gedung</th><th className="px-4 py-3">Kapasitas</th><th className="px-4 py-3">Tipe</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Aksi</th></tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {ruangans.data.map(r => (
                                <tr key={r.id}>
                                    <td className="px-4 py-3 font-bold">{r.kode}</td>
                                    <td className="px-4 py-3">{r.nama}</td>
                                    <td className="px-4 py-3">{r.gedung}</td>
                                    <td className="px-4 py-3">{r.kapasitas}</td>
                                    <td className="px-4 py-3 capitalize">{r.tipe}</td>
                                    <td className="px-4 py-3 capitalize">{r.status}</td>
                                    <td className="px-4 py-3 space-x-2">
                                        <Link href={route('admin.ruangan.edit', r.id)} className="underline">Edit</Link>
                                        <button onClick={() => remove(r)} className="text-red-600">Hapus</button>
                                    </td>
                                </tr>
                            ))}
                            {ruangans.data.length === 0 && <tr><td colSpan="7" className="px-4 py-8 text-center text-neutral-500">Belum ada ruangan.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
