import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';

function PengajarTab({ kelasKuliah, dosens }) {
    const { data, setData, post, processing, errors, reset } = useForm({ dosen_id: '', peran: 'utama', status: 'aktif' });
    const submit = e => { e.preventDefault(); post(route('admin.kelas-kuliah.pengajar.store', kelasKuliah.id), { onSuccess: () => reset() }); };
    const remove = (p) => confirm('Hapus pengajar ini?') && router.delete(route('admin.kelas-kuliah.pengajar.destroy', [kelasKuliah.id, p.id]));

    return (
        <div className="bg-white border p-6">
            <div className="divide-y divide-neutral-100 mb-4">
                {kelasKuliah.pengajars?.map(p => (
                    <div key={p.id} className="py-3 flex justify-between">
                        <span>{p.dosen?.nama_lengkap} · {p.peran} · {p.status}</span>
                        <button onClick={() => remove(p)} className="text-red-600 text-xs">Hapus</button>
                    </div>
                ))}
                {(!kelasKuliah.pengajars || kelasKuliah.pengajars.length === 0) && <p className="py-4 text-sm text-neutral-500">Belum ada dosen pengajar.</p>}
            </div>
            <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-4 gap-3 border-t pt-4">
                <select required value={data.dosen_id} onChange={e => setData('dosen_id', e.target.value)} className="text-sm border-neutral-300">
                    <option value="">Pilih Dosen</option>
                    {dosens.map(d => <option key={d.id} value={d.id}>{d.nama_lengkap}</option>)}
                </select>
                <select value={data.peran} onChange={e => setData('peran', e.target.value)} className="text-sm border-neutral-300">
                    <option value="utama">Utama</option>
                    <option value="pendamping">Pendamping</option>
                    <option value="asisten">Asisten</option>
                </select>
                <p className="text-xs text-red-600 md:col-span-2">{errors.dosen_id}</p>
                <button disabled={processing} className="bg-black text-white px-4 py-2 text-xs font-bold">Tambah Pengajar</button>
            </form>
        </div>
    );
}

function JadwalTab({ kelasKuliah, ruangans }) {
    const { data, setData, post, processing, errors, reset } = useForm({ hari: 'Senin', jam_mulai: '', jam_selesai: '', ruangan_id: '', tipe_pertemuan: 'tatap_muka', status: 'draft' });
    const submit = e => { e.preventDefault(); post(route('admin.kelas-kuliah.jadwal.store', kelasKuliah.id), { onSuccess: () => reset() }); };
    const remove = (j) => confirm('Hapus jadwal ini?') && router.delete(route('admin.kelas-kuliah.jadwal.destroy', [kelasKuliah.id, j.id]));

    return (
        <div className="bg-white border p-6">
            <div className="divide-y divide-neutral-100 mb-4">
                {kelasKuliah.jadwals?.map(j => (
                    <div key={j.id} className="py-3 flex justify-between">
                        <span>{j.hari} · {j.jam_mulai} - {j.jam_selesai} · {j.ruangan?.nama || 'Belum ada ruang'} · {j.status}</span>
                        <button onClick={() => remove(j)} className="text-red-600 text-xs">Hapus</button>
                    </div>
                ))}
                {(!kelasKuliah.jadwals || kelasKuliah.jadwals.length === 0) && <p className="py-4 text-sm text-neutral-500">Belum ada jadwal.</p>}
            </div>
            <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-6 gap-3 border-t pt-4">
                <select value={data.hari} onChange={e => setData('hari', e.target.value)} className="text-sm border-neutral-300">
                    {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map(h => <option key={h} value={h}>{h}</option>)}
                </select>
                <input type="time" required value={data.jam_mulai} onChange={e => setData('jam_mulai', e.target.value)} className="text-sm border-neutral-300" />
                <input type="time" required value={data.jam_selesai} onChange={e => setData('jam_selesai', e.target.value)} className="text-sm border-neutral-300" />
                <select value={data.ruangan_id} onChange={e => setData('ruangan_id', e.target.value)} className="text-sm border-neutral-300">
                    <option value="">Belum ada ruang</option>
                    {ruangans.map(r => <option key={r.id} value={r.id}>{r.kode} - {r.nama}</option>)}
                </select>
                <select value={data.status} onChange={e => setData('status', e.target.value)} className="text-sm border-neutral-300">
                    <option value="draft">Draft</option>
                    <option value="dipublikasikan">Dipublikasikan</option>
                    <option value="dibatalkan">Dibatalkan</option>
                </select>
                <button disabled={processing} className="bg-black text-white px-4 py-2 text-xs font-bold">Tambah Jadwal</button>
                {(errors.ruangan_id || errors.hari || errors.dosen) && (
                    <div className="md:col-span-6 text-xs text-red-600 space-y-1">
                        {errors.ruangan_id && <p>{errors.ruangan_id}</p>}
                        {errors.hari && <p>{errors.hari}</p>}
                        {errors.dosen && <p>{errors.dosen}</p>}
                    </div>
                )}
            </form>
        </div>
    );
}

function PddiktiTab({ kelasKuliah }) {
    return (
        <div className="bg-white border p-6">
            <p className="text-sm mb-3">Status integrasi: <b>{kelasKuliah.pddikti_mapping?.sync_status || 'not_synced'}</b>. Client Neo Feeder belum tersedia; sinkronisasi tidak akan mengklaim keberhasilan.</p>
            <button onClick={() => router.post(route('admin.kelas-kuliah.pddikti.sync', kelasKuliah.id))} className="border px-3 py-2 text-xs">Coba Sinkronisasi</button>
        </div>
    );
}

export default function Show({ kelasKuliah, dosens, ruangans }) {
    const [tab, setTab] = useState('Pengajar');

    return (
        <AdminLayout title="Detail Kelas Kuliah">
            <Head title={`Kelas Kuliah - ${kelasKuliah.kode_kelas}`} />
            <div className="p-6 space-y-6 bg-neutral-50 min-h-dvh">
                <div className="bg-gradient-to-r from-slate-800 to-indigo-700 p-6 text-white flex justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-widest">Kelas Kuliah</p>
                        <h1 className="text-2xl font-bold">{kelasKuliah.mata_kuliah?.kode_mata_kuliah}-{kelasKuliah.kode_kelas}</h1>
                        <p className="text-sm mt-1">{kelasKuliah.mata_kuliah?.nama_mata_kuliah} · {kelasKuliah.semester?.tahun_ajaran?.nama_tahun_ajaran} {kelasKuliah.semester?.nama_semester}</p>
                    </div>
                    <div className="space-x-2">
                        <Link href={route('admin.kelas-kuliah.edit', kelasKuliah.id)} className="bg-white text-black px-3 py-2 text-xs font-bold">Edit</Link>
                        <Link href={route('admin.kelas-kuliah.index')} className="text-sm underline">Kembali</Link>
                    </div>
                </div>
                <div className="bg-white border flex">
                    {['Pengajar', 'Jadwal', 'PDDikti'].map(t => (
                        <button key={t} onClick={() => setTab(t)} className={`px-4 py-3 text-xs font-bold ${tab === t ? 'border-b-2 border-black' : 'text-neutral-500'}`}>{t}</button>
                    ))}
                </div>
                {tab === 'Pengajar' && <PengajarTab kelasKuliah={kelasKuliah} dosens={dosens} />}
                {tab === 'Jadwal' && <JadwalTab kelasKuliah={kelasKuliah} ruangans={ruangans} />}
                {tab === 'PDDikti' && <PddiktiTab kelasKuliah={kelasKuliah} />}
            </div>
        </AdminLayout>
    );
}
