import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function Edit({ ruangan }) {
    const { data, setData, put, processing, errors } = useForm({
        kode: ruangan.kode, nama: ruangan.nama, gedung: ruangan.gedung || '', lantai: ruangan.lantai || '',
        kapasitas: ruangan.kapasitas, tipe: ruangan.tipe, status: ruangan.status,
    });
    const submit = e => { e.preventDefault(); put(route('admin.ruangan.update', ruangan.id)); };

    return (
        <AdminLayout title="Edit Ruangan">
            <Head title="Edit Ruangan" />
            <div className="p-6 space-y-6 bg-neutral-50 min-h-dvh">
                <div className="bg-gradient-to-r from-emerald-700 to-teal-700 p-6 text-white flex justify-between">
                    <h1 className="text-2xl font-bold">{ruangan.kode} - {ruangan.nama}</h1>
                    <Link href={route('admin.ruangan.index')} className="text-sm">Kembali</Link>
                </div>
                <form onSubmit={submit} className="bg-white border p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold uppercase mb-1">Kode</label>
                        <input required value={data.kode} onChange={e => setData('kode', e.target.value)} className="w-full border-neutral-300 text-sm" />
                        <p className="text-xs text-red-600">{errors.kode}</p>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase mb-1">Nama</label>
                        <input required value={data.nama} onChange={e => setData('nama', e.target.value)} className="w-full border-neutral-300 text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase mb-1">Gedung</label>
                        <input value={data.gedung} onChange={e => setData('gedung', e.target.value)} className="w-full border-neutral-300 text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase mb-1">Lantai</label>
                        <input value={data.lantai} onChange={e => setData('lantai', e.target.value)} className="w-full border-neutral-300 text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase mb-1">Kapasitas</label>
                        <input type="number" required value={data.kapasitas} onChange={e => setData('kapasitas', e.target.value)} className="w-full border-neutral-300 text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase mb-1">Tipe</label>
                        <select value={data.tipe} onChange={e => setData('tipe', e.target.value)} className="w-full border-neutral-300 text-sm">
                            <option value="kelas">Kelas</option>
                            <option value="laboratorium">Laboratorium</option>
                            <option value="auditorium">Auditorium</option>
                            <option value="online">Online</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase mb-1">Status</label>
                        <select value={data.status} onChange={e => setData('status', e.target.value)} className="w-full border-neutral-300 text-sm">
                            <option value="aktif">Aktif</option>
                            <option value="nonaktif">Nonaktif</option>
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <button disabled={processing} className="bg-black text-white px-5 py-3 text-sm font-bold">{processing ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
