import { useForm } from '@inertiajs/react';
import { useState } from 'react';
import { useBorangCrud } from '../../Components/useBorangCrud';
import {
    ActionButton,
    InputLabel,
    TextInput,
    SelectInput,
    TextArea,
    InputError,
    ChipsInput,
    PillarCheckboxes,
    DragRow,
} from '../../Components/RakerUi';

const EMPTY = {
    program_name: '',
    unit: '',
    pic_names: [],
    pillars: [],
    description: '',
    policy_alignment: 'Sangat Sesuai',
    improvement_notes: '',
};

export default function Borang1Tab({ items = [], submissionId, canEdit }) {
    const { destroy, reorderOnDrop } = useBorangCrud({
        destroyRoute: (id) => `/raker/borang1/${id}`,
        reorderRoute: `/raker/submissions/${submissionId}/borang1/reorder`,
        label: 'program kerja lama',
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
            form.put(`/raker/borang1/${editingId}`, options);
        } else {
            form.post(`/raker/submissions/${submissionId}/borang1`, options);
        }
    };

    const policyLabel = {
        'Sangat Sesuai': 'bg-green-600 text-white border-green-600',
        'Cukup Sesuai': 'bg-yellow-500 text-white border-yellow-500',
        'Perlu Penyesuaian': 'bg-red-500 text-white border-red-500',
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-neutral-500 uppercase tracking-widest">
                    {items.length} program kerja lama tercatat
                </p>
                {canEdit && !adding && editingId === null && (
                    <ActionButton onClick={startAdd}>+ Tambah Program</ActionButton>
                )}
            </div>

            {adding || editingId !== null ? (
                <div className="border border-neutral-300 bg-[#fafafa] p-5 space-y-5">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-900">
                        {editingId !== null ? 'Edit Program Kerja Lama' : 'Tambah Program Kerja Lama'}
                    </h3>
                    <form onSubmit={submit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <InputLabel htmlFor="b1_name">Nama Program</InputLabel>
                                <TextInput id="b1_name" value={form.data.program_name} onChange={(e) => form.setData('program_name', e.target.value)} error={form.errors.program_name} required />
                                <InputError message={form.errors.program_name} />
                            </div>
                            <div>
                                <InputLabel htmlFor="b1_unit">Unit</InputLabel>
                                <TextInput id="b1_unit" value={form.data.unit} onChange={(e) => form.setData('unit', e.target.value)} />
                            </div>
                        </div>

                        <div>
                            <InputLabel>PIC (Nama)</InputLabel>
                            <ChipsInput value={form.data.pic_names} onChange={(v) => form.setData('pic_names', v)} placeholder="Nama PIC lalu Enter" />
                        </div>

                        <div>
                            <InputLabel>Pilar yang Didukung</InputLabel>
                            <PillarCheckboxes value={form.data.pillars} onChange={(v) => form.setData('pillars', v)} />
                        </div>

                        <div>
                            <InputLabel htmlFor="b1_desc">Deskripsi</InputLabel>
                            <TextArea id="b1_desc" rows="3" value={form.data.description} onChange={(e) => form.setData('description', e.target.value)} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <InputLabel htmlFor="b1_align">Keselarasan Kebijakan</InputLabel>
                                <SelectInput id="b1_align" value={form.data.policy_alignment} onChange={(e) => form.setData('policy_alignment', e.target.value)}>
                                    <option value="Sangat Sesuai">Sangat Sesuai</option>
                                    <option value="Cukup Sesuai">Cukup Sesuai</option>
                                    <option value="Perlu Penyesuaian">Perlu Penyesuaian</option>
                                </SelectInput>
                            </div>
                            <div>
                                <InputLabel htmlFor="b1_notes">Catatan Perbaikan</InputLabel>
                                <TextArea id="b1_notes" rows="1" value={form.data.improvement_notes} onChange={(e) => form.setData('improvement_notes', e.target.value)} />
                            </div>
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
                    <p className="text-xs uppercase tracking-widest text-neutral-400">Belum ada program kerja lama.</p>
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
                                    <p className="text-sm font-bold uppercase tracking-wide text-neutral-900">{item.program_name}</p>
                                    {item.unit && <p className="text-xs text-neutral-500 mt-0.5">Unit: {item.unit}</p>}
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border ${policyLabel[item.policy_alignment] || policyLabel['Cukup Sesuai']}`}>
                                            {item.policy_alignment}
                                        </span>
                                        {(item.pillars || []).map((pillar) => (
                                            <span key={pillar} className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-[#f5f5f5] border border-[#e5e5e5] text-neutral-600">
                                                {pillar}
                                            </span>
                                        ))}
                                    </div>
                                    {item.description && <p className="mt-2 text-xs text-neutral-600">{item.description}</p>}
                                    {item.improvement_notes && (
                                        <p className="mt-1 text-xs text-neutral-500"><span className="font-bold">Catatan: </span>{item.improvement_notes}</p>
                                    )}
                                    {(item.pic_names || []).length > 0 && (
                                        <p className="mt-1 text-xs text-neutral-500"><span className="font-bold">PIC: </span>{item.pic_names.join(', ')}</p>
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
                    ))}
                </div>
            )}
        </div>
    );
}