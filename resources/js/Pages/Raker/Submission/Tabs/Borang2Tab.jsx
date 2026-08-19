import { useForm } from '@inertiajs/react';
import { useState } from 'react';
import { useBorangCrud } from '../../Components/useBorangCrud';
import {
    ActionButton,
    InputLabel,
    TextInput,
    TextArea,
    InputError,
    ChipsInput,
    PillarCheckboxes,
    DragRow,
} from '../../Components/RakerUi';

const EMPTY = {
    program_name: '',
    main_pillar: [],
    supporting_pillar: [],
    target_audience: '',
    main_output: '',
    success_indicator: '',
    pic_names: [],
    estimated_duration: '',
    priority: 1,
};

export default function Borang2Tab({ items = [], submissionId, canEdit }) {
    const { destroy, reorderOnDrop } = useBorangCrud({
        destroyRoute: (id) => `/raker/borang2/${id}`,
        reorderRoute: `/raker/submissions/${submissionId}/borang2/reorder`,
        label: 'program kerja baru',
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
            form.put(`/raker/borang2/${editingId}`, options);
        } else {
            form.post(`/raker/submissions/${submissionId}/borang2`, options);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-neutral-500 uppercase tracking-widest">
                    {items.length} program kerja baru tercatat
                </p>
                {canEdit && !adding && editingId === null && (
                    <ActionButton onClick={startAdd}>+ Tambah Program</ActionButton>
                )}
            </div>

            {adding || editingId !== null ? (
                <div className="border border-neutral-300 bg-[#fafafa] p-5 space-y-5">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-900">
                        {editingId !== null ? 'Edit Program Kerja Baru' : 'Tambah Program Kerja Baru'}
                    </h3>
                    <form onSubmit={submit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <InputLabel htmlFor="b2_name">Nama Program</InputLabel>
                                <TextInput id="b2_name" value={form.data.program_name} onChange={(e) => form.setData('program_name', e.target.value)} error={form.errors.program_name} required />
                                <InputError message={form.errors.program_name} />
                            </div>
                            <div>
                                <InputLabel htmlFor="b2_duration">Estimasi Durasi</InputLabel>
                                <TextInput id="b2_duration" value={form.data.estimated_duration} onChange={(e) => form.setData('estimated_duration', e.target.value)} placeholder="Contoh: 6 bulan / 1 tahun" />
                            </div>
                        </div>

                        <div>
                            <InputLabel>Pilar Utama</InputLabel>
                            <PillarCheckboxes value={form.data.main_pillar} onChange={(v) => form.setData('main_pillar', v)} />
                        </div>

                        <div>
                            <InputLabel>Pilar Pendukung</InputLabel>
                            <PillarCheckboxes value={form.data.supporting_pillar} onChange={(v) => form.setData('supporting_pillar', v)} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <InputLabel htmlFor="b2_audience">Sasaran</InputLabel>
                                <TextArea id="b2_audience" rows="2" value={form.data.target_audience} onChange={(e) => form.setData('target_audience', e.target.value)} />
                            </div>
                            <div>
                                <InputLabel htmlFor="b2_output">Output Utama</InputLabel>
                                <TextArea id="b2_output" rows="2" value={form.data.main_output} onChange={(e) => form.setData('main_output', e.target.value)} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <InputLabel htmlFor="b2_indicator">Indikator Keberhasilan</InputLabel>
                                <TextArea id="b2_indicator" rows="2" value={form.data.success_indicator} onChange={(e) => form.setData('success_indicator', e.target.value)} />
                            </div>
                            <div>
                                <InputLabel htmlFor="b2_priority">Prioritas</InputLabel>
                                <TextInput id="b2_priority" type="number" min="1" value={form.data.priority} onChange={(e) => form.setData('priority', e.target.value)} />
                                <InputError message={form.errors.priority} />
                            </div>
                        </div>

                        <div>
                            <InputLabel>PIC (Nama)</InputLabel>
                            <ChipsInput value={form.data.pic_names} onChange={(v) => form.setData('pic_names', v)} placeholder="Nama PIC lalu Enter" />
                        </div>

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
                    <p className="text-xs uppercase tracking-widest text-neutral-400">Belum ada program kerja baru.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {items.map((item) => (
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
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-sm font-bold uppercase tracking-wide text-neutral-900">{item.program_name}</p>
                                        {item.priority && (
                                            <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-black text-white border border-black">
                                                Prioritas {item.priority}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {(item.main_pillar || []).map((pillar) => (
                                            <span key={pillar} className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-green-50 border border-green-200 text-green-700">
                                                {pillar}
                                            </span>
                                        ))}
                                        {(item.supporting_pillar || []).map((pillar) => (
                                            <span key={pillar} className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-[#f5f5f5] border border-[#e5e5e5] text-neutral-600">
                                                {pillar}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-neutral-600">
                                        {item.target_audience && <p><span className="font-bold">Sasaran:</span> {item.target_audience}</p>}
                                        {item.main_output && <p><span className="font-bold">Output:</span> {item.main_output}</p>}
                                        {item.success_indicator && <p><span className="font-bold">Indikator:</span> {item.success_indicator}</p>}
                                    </div>
                                    <div className="mt-1 text-xs text-neutral-500">
                                        {item.estimated_duration && <span className="mr-3"><span className="font-bold">Durasi:</span> {item.estimated_duration}</span>}
                                        {(item.pic_names || []).length > 0 && <span><span className="font-bold">PIC:</span> {item.pic_names.join(', ')}</span>}
                                    </div>
                                </div>
                                {canEdit && (
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <ActionButton onClick={() => startEdit(item)} variant="ghost">Edit</ActionButton>
                                        <ActionButton onClick={() => destroy(item.id)} variant="danger">Hapus</ActionButton>
                                    </div>
                                )}
                            </div>
                        </DragRow>
                    ))}
                </div>
            )}
        </div>
    );
}