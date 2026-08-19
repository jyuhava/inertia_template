import { useForm } from '@inertiajs/react';
import { useState } from 'react';
import { useBorangCrud } from '../../Components/useBorangCrud';
import { ActionButton, InputLabel, TextArea, InputError, DragRow, ProgramSelect, MONTHS } from '../../Components/RakerUi';

const EMPTY = {
    program_source_id: null,
    program_name: '',
    jan: '', feb: '', mar: '', apr: '', may: '', jun: '',
    jul: '', aug: '', sep: '', oct: '', nov: '', dec: '',
    main_milestone: '',
};

export default function Borang4Tab({ items = [], programs = [], submissionId, canEdit }) {
    const { destroy, reorderOnDrop } = useBorangCrud({
        destroyRoute: (id) => `/raker/borang4/${id}`,
        reorderRoute: `/raker/submissions/${submissionId}/borang4/reorder`,
        label: 'timeline',
    });

    const form = useForm(EMPTY);
    const [adding, setAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [draggedId, setDraggedId] = useState(null);

    const cancel = () => {
        form.setDefaults(EMPTY);
        form.reset();
        setAdding(false);
        setEditingId(null);
    };

    const startAdd = () => {
        cancel();
        setAdding(true);
    };

    const startEdit = (item) => {
        form.setData({ ...item });
        form.setDefaults({ ...item });
        setAdding(false);
        setEditingId(item.id);
    };

    const submit = (e) => {
        e.preventDefault();
        const options = { preserveScroll: true, onSuccess: cancel };
        if (editingId) {
            form.put(`/raker/borang4/${editingId}`, options);
        } else {
            form.post(`/raker/submissions/${submissionId}/borang4`, options);
        }
    };

    const monthCell = (key) => (
        <div>
            <InputLabel htmlFor={`b4_${key}`}>{key.charAt(0).toUpperCase() + key.slice(1)}</InputLabel>
            <TextArea id={`b4_${key}`} rows="1" value={form.data[key] || ''} onChange={(e) => form.setData(key, e.target.value)} placeholder={key.toUpperCase()} disabled={!canEdit} className="text-[11px]" />
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-neutral-500 uppercase tracking-widest">
                    {items.length} timeline program tercatat
                </p>
                {canEdit && !adding && editingId === null && (
                    <ActionButton onClick={startAdd}>+ Tambah Timeline</ActionButton>
                )}
            </div>

            {adding || editingId !== null ? (
                <div className="border border-neutral-300 bg-[#fafafa] p-5 space-y-5">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-900">
                        {editingId !== null ? 'Edit Timeline' : 'Tambah Timeline'}
                    </h3>
                    <form onSubmit={submit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <InputLabel>Program (dari Borang 1 / 2)</InputLabel>
                                <ProgramSelect
                                    programs={programs}
                                    value={form.data}
                                    onChange={(v) => form.setData((prev) => ({ ...prev, ...v }))}
                                />
                            </div>
                            <div>
                                <InputLabel htmlFor="b4_name">Nama Program (otomatis)</InputLabel>
                                <div className="border border-neutral-300 bg-neutral-100 px-3 py-2 text-sm text-neutral-600 h-[42px] overflow-hidden">
                                    {form.data.program_name || 'Pilih program terlebih dahulu'}
                                </div>
                            </div>
                        </div>

                        <div>
                            <p className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Grid Kegiatan Bulanan (Jan — Des)</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                {MONTHS.map((m) => monthCell(m.key))}
                            </div>
                        </div>

                        <div>
                            <InputLabel htmlFor="b4_milestone">Milestone Utama</InputLabel>
                            <TextArea id="b4_milestone" rows="2" value={form.data.main_milestone} onChange={(e) => form.setData('main_milestone', e.target.value)} />
                        </div>

                        <InputError message={form.errors.program_name} />

                        <div className="flex items-center justify-end gap-3 border-t border-neutral-200 pt-4">
                            <ActionButton onClick={cancel} variant="secondary">Batal</ActionButton>
                            <ActionButton type="submit" variant="primary" disabled={form.processing}>
                                {form.processing ? 'Menyimpan...' : editingId !== null ? 'Simpan Perubahan' : 'Simpan'}
                            </ActionButton>
                        </div>
                    </form>
                </div>
            ) : null}

            {items.length === 0 ? (
                <div className="border border-dashed border-neutral-300 p-8 text-center">
                    <p className="text-xs uppercase tracking-widest text-neutral-400">Belum ada timeline program.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {items.map((item) => {
                        const filled = MONTHS.filter((m) => item[m.key]).length;
                        return (
                            <DragRow
                                key={item.id}
                                draggable={canEdit}
                                onDragStart={(e) => { if (canEdit) { setDraggedId(item.id); e.dataTransfer.effectAllowed = 'move'; } }}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => { if (canEdit) { e.preventDefault(); reorderOnDrop(items, draggedId, item.id); setDraggedId(null); } }}
                                isDragging={draggedId === item.id}
                            >
                                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold uppercase tracking-wide text-neutral-900">{item.program_name}</p>
                                        <p className="mt-0.5 text-xs text-neutral-500">Bulan terisi: {filled} dari 12</p>
                                        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                                            {MONTHS.map((m) => (
                                                <div key={m.key} className={`border px-2 py-1.5 min-h-[38px] ${item[m.key] ? 'border-green-300 bg-green-50' : 'border-[#e5e5e5] bg-neutral-50'}`}>
                                                    <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-500 mb-0.5">{m.label}</p>
                                                    <p className="text-[11px] text-neutral-700 leading-snug">{item[m.key] || '—'}</p>
                                                </div>
                                            ))}
                                        </div>
                                        {item.main_milestone && (
                                            <p className="mt-2 text-xs text-neutral-700"><span className="font-bold">Milestone:</span> {item.main_milestone}</p>
                                        )}
                                    </div>
                                    {canEdit && (
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <ActionButton onClick={() => startEdit(item)} variant="ghost">Edit</ActionButton>
                                            <ActionButton onClick={() => destroy(item.id)} variant="danger">Hapus</ActionButton>
                                        </div>
                                    )}
                                </div>
                            </DragRow>
                        );
                    })}
                </div>
            )}
        </div>
    );
}