import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';

function StatusBadge({ status }) {
    const map = {
        draft: 'bg-amber-100 text-amber-800', submitted: 'bg-blue-100 text-blue-800', revision: 'bg-orange-100 text-orange-800',
        approved: 'bg-black text-white', rejected: 'bg-red-100 text-red-700', locked: 'bg-neutral-800 text-white', cancelled: 'bg-neutral-200 text-neutral-600',
    };
    return <span className={`inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${map[status] || map.draft}`}>{status}</span>;
}

export default function Index({ registrations, filters, periodeKrsList, prodis, stats }) {
    const [form, setForm] = useState(filters);
    const applyFilters = () => router.get(route('admin.krs-enrollment.index'), form, { preserveState: true });

    return (
        <AdminLayout title="KRS / Student Enrollment">
            <Head title="KRS / Student Enrollment" />
            <div className="p-6 space-y-6 bg-neutral-50 min-h-dvh">
                <div className="bg-gradient-to-r from-slate-800 to-indigo-700 p-6 text-white">
                    <p className="text-xs uppercase tracking-widest">Akademik</p>
                    <h1 className="text-2xl font-bold">KRS / STUDENT ENROLLMENT</h1>
                </div>

                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                        {Object.entries(stats).map(([k, v]) => (
                            <div key={k} className="bg-white border p-3"><p className="text-[10px] uppercase text-neutral-500">{k}</p><p className="text-xl font-bold">{v}</p></div>
                        ))}
                    </div>
                )}

                <div className="bg-white border p-4 flex flex-wrap gap-3">
                    <input placeholder="Cari NIM/nama..." value={form.search || ''} onChange={e => setForm({ ...form, search: e.target.value })} className="text-sm border-neutral-300 flex-1 min-w-[200px]" />
                    <select value={form.periode_krs_id || ''} onChange={e => setForm({ ...form, periode_krs_id: e.target.value })} className="text-sm border-neutral-300">
                        <option value="">Semua Periode</option>
                        {periodeKrsList.map(p => <option key={p.id} value={p.id}>{p.tahun_ajaran?.nama_tahun_ajaran} - {p.semester?.nama_semester}</option>)}
                    </select>
                    <select value={form.prodi_id || ''} onChange={e => setForm({ ...form, prodi_id: e.target.value })} className="text-sm border-neutral-300">
                        <option value="">Semua Prodi</option>
                        {prodis.map(p => <option key={p.id} value={p.id}>{p.nama_prodi}</option>)}
                    </select>
                    <select value={form.status || ''} onChange={e => setForm({ ...form, status: e.target.value })} className="text-sm border-neutral-300">
                        <option value="">Semua Status</option>
                        {['draft', 'submitted', 'revision', 'approved', 'rejected', 'locked', 'cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button onClick={applyFilters} className="bg-black text-white px-4 py-2 text-xs font-bold">Terapkan</button>
                </div>

                <div className="bg-white border overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
                            <tr><th className="px-4 py-3">NIM</th><th className="px-4 py-3">Nama</th><th className="px-4 py-3">Prodi</th><th className="px-4 py-3">Periode</th><th className="px-4 py-3">Total SKS</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Aksi</th></tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {registrations.data.map(r => (
                                <tr key={r.id}>
                                    <td className="px-4 py-3">{r.mahasiswa?.nim}</td>
                                    <td className="px-4 py-3">{r.mahasiswa?.nama_lengkap}</td>
                                    <td className="px-4 py-3">{r.mahasiswa?.prodi?.nama_prodi}</td>
                                    <td className="px-4 py-3">{r.periode_krs?.tahun_ajaran?.nama_tahun_ajaran} {r.periode_krs?.semester?.nama_semester}</td>
                                    <td className="px-4 py-3">{r.total_sks}</td>
                                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                                    <td className="px-4 py-3"><Link href={route('admin.krs-enrollment.show', r.id)} className="underline">Detail</Link></td>
                                </tr>
                            ))}
                            {registrations.data.length === 0 && <tr><td colSpan="7" className="px-4 py-8 text-center text-neutral-500">Tidak ada data KRS.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
