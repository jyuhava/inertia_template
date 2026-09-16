import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';

function StatusBadge({ status }) {
    const map = { draft: 'bg-amber-100 text-amber-800', dibuka: 'bg-black text-white', ditutup: 'bg-neutral-200 text-neutral-600', dibatalkan: 'bg-red-100 text-red-700' };
    return <span className={`inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${map[status] || map.draft}`}>{status}</span>;
}

export default function Index({ kelasKuliahs, semesters, mataKuliahs, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [semesterId, setSemesterId] = useState(filters.semester_id || '');
    const [mataKuliahId, setMataKuliahId] = useState(filters.mata_kuliah_id || '');

    const submit = e => { e.preventDefault(); router.get(route('admin.kelas-kuliah.index'), { search, semester_id: semesterId, mata_kuliah_id: mataKuliahId }, { preserveState: true }); };

    return (
        <AdminLayout title="Kelas Kuliah">
            <Head title="Kelas Kuliah" />
            <div className="p-6 space-y-6 bg-neutral-50 min-h-dvh">
                <div className="bg-gradient-to-r from-slate-800 to-indigo-700 p-6 text-white flex justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-widest">Fondasi Akademik</p>
                        <h1 className="text-2xl font-bold">KELAS KULIAH</h1>
                    </div>
                    <Link href={route('admin.kelas-kuliah.create')} className="bg-white text-black px-4 py-2 text-sm font-bold h-fit">+ Tambah Kelas</Link>
                </div>
                <form onSubmit={submit} className="bg-white border p-4 flex flex-wrap gap-3">
                    <input placeholder="Cari kode kelas/mata kuliah..." value={search} onChange={e => setSearch(e.target.value)} className="border-neutral-300 text-sm flex-1 min-w-[200px]" />
                    <select value={semesterId} onChange={e => setSemesterId(e.target.value)} className="border-neutral-300 text-sm">
                        <option value="">Semua Periode</option>
                        {semesters.map(s => <option key={s.id} value={s.id}>{s.tahun_ajaran?.nama_tahun_ajaran} - {s.nama_semester}</option>)}
                    </select>
                    <select value={mataKuliahId} onChange={e => setMataKuliahId(e.target.value)} className="border-neutral-300 text-sm">
                        <option value="">Semua Mata Kuliah</option>
                        {mataKuliahs.map(mk => <option key={mk.id} value={mk.id}>{mk.kode_mata_kuliah}</option>)}
                    </select>
                    <button className="bg-black text-white px-4 py-2 text-xs font-bold">Cari</button>
                </form>
                <div className="bg-white border overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
                            <tr><th className="px-4 py-3">Kelas</th><th className="px-4 py-3">Mata Kuliah</th><th className="px-4 py-3">Periode</th><th className="px-4 py-3">Kapasitas</th><th className="px-4 py-3">Pengajar</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Aksi</th></tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {kelasKuliahs.data.map(k => (
                                <tr key={k.id}>
                                    <td className="px-4 py-3 font-bold">{k.mata_kuliah?.kode_mata_kuliah}-{k.kode_kelas}</td>
                                    <td className="px-4 py-3">{k.mata_kuliah?.nama_mata_kuliah}</td>
                                    <td className="px-4 py-3">{k.semester?.tahun_ajaran?.nama_tahun_ajaran} - {k.semester?.nama_semester}</td>
                                    <td className="px-4 py-3">{k.kapasitas}</td>
                                    <td className="px-4 py-3">{k.dosens?.map(d => d.nama_lengkap).join(', ') || '-'}</td>
                                    <td className="px-4 py-3"><StatusBadge status={k.status} /></td>
                                    <td className="px-4 py-3"><Link href={route('admin.kelas-kuliah.show', k.id)} className="underline">Detail</Link></td>
                                </tr>
                            ))}
                            {kelasKuliahs.data.length === 0 && <tr><td colSpan="7" className="px-4 py-8 text-center text-neutral-500">Belum ada kelas kuliah.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
