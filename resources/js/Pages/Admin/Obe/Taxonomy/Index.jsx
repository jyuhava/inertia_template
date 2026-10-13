import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { collectionRows, EmptyRow, Field, ObeHeader, Panel, StatusBadge } from '@/Components/ObeUi';

const emptyLevel = { code: '', name: '', category: '', description: '', sequence: 1, status: 'aktif' };

export default function Index({ taxonomyLevels = [], levels = [] }) {
    const rows = collectionRows(taxonomyLevels).length ? collectionRows(taxonomyLevels) : collectionRows(levels);
    const levelForm = useForm(emptyLevel);
    const editForm = useForm(emptyLevel);
    const [editingId, setEditingId] = useState(null);

    const submitCreate = (event) => { event.preventDefault(); levelForm.post('/admin/obe/taxonomy-levels', { onSuccess: () => levelForm.reset() }); };

    // Satu form edit untuk satu level: nilai dimumpil ulang dari baris yang
    // dipilih supaya perubahan tidak tertimpa form milik baris lain.
    const startEdit = (level) => {
        setEditingId(level.id);
        editForm.setData({ code: level.code || '', name: level.name || '', category: level.category || '', description: level.description || '', sequence: level.sequence ?? 0, status: level.status || 'aktif' });
    };
    const submitEdit = (event) => {
        event.preventDefault();
        editForm.put(`/admin/obe/taxonomy-levels/${editingId}`, { onSuccess: () => { setEditingId(null); editForm.reset(); } });
    };
    const cancelEdit = () => { setEditingId(null); editForm.reset(); };
    const deactivate = (level) => { if (confirm(`Nonaktifkan level ${level.code}?`)) router.delete(`/admin/obe/taxonomy-levels/${level.id}`); };

    return <AdminLayout title="Level Taksonomi"><Head title="Level Taksonomi" /><div className="min-h-dvh space-y-6 bg-neutral-50 p-6"><ObeHeader title="LEVEL TAKSONOMI" description="Taksonomi bloom yang dipakai saat menetapkan level capaian CPMK." />
        <Panel><h2 className="mb-4 text-lg font-bold text-neutral-900">Tambah Level</h2><form onSubmit={submitCreate} className="grid gap-4 md:grid-cols-2"><Field label="Kode" error={levelForm.errors.code}><input required value={levelForm.data.code} onChange={(e) => levelForm.setData('code', e.target.value)} className="w-full border-neutral-300 text-sm" placeholder="C1" /></Field><Field label="Nama" error={levelForm.errors.name}><input required value={levelForm.data.name} onChange={(e) => levelForm.setData('name', e.target.value)} className="w-full border-neutral-300 text-sm" placeholder="Mengingat" /></Field><Field label="Kategori" error={levelForm.errors.category}><input value={levelForm.data.category} onChange={(e) => levelForm.setData('category', e.target.value)} className="w-full border-neutral-300 text-sm" placeholder="Bloom Kognitif" /></Field><Field label="Urutan" error={levelForm.errors.sequence}><input type="number" min="0" value={levelForm.data.sequence} onChange={(e) => levelForm.setData('sequence', e.target.value)} className="w-full border-neutral-300 text-sm" /></Field><Field label="Deskripsi" error={levelForm.errors.description} className="md:col-span-2"><textarea rows="3" value={levelForm.data.description} onChange={(e) => levelForm.setData('description', e.target.value)} className="w-full border-neutral-300 text-sm" /></Field><div className="md:col-span-2"><button disabled={levelForm.processing} className="bg-black px-4 py-2 text-xs font-bold text-white disabled:opacity-50">{levelForm.processing ? 'Menyimpan...' : 'Tambah Level'}</button></div></form></Panel>

        <Panel className="overflow-x-auto !p-0"><div className="border-b border-neutral-200 px-5 py-4"><h2 className="font-bold">Daftar Level Taksonomi</h2></div><table className="min-w-full text-sm"><thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500"><tr><th className="px-4 py-3">Kode</th><th className="px-4 py-3">Nama</th><th className="px-4 py-3">Kategori</th><th className="px-4 py-3">Urutan</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Aksi</th></tr></thead><tbody className="divide-y divide-neutral-100">{rows.map((level) => <tr key={level.id}><td className="px-4 py-3 font-bold">{level.code}</td><td className="px-4 py-3">{level.name}</td><td className="px-4 py-3">{level.category || '—'}</td><td className="px-4 py-3">{level.sequence ?? 0}</td><td className="px-4 py-3"><StatusBadge value={level.status} /></td><td className="px-4 py-3"><div className="flex gap-3"><button onClick={() => startEdit(level)} className="text-xs font-bold text-indigo-700 underline">Ubah</button><button onClick={() => deactivate(level)} className="text-xs font-bold text-red-700 underline">Nonaktifkan</button></div></td></tr>)}{rows.length === 0 && <EmptyRow colSpan={6}>Belum ada level taksonomi.</EmptyRow>}</tbody></table></Panel>

        {editingId && <Panel><h2 className="mb-4 font-bold">Ubah Level</h2><form onSubmit={submitEdit} className="grid gap-4 md:grid-cols-2"><Field label="Kode" error={editForm.errors.code}><input required value={editForm.data.code} onChange={(e) => editForm.setData('code', e.target.value)} className="w-full border-neutral-300 text-sm" /></Field><Field label="Nama" error={editForm.errors.name}><input required value={editForm.data.name} onChange={(e) => editForm.setData('name', e.target.value)} className="w-full border-neutral-300 text-sm" /></Field><Field label="Kategori" error={editForm.errors.category}><input value={editForm.data.category} onChange={(e) => editForm.setData('category', e.target.value)} className="w-full border-neutral-300 text-sm" /></Field><Field label="Urutan" error={editForm.errors.sequence}><input type="number" min="0" value={editForm.data.sequence} onChange={(e) => editForm.setData('sequence', e.target.value)} className="w-full border-neutral-300 text-sm" /></Field><Field label="Deskripsi" error={editForm.errors.description} className="md:col-span-2"><textarea rows="3" value={editForm.data.description} onChange={(e) => editForm.setData('description', e.target.value)} className="w-full border-neutral-300 text-sm" /></Field><div className="flex gap-3 md:col-span-2"><button disabled={editForm.processing} className="bg-black px-4 py-2 text-xs font-bold text-white disabled:opacity-50">{editForm.processing ? 'Menyimpan...' : 'Simpan'}</button><button type="button" onClick={cancelEdit} className="border border-neutral-300 px-4 py-2 text-xs font-bold">Batal</button></div></form></Panel>}
    </div></AdminLayout>;
}