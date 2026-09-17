import { Head, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

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
        <AdminLayout title="Review KRS">
            <Head title={`Review KRS - ${registration.mahasiswa?.nama_lengkap}`} />
            <div className="p-6 space-y-6 bg-neutral-50 min-h-dvh">
                <div className="bg-gradient-to-r from-emerald-700 to-teal-700 p-6 text-white">
                    <p className="text-xs uppercase tracking-widest">Review KRS</p>
                    <h1 className="text-2xl font-bold">{registration.mahasiswa?.nama_lengkap} ({registration.mahasiswa?.nim})</h1>
                    <p className="text-sm mt-1">{registration.mahasiswa?.prodi?.nama_prodi} · {registration.periode_krs?.tahun_ajaran?.nama_tahun_ajaran} {registration.periode_krs?.semester?.nama_semester}</p>
                </div>

                <div className="bg-white border p-6">
                    <table className="min-w-full text-sm">
                        <thead className="text-left text-xs uppercase text-neutral-500">
                            <tr><th className="py-2">Kelas</th><th>Mata Kuliah</th><th>SKS</th><th>Jadwal</th></tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {registration.items.map(item => (
                                <tr key={item.id}>
                                    <td className="py-2">{item.kelas_kuliah?.nama_lengkap}</td>
                                    <td>{item.kelas_kuliah?.mata_kuliah?.nama_mata_kuliah}</td>
                                    <td>{item.sks_snapshot}</td>
                                    <td>{item.kelas_kuliah?.jadwals?.map(j => `${j.hari} ${j.jam_mulai}-${j.jam_selesai}`).join(', ')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <p className="mt-3 text-sm font-bold">Total SKS: {registration.total_sks}</p>
                </div>

                <div className="bg-white border p-6 space-y-3">
                    <button onClick={() => router.post(route('dosen.krs-advisor.approve', registration.id))} className="bg-black text-white px-4 py-2 text-xs font-bold">Setujui</button>
                    <ReasonForm routeName="dosen.krs-advisor.reject" registration={registration} label="Tolak" />
                    <ReasonForm routeName="dosen.krs-advisor.request-revision" registration={registration} label="Minta Revisi" />
                </div>
            </div>
        </AdminLayout>
    );
}
