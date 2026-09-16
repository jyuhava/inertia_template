import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';

const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

function TableView({ jadwals }) {
    return (
        <div className="bg-white border overflow-x-auto">
            <table className="min-w-full text-sm">
                <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
                    <tr><th className="px-4 py-3">Hari</th><th className="px-4 py-3">Jam</th><th className="px-4 py-3">Kode</th><th className="px-4 py-3">Mata Kuliah</th><th className="px-4 py-3">Kelas</th><th className="px-4 py-3">Ruang</th><th className="px-4 py-3">Dosen</th></tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                    {jadwals.map(j => (
                        <tr key={j.id}>
                            <td className="px-4 py-3">{j.hari}</td>
                            <td className="px-4 py-3">{j.jam_mulai} - {j.jam_selesai}</td>
                            <td className="px-4 py-3">{j.kelas_kuliah?.mata_kuliah?.kode_mata_kuliah}</td>
                            <td className="px-4 py-3">{j.kelas_kuliah?.mata_kuliah?.nama_mata_kuliah}</td>
                            <td className="px-4 py-3">{j.kelas_kuliah?.kode_kelas}</td>
                            <td className="px-4 py-3">{j.ruangan?.nama || '-'}</td>
                            <td className="px-4 py-3">{j.kelas_kuliah?.pengajars?.map(p => p.dosen?.nama_lengkap).join(', ') || '-'}</td>
                        </tr>
                    ))}
                    {jadwals.length === 0 && <tr><td colSpan="7" className="px-4 py-8 text-center text-neutral-500">Tidak ada jadwal untuk filter ini.</td></tr>}
                </tbody>
            </table>
        </div>
    );
}

function CalendarView({ jadwals }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {HARI.map(hari => (
                <div key={hari} className="bg-white border p-4">
                    <h3 className="font-bold text-xs uppercase mb-3">{hari}</h3>
                    <div className="space-y-2">
                        {jadwals.filter(j => j.hari === hari).sort((a, b) => a.jam_mulai.localeCompare(b.jam_mulai)).map(j => (
                            <div key={j.id} className="border-l-4 border-black pl-2 text-xs">
                                <p className="font-bold">{j.jam_mulai} - {j.jam_selesai}</p>
                                <p>{j.kelas_kuliah?.mata_kuliah?.nama_mata_kuliah} ({j.kelas_kuliah?.kode_kelas})</p>
                                <p className="text-neutral-500">{j.ruangan?.nama || '-'}</p>
                            </div>
                        ))}
                        {jadwals.filter(j => j.hari === hari).length === 0 && <p className="text-xs text-neutral-400">Tidak ada jadwal.</p>}
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function Index({ jadwals, filters, semesters, prodis, ruangans, hariOptions }) {
    const [mode, setMode] = useState('table');
    const [form, setForm] = useState(filters);

    const applyFilters = () => router.get(route('admin.jadwal-akademik.index'), form, { preserveState: true });

    return (
        <AdminLayout title="Jadwal Akademik">
            <Head title="Jadwal Akademik" />
            <div className="p-6 space-y-6 bg-neutral-50 min-h-dvh">
                <div className="bg-gradient-to-r from-slate-800 to-indigo-700 p-6 text-white flex justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-widest">Fondasi Akademik</p>
                        <h1 className="text-2xl font-bold">JADWAL AKADEMIK</h1>
                    </div>
                    <div className="space-x-2">
                        <button onClick={() => setMode('table')} className={`px-3 py-2 text-xs font-bold ${mode === 'table' ? 'bg-white text-black' : 'bg-white/20'}`}>Tabel</button>
                        <button onClick={() => setMode('calendar')} className={`px-3 py-2 text-xs font-bold ${mode === 'calendar' ? 'bg-white text-black' : 'bg-white/20'}`}>Kalender Mingguan</button>
                    </div>
                </div>
                <div className="bg-white border p-4 flex flex-wrap gap-3">
                    <select value={form.semester_id || ''} onChange={e => setForm({ ...form, semester_id: e.target.value })} className="text-sm border-neutral-300">
                        <option value="">Semua Periode</option>
                        {semesters.map(s => <option key={s.id} value={s.id}>{s.tahun_ajaran?.nama_tahun_ajaran} - {s.nama_semester}</option>)}
                    </select>
                    <select value={form.prodi_id || ''} onChange={e => setForm({ ...form, prodi_id: e.target.value })} className="text-sm border-neutral-300">
                        <option value="">Semua Prodi</option>
                        {prodis.map(p => <option key={p.id} value={p.id}>{p.nama_prodi}</option>)}
                    </select>
                    <select value={form.ruangan_id || ''} onChange={e => setForm({ ...form, ruangan_id: e.target.value })} className="text-sm border-neutral-300">
                        <option value="">Semua Ruangan</option>
                        {ruangans.map(r => <option key={r.id} value={r.id}>{r.kode} - {r.nama}</option>)}
                    </select>
                    <select value={form.hari || ''} onChange={e => setForm({ ...form, hari: e.target.value })} className="text-sm border-neutral-300">
                        <option value="">Semua Hari</option>
                        {hariOptions.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <button onClick={applyFilters} className="bg-black text-white px-4 py-2 text-xs font-bold">Terapkan Filter</button>
                </div>
                {mode === 'table' ? <TableView jadwals={jadwals} /> : <CalendarView jadwals={jadwals} />}
            </div>
        </AdminLayout>
    );
}
