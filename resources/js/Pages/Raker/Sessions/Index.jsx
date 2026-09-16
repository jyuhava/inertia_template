import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Box, ActionButton, SessionStatusBadge } from '../Components/RakerUi';
import { useState } from 'react';

function formatDate(date) {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('id-ID');
}

export default function Index({ sessions }) {
    const [search, setSearch] = useState('');

    const handleDelete = (id) => {
        if (confirm('Yakin ingin menghapus sesi Raker ini? Semua isian user akan ikut terhapus.')) {
            router.delete(`/raker/sessions/${id}`);
        }
    };

    const filtered = sessions.data.filter(
        (s) =>
            s.name?.toLowerCase().includes(search.toLowerCase()) ||
            s.location?.toLowerCase().includes(search.toLowerCase()),
    );

    return (
        <AdminLayout>
            <Head title="Manajemen Raker" />

            <div className="space-y-6">
                <Box variant="black" className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-400 mb-1">Rapat Kerja</p>
                        <h1 className="text-xl font-bold uppercase tracking-tight text-white">Manajemen Sesi Raker</h1>
                        <p className="text-sm text-neutral-400 mt-1">Kelola sesi Raker dan pantau isian seluruh user.</p>
                    </div>
                    <ActionButton href="/raker/sessions/create" variant="secondary">+ Tambah Sesi</ActionButton>
                </Box>

                <Box>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-900">Daftar Sesi</h2>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari sesi..."
                            className="px-3 py-2 text-xs border border-[#ccc] bg-white focus:outline-none focus:border-black w-48"
                        />
                    </div>

                    <div className="overflow-x-auto border border-[#e5e5e5]">
                        <table className="min-w-full text-left table-cards">
                            <thead className="bg-[#f5f5f5] border-b border-[#e5e5e5]">
                                <tr>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Nama Sesi</th>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Tanggal</th>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Lokasi</th>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Status</th>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Pengisi</th>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#e5e5e5]">
                                {filtered.length === 0 ? (
                                    <tr className="table-cards-empty">
                                        <td colSpan="6" className="px-4 py-8 text-center text-xs text-neutral-400 uppercase tracking-widest">
                                            Belum ada sesi Raker.
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((session) => (
                                        <tr key={session.id} className="hover:bg-[#fafafa]">
                                            <td data-label="Nama Sesi" className="px-4 py-3 text-sm font-semibold text-neutral-900">{session.name}</td>
                                            <td data-label="Tanggal" className="px-4 py-3 text-sm text-neutral-600">
                                                {formatDate(session.start_date)} — {formatDate(session.end_date)}
                                            </td>
                                            <td data-label="Lokasi" className="px-4 py-3 text-sm text-neutral-600">{session.location || '-'}</td>
                                            <td data-label="Status" className="px-4 py-3"><SessionStatusBadge status={session.status} /></td>
                                            <td data-label="Pengisi" className="px-4 py-3 text-sm text-neutral-600">{session.submissions_count}</td>
                                            <td data-label="Aksi" className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <ActionButton href={`/raker/sessions/${session.id}`} variant="ghost">Lihat</ActionButton>
                                                    <ActionButton href={`/raker/sessions/${session.id}/edit`} variant="ghost">Edit</ActionButton>
                                                    <ActionButton onClick={() => handleDelete(session.id)} variant="danger">Hapus</ActionButton>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {sessions.links && (
                        <div className="mt-6 flex justify-center">
                            <div className="flex items-center gap-1">
                                {sessions.links.map((link, index) => (
                                    <Link
                                        key={index}
                                        href={link.url || '#'}
                                        className={`px-3 py-2 text-xs font-bold uppercase tracking-widest border transition-colors ${
                                            link.active
                                                ? 'bg-black text-white border-black'
                                                : link.url
                                                ? 'bg-white text-neutral-700 border-[#ccc] hover:bg-[#f5f5f5]'
                                                : 'bg-[#f5f5f5] text-neutral-400 border-[#e5e5e5] cursor-not-allowed'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </Box>
            </div>
        </AdminLayout>
    );
}