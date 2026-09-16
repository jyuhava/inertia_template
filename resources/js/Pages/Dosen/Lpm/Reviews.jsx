import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';

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

export default function Reviews({ reviews }) {
    return (
        <AdminLayout title="Review Proposal">
            <Head title="Review Proposal" />

            <div className="space-y-6">
                <Box variant="dark" className="relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-neutral-400 mb-2">LPM — Reviewer</p>
                        <h1 className="text-2xl font-bold tracking-tight text-white">REVIEW PROPOSAL</h1>
                        <p className="text-sm text-neutral-400 mt-1">Proposal pengabdian yang ditugaskan kepada Anda untuk dinilai</p>
                    </div>
                </Box>

                <Box padded={false} className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-[#e4e4e7] table-cards">
                            <thead className="bg-[#fafafa]">
                                <tr>
                                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Judul Proposal</th>
                                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Program</th>
                                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Ketua</th>
                                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Skor</th>
                                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Status</th>
                                    <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-[#e4e4e7]">
                                {reviews.data.map((review) => (
                                    <tr key={review.id} className="hover:bg-[#fafafa] transition-colors">
                                        <td data-label="Judul Proposal" className="px-5 py-4 text-sm font-medium text-black max-w-72">
                                            <span className="block truncate">{review.proposal?.judul}</span>
                                        </td>
                                        <td data-label="Program" className="px-5 py-4 text-xs text-neutral-500">{review.proposal?.program?.nama_program}</td>
                                        <td data-label="Ketua" className="px-5 py-4 text-sm text-neutral-700">
                                            {review.proposal?.ketua?.dosen?.nama_lengkap || review.proposal?.ketua?.name}
                                        </td>
                                        <td data-label="Skor" className="px-5 py-4 text-sm font-semibold text-black">{review.total_score ?? '—'}</td>
                                        <td data-label="Status" className="px-5 py-4">
                                            <span className={`inline-flex px-3 py-1 text-[10px] font-semibold uppercase tracking-wider border ${
                                                review.status === 'submitted'
                                                    ? (review.kesimpulan === 'lolos' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200')
                                                    : 'bg-neutral-100 text-neutral-500 border-[#e4e4e7]'
                                            }`}>
                                                {review.status === 'submitted' ? `${review.kesimpulan}` : 'Belum dinilai'}
                                            </span>
                                        </td>
                                        <td data-label="Aksi" className="px-5 py-4 text-right">
                                            <ActionButton href={route('dosen.lpm.reviews.edit', review.id)} variant="primary" size="sm">
                                                {review.status === 'submitted' ? 'Lihat Review' : 'Nilai Sekarang'}
                                            </ActionButton>
                                        </td>
                                    </tr>
                                ))}
                                {reviews.data.length === 0 && (
                                    <tr className="table-cards-empty">
                                        <td colSpan="6" className="px-5 py-12 text-center text-sm text-neutral-500">
                                            Belum ada proposal yang ditugaskan untuk Anda review.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {reviews.links && (
                        <div className="px-5 py-4 border-t border-[#e4e4e7] flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-xs text-neutral-500 uppercase tracking-wider">
                                Menampilkan {reviews.from} sampai {reviews.to} dari {reviews.total} data
                            </div>
                            <div className="flex gap-1">
                                {reviews.links.map((link, key) => (
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