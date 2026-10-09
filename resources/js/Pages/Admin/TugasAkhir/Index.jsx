import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import Pagination from '@/Components/Pagination';

const statuses = { submitted: 'Menunggu review', under_review: 'Dalam review', title_revision: 'Revisi judul', title_approved: 'Judul disetujui', supervisor_assignment: 'Penetapan pembimbing', proposal: 'Proposal', proposal_rejected: 'Proposal ditolak', proposal_approved: 'Proposal disetujui', seminar_proposal: 'Seminar proposal', research: 'Penelitian', result_seminar: 'Seminar hasil', thesis_defense: 'Sidang akhir', revision: 'Revisi', revision_verified: 'Revisi terverifikasi', completed: 'Selesai' };
function Badge({ status }) { const tone = status === 'completed' ? 'bg-emerald-100 text-emerald-800' : status === 'proposal_rejected' ? 'bg-rose-100 text-rose-800' : status?.includes('revision') ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'; return <span className={`inline-flex rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${tone}`}>{statuses[status] || status || '-'}</span>; }

export default function Index({ theses = {}, filters = {}, capacityOverview = [], capacities = [] }) {
    const rows = theses.data || [];
    const overview = capacityOverview.length ? capacityOverview : capacities;
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const hasFilter = Boolean(filters.search || filters.status);

    const submit = (event) => {
        event.preventDefault();
        router.get('/admin/tugas-akhir', { search: search.trim(), status }, { preserveState: true, replace: true });
    };
    const clear = () => {
        setSearch(''); setStatus('');
        router.get('/admin/tugas-akhir', {}, { preserveState: true, replace: true });
    };

    return <AdminLayout title="Manajemen Tugas Akhir"><Head title="Manajemen Tugas Akhir" /><div className="min-h-dvh space-y-6 bg-neutral-50 p-6">
        <header className="bg-gradient-to-r from-slate-800 to-indigo-700 p-6 text-white"><p className="text-xs font-bold uppercase tracking-widest">Administrasi Akademik</p><h1 className="text-2xl font-bold">MANAJEMEN TUGAS AKHIR</h1><p className="mt-1 text-sm text-white/80">Review pengajuan, monitor beban pembimbing, dan finalisasi tugas akhir.</p></header>

        <section><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-bold uppercase text-neutral-700">Kapasitas pembimbing</h2><span className="text-xs text-neutral-500">Dibatasi oleh kuota tiap program studi</span></div><div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">{overview.map((item) => {
            const active = item.active_count ?? item.active_students ?? item.used ?? 0;
            const capacity = item.capacity ?? item.max_students ?? null;
            const percent = capacity ? Math.min(100, Math.round((active / capacity) * 100)) : 0;
            const full = capacity !== null && active >= capacity;
            return <article className="border bg-white p-4" key={item.id || item.lecturer_id}>
                <p className="text-sm font-bold">{item.name || item.lecturer?.nama_lengkap || item.dosen?.nama_lengkap || '-'}</p>
                <div className="mt-3 flex justify-between text-xs text-neutral-500"><span>Mahasiswa aktif</span><span>{active} / {capacity ?? '∞'}</span></div>
                <div className="mt-2 h-2 bg-neutral-100"><div className={percent >= 100 ? 'h-2 bg-red-500' : 'h-2 bg-emerald-500'} style={{ width: `${percent}%` }} /></div>
                {full && <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-red-600">Kuota penuh</p>}
            </article>;
        })}{overview.length === 0 && <div className="border border-dashed bg-white p-5 text-sm text-neutral-500 md:col-span-2 xl:col-span-4">Data kapasitas pembimbing akan tampil setelah penetapan pembimbing tersedia.</div>}</div></section>

        <form onSubmit={submit} className="flex flex-wrap gap-3 border bg-white p-4">
            <input value={search} onChange={(event) => setSearch(event.target.value)} className="min-w-60 flex-1 border-neutral-300 text-sm" placeholder="Cari NIM, nama, atau judul..." />
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="border-neutral-300 text-sm"><option value="">Semua status</option>{Object.entries(statuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
            <button className="bg-black px-5 py-2 text-xs font-bold text-white">Cari</button>
            {hasFilter && <button type="button" onClick={clear} className="px-3 py-2 text-xs font-bold text-neutral-500 underline">Reset</button>}
        </form>

        <section className="overflow-x-auto border bg-white"><table className="min-w-full text-sm"><thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500"><tr><th className="px-4 py-3">Mahasiswa</th><th className="px-4 py-3">Judul</th><th className="px-4 py-3">Pembimbing</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Diajukan</th><th className="px-4 py-3">Aksi</th></tr></thead><tbody className="divide-y divide-neutral-100">
            {rows.map((thesis) => <tr key={thesis.id}>
                <td className="px-4 py-3"><p className="font-bold">{thesis.mahasiswa?.nama_lengkap || '-'}</p><p className="text-xs text-neutral-500">{thesis.mahasiswa?.nim || '-'}</p></td>
                <td className="max-w-sm px-4 py-3 text-xs font-medium">{thesis.title || '-'}</td>
                <td className="px-4 py-3 text-xs">{(thesis.active_supervisors || []).map((item) => item.dosen?.nama_lengkap).filter(Boolean).join(', ') || '-'}</td>
                <td className="px-4 py-3"><Badge status={thesis.status} /></td>
                <td className="px-4 py-3 text-xs text-neutral-500">{thesis.submitted_at ? new Date(thesis.submitted_at).toLocaleDateString('id-ID') : '-'}</td>
                <td className="px-4 py-3"><Link href={`/admin/tugas-akhir/${thesis.id}`} className="text-xs font-bold underline">Detail</Link></td>
            </tr>)}
            {rows.length === 0 && <tr><td colSpan="6" className="px-4 py-10 text-center text-neutral-500">{hasFilter ? 'Tidak ada tugas akhir yang sesuai dengan pencarian.' : 'Belum ada tugas akhir yang tercatat.'}</td></tr>}
        </tbody></table></section>

        {theses.meta?.total > 0 && <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-500"><span>Menampilkan {theses.meta.from}–{theses.meta.to} dari {theses.meta.total} tugas akhir</span><Pagination links={theses.links} /></div>}
    </div></AdminLayout>;
}