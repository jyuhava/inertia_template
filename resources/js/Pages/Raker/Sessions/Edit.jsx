import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Box, ActionButton, InputLabel, TextInput, SelectInput, TextArea, InputError } from '../Components/RakerUi';

function toDateInput(date) {
    if (!date) return '';
    return new Date(date).toISOString().slice(0, 10);
}

export default function Edit({ session }) {
    const { data, setData, put, processing, errors } = useForm({
        name: session.name,
        start_date: toDateInput(session.start_date),
        end_date: toDateInput(session.end_date),
        location: session.location || '',
        description: session.description || '',
        status: session.status,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(`/raker/sessions/${session.id}`);
    };

    return (
        <AdminLayout>
            <Head title="Edit Sesi Raker" />

            <div className="space-y-6">
                <Box variant="black" className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Manajemen Sesi Raker</p>
                        <h1 className="text-2xl font-bold text-white">Edit Sesi Raker</h1>
                        <p className="text-sm text-neutral-400 mt-1">{session.name}</p>
                    </div>
                    <ActionButton href="/raker/sessions" variant="secondary">← Kembali</ActionButton>
                </Box>

                <Box>
                    <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-900 mb-6">Informasi Sesi</h2>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <InputLabel htmlFor="name">Nama Sesi</InputLabel>
                                <TextInput
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    error={errors.name}
                                    required
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div>
                                <InputLabel htmlFor="start_date">Tanggal Mulai</InputLabel>
                                <TextInput
                                    id="start_date"
                                    type="date"
                                    value={data.start_date}
                                    onChange={(e) => setData('start_date', e.target.value)}
                                    error={errors.start_date}
                                    required
                                />
                                <InputError message={errors.start_date} />
                            </div>

                            <div>
                                <InputLabel htmlFor="end_date">Tanggal Selesai</InputLabel>
                                <TextInput
                                    id="end_date"
                                    type="date"
                                    value={data.end_date}
                                    onChange={(e) => setData('end_date', e.target.value)}
                                    error={errors.end_date}
                                    required
                                />
                                <InputError message={errors.end_date} />
                            </div>

                            <div>
                                <InputLabel htmlFor="location">Lokasi</InputLabel>
                                <TextInput
                                    id="location"
                                    value={data.location}
                                    onChange={(e) => setData('location', e.target.value)}
                                    error={errors.location}
                                />
                                <InputError message={errors.location} />
                            </div>

                            <div>
                                <InputLabel htmlFor="status">Status</InputLabel>
                                <SelectInput
                                    id="status"
                                    value={data.status}
                                    onChange={(e) => setData('status', e.target.value)}
                                    error={errors.status}
                                >
                                    <option value="Draft">Draft</option>
                                    <option value="Aktif">Aktif</option>
                                    <option value="Selesai">Selesai</option>
                                </SelectInput>
                                <InputError message={errors.status} />
                            </div>

                            <div className="md:col-span-2">
                                <InputLabel htmlFor="description">Deskripsi</InputLabel>
                                <TextArea
                                    id="description"
                                    rows="3"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    error={errors.description}
                                />
                                <InputError message={errors.description} />
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
                            <ActionButton href="/raker/sessions" variant="secondary">Batal</ActionButton>
                            <ActionButton type="submit" variant="primary" disabled={processing}>
                                {processing ? 'Menyimpan...' : 'Simpan'}
                            </ActionButton>
                        </div>
                    </form>
                </Box>
            </div>
        </AdminLayout>
    );
}