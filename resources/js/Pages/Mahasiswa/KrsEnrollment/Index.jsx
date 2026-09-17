import { Head, Link, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

function StatusBadge({ status }) {
    const map = {
        draft: 'bg-amber-100 text-amber-800', submitted: 'bg-blue-100 text-blue-800', revision: 'bg-orange-100 text-orange-800',
        approved: 'bg-black text-white', rejected: 'bg-red-100 text-red-700', locked: 'bg-neutral-800 text-white', cancelled: 'bg-neutral-200 text-neutral-600',
    };
    return <span className={`inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${map[status] || map.draft}`}>{status}</span>;
}

export default function Index({ periode, registration, kelasTersedia, riwayat }) {
    const { errors } = usePage().props;
    const addClass = (kelasId) => router.post(route('mahasiswa.krs-enrollment.add-class'), { registration_id: registration.id, kelas_kuliah_id: kelasId });
    const removeItem = (itemId) => confirm('Hapus kelas ini dari KRS?') && router.delete(route('mahasiswa.krs-enrollment.remove-class', [registration.id, itemId]));
    const submitKrs = () => confirm('Ajukan KRS ini untuk direview?') && router.post(route('mahasiswa.krs-enrollment.submit', registration.id));

    if (!periode) {
        return (
            <AdminLayout title="KRS">
                <Head title="KRS" />
                <div className="p-6"><div className="bg-white border p-8 text-center text-neutral-500">Tidak ada periode KRS yang sedang dibuka saat ini.</div></div>
            </AdminLayout>
        );
    }

    const takenIds = registration?.items?.filter(i => i.status === 'active').map(i => i.kelas_kuliah_id) || [];
    const canEdit = registration && ['draft', 'revision'].includes(registration.status);

    return (
        <AdminLayout title="KRS">
            <Head title="KRS" />
            <div className="p-6 space-y-6 bg-neutral-50 min-h-dvh">
                <div className="bg-gradient-to-r from-slate-800 to-indigo-700 p-6 text-white flex justify-between items-center">
                    <div>
                        <p className="text-xs uppercase tracking-widest">KRS</p>
                        <h1 className="text-2xl font-bold">{periode.nama_periode}</h1>
                        <p className="text-sm mt-1">Status KRS Saya: <StatusBadge status={registration?.status} /></p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs uppercase">Total SKS</p>
                        <p className="text-3xl font-bold">{registration?.total_sks ?? 0}</p>
                    </div>
                </div>

                {Object.keys(errors).length > 0 && (
                    <div className="bg-red-50 border border-red-200 p-4 text-sm text-red-700">
                        {Object.values(errors).flat().map((e, i) => <p key={i}>{e}</p>)}
                    </div>
                )}

                {registration?.status === 'revision' && (
                    <div className="bg-orange-50 border border-orange-200 p-4 text-sm text-orange-800">
                        KRS Anda perlu direvisi: {registration.rejection_reason}
                    </div>
                )}
                {registration?.status === 'rejected' && (
                    <div className="bg-red-50 border border-red-200 p-4 text-sm text-red-800">
                        KRS Anda ditolak: {registration.rejection_reason}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white border p-6">
                        <h2 className="font-bold text-sm uppercase mb-4">Kelas Tersedia</h2>
                        <div className="space-y-3 max-h-[32rem] overflow-y-auto">
                            {kelasTersedia.map(k => (
                                <div key={k.id} className="border p-3 flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-sm">{k.kode}</p>
                                        <p className="text-xs text-neutral-600">{k.mata_kuliah} · {k.sks} SKS</p>
                                        <p className="text-xs text-neutral-500">{k.jadwals.map(j => `${j.hari} ${j.jam_mulai}-${j.jam_selesai}`).join(', ')}</p>
                                        <p className="text-xs text-neutral-500">{k.dosens.join(', ')}</p>
                                        <p className="text-xs">{k.terdaftar}/{k.kapasitas} terisi ({k.sisa} sisa)</p>
                                    </div>
                                    <button
                                        disabled={!canEdit || takenIds.includes(k.id) || k.sisa <= 0}
                                        onClick={() => addClass(k.id)}
                                        className="bg-black text-white px-3 py-2 text-xs font-bold disabled:opacity-40"
                                    >
                                        {takenIds.includes(k.id) ? 'Diambil' : 'Ambil'}
                                    </button>
                                </div>
                            ))}
                            {kelasTersedia.length === 0 && <p className="text-sm text-neutral-500">Tidak ada kelas tersedia untuk periode ini.</p>}
                        </div>
                    </div>

                    <div className="bg-white border p-6">
                        <h2 className="font-bold text-sm uppercase mb-4">KRS Saya</h2>
                        <div className="divide-y divide-neutral-100">
                            {registration?.items?.filter(i => i.status === 'active').map(item => (
                                <div key={item.id} className="py-3 flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-sm">{item.kelas_kuliah?.nama_lengkap}</p>
                                        <p className="text-xs text-neutral-600">{item.kelas_kuliah?.mata_kuliah?.nama_mata_kuliah} · {item.sks_snapshot} SKS</p>
                                    </div>
                                    {canEdit && <button onClick={() => removeItem(item.id)} className="text-red-600 text-xs">Hapus</button>}
                                </div>
                            ))}
                            {(!registration?.items || registration.items.filter(i => i.status === 'active').length === 0) && <p className="py-4 text-sm text-neutral-500">Belum ada kelas dipilih.</p>}
                        </div>
                        {canEdit && (
                            <button onClick={submitKrs} className="mt-4 bg-black text-white px-5 py-3 text-sm font-bold w-full">Ajukan KRS</button>
                        )}
                    </div>
                </div>

                <div className="bg-white border p-6">
                    <h2 className="font-bold text-sm uppercase mb-4">Riwayat KRS</h2>
                    <div className="divide-y divide-neutral-100">
                        {riwayat.map(r => (
                            <div key={r.id} className="py-3 flex justify-between">
                                <span>{r.periode_krs?.tahun_ajaran?.nama_tahun_ajaran} {r.periode_krs?.semester?.nama_semester}</span>
                                <span><StatusBadge status={r.status} /> · {r.total_sks} SKS</span>
                            </div>
                        ))}
                        {riwayat.length === 0 && <p className="py-4 text-sm text-neutral-500">Belum ada riwayat KRS.</p>}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
