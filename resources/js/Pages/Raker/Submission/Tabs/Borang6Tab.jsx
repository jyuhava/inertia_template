import { useForm } from '@inertiajs/react';
import { useState } from 'react';
import { useBorangCrud } from '../../Components/useBorangCrud';
import {
    ActionButton,
    InputLabel,
    TextInput,
    TextArea,
    InputError,
    DragRow,
    ProgramSelect,
    formatRupiah,
} from '../../Components/RakerUi';

const EMPTY = {
    program_source_id: null,
    program_name: '',
    cost_component: '',
    volume: '',
    unit: '',
    unit_price: '',
    total_price: '',
    funding_source: '',
    priority: '',
    notes: '',
};

const computeTotal = (data) => {
    const volume = parseFloat(data.volume || 0);
    const price = parseInt(data.unit_price || 0, 10);
    if (!data.volume || !data.unit_price) return '';
    return Math.round(volume * price);
};

export default function Borang6Tab({ items = [], programs = [], submissionId, canEdit }) {
    const { destroy, reorderOnDrop } = useBorangCrud({
        destroyRoute: (id) => `/raker/borang6/${id}`,
        reorderRoute: `/raker/submissions/${submissionId}/borang6/reorder`,
        label: 'anggaran',
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
        form.setData('total_price', computeTotal(form.data));
        const options = { preserveScroll: true, onSuccess: cancel };
        if (editingId) {
            form.put(`/raker/borang6/${editingId}`, options);
        } else {
            form.post(`/raker/submissions/${submissionId}/borang6`, options);
        }
    };

    const grandTotal = items.reduce((sum, item) => sum + Number(item.total_price || 0), 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-neutral-500 uppercase tracking-widest">
                    {items.length} komponen anggaran tercatat
                </p>
                {canEdit && !adding && editingId === null && (
                    <ActionButton onClick={startAdd}>+ Tambah Anggaran</ActionButton>
                )}
            </div>

            {adding || editingId !== null ? (
                <div className="border border-neutral-300 bg-[#fafafa] p-5 space-y-5">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-900">
                        {editingId !== null ? 'Edit Anggaran' : 'Tambah Anggaran'}
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
                                <InputLabel htmlFor="b6_name">Nama Program (otomatis)</InputLabel>
                                <div className="border border-neutral-300 bg-neutral-100 px-3 py-2 text-sm text-neutral-600 h-[42px] overflow-hidden">
                                    {form.data.program_name || 'Pilih program terlebih dahulu'}
                                </div>
                            </div>
                        </div>

                        <div>
                            <InputLabel htmlFor="b6_component">Komponen Biaya</InputLabel>
                            <TextInput id="b6_component" value={form.data.cost_component} onChange={(e) => form.setData('cost_component', e.target.value)} placeholder="Contoh: Honorarium narasumber" />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                            <div>
                                <InputLabel htmlFor="b6_volume">Volume</InputLabel>
                                <TextInput id="b6_volume" type="number" step="0.01" min="0" value={form.data.volume} onChange={(e) => { form.setData('volume', e.target.value); form.setData('total_price', computeTotal({ ...form.data, volume: e.target.value })); }} />
                            </div>
                            <div>
                                <InputLabel htmlFor="b6_unit">Satuan</InputLabel>
                                <TextInput id="b6_unit" value={form.data.unit} onChange={(e) => form.setData('unit', e.target.value)} placeholder="contoh: orang/kali" />
                            </div>
                            <div>
                                <InputLabel htmlFor="b6_price">Harga Satuan (Rp)</InputLabel>
                                <TextInput id="b6_price" type="number" min="0" value={form.data.unit_price} onChange={(e) => { form.setData('unit_price', e.target.value); form.setData('total_price', computeTotal({ ...form.data, unit_price: e.target.value })); }} />
                            </div>
                            <div>
                                <InputLabel htmlFor="b6_total">Total (Otomatis)</InputLabel>
                                <div className="border border-neutral-300 bg-neutral-100 px-3 py-2 text-sm font-bold text-neutral-900 h-[42px] overflow-hidden">
                                    {computeTotal(form.data) !== '' ? formatRupiah(computeTotal(form.data)) : '-'}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <InputLabel htmlFor="b6_source">Sumber Dana</InputLabel>
                                <TextInput id="b6_source" value={form.data.funding_source} onChange={(e) => form.setData('funding_source', e.target.value)} placeholder="Contoh: APB, Yayasan, Hibah" />
                            </div>
                            <div>
                                <InputLabel htmlFor="b6_priority">Prioritas</InputLabel>
                                <TextInput id="b6_priority" type="number" min="1" value={form.data.priority} onChange={(e) => form.setData('priority', e.target.value)} />
                            </div>
                        </div>

                        <div>
                            <InputLabel htmlFor="b6_notes">Catatan</InputLabel>
                            <TextArea id="b6_notes" rows="2" value={form.data.notes} onChange={(e) => form.setData('notes', e.target.value)} />
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
                    <p className="text-xs uppercase tracking-widest text-neutral-400">Belum ada anggaran.</p>
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
                                    <div className="mt-1 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-neutral-600">
                                        {item.cost_component && <p><span className="font-bold">Komponen:</span> {item.cost_component}</p>}
                                        {item.volume != null && <p><span className="font-bold">Volume:</span> {item.volume} {item.unit}</p>}
                                        {item.unit_price != null && <p><span className="font-bold">Harga Satuan:</span> {formatRupiah(item.unit_price)}</p>}
                                        {item.funding_source && <p><span className="font-bold">Sumber:</span> {item.funding_source}</p>}
                                    </div>
                                    <div className="mt-1 text-xs text-neutral-500">
                                        {item.priority && <span className="mr-3"><span className="font-bold">Prioritas:</span> {item.priority}</span>}
                                        {item.notes && <span><span className="font-bold">Catatan:</span> {item.notes}</span>}
                                    </div>
                                </div>
                                <div className="flex flex-col items-start md:items-end gap-2 flex-shrink-0">
                                    <span className="text-sm font-bold text-neutral-900">{formatRupiah(item.total_price)}</span>
                                    {canEdit && (
                                        <div className="flex items-center gap-2">
                                            <ActionButton onClick={() => startEdit(item)} variant="ghost">Edit</ActionButton>
                                            <ActionButton onClick={() => destroy(item.id)} variant="danger">Hapus</ActionButton>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </DragRow>
                    ))}
                </div>
            )}

            {grandTotal > 0 && (
                <div className="flex items-center justify-between bg-black text-white border border-black px-5 py-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Total Anggaran Keseluruhan</p>
                    <p className="text-lg font-bold">{formatRupiah(grandTotal)}</p>
                </div>
            )}
        </div>
    );
}