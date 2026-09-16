import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function Create({ mataKuliahs, kurikulums, semesters }) {
    const { data, setData, post, processing, errors } = useForm({
        mata_kuliah_id: '', kurikulum_id: '', semester_id: '', kode_kelas: '', nama_kelas: '',
        kapasitas: 40, tipe_kelas: 'reguler', status: 'draft',
    });
    const submit = e => { e.preventDefault(); post(route('admin.kelas-kuliah.store')); };

    return (
        <AdminLayout title="Tambah Kelas Kuliah">
            <Head title="Tambah Kelas Kuliah" />
            <div className="p-6 space-y-6 bg-neutral-50 min-h-dvh">
                <div className="bg-gradient-to-r from-slate-800 to-indigo-700 p-6 text-white flex justify-between">
                    <h1 className="text-2xl font-bold">Tambah Kelas Kuliah</h1>
                    <Link href={route('admin.kelas-kuliah.index')} className="text-sm">Kembali</Link>
                </div>
                <form onSubmit={submit} className="bg-white border p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold uppercase mb-1">Mata Kuliah</label>
                        <select required value={data.mata_kuliah_id} onChange={e => setData('mata_kuliah_id', e.target.value)} className="w-full border-neutral-300 text-sm">
                            <option value="">Pilih Mata Kuliah</option>
                            {mataKuliahs.map(mk => <option key={mk.id} value={mk.id}>{mk.kode_mata_kuliah} - {mk.nama_mata_kuliah}</option>)}
                        </select>
                        <p className="text-xs text-red-600">{errors.mata_kuliah_id}</p>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase mb-1">Kurikulum (opsional)</label>
                        <select value={data.kurikulum_id} onChange={e => setData('kurikulum_id', e.target.value)} className="w-full border-neutral-300 text-sm">
                            <option value="">Tidak terkait kurikulum tertentu</option>
                            {kurikulums.map(k => <option key={k.id} value={k.id}>{k.kode} - {k.nama}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase mb-1">Periode Akademik</label>
                        <select required value={data.semester_id} onChange={e => setData('semester_id', e.target.value)} className="w-full border-neutral-300 text-sm">
                            <option value="">Pilih Periode</option>
                            {semesters.map(s => <option key={s.id} value={s.id}>{s.tahun_ajaran?.nama_tahun_ajaran} - {s.nama_semester}</option>)}
                        </select>
                        <p className="text-xs text-red-600">{errors.semester_id}</p>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase mb-1">Kode Kelas</label>
                        <input required value={data.kode_kelas} onChange={e => setData('kode_kelas', e.target.value)} className="w-full border-neutral-300 text-sm" placeholder="mis. A, B, Paralel-1" />
                        <p className="text-xs text-red-600">{errors.kode_kelas}</p>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase mb-1">Nama Kelas (opsional)</label>
                        <input value={data.nama_kelas} onChange={e => setData('nama_kelas', e.target.value)} className="w-full border-neutral-300 text-sm" />
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
                        <button disabled={processing} className="bg-black text-white px-5 py-3 text-sm font-bold">{processing ? 'Menyimpan...' : 'Simpan Kelas Kuliah'}</button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
