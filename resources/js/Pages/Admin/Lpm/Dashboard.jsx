import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';

function Box({ children, className = '', padded = true, variant = 'white' }) {
    const variants = {
        white: 'bg-white border-[#e4e4e7]',
        dark: 'bg-gradient-to-br from-slate-800 via-indigo-700 to-indigo-600 border-transparent text-white rounded-2xl shadow-lg shadow-indigo-500/20',
        accent: 'bg-black text-white border-black'
    };
    return (
        <div className={`border ${variants[variant]} ${padded ? 'p-5' : ''} ${className}`}>
            {children}
        </div>
    );
}

export default function Dashboard({ stats, perStatus, perTahun, topPrograms, recent }) {
    const statCards = [
        { label: 'Program', value: stats.program, sub: `${stats.program_aktif} aktif`, href: '/admin/lpm/programs' },
        { label: 'Proposal', value: stats.proposal, sub: 'total pengajuan', href: '/admin/lpm/proposals' },
        { label: 'Menunggu Verifikasi', value: stats.menunggu_verifikasi, sub: 'administrasi', href: '/admin/lpm/proposals?status=submitted' },
        { label: 'Review Substansi', value: stats.review_substansi, sub: 'dalam penilaian', href: '/admin/lpm/proposals?status=under_substance_review' },
        { label: 'Lulus Seleksi', value: stats.lulus, sub: 'ditetapkan', href: '/admin/lpm/proposals?status=passed' },
        { label: 'Berjalan', value: stats.kegiatan_berjalan, sub: 'pelaksanaan', href: '/admin/lpm/proposals?status=ongoing' },
        { label: 'Selesai', value: stats.selesai, sub: 'tuntas', href: '/admin/lpm/proposals?status=completed' },
        { label: 'Dana Disetujui', value: `Rp ${Number(stats.dana_disetujui || 0).toLocaleString('id-ID')}`, sub: 'akumulasi kontrak', href: '/admin/lpm/proposals' },
    ];

    const statusColors = {
        draft: 'bg-neutral-100 text-neutral-600 border-[#e4e4e7]',
        submitted: 'bg-blue-50 text-blue-700 border-blue-200',
        returned: 'bg-amber-50 text-amber-700 border-amber-200',
        revision: 'bg-orange-50 text-orange-700 border-orange-200',
        under_admin_review: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        admin_approved: 'bg-violet-50 text-violet-700 border-violet-200',
        under_substance_review: 'bg-purple-50 text-purple-700 border-purple-200',
        passed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        failed: 'bg-red-50 text-red-700 border-red-200',
        funded: 'bg-teal-50 text-teal-700 border-teal-200',
        contracted: 'bg-cyan-50 text-cyan-700 border-cyan-200',
        ongoing: 'bg-sky-50 text-sky-700 border-sky-200',
        progress_report: 'bg-lime-50 text-lime-700 border-lime-200',
        final_report: 'bg-green-50 text-green-700 border-green-200',
        output_validation: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        rejected: 'bg-red-50 text-red-700 border-red-200',
    };

    const maxStatus = Math.max(...perStatus.map(s => s.value), 1);
    const maxYear = Math.max(...perTahun.values(), 1);

    return (
        <AdminLayout title="Dashboard LPM">
            <Head title="Dashboard LPM" />

            <div className="space-y-6">
                {/* Header */}
                <Box variant="dark" className="relative overflow-hidden">
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-neutral-400 mb-2">Lembaga Penjaminan Mutu</p>
                            <h1 className="text-2xl font-bold tracking-tight text-white">PENGABDIAN KEPADA MASYARAKAT</h1>
                            <p className="text-sm text-neutral-400 mt-1">Overview pengelolaan proposal, review, kontrak, dan pelaksanaan kegiatan</p>
                        </div>
                        <div className="flex gap-2">
                            <Link href="/admin/lpm/programs/create" className="inline-flex items-center justify-center px-4 py-2 text-[11px] font-semibold uppercase tracking-widest border border-white/30 text-white hover:bg-white hover:text-black transition-colors duration-200">
                                + Program Baru
                            </Link>
                            <Link href="/admin/lpm/proposals" className="inline-flex items-center justify-center px-4 py-2 text-[11px] font-semibold uppercase tracking-widest bg-white text-black border border-white hover:bg-neutral-200 transition-colors duration-200">
                                Lihat Proposal
                            </Link>
                        </div>
                    </div>
                </Box>

                {/* Stat cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {statCards.map((card, i) => (
                        <Link key={i} href={card.href}>
                            <Box className="h-full transition-colors hover:border-black">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">{card.label}</p>
                                <p className="mt-2 text-2xl font-bold tracking-tight text-black">{card.value}</p>
                                <p className="mt-1 text-xs text-neutral-500">{card.sub}</p>
                            </Box>
                        </Link>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Status pipeline */}
                    <Box className="lg:col-span-2">
                        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 mb-5">PIPELINE STATUS PROPOSAL</h2>
                        <div className="space-y-3">
                            {perStatus.map((s, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <span className="w-44 flex-shrink-0 text-xs font-medium text-neutral-700 truncate" title={s.label}>{s.label}</span>
                                    <div className="flex-1 bg-neutral-100 h-5">
                                        <div
                                            className="bg-black h-5 transition-all"
                                            style={{ width: `${(s.value / maxStatus) * 100}%` }}
                                        />
                                    </div>
                                    <span className="w-10 text-right text-sm font-bold text-black">{s.value}</span>
                                </div>
                            ))}
                        </div>
                    </Box>

                    {/* Berita / laporan pending */}
                    <div className="space-y-6">
                        <Box>
                            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 mb-4">VALIDASI MENUNGGU</h2>
                            <div className="space-y-3">
                                <div className={`inline-flex px-3 py-1 text-[10px] font-semibold uppercase tracking-wider border ${stats.laporan_menunggu > 0 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-neutral-100 text-neutral-500 border-[#e4e4e7]'}`}>
                                    {stats.laporan_menunggu} Laporan
                                </div>
                                <div className={`inline-flex px-3 py-1 text-[10px] font-semibold uppercase tracking-wider border ml-2 ${stats.luaran_menunggu > 0 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-neutral-100 text-neutral-500 border-[#e4e4e7]'}`}>
                                    {stats.luaran_menunggu} Luaran
                                </div>
                            </div>
                        </Box>

                        <Box>
                            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 mb-4">TOTAL PROPOSAL PER TAHUN</h2>
                            {perTahun.length === 0 ? (
                                <p className="text-xs text-neutral-500">Belum ada data.</p>
                            ) : (
                                <div className="flex items-end gap-3 h-32">
                                    {perTahun.map(([tahun, total], i) => (
                                        <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                                            <span className="text-[10px] font-bold text-black">{total}</span>
                                            <div className="w-full bg-black" style={{ height: `${(total / maxYear) * 60}%` }} />
                                            <span className="text-[10px] uppercase text-neutral-500">{tahun}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Box>
                    </div>
                </div>

                {/* Top programs + recent */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Box>
                        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 mb-4">PROGRAM TERBANYAK PROPOSAL</h2>
                        {topPrograms.length === 0 ? (
                            <p className="text-xs text-neutral-500">Belum ada program.</p>
                        ) : (
                            <div className="space-y-3">
                                {topPrograms.map((program, i) => (
                                    <div key={i} className="flex items-center justify-between gap-3">
                                        <span className="text-xs text-neutral-700 truncate">{program.nama}</span>
                                        <span className="text-xs font-semibold text-black">{program.jumlah}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Box>

                    <Box className="lg:col-span-2">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">PROPOSAL TERBARU</h2>
                            <Link href="/admin/lpm/proposals" className="text-xs font-semibold uppercase tracking-wider text-black hover:underline">
                                Lihat Semua →
                            </Link>
                        </div>
                        {recent.length === 0 ? (
                            <p className="text-xs text-neutral-500">Belum ada proposal.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-[#e4e4e7]">
                                    <thead className="bg-[#fafafa]">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Judul</th>
                                            <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Program</th>
                                            <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Ketua</th>
                                            <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-[#e4e4e7]">
                                        {recent.map((p) => (
                                            <tr key={p.id} className="hover:bg-[#fafafa] transition-colors">
                                                <td className="px-4 py-3 text-sm text-neutral-800 truncate max-w-56">
                                                    <Link href={`/admin/lpm/proposals/${p.id}`} className="hover:text-black">{p.judul}</Link>
                                                </td>
                                                <td className="px-4 py-3 text-xs text-neutral-500">{p.program?.nama_program}</td>
                                                <td className="px-4 py-3 text-xs text-neutral-500">{p.ketua?.dosen?.nama_lengkap || p.ketua?.name}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider border ${statusColors[p.status] || statusColors.draft}`}>
                                                        {p.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Box>
                </div>
            </div>
        </AdminLayout>
    );
}