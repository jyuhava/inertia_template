import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Box, ActionButton, SessionStatusBadge, SubmissionStatusBadge, formatRupiah } from '../Components/RakerUi';

function formatDate(date) {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDateTime(datetime) {
    if (!datetime) return '-';
    return new Date(datetime).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function Show({ session, submissions, stats, grand_total_budget }) {
    return (
        <AdminLayout>
            <Head title={`Raker — ${session.name}`} />

            <div className="space-y-6">
                <Box variant="black" className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-400 mb-1">Manajemen Sesi Raker</p>
                        <h1 className="text-xl font-bold uppercase tracking-tight text-white">{session.name}</h1>
                        <p className="text-sm text-neutral-400 mt-1">
                            {formatDate(session.start_date)} — {formatDate(session.end_date)}
                            {session.location ? ` • ${session.location}` : ''}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <SessionStatusBadge status={session.status} />
                        <ActionButton href="/raker/sessions" variant="secondary">← Kembali</ActionButton>
                    </div>
                </Box>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Box>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">Total Pengisi</p>
                        <p className="text-2xl font-bold text-neutral-900">{stats.total}</p>
                    </Box>
                    <Box>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">Sudah Submit</p>
                        <p className="text-2xl font-bold text-green-700">{stats.submitted}</p>
                    </Box>
                    <Box>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">Masih Draft</p>
                        <p className="text-2xl font-bold text-neutral-500">{stats.draft}</p>
                    </Box>
                </div>

                <Box>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-900">Isian User</h2>
                        {grand_total_budget > 0 && (
                            <p className="text-xs font-bold uppercase tracking-widest text-neutral-700">
                                Total Anggaran Keseluruhan: <span className="text-black">{formatRupiah(grand_total_budget)}</span>
                            </p>
                        )}
                    </div>

                    <div className="overflow-x-auto border border-[#e5e5e5]">
                        <table className="min-w-full text-left">
                            <thead className="bg-[#f5f5f5] border-b border-[#e5e5e5]">
                                <tr>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500">User</th>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Unit</th>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Jabatan</th>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Isian Borang</th>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Anggaran</th>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Status</th>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Tgl Submit</th>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#e5e5e5]">
                                {submissions.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="px-4 py-8 text-center text-xs text-neutral-400 uppercase tracking-widest">
                                            Belum ada user yang mengisi sesi ini.
                                        </td>
                                    </tr>
                                ) : (
                                    submissions.map((submission) => (
                                        <tr key={submission.id} className="hover:bg-[#fafafa]">
                                            <td className="px-4 py-3">
                                                <p className="text-sm font-semibold text-neutral-900">{submission.user?.name}</p>
                                                <p className="text-xs text-neutral-500">{submission.user?.email}</p>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-neutral-600">{submission.unit || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-neutral-600">{submission.jabatan || '-'}</td>
                                            <td className="px-4 py-3 text-xs text-neutral-600 whitespace-nowrap">
                                                B1: {submission.borang1_count} • B2: {submission.borang2_count} • B3: {submission.borang3_count} • B4: {submission.borang4_count} • B5: {submission.borang5_count} • B6: {submission.borang6_count}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-neutral-600">{submission.borang6_total ? formatRupiah(submission.borang6_total) : '-'}</td>
                                            <td className="px-4 py-3"><SubmissionStatusBadge status={submission.status} /></td>
                                            <td className="px-4 py-3 text-xs text-neutral-600">{formatDateTime(submission.submitted_at)}</td>
                                            <td className="px-4 py-3 text-right">
                                                <ActionButton href={`/raker/submissions/${submission.id}`} variant="ghost">
                                                    Detail
                                                </ActionButton>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Box>
            </div>
        </AdminLayout>
    );
}