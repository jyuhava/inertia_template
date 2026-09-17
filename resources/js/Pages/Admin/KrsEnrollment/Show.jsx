import { Head, Link, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

function StatusBadge({ status }) {
    const map = {
        draft: 'bg-amber-100 text-amber-800', submitted: 'bg-blue-100 text-blue-800', revision: 'bg-orange-100 text-orange-800',
        approved: 'bg-black text-white', rejected: 'bg-red-100 text-red-700', locked: 'bg-neutral-800 text-white', cancelled: 'bg-neutral-200 text-neutral-600',
    };
    return <span className={`inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${map[status] || map.draft}`}>{status}</span>;
}

function ReasonForm({ routeName, registration, label }) {
    const { data, setData, post, processing } = useForm({ reason: '' });
    return (
        <form onSubmit={e => { e.preventDefault(); post(route(routeName, registration.id)); }} className="flex gap-2">
            <input required placeholder="Alasan" value={data.reason} onChange={e => setData('reason', e.target.value)} className="text-xs border-neutral-300 flex-1" />
            <button disabled={processing} className="bg-white border px-3 py-2 text-xs font-bold">{label}</button>
        </form>
    );
}

export default function Show({ registration }) {
    return (
        <AdminLayout title="Detail KRS">
            <Head title={`KRS - ${registration.mahasiswa?.nama_lengkap}`} />
            <div className="p-6 space-y-6 bg-neutral-50 min-h-dvh">
                <div className="bg-gradient-to-r from-slate-800 to-indigo-700 p-6 text-white flex justify-between items-start">
                    <div>
                        <p className="text-xs uppercase tracking-widest">KRS</p>
                        <h1 className="text-2xl font-bold">{registration.mahasiswa?.nama_lengkap} ({registration.mahasiswa?.nim})</h1>
                        <p className="text-sm mt-1">{registration.mahasiswa?.prodi?.nama_prodi} · {registration.periode_krs?.tahun_ajaran?.nama_tahun_ajaran} {registration.periode_krs?.semester?.nama_semester} · {registration.kurikulum?.nama || 'Tanpa kurikulum'}</p>
                    </div>
                    <StatusBadge status={registration.status} />
                </div>

                <div className="bg-white border p-6">
                    <h2 className="font-bold text-sm uppercase mb-4">Daftar Kelas</h2>
                    <table className="min-w-full text-sm">
                        <thead className="text-left text-xs uppercase text-neutral-500">
                            <tr><th className="py-2">Kode</th><th>Mata Kuliah</th><th>SKS</th><th>Dosen</th><th>Jadwal</th><th>Status</th></tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {registration.items.map(item => (
                                <tr key={item.id}>
                                    <td className="py-2">{item.kelas_kuliah?.nama_lengkap}</td>
                                    <td>{item.kelas_kuliah?.mata_kuliah?.nama_mata_kuliah}</td>
                                    <td>{item.sks_snapshot}</td>
                                    <td>{item.kelas_kuliah?.pengajars?.map(p => p.dosen?.nama_lengkap).join(', ')}</td>
                                    <td>{item.kelas_kuliah?.jadwals?.map(j => `${j.hari} ${j.jam_mulai}-${j.jam_selesai}`).join(', ')}</td>
                                    <td>{item.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <p className="mt-3 text-sm font-bold">Total SKS: {registration.total_sks}</p>
                </div>

                {registration.status === 'submitted' && (
                    <div className="bg-white border p-6 space-y-3">
                        <h2 className="font-bold text-sm uppercase mb-2">Review</h2>
                        <button onClick={() => router.post(route('admin.krs-enrollment.approve', registration.id))} className="bg-black text-white px-4 py-2 text-xs font-bold mr-2">Setujui</button>
                        <ReasonForm routeName="admin.krs-enrollment.reject" registration={registration} label="Tolak" />
                        <ReasonForm routeName="admin.krs-enrollment.request-revision" registration={registration} label="Minta Revisi" />
                    </div>
                )}

                {registration.status === 'approved' && (
                    <div className="bg-white border p-6">
                        <button onClick={() => router.post(route('admin.krs-enrollment.lock', registration.id))} className="bg-black text-white px-4 py-2 text-xs font-bold">Kunci KRS</button>
                    </div>
                )}

                {registration.status === 'locked' && (
                    <div className="bg-white border p-6">
                        <ReasonForm routeName="admin.krs-enrollment.unlock" registration={registration} label="Buka Kembali (Override)" />
                    </div>
                )}

                <div className="bg-white border p-6">
                    <h2 className="font-bold text-sm uppercase mb-4">PDDikti</h2>
                    <p className="text-sm mb-3">Status integrasi: <b>{registration.pddikti_mapping?.sync_status || 'not_synced'}</b>. Client Neo Feeder belum tersedia; sinkronisasi tidak akan mengklaim keberhasilan.</p>
                    <button onClick={() => router.put(route('admin.krs-enrollment.pddikti.sync', registration.id))} className="border px-3 py-2 text-xs">Coba Laporkan ke PDDikti</button>
                </div>

                <div className="bg-white border p-6">
                    <h2 className="font-bold text-sm uppercase mb-4">Riwayat Perubahan (Audit Trail)</h2>
                    <div className="divide-y divide-neutral-100 text-sm">
                        {registration.audits.map(a => (
                            <div key={a.id} className="py-2">
                                <b>{a.action}</b> oleh {a.user?.name || 'Sistem'} · {new Date(a.created_at).toLocaleString('id-ID')}
                                {a.reason && <p className="text-neutral-500">Alasan: {a.reason}</p>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
