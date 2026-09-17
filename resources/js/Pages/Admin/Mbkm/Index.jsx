import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';

const labels = { draft: 'Draft', registration_open: 'Pendaftaran dibuka', registration_closed: 'Pendaftaran ditutup', active: 'Aktif', completed: 'Selesai', archived: 'Arsip' };
const tones = { draft: 'bg-amber-100 text-amber-800', registration_open: 'bg-emerald-100 text-emerald-800', active: 'bg-blue-100 text-blue-800', completed: 'bg-neutral-900 text-white', archived: 'bg-neutral-200 text-neutral-600' };
function Status({ value }) { return <span className={`inline-flex rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${tones[value] || 'bg-neutral-100 text-neutral-700'}`}>{labels[value] || value || '-'}</span>; }

export default function Index({ programs, mbkmPrograms, filters = {}, programTypes = [], semesters = [] }) {
    const collection = programs || mbkmPrograms || { data: [] };
    const rows = collection.data || collection;
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const submit = (event) => { event.preventDefault(); router.get('/admin/mbkm/programs', { search, status }, { preserveState: true, replace: true }); };
    return <AdminLayout title="Program MBKM"><Head title="Program MBKM" />
        <div className="min-h-dvh space-y-6 bg-neutral-50 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-slate-800 to-indigo-700 p-6 text-white"><div><p className="text-xs uppercase tracking-widest">Merdeka Belajar</p><h1 className="text-2xl font-bold">PROGRAM MBKM</h1><p className="mt-1 text-sm text-white/80">Kelola program, kuota, dan kriteria peserta.</p></div><Link href="/admin/mbkm/programs/create" className="bg-white px-4 py-2 text-sm font-bold text-black">+ Tambah Program</Link></div>
            <form onSubmit={submit} className="flex flex-wrap gap-3 border border-neutral-200 bg-white p-4"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari kode atau nama program..." className="min-w-56 flex-1 border-neutral-300 text-sm" /><select value={status} onChange={(e) => setStatus(e.target.value)} className="border-neutral-300 text-sm"><option value="">Semua status</option>{Object.entries(labels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><button className="bg-black px-4 py-2 text-xs font-bold text-white">Cari</button></form>
            <div className="overflow-x-auto border border-neutral-200 bg-white"><table className="min-w-full text-sm"><thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500"><tr><th className="px-4 py-3">Program</th><th className="px-4 py-3">Jenis</th><th className="px-4 py-3">Periode</th><th className="px-4 py-3">Kuota</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Aksi</th></tr></thead><tbody className="divide-y divide-neutral-100">{rows.map((program) => <tr key={program.id}><td className="px-4 py-3"><p className="font-bold">{program.name}</p><p className="text-xs text-neutral-500">{program.code}</p></td><td className="px-4 py-3">{program.program_type?.name || program.mbkm_program_type?.name || '-'}</td><td className="px-4 py-3 text-xs">{program.registration_start} s/d {program.registration_end}</td><td className="px-4 py-3">{program.application_count ?? program.applications_count ?? 0}{program.quota ? ` / ${program.quota}` : ''}</td><td className="px-4 py-3"><Status value={program.status} /></td><td className="px-4 py-3"><Link href={`/admin/mbkm/programs/${program.id}`} className="text-xs font-bold underline">Detail</Link></td></tr>)}{rows.length === 0 && <tr><td colSpan="6" className="px-4 py-10 text-center text-neutral-500">Belum ada program MBKM.</td></tr>}</tbody></table></div>
        </div>
    </AdminLayout>;
}
