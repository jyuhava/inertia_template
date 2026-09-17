import { Link } from '@inertiajs/react';

export const collectionRows = (value) => (Array.isArray(value) ? value : value?.data || []);
export const courseName = (course) => course?.nama_mata_kuliah || course?.nama || course?.name || '-';
export const curriculumName = (curriculum) => curriculum?.nama || curriculum?.name || curriculum?.kode || '-';

export function ObeHeader({ eyebrow = 'Outcome-Based Education', title, description, action }) {
    return <section className="flex flex-wrap items-start justify-between gap-4 bg-gradient-to-r from-slate-800 to-indigo-700 p-6 text-white"><div><p className="text-xs uppercase tracking-widest text-white/75">{eyebrow}</p><h1 className="mt-1 text-2xl font-bold">{title}</h1>{description && <p className="mt-2 text-sm text-white/80">{description}</p>}</div>{action}</section>;
}

export function Panel({ children, className = '' }) {
    return <section className={`border border-neutral-200 bg-white p-5 ${className}`}>{children}</section>;
}

export function Field({ label, error, children, className = '' }) {
    return <div className={className}><label className="mb-1 block text-xs font-bold uppercase tracking-wide text-neutral-700">{label}</label>{children}{error && <p className="mt-1 text-xs text-red-600">{error}</p>}</div>;
}

const domainTone = {
    sikap: 'bg-violet-100 text-violet-800', pengetahuan: 'bg-sky-100 text-sky-800',
    keterampilan_umum: 'bg-amber-100 text-amber-800', keterampilan_khusus: 'bg-emerald-100 text-emerald-800',
};

export function DomainBadge({ value }) {
    const label = String(value || 'Belum dikategorikan').replaceAll('_', ' ');
    return <span className={`inline-flex rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${domainTone[value] || 'bg-neutral-100 text-neutral-700'}`}>{label}</span>;
}

export function StatusBadge({ value }) {
    const active = ['aktif', 'active', 'published'].includes(value);
    return <span className={`inline-flex rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${active ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-700'}`}>{value || 'aktif'}</span>;
}

export function BackLink({ href = '/admin/obe/cpl' }) {
    return <Link href={href} className="text-sm font-semibold underline underline-offset-4">Kembali</Link>;
}

export function EmptyRow({ colSpan, children }) {
    return <tr><td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-neutral-500">{children}</td></tr>;
}
