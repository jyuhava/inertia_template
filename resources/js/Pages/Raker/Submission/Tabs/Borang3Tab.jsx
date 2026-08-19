import { useForm } from '@inertiajs/react';
import { useState } from 'react';
import { useBorangCrud } from '../../Components/useBorangCrud';
import {
    ActionButton,
    InputLabel,
    TextArea,
    SelectInput,
    InputError,
    ChipsInput,
    DragRow,
    ProgramSelect,
} from '../../Components/RakerUi';

const EMPTY = {
    program_source_type: null,
    program_source_id: null,
    program_name: '',
    main_risk: '',
    cause: '',
    impact: '',
    risk_level: 'Sedang',
    mitigation_strategy: '',
    pic_names: [],
    additional_notes: '',
};

export default function Borang3Tab({ items = [], programs = [], submissionId, canEdit }) {
    const { destroy, reorderOnDrop } = useBorangCrud({
        destroyRoute: (id) => `/raker/borang3/${id}`,
        reorderRoute: `/raker/submissions/${submissionId}/borang3/reorder`,
        label: 'analisis risiko',
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
            form.put(`/raker/borang3/${editingId}`, options);
        } else {
            form.post(`/raker/submissions/${submissionId}/borang3`, options);
        }
    };

    const riskLevel = {
        Tinggi: 'bg-red-500 text-white border-red-500',
        Sedang: 'bg-yellow-500 text-white border-yellow-500',
        Rendah: 'bg-green-600 text-white border-green-600',
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-neutral-500 uppercase tracking-widest">
                    {items.length} analisis risiko tercatat
                </p>
                {canEdit && !adding && editingId === null && (
                    <ActionButton onClick={startAdd}>+ Tambah Analisis Risiko</ActionButton>
                )}
            </div>

            {adding || editingId !== null ? (
                <div className="border border-neutral-300 bg-[#fafafa] p-5 space-y-5">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-900">
                        {editingId !== null ? 'Edit Analisis Risiko' : 'Tambah Analisis Risiko'}
                    </h3>
                    <form onSubmit={submit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <InputLabel>Program (dari Borang 1 / 2)</InputLabel>
                                <ProgramSelect
                                    programs={programs}
                                    value={form.data}
                                    includeType
                                    onChange={(v) => form.setData((prev) => ({ ...prev, ...v }))}
                                />
                            </div>
                            <div>
                                <InputLabel htmlFor="b3_name">Nama Program (otomatis)</InputLabel>
                                <div className="border border-neutral-300 bg-neutral-100 px-3 py-2 text-sm text-neutral-600 h-[42px] overflow-hidden">
                                    {form.data.program_name || 'Pilih program terlebih dahulu'}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <InputLabel htmlFor="b3_risk">Risiko Utama</InputLabel>
                                <TextArea id="b3_risk" rows="2" value={form.data.main_risk} onChange={(e) => form.setData('main_risk', e.target.value)} />
                            </div>
                            <div>
                                <InputLabel htmlFor="b3_cause">Penyebab</InputLabel>
                                <TextArea id="b3_cause" rows="2" value={form.data.cause} onChange={(e) => form.setData('cause', e.target.value)} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <InputLabel htmlFor="b3_impact">Dampak</InputLabel>
                                <TextArea id="b3_impact" rows="2" value={form.data.impact} onChange={(e) => form.setData('impact', e.target.value)} />
                            </div>
                            <div>
                                <InputLabel htmlFor="b3_level">Tingkat Risiko</InputLabel>
                                <SelectInput id="b3_level" value={form.data.risk_level} onChange={(e) => form.setData('risk_level', e.target.value)}>
                                    <option value="Tinggi">Tinggi</option>
                                    <option value="Sedang">Sedang</option>
                                    <option value="Rendah">Rendah</option>
                                </SelectInput>
                            </div>
                        </div>

                        <div>
                            <InputLabel htmlFor="b3_mitigation">Strategi Mitigasi</InputLabel>
                            <TextArea id="b3_mitigation" rows="2" value={form.data.mitigation_strategy} onChange={(e) => form.setData('mitigation_strategy', e.target.value)} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <InputLabel>PIC (Nama)</InputLabel>
                                <ChipsInput value={form.data.pic_names} onChange={(v) => form.setData('pic_names', v)} placeholder="Nama PIC lalu Enter" />
                            </div>
                            <div>
                                <InputLabel htmlFor="b3_notes">Catatan Tambahan</InputLabel>
                                <TextArea id="b3_notes" rows="2" value={form.data.additional_notes} onChange={(e) => form.setData('additional_notes', e.target.value)} />
                            </div>
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
                    <p className="text-xs uppercase tracking-widest text-neutral-400">Belum ada analisis risiko.</p>
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
                                        <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border ${riskLevel[item.risk_level] || riskLevel.Sedang}`}>
                                            {item.risk_level}
                                        </span>
                                    </div>
                                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-neutral-600">
                                        {item.main_risk && <p><span className="font-bold">Risiko:</span> {item.main_risk}</p>}
                                        {item.cause && <p><span className="font-bold">Penyebab:</span> {item.cause}</p>}
                                        {item.impact && <p><span className="font-bold">Dampak:</span> {item.impact}</p>}
                                    </div>
                                    {item.mitigation_strategy && (
                                        <p className="mt-1 text-xs text-neutral-600"><span className="font-bold">Mitigasi:</span> {item.mitigation_strategy}</p>
                                    )}
                                    <div className="mt-1 text-xs text-neutral-500">
                                        {(item.pic_names || []).length > 0 && <span className="mr-3"><span className="font-bold">PIC:</span> {item.pic_names.join(', ')}</span>}
                                        {item.additional_notes && <span><span className="font-bold">Catatan:</span> {item.additional_notes}</span>}
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