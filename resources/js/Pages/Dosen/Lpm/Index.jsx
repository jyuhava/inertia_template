import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

function Box({ children, className = '', padded = true, variant = 'white' }) {
    const variants = {
        white: 'bg-white border-[#e4e4e7]',
        dark: 'bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 border-transparent text-white rounded-2xl shadow-lg shadow-teal-500/20',
        accent: 'bg-black text-white border-black'
    };
    return (
        <div className={`border ${variants[variant]} ${padded ? 'p-5' : ''} ${className}`}>
            {children}
        </div>
    );
}

function SectionTitle({ children, action }) {
    return (
        <div className="flex items-center justify-between mb-5">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">{children}</h2>
            {action && <div>{action}</div>}
        </div>
    );
}

function ActionButton({ children, href, onClick, variant = 'primary', type = 'button' }) {
    const map = {
        primary: 'bg-black text-white border-black hover:bg-neutral-800',
        secondary: 'bg-white text-black border-[#e4e4e7] hover:border-black',
        danger: 'bg-white text-red-600 border-[#e4e4e7] hover:border-red-600 hover:bg-red-50',
        ghost: 'bg-transparent text-neutral-500 border-transparent hover:text-black'
    };
    const className = `inline-flex items-center justify-center px-4 py-2 text-[11px] font-semibold uppercase tracking-widest border transition-colors duration-200 ${map[variant]}`;
    if (href) {
        return <Link href={href} className={className}>{children}</Link>;
    }
    return (
        <button type={type} onClick={onClick} className={className}>
            {children}
        </button>
    );
}

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

const editableStatuses = ['draft', 'returned', 'revision'];

export default function Index({ proposals, filters, dosen, statusOptions }) {
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');

    const applyFilter = (status) => {
        setSelectedStatus(status);
        router.get(route('dosen.lpm.proposals.index'), status ? { status } : {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <AdminLayout title="Proposal Pengabdian Saya">
            <Head title="Proposal Pengabdian" />

            <div className="space-y-6">
                <Box variant="dark" className="relative overflow-hidden">
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-neutral-400 mb-2">LPM</p>
                            <h1 className="text-2xl font-bold tracking-tight text-white">PROPOSAL PENGABDIAN SAYA</h1>
                            <p className="text-sm text-neutral-400 mt-1">Kelola pengajuan proposal pengabdian kepada masyarakat</p>
                        </div>
                        <ActionButton href={route('dosen.lpm.proposals.create')} variant="primary">
                            + Pengajuan Baru
                        </ActionButton>
                    </div>
                </Box>

                <Box>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => applyFilter('')}
                            className={`px-3 py-2 text-[11px] font-semibold uppercase tracking-wider border transition-colors ${!selectedStatus ? 'bg-black text-white border-black' : 'bg-white text-neutral-700 border-[#e4e4e7] hover:border-black'}`}
                        >
                            Semua
                        </button>
                        {Object.entries(statusOptions).map(([key, label]) => (
                            <button
                                key={key}
                                onClick={() => applyFilter(key)}
                                className={`px-3 py-2 text-[11px] font-semibold uppercase tracking-wider border transition-colors ${selectedStatus === key ? 'bg-black text-white border-black' : 'bg-white text-neutral-700 border-[#e4e4e7] hover:border-black'}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </Box>

                <Box padded={false} className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-[#e4e4e7] table-cards">
                            <thead className="bg-[#fafafa]">
                                <tr>
                                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Judul</th>
                                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Program</th>
                                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Versi</th>
                                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Status</th>
                                    <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-[#e4e4e7]">
                                {proposals.data.map((proposal) => (
                                    <tr key={proposal.id} className="hover:bg-[#fafafa] transition-colors">
                                        <td data-label="Judul" className="px-5 py-4 text-sm font-medium text-black max-w-72">
                                            <span className="block truncate">{proposal.judul}</span>
                                            {proposal.alasan_verifikasi && (
                                                <span className="block text-xs text-amber-600 italic mt-0.5">"{proposal.alasan_verifikasi}"</span>
                                            )}
                                        </td>
                                        <td data-label="Program" className="px-5 py-4 text-xs text-neutral-500">{proposal.program?.nama_program}</td>
                                        <td data-label="Versi" className="px-5 py-4 text-sm text-neutral-700">{proposal.versi}</td>
                                        <td data-label="Status" className="px-5 py-4">
                                            <span className={`inline-flex px-3 py-1 text-[10px] font-semibold uppercase tracking-wider border ${statusColors[proposal.status] || statusColors.draft}`}>
                                                {statusOptions[proposal.status] || proposal.status}
                                            </span>
                                        </td>
                                        <td data-label="Aksi" className="px-5 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                {editableStatuses.includes(proposal.status) ? (
                                                    <ActionButton href={route('dosen.lpm.proposals.edit', proposal.id)} variant="primary" size="sm">Lengkapi</ActionButton>
                                                ) : (
                                                    <ActionButton href={route('dosen.lpm.proposals.show', proposal.id)} variant="secondary" size="sm">Detail</ActionButton>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {proposals.data.length === 0 && (
                                    <tr className="table-cards-empty">
                                        <td colSpan="5" className="px-5 py-12 text-center text-sm text-neutral-500">
                                            Belum ada proposal. Klik "Pengajuan Baru" untuk memulai.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {proposals.links && (
                        <div className="px-5 py-4 border-t border-[#e4e4e7] flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-xs text-neutral-500 uppercase tracking-wider">
                                Menampilkan {proposals.from} sampai {proposals.to} dari {proposals.total} data
                            </div>
                            <div className="flex gap-1">
                                {proposals.links.map((link, key) => (
                                    link.url ? (
                                        <Link
                                            key={key}
                                            href={link.url}
                                            className={`px-3 py-2 text-xs font-medium border transition-colors ${
                                                link.active
                                                    ? 'bg-black text-white border-black'
                                                    : 'bg-white text-neutral-700 border-[#e4e4e7] hover:border-black hover:text-black'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ) : (
                                        <span
                                            key={key}
                                            className="px-3 py-2 text-xs font-medium border bg-[#fafafa] text-neutral-400 border-[#e4e4e7] cursor-not-allowed"
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    )
                                ))}
                            </div>
                        </div>
                    )}
                </Box>
            </div>
        </AdminLayout>
    );
}