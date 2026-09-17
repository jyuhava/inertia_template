import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

const steps = [
    ['submitted', 'Pengajuan judul'], ['under_review', 'Review prodi'], ['title_approved', 'Judul disetujui'],
    ['supervisor_assignment', 'Penetapan pembimbing'], ['proposal', 'Proposal & bimbingan'], ['seminar_proposal', 'Seminar proposal'],
    ['research', 'Penelitian'], ['thesis_defense', 'Sidang akhir'], ['completed', 'Finalisasi'],
];

const labels = {
    draft: 'Draft', submitted: 'Menunggu review', under_review: 'Dalam review', title_revision: 'Revisi judul',
    title_approved: 'Judul disetujui', supervisor_assignment: 'Penetapan pembimbing', proposal: 'Proposal',
    proposal_approved: 'Proposal disetujui', seminar_proposal: 'Seminar proposal', research: 'Penelitian',
    result_seminar: 'Seminar hasil', thesis_defense: 'Sidang akhir', revision: 'Revisi', revision_verified: 'Revisi terverifikasi', completed: 'Selesai',
};

function StatusBadge({ status }) {
    const tone = status === 'completed' ? 'bg-emerald-100 text-emerald-800' : status === 'title_revision' || status === 'revision' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800';
    return <span className={`inline-flex rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${tone}`}>{labels[status] || status || 'Belum diajukan'}</span>;
}

export default function Index({ thesis = null, titleSubmissions = [], history = [], eligibility = {}, thesisTypes = [], types = [] }) {
    const availableTypes = thesisTypes.length ? thesisTypes : types;
    const { data, setData, post, processing, errors, reset } = useForm({
        title: thesis?.title || '', alternate_titles: ['', ''], thesis_type_id: thesis?.thesis_type_id || availableTypes[0]?.id || '',
        background: '', problem_statement: '', objective: '', topic: '', method: '',
    });
    const submissions = titleSubmissions.length ? titleSubmissions : (thesis?.title_submissions || []);
    const events = history.length ? history : (thesis?.histories || []);
    const requirements = eligibility?.requirements || eligibility?.unmet_requirements || [];
    const canSubmit = !thesis || ['draft', 'title_revision', 'withdrawn'].includes(thesis.status);

    const submit = (event) => {
        event.preventDefault();
        post('/mahasiswa/tugas-akhir/title-submissions', {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    };

    return (
        <AdminLayout title="Tugas Akhir">
            <Head title="Tugas Akhir" />
            <div className="min-h-dvh space-y-6 bg-neutral-50 p-6">
                <header className="bg-gradient-to-r from-slate-800 to-indigo-700 p-6 text-white">
                    <p className="text-xs font-bold uppercase tracking-widest">Akademik Mahasiswa</p>
                    <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
                        <div><h1 className="text-2xl font-bold">TUGAS AKHIR / SKRIPSI</h1><p className="mt-1 text-sm text-white/80">Pantau pengajuan, bimbingan, dan progres penyelesaian tugas akhir Anda.</p></div>
                        {thesis && <StatusBadge status={thesis.status} />}
                    </div>
                </header>

                {requirements.length > 0 && (
                    <section className="border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                        <p className="font-bold">Persyaratan pengajuan belum lengkap</p>
                        <ul className="mt-2 list-disc space-y-1 pl-5">{requirements.map((item, index) => <li key={item.id || index}>{item.label || item.name || item}</li>)}</ul>
                    </section>
                )}

                {thesis && (
                    <section className="border bg-white p-5">
                        <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-neutral-500">Tugas akhir aktif</p><h2 className="mt-1 text-lg font-bold">{thesis.title || 'Judul sedang diproses'}</h2><p className="mt-1 text-sm text-neutral-600">{thesis.program_study?.nama_prodi || thesis.prodi?.nama_prodi || thesis.type?.name || (typeof thesis.type === 'string' ? thesis.type : 'Skripsi')}</p></div><Link href="/mahasiswa/tugas-akhir/sessions" className="bg-black px-4 py-2 text-xs font-bold text-white">Bimbingan Saya</Link></div>
                        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3"><div><p className="text-xs uppercase text-neutral-500">Pembimbing 1</p><p className="mt-1 text-sm font-semibold">{thesis.primary_supervisor?.nama_lengkap || thesis.active_supervisors?.find((item) => item.role === 'pembimbing_1')?.dosen?.nama_lengkap || '-'}</p></div><div><p className="text-xs uppercase text-neutral-500">Pembimbing 2</p><p className="mt-1 text-sm font-semibold">{thesis.secondary_supervisor?.nama_lengkap || thesis.active_supervisors?.find((item) => item.role === 'pembimbing_2')?.dosen?.nama_lengkap || '-'}</p></div><div><p className="text-xs uppercase text-neutral-500">Bimbingan tercatat</p><p className="mt-1 text-sm font-semibold">{thesis.sessions_count ?? thesis.sessions?.length ?? 0} sesi</p></div></div>
                    </section>
                )}

                <section className="border bg-white p-5">
                    <h2 className="text-sm font-bold uppercase">Tahapan tugas akhir</h2>
                    <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">{steps.map(([value, label], index) => {
                        const active = thesis?.status === value;
                        const reached = thesis && steps.findIndex(([step]) => step === thesis.status) >= index;
                        return <div key={value} className={`border p-3 ${active ? 'border-indigo-600 bg-indigo-50' : reached ? 'border-emerald-200 bg-emerald-50' : 'border-neutral-200'}`}><p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Tahap {index + 1}</p><p className="mt-1 text-xs font-bold text-neutral-800">{label}</p></div>;
                    })}</div>
                </section>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                    <section className="border bg-white p-6 xl:col-span-2">
                        <div className="flex items-start justify-between gap-4"><div><h2 className="text-sm font-bold uppercase">Pengajuan judul</h2><p className="mt-1 text-sm text-neutral-500">Sertakan satu judul utama dan alternatif untuk dipertimbangkan prodi.</p></div>{thesis && <StatusBadge status={thesis.status} />}</div>
                        {canSubmit ? <form onSubmit={submit} className="mt-5 space-y-4">
                            <div className="grid gap-4 md:grid-cols-2"><label className="block text-sm font-medium">Jenis tugas akhir<select value={data.thesis_type_id} onChange={(event) => setData('thesis_type_id', event.target.value)} className="mt-1 block w-full border-neutral-300 text-sm" required><option value="">Pilih jenis tugas akhir</option>{availableTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}</select></label><label className="block text-sm font-medium">Bidang / topik<input value={data.topic} onChange={(event) => setData('topic', event.target.value)} className="mt-1 block w-full border-neutral-300 text-sm" placeholder="Contoh: Sistem informasi" /></label></div>
                            <label className="block text-sm font-medium">Judul utama<textarea value={data.title} onChange={(event) => setData('title', event.target.value)} className="mt-1 block w-full border-neutral-300 text-sm" rows="2" required placeholder="Tuliskan judul yang spesifik dan terukur" />{errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}</label>
                            <div className="grid gap-4 md:grid-cols-2">{data.alternate_titles.map((alternative, index) => <label key={index} className="block text-sm font-medium">Judul alternatif {index + 1}<textarea value={alternative} onChange={(event) => setData('alternate_titles', data.alternate_titles.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} className="mt-1 block w-full border-neutral-300 text-sm" rows="2" placeholder="Opsional" /></label>)}</div>
                            <label className="block text-sm font-medium">Latar belakang<textarea value={data.background} onChange={(event) => setData('background', event.target.value)} className="mt-1 block w-full border-neutral-300 text-sm" rows="3" required /></label>
                            <div className="grid gap-4 md:grid-cols-2"><label className="block text-sm font-medium">Rumusan masalah<textarea value={data.problem_statement} onChange={(event) => setData('problem_statement', event.target.value)} className="mt-1 block w-full border-neutral-300 text-sm" rows="3" required /></label><label className="block text-sm font-medium">Tujuan penelitian<textarea value={data.objective} onChange={(event) => setData('objective', event.target.value)} className="mt-1 block w-full border-neutral-300 text-sm" rows="3" required /></label></div>
                            <label className="block text-sm font-medium">Metode penelitian<textarea value={data.method} onChange={(event) => setData('method', event.target.value)} className="mt-1 block w-full border-neutral-300 text-sm" rows="3" required /></label>
                            <button disabled={processing || eligibility?.eligible === false} className="bg-black px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">{processing ? 'Mengirim...' : 'Ajukan Judul'}</button>
                        </form> : <p className="mt-5 border border-dashed p-4 text-sm text-neutral-600">Pengajuan baru tersedia saat judul perlu direvisi atau belum ada tugas akhir aktif.</p>}
                    </section>

                    <section className="border bg-white p-6"><h2 className="text-sm font-bold uppercase">Riwayat pengajuan</h2><div className="mt-4 space-y-3">{submissions.map((item) => <article className="border p-3" key={item.id}><div className="flex items-start justify-between gap-2"><p className="text-sm font-bold">{item.title || item.judul}</p><StatusBadge status={item.status} /></div><p className="mt-2 text-xs text-neutral-500">{item.reviewed_at ? `Ditinjau ${new Date(item.reviewed_at).toLocaleDateString('id-ID')}` : item.created_at ? `Diajukan ${new Date(item.created_at).toLocaleDateString('id-ID')}` : ''}</p>{item.comment && <p className="mt-2 text-xs text-neutral-700">{item.comment}</p>}</article>)}{submissions.length === 0 && <p className="py-6 text-sm text-neutral-500">Belum ada riwayat pengajuan judul.</p>}</div></section>
                </div>

                <section className="border bg-white p-5"><h2 className="text-sm font-bold uppercase">Riwayat proses</h2><div className="mt-4 divide-y">{events.map((event) => <div className="flex flex-wrap justify-between gap-2 py-3 text-sm" key={event.id}><div><p className="font-semibold">{event.label || event.event_type || labels[event.status] || event.status}</p><p className="text-xs text-neutral-500">{event.notes || event.comment || '-'}</p></div><p className="text-xs text-neutral-500">{event.created_at ? new Date(event.created_at).toLocaleDateString('id-ID') : '-'}</p></div>)}{events.length === 0 && <p className="py-5 text-sm text-neutral-500">Aktivitas proses akan tampil setelah pengajuan diproses.</p>}</div></section>
            </div>
        </AdminLayout>
    );
}
