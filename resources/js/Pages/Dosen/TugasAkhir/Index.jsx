import { Head, router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';

const labels = {
    submitted: 'Menunggu review', under_review: 'Dalam review', title_approved: 'Judul disetujui',
    proposal: 'Proposal', proposal_approved: 'Proposal disetujui', research: 'Penelitian',
    revision: 'Perlu revisi', completed: 'Selesai', reviewed: 'Bimbingan ditinjau',
};

function Badge({ status }) {
    const tone = status === 'completed' || status === 'title_approved' || status === 'proposal_approved'
        ? 'bg-emerald-100 text-emerald-800'
        : status === 'revision' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800';
    return <span className={`inline-flex rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${tone}`}>{labels[status] || status || '-'}</span>;
}

export default function Index({ supervisions = [], theses = [], pendingSessions = [] }) {
    const managed = supervisions.data || supervisions || [];
    const rows = theses?.data || (theses?.length ? theses : managed.map((supervision) => ({ ...supervision.thesis, supervision })));
    const sessions = useMemo(() => {
        if (pendingSessions.length) return pendingSessions.data || pendingSessions;
        return managed.flatMap((supervision) => (supervision.thesis?.sessions || [])
            .filter((session) => session.thesis_supervisor_id === supervision.id && session.status === 'submitted')
            .map((session) => ({ ...session, thesis: supervision.thesis })));
    }, [managed, pendingSessions]);
    const [selectedSession, setSelectedSession] = useState(null);
    const { data, setData, post, processing, errors, reset } = useForm({ status: 'reviewed', feedback: '' });

    const review = (event) => {
        event.preventDefault();
        if (!selectedSession) return;
        post(`/dosen/tugas-akhir/sessions/${selectedSession.id}/review`, {
            preserveScroll: true,
            onSuccess: () => { setSelectedSession(null); reset(); },
        });
    };
    const approveProposal = (thesis) => {
        if (confirm(`Setujui proposal tugas akhir ${thesis.mahasiswa?.nama_lengkap || 'mahasiswa'}?`)) {
            router.post(`/dosen/tugas-akhir/${thesis.id}/proposal/review`, { decision: 'approved' }, { preserveScroll: true });
        }
    };

    return (
        <AdminLayout title="Bimbingan Tugas Akhir">
            <Head title="Bimbingan Tugas Akhir" />
            <div className="min-h-dvh space-y-6 bg-neutral-50 p-6">
                <header className="bg-gradient-to-r from-emerald-700 to-teal-700 p-6 text-white">
                    <p className="text-xs font-bold uppercase tracking-widest">Dosen Pembimbing</p>
                    <h1 className="mt-1 text-2xl font-bold">TUGAS AKHIR MAHASISWA</h1>
                    <p className="mt-1 text-sm text-white/80">Kelola bimbingan, berikan masukan, dan setujui proposal mahasiswa bimbingan.</p>
                </header>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                    <section className="border bg-white p-6 xl:col-span-2">
                        <div className="flex items-center justify-between"><h2 className="text-sm font-bold uppercase">Mahasiswa bimbingan</h2><span className="text-xs text-neutral-500">{rows.length} tugas akhir</span></div>
                        <div className="mt-4 overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500"><tr><th className="px-3 py-3">Mahasiswa</th><th className="px-3 py-3">Judul</th><th className="px-3 py-3">Tahap</th><th className="px-3 py-3">Bimbingan</th><th className="px-3 py-3">Aksi</th></tr></thead>
                                <tbody className="divide-y divide-neutral-100">{rows.map((thesis) => <tr key={thesis.id}>
                                    <td className="px-3 py-3"><p className="font-bold">{thesis.mahasiswa?.nama_lengkap || thesis.student?.nama_lengkap || '-'}</p><p className="text-xs text-neutral-500">{thesis.mahasiswa?.nim || thesis.student?.nim || '-'}</p></td>
                                    <td className="max-w-xs px-3 py-3 text-xs font-medium">{thesis.title || '-'}</td>
                                    <td className="px-3 py-3"><Badge status={thesis.status} /></td>
                                    <td className="px-3 py-3 text-xs">{thesis.sessions_count ?? thesis.sessions?.length ?? 0} sesi</td>
                                    <td className="px-3 py-3">{thesis.status === 'proposal' ? <button onClick={() => approveProposal(thesis)} className="text-xs font-bold underline">Setujui proposal</button> : <span className="text-xs text-neutral-400">-</span>}</td>
                                </tr>)}{rows.length === 0 && <tr><td colSpan="5" className="px-3 py-10 text-center text-neutral-500">Belum ada mahasiswa tugas akhir dalam bimbingan Anda.</td></tr>}</tbody>
                            </table>
                        </div>
                    </section>

                    <aside className="h-fit border bg-white p-6">
                        <h2 className="text-sm font-bold uppercase">Permintaan bimbingan</h2>
                        <div className="mt-4 space-y-3">{sessions.map((session) => <button key={session.id} onClick={() => { setSelectedSession(session); setData({ status: 'reviewed', feedback: session.feedback || '' }); }} className="w-full border p-3 text-left hover:bg-neutral-50">
                            <div className="flex justify-between gap-2"><p className="text-sm font-bold">{session.thesis?.mahasiswa?.nama_lengkap || 'Mahasiswa'}</p><Badge status={session.status} /></div>
                            <p className="mt-1 text-xs text-neutral-600">{session.topic || 'Bimbingan tugas akhir'}</p>
                            <p className="mt-1 text-xs text-neutral-500">{session.meeting_date ? new Date(session.meeting_date).toLocaleDateString('id-ID') : '-'}</p>
                        </button>)}{sessions.length === 0 && <p className="py-4 text-sm text-neutral-500">Tidak ada permintaan bimbingan yang menunggu.</p>}</div>
                    </aside>
                </div>

                {selectedSession && <section className="border bg-white p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-sm font-bold uppercase">Review sesi bimbingan</h2><p className="mt-1 text-sm text-neutral-500">{selectedSession.thesis?.mahasiswa?.nama_lengkap || 'Mahasiswa'} · {selectedSession.topic}</p></div><button onClick={() => setSelectedSession(null)} className="text-xs font-bold underline">Tutup</button></div>
                    <form onSubmit={review} className="mt-5 grid gap-4 md:grid-cols-3">
                        <label className="block text-sm font-medium">Status<select value={data.status} onChange={(event) => setData('status', event.target.value)} className="mt-1 block w-full border-neutral-300 text-sm"><option value="reviewed">Ditinjau</option><option value="revision">Perlu revisi</option></select></label>
                        <label className="block text-sm font-medium md:col-span-2">Masukan pembimbing<textarea value={data.feedback} onChange={(event) => setData('feedback', event.target.value)} className="mt-1 block w-full border-neutral-300 text-sm" rows="3" required />{errors.feedback && <p className="mt-1 text-xs text-red-600">{errors.feedback}</p>}</label>
                        <div className="flex items-end"><button disabled={processing} className="w-full bg-black px-4 py-3 text-sm font-bold text-white disabled:opacity-50">Simpan review</button></div>
                    </form>
                </section>}
            </div>
        </AdminLayout>
    );
}
