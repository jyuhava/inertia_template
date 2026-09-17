import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function Edit({ kelasKuliah, mataKuliahs, kurikulums, semesters }) {
    const { data, setData, put, processing, errors } = useForm({
        mata_kuliah_id: kelasKuliah.mata_kuliah_id, kurikulum_id: kelasKuliah.kurikulum_id || '',
        semester_id: kelasKuliah.semester_id, kode_kelas: kelasKuliah.kode_kelas,
        nama_kelas: kelasKuliah.nama_kelas || '', kapasitas: kelasKuliah.kapasitas,
        tipe_kelas: kelasKuliah.tipe_kelas, status: kelasKuliah.status,
    });
    const submit = e => { e.preventDefault(); put(route('admin.kelas-kuliah.update', kelasKuliah.id)); };

    return (
        <AdminLayout title="Edit Kelas Kuliah">
            <Head title="Edit Kelas Kuliah" />
            <div className="p-6 space-y-6 bg-neutral-50 min-h-dvh">
                <div className="bg-gradient-to-r from-slate-800 to-indigo-700 p-6 text-white flex justify-between">
                    <h1 className="text-2xl font-bold">Edit Kelas Kuliah</h1>
                    <Link href={route('admin.kelas-kuliah.show', kelasKuliah.id)} className="text-sm">Kembali</Link>
                </div>
                <form onSubmit={submit} className="bg-white border p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold uppercase mb-1">Mata Kuliah</label>
                        <select required value={data.mata_kuliah_id} onChange={e => setData('mata_kuliah_id', e.target.value)} className="w-full border-neutral-300 text-sm">
                            {mataKuliahs.map(mk => <option key={mk.id} value={mk.id}>{mk.kode_mata_kuliah} - {mk.nama_mata_kuliah}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase mb-1">Kurikulum</label>
                        <select value={data.kurikulum_id} onChange={e => setData('kurikulum_id', e.target.value)} className="w-full border-neutral-300 text-sm">
                            <option value="">Tidak terkait kurikulum tertentu</option>
                            {kurikulums.map(k => <option key={k.id} value={k.id}>{k.kode} - {k.nama}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase mb-1">Periode Akademik</label>
                        <select required value={data.semester_id} onChange={e => setData('semester_id', e.target.value)} className="w-full border-neutral-300 text-sm">
                            {semesters.map(s => <option key={s.id} value={s.id}>{s.tahun_ajaran?.nama_tahun_ajaran} - {s.nama_semester}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase mb-1">Kode Kelas</label>
                        <input required value={data.kode_kelas} onChange={e => setData('kode_kelas', e.target.value)} className="w-full border-neutral-300 text-sm" />
                        <p className="text-xs text-red-600">{errors.kode_kelas}</p>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase mb-1">Kapasitas</label>
                        <input type="number" required value={data.kapasitas} onChange={e => setData('kapasitas', e.target.value)} className="w-full border-neutral-300 text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase mb-1">Tipe Kelas</label>
                        <select value={data.tipe_kelas} onChange={e => setData('tipe_kelas', e.target.value)} className="w-full border-neutral-300 text-sm">
                            <option value="reguler">Reguler</option>
                            <option value="paralel">Paralel</option>
                            <option value="praktikum">Praktikum</option>
                            <option value="daring">Daring</option>
                            <option value="blended">Blended</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase mb-1">Status</label>
                        <select value={data.status} onChange={e => setData('status', e.target.value)} className="w-full border-neutral-300 text-sm">
                            <option value="draft">Draft</option>
                            <option value="dibuka">Dibuka</option>
                            <option value="ditutup">Ditutup</option>
                            <option value="dibatalkan">Dibatalkan</option>
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
