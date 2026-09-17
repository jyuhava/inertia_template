import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function Index({ registrations }) {
    return (
        <AdminLayout title="Review KRS Mahasiswa Bimbingan">
            <Head title="Review KRS" />
            <div className="p-6 space-y-6 bg-neutral-50 min-h-dvh">
                <div className="bg-gradient-to-r from-emerald-700 to-teal-700 p-6 text-white">
                    <p className="text-xs uppercase tracking-widest">Dosen Pembimbing Akademik</p>
                    <h1 className="text-2xl font-bold">REVIEW KRS</h1>
                </div>
                <div className="bg-white border overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
                            <tr><th className="px-4 py-3">NIM</th><th className="px-4 py-3">Nama</th><th className="px-4 py-3">Prodi</th><th className="px-4 py-3">Periode</th><th className="px-4 py-3">Aksi</th></tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {registrations.data.map(r => (
                                <tr key={r.id}>
                                    <td className="px-4 py-3">{r.mahasiswa?.nim}</td>
                                    <td className="px-4 py-3">{r.mahasiswa?.nama_lengkap}</td>
                                    <td className="px-4 py-3">{r.mahasiswa?.prodi?.nama_prodi}</td>
                                    <td className="px-4 py-3">{r.periode_krs?.tahun_ajaran?.nama_tahun_ajaran} {r.periode_krs?.semester?.nama_semester}</td>
                                    <td className="px-4 py-3"><Link href={route('dosen.krs-advisor.show', r.id)} className="underline">Review</Link></td>
                                </tr>
                            ))}
                            {registrations.data.length === 0 && <tr><td colSpan="5" className="px-4 py-8 text-center text-neutral-500">Tidak ada KRS yang menunggu review.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
