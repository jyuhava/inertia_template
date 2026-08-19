import { Head, Link, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import InputError from '@/Components/InputError';
import MultiSelectEmployee from '@/Components/MultiSelectEmployee';

function emptyAgendaItem() {
    return {
        id: null,
        discussion: '',
        decision: '',
        pic: [],
        deadline: '',
        status: 'pending',
    };
}

export default function Create({ employees }) {
    const { data, setData, post, processing, errors } = useForm({
        title: '',
        division: '',
        meeting_date: '',
        location: '',
        description: '',
        attendees: [],
        agenda_items: [emptyAgendaItem()],
    });

    const updateAgendaItem = (index, key, value) => {
        const items = data.agenda_items.map((item, i) =>
            i === index ? { ...item, [key]: value } : item,
        );
        setData('agenda_items', items);
    };

    const addAgendaItem = () => {
        setData('agenda_items', [...data.agenda_items, emptyAgendaItem()]);
    };

    const removeAgendaItem = (index) => {
        if (data.agenda_items.length === 1) {
            alert('Minimal harus ada satu agenda item.');
            return;
        }
        setData(
            'agenda_items',
            data.agenda_items.filter((_, i) => i !== index),
        );
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('meeting-minutes.store'));
    };

    const inputClass =
        'mt-1 block w-full border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';
    const labelClass =
        'block text-xs font-semibold uppercase tracking-wide text-gray-500';

    return (
        <AdminLayout title="Buat Notulen Rapat">
            <Head title="Buat Notulen Rapat" />

                    <div className="mb-6 flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-gray-900">Buat Notulen Rapat Baru</h1>
                        <Link
                            href={route('meeting-minutes.index')}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
                        >
                            Kembali
                        </Link>
                    </div>

                    <form onSubmit={submit} className="space-y-6">
                        {/* Header section */}
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-4 text-lg font-semibold text-gray-900">Informasi Rapat</h2>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className={labelClass} htmlFor="title">
                                        Judul Notulen *
                                    </label>
                                    <input
                                        id="title"
                                        type="text"
                                        value={data.title}
                                        onChange={(e) => setData('title', e.target.value)}
                                        placeholder="Mis: Rapat Koordinasi Semester Genap"
                                        className={inputClass}
                                        required
                                    />
                                    <InputError message={errors.title} className="mt-1" />
                                </div>

                                <div>
                                    <label className={labelClass} htmlFor="division">
                                        Divisi *
                                    </label>
                                    <input
                                        id="division"
                                        type="text"
                                        value={data.division}
                                        onChange={(e) => setData('division', e.target.value)}
                                        placeholder="Mis: Akademik"
                                        className={inputClass}
                                        required
                                    />
                                    <InputError message={errors.division} className="mt-1" />
                                </div>

                                <div>
                                    <label className={labelClass} htmlFor="meeting_date">
                                        Tanggal Rapat *
                                    </label>
                                    <input
                                        id="meeting_date"
                                        type="date"
                                        value={data.meeting_date}
                                        onChange={(e) => setData('meeting_date', e.target.value)}
                                        className={inputClass}
                                        required
                                    />
                                    <InputError message={errors.meeting_date} className="mt-1" />
                                </div>

                                <div>
                                    <label className={labelClass} htmlFor="location">
                                        Lokasi *
                                    </label>
                                    <input
                                        id="location"
                                        type="text"
                                        value={data.location}
                                        onChange={(e) => setData('location', e.target.value)}
                                        placeholder="Mis: Ruang Rapat Utama"
                                        className={inputClass}
                                        required
                                    />
                                    <InputError message={errors.location} className="mt-1" />
                                </div>

                                <div className="md:col-span-2">
                                    <label className={labelClass} htmlFor="description">
                                        Deskripsi
                                    </label>
                                    <textarea
                                        id="description"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        rows="3"
                                        placeholder="Ringkasan tujuan / latar belakang rapat (opsional)"
                                        className={inputClass}
                                    />
                                    <InputError message={errors.description} className="mt-1" />
                                </div>
                            </div>
                        </div>

                        {/* Attendees */}
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-4 text-lg font-semibold text-gray-900">
                                Peserta Rapat *
                            </h2>
                            <MultiSelectEmployee
                                employees={employees || []}
                                value={data.attendees}
                                onChange={(ids) => setData('attendees', ids)}
                                placeholder="Pilih peserta rapat..."
                                error={errors.attendees}
                            />
                        </div>

                        {/* Agenda items */}
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900">Agenda Rapat *</h2>
                                <button
                                    type="button"
                                    onClick={addAgendaItem}
                                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700"
                                >
                                    + Tambah Agenda
                                </button>
                            </div>

                            {errors.agenda_items && (
                                <div className="mb-3 rounded bg-red-50 p-3 text-xs text-red-600">
                                    {errors.agenda_items}
                                </div>
                            )}

                            <div className="space-y-4">
                                {data.agenda_items.map((item, index) => (
                                    <div key={index} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                                        <div className="mb-3 flex items-center justify-between">
                                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                                                {index + 1}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => removeAgendaItem(index)}
                                                className="rounded border border-red-200 px-2 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                                            >
                                                Hapus
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div className="md:col-span-2">
                                                <label className={labelClass}>
                                                    Pembahasan *
                                                </label>
                                                <textarea
                                                    value={item.discussion}
                                                    onChange={(e) =>
                                                        updateAgendaItem(index, 'discussion', e.target.value)
                                                    }
                                                    rows="2"
                                                    placeholder="Topik / pembahasan rapat"
                                                    className={inputClass}
                                                    required
                                                />
                                                {errors[`agenda_items.${index}.discussion`] && (
                                                    <p className="mt-1 text-xs text-red-600">
                                                        {errors[`agenda_items.${index}.discussion`]}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="md:col-span-2">
                                                <label className={labelClass}>Keputusan *</label>
                                                <textarea
                                                    value={item.decision}
                                                    onChange={(e) =>
                                                        updateAgendaItem(index, 'decision', e.target.value)
                                                    }
                                                    rows="2"
                                                    placeholder="Hasil keputusan rapat"
                                                    className={inputClass}
                                                    required
                                                />
                                                {errors[`agenda_items.${index}.decision`] && (
                                                    <p className="mt-1 text-xs text-red-600">
                                                        {errors[`agenda_items.${index}.decision`]}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="md:col-span-2">
                                                <label className={labelClass}>PIC (Penanggung Jawab) *</label>
                                                <MultiSelectEmployee
                                                    employees={employees || []}
                                                    value={item.pic}
                                                    onChange={(ids) => updateAgendaItem(index, 'pic', ids)}
                                                    placeholder="Pilih PIC agenda ini..."
                                                />
                                                {errors[`agenda_items.${index}.pic`] && (
                                                    <p className="mt-1 text-xs text-red-600">
                                                        {errors[`agenda_items.${index}.pic`]}
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <label className={labelClass}>Deadline *</label>
                                                <input
                                                    type="date"
                                                    value={item.deadline}
                                                    onChange={(e) =>
                                                        updateAgendaItem(index, 'deadline', e.target.value)
                                                    }
                                                    className={inputClass}
                                                    required
                                                />
                                                {errors[`agenda_items.${index}.deadline`] && (
                                                    <p className="mt-1 text-xs text-red-600">
                                                        {errors[`agenda_items.${index}.deadline`]}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                            <button
                                type="submit"
                                disabled={processing}
                                className={`rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 ${
                                    processing ? 'opacity-50' : ''
                                }`}
                            >
                                {processing ? 'Menyimpan...' : 'Simpan Notulen'}
                            </button>
                            <Link
                                href={route('meeting-minutes.index')}
                                className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
                            >
                                Batal
                            </Link>
                        </div>
                    </form>
        </AdminLayout>
    );
}