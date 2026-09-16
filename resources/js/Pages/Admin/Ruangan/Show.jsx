import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function Show({ ruangan }) {
    return (
        <AdminLayout title="Detail Ruangan">
            <Head title={`Ruangan - ${ruangan.nama}`} />
            <div className="p-6 space-y-6 bg-neutral-50 min-h-dvh">
                <div className="bg-gradient-to-r from-emerald-700 to-teal-700 p-6 text-white flex justify-between">
                    <h1 className="text-2xl font-bold">{ruangan.kode} - {ruangan.nama}</h1>
                    <div className="space-x-2">
                        <Link href={route('admin.ruangan.edit', ruangan.id)} className="bg-white text-black px-3 py-2 text-xs font-bold">Edit</Link>
                        <Link href={route('admin.ruangan.index')} className="text-sm underline">Kembali</Link>
                    </div>
                </div>
                <div className="bg-white border p-6">
                    <h2 className="font-bold text-sm uppercase mb-4">Jadwal Menggunakan Ruangan Ini</h2>
                    <table className="min-w-full text-sm">
                        <thead className="text-left text-xs uppercase text-neutral-500">
                            <tr><th className="py-2">Hari</th><th>Jam</th><th>Kelas</th></tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {ruangan.jadwal_kelas_kuliahs?.map(j => (
                                <tr key={j.id}>
                                    <td className="py-2">{j.hari}</td>
                                    <td>{j.jam_mulai} - {j.jam_selesai}</td>
                                    <td>{j.kelas_kuliah?.mata_kuliah?.nama_mata_kuliah} ({j.kelas_kuliah?.kode_kelas})</td>
                                </tr>
                            ))}
                            {(!ruangan.jadwal_kelas_kuliahs || ruangan.jadwal_kelas_kuliahs.length === 0) && (
                                <tr><td colSpan="3" className="py-8 text-center text-neutral-500">Belum ada jadwal.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
