import { useForm } from '@inertiajs/react';
import { useState } from 'react';
import { useBorangCrud } from '../../Components/useBorangCrud';
import {
    ActionButton,
    InputLabel,
    TextInput,
    TextArea,
    SelectInput,
    InputError,
    ChipsInput,
    DragRow,
    ProgramSelect,
} from '../../Components/RakerUi';

const EMPTY = {
    program_source_id: null,
    program_name: '',
    need_type: 'Sarana',
    need_details: '',
    main_specifications: '',
    quantity: '',
    status: 'Belum Ada',
    pic_names: [],
    notes: '',
};

export default function Borang5Tab({ items = [], programs = [], submissionId, canEdit }) {
    const { destroy, reorderOnDrop } = useBorangCrud({
        destroyRoute: (id) => `/raker/borang5/${id}`,
        reorderRoute: `/raker/submissions/${submissionId}/borang5/reorder`,
        label: 'kebutuhan',
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
            form.put(`/raker/borang5/${editingId}`, options);
        } else {
            form.post(`/raker/submissions/${submissionId}/borang5`, options);
        }
    };

    const typeStyle = {
        Sarana: 'bg-blue-50 border-blue-200 text-blue-700',
        Prasarana: 'bg-purple-50 border-purple-200 text-purple-700',
        SDM: 'bg-orange-50 border-orange-200 text-orange-700',
    };

    const statusStyle = (s) => (s === 'Ada' ? 'bg-green-600 text-white border-green-600' : 'bg-red-500 text-white border-red-500');

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-neutral-500 uppercase tracking-widest">
                    {items.length} kebutuhan tercatat
                </p>
                {canEdit && !adding && editingId === null && (
                    <ActionButton onClick={startAdd}>+ Tambah Kebutuhan</ActionButton>
                )}
            </div>

            {adding || editingId !== null ? (
                <div className="border border-neutral-300 bg-[#fafafa] p-5 space-y-5">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-900">
                        {editingId !== null ? 'Edit Kebutuhan' : 'Tambah Kebutuhan'}
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
                                <InputLabel htmlFor="b5_name">Nama Program (otomatis)</InputLabel>
                                <div className="border border-neutral-300 bg-neutral-100 px-3 py-2 text-sm text-neutral-600 h-[42px] overflow-hidden">
                                    {form.data.program_name || 'Pilih program terlebih dahulu'}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <InputLabel htmlFor="b5_type">Jenis Kebutuhan</InputLabel>
                                <SelectInput id="b5_type" value={form.data.need_type} onChange={(e) => form.setData('need_type', e.target.value)}>
                                    <option value="Sarana">Sarana</option>
                                    <option value="Prasarana">Prasarana</option>
                                    <option value="SDM">SDM</option>
                                </SelectInput>
                            </div>
                            <div>
                                <InputLabel htmlFor="b5_status">Status Ketersediaan</InputLabel>
                                <SelectInput id="b5_status" value={form.data.status} onChange={(e) => form.setData('status', e.target.value)}>
                                    <option value="Belum Ada">Belum Ada</option>
                                    <option value="Ada">Ada</option>
                                </SelectInput>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <InputLabel htmlFor="b5_details">Detail Kebutuhan</InputLabel>
                                <TextArea id="b5_details" rows="2" value={form.data.need_details} onChange={(e) => form.setData('need_details', e.target.value)} />
                            </div>
                            <div>
                                <InputLabel htmlFor="b5_spec">Spesifikasi Utama</InputLabel>
                                <TextArea id="b5_spec" rows="2" value={form.data.main_specifications} onChange={(e) => form.setData('main_specifications', e.target.value)} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <InputLabel htmlFor="b5_qty">Kuantitas</InputLabel>
                                <TextInput id="b5_qty" value={form.data.quantity} onChange={(e) => form.setData('quantity', e.target.value)} placeholder="Contoh: 2 unit / 1 ruang" />
                            </div>
                            <div>
                                <InputLabel>PIC (Nama)</InputLabel>
                                <ChipsInput value={form.data.pic_names} onChange={(v) => form.setData('pic_names', v)} placeholder="Nama PIC lalu Enter" />
                            </div>
                        </div>

                        <div>
                            <InputLabel htmlFor="b5_notes">Catatan</InputLabel>
                            <TextArea id="b5_notes" rows="2" value={form.data.notes} onChange={(e) => form.setData('notes', e.target.value)} />
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
                    <p className="text-xs uppercase tracking-widest text-neutral-400">Belum ada kebutuhan.</p>
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
                                        <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider border ${typeStyle[item.need_type] || typeStyle.Sarana}`}>
                                            {item.need_type}
                                        </span>
                                        <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border ${statusStyle(item.status)}`}>
                                            {item.status}
                                        </span>
                                    </div>
                                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-neutral-600">
                                        {item.need_details && <p><span className="font-bold">Detail:</span> {item.need_details}</p>}
                                        {item.main_specifications && <p><span className="font-bold">Spesifikasi:</span> {item.main_specifications}</p>}
                                        {item.quantity && <p><span className="font-bold">Kuantitas:</span> {item.quantity}</p>}
                                    </div>
                                    <div className="mt-1 text-xs text-neutral-500">
                                        {(item.pic_names || []).length > 0 && <span className="mr-3"><span className="font-bold">PIC:</span> {item.pic_names.join(', ')}</span>}
                                        {item.notes && <span><span className="font-bold">Catatan:</span> {item.notes}</span>}
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