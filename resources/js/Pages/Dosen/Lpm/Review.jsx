import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';

function Box({ children, className = '', padded = true, variant = 'white' }) {
    const variants = {
        white: 'bg-white border-[#e4e4e7]',
        dark: 'bg-[#0a0a0a] border-[#222] text-white',
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

export default function Review({ review }) {
    const proposal = review.proposal;
    const criteria = proposal?.program?.review_scheme?.criteria || [];
    const isSubmitted = review.status === 'submitted';

    const initialScores = {};
    criteria.forEach((c) => {
        initialScores[c.id] = review.scores?.[c.id] ?? 0;
    });

    const form = useForm({
        scores: initialScores,
        catatan: review.catatan || '',
    });

    const submit = (e) => {
        e.preventDefault();
        form.put(route('dosen.lpm.reviews.update', review.id), { preserveScroll: true });
    };

    const cancelReview = () => {
        if (confirm('Batalkan review ini?')) {
            router.delete(route('dosen.lpm.reviews.destroy', review.id));
        }
    };

    const bobotTotal = criteria.reduce((sum, c) => sum + Number(c.bobot || 0), 0) || 100;
    const liveTotal = criteria.reduce((sum, c) => sum + (Number(form.data.scores[c.id]) || 0) * (Number(c.bobot || 0) / bobotTotal), 0).toFixed(2);
    const minimum = proposal?.program?.review_scheme?.minimum_score ?? 70;

    const fileUrl = (path) => (path ? `/storage/${path}` : '#');

    return (
        <AdminLayout title="Form Review">
            <Head title="Review Proposal" />

            <div className="space-y-6">
                <Box variant="dark" className="relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-neutral-400 mb-2">LPM — Reviewer</p>
                        <h1 className="text-2xl font-bold tracking-tight text-white">{proposal?.judul}</h1>
                        <p className="text-sm text-neutral-400 mt-1">
                            {proposal?.program?.nama_program} — {proposal?.program?.skema} • Ketua: {proposal?.ketua?.dosen?.nama_lengkap || proposal?.ketua?.name}
                        </p>
                    </div>
                </Box>

                {/* Live score */}
                <Box variant="dark">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Skor Live</p>
                            <p className="text-3xl font-bold text-white">{liveTotal}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Batas Kelulusan</p>
                            <p className="text-3xl font-bold text-white">{minimum}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Kesimpulan Awal</p>
                            <p className={`text-xl font-bold ${Number(liveTotal) >= minimum ? 'text-green-400' : 'text-red-400'}`}>
                                {Number(liveTotal) >= minimum ? 'LOLOS' : 'GAGAL'}
                            </p>
                        </div>
                    </div>
                </Box>

                {/* Isi proposal */}
                <Box padded={false} className="overflow-hidden">
                    <div className="p-5">
                        <SectionTitle>Ringkasan Proposal</SectionTitle>
                    </div>
                    <div className="px-5 pb-5 space-y-3">
                        {proposal?.ringkasan && <p className="text-sm text-neutral-700">{proposal.ringkasan}</p>}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {proposal?.mitra && <div className="border border-[#e4e4e7] p-4"><p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-1">Mitra</p><p className="text-sm text-neutral-800">{proposal.mitra}</p></div>}
                            {proposal?.permasalahan && <div className="border border-[#e4e4e7] p-4"><p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-1">Permasalahan</p><p className="text-sm text-neutral-800">{proposal.permasalahan}</p></div>}
                            {proposal?.solusi && <div className="border border-[#e4e4e7] p-4"><p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-1">Solusi</p><p className="text-sm text-neutral-800">{proposal.solusi}</p></div>}
                            {proposal?.metode && <div className="border border-[#e4e4e7] p-4"><p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-1">Metode</p><p className="text-sm text-neutral-800">{proposal.metode}</p></div>}
                        </div>
                        {proposal?.documents?.length > 0 && (
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-2">Dokumen Pendukung</p>
                                <div className="flex flex-wrap gap-2">
                                    {proposal.documents.map((doc) => (
                                        <a key={doc.id} href={fileUrl(doc.path)} target="_blank" rel="noopener noreferrer" className="inline-flex px-3 py-1.5 text-[11px] font-medium border border-[#e4e4e7] text-neutral-700 hover:border-black hover:text-black">
                                            {doc.jenis} — {doc.nama_file}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </Box>

                {/* Scoring form */}
                <Box>
                    <SectionTitle>Penilaian</SectionTitle>
                    {isSubmitted && (
                        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 mb-4">
                            Review telah dikirim dan tidak dapat diubah. Detail penilaian Anda terlihat di bawah.
                        </p>
                    )}

                    <form onSubmit={submit}>
                        <div className="space-y-3">
                            {criteria.length === 0 ? (
                                <p className="text-sm text-neutral-500">Belum ada kriteria penilaian untuk program ini.</p>
                            ) : (
                                criteria.map((criterion) => (
                                    <div key={criterion.id} className="border border-[#e4e4e7] p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="text-sm font-medium text-neutral-800 flex-1">
                                                {criterion.nama_kriteria}
                                                <span className="ml-2 text-[10px] uppercase tracking-wider text-neutral-400">Bobot {criterion.bobot}%</span>
                                            </p>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                disabled={isSubmitted}
                                                className="w-24 border border-[#e4e4e7] px-3 py-2 text-sm focus:border-black rounded-none text-right"
                                                value={form.data.scores[criterion.id]}
                                                onChange={(e) => form.setData(`scores.${criterion.id}`, e.target.value)}
                                            />
                                        </div>
                                        {form.errors[`scores.${criterion.id}`] && (
                                            <p className="mt-1 text-xs text-red-600">{form.errors[`scores.${criterion.id}`]}</p>
                                        )}
                                    </div>
                                ))
                            )}

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">Catatan Review</label>
                                <textarea
                                    rows="4"
                                    disabled={isSubmitted}
                                    className="w-full border border-[#e4e4e7] px-3 py-2 text-sm focus:border-black rounded-none"
                                    value={form.data.catatan}
                                    onChange={(e) => form.setData('catatan', e.target.value)}
                                    placeholder="Catatan & rekomendasi untuk pengusul..."
                                />
                            </div>

                            {!isSubmitted && (
                                <div className="flex gap-3">
                                    <button type="submit" disabled={form.processing} className="px-4 py-2 text-[11px] font-semibold uppercase tracking-widest border border-black bg-black text-white hover:bg-neutral-800 disabled:opacity-50">
                                        {form.processing ? 'Mengirim...' : 'Kirim Penilaian'}
                                    </button>
                                    <button type="button" onClick={cancelReview} className="px-4 py-2 text-[11px] font-semibold uppercase tracking-widest border border-[#e4e4e7] bg-white text-red-600 hover:border-red-600 hover:bg-red-50">
                                        Batalkan Review
                                    </button>
                                </div>
                            )}
                        </div>
                    </form>
                </Box>

                <div className="flex gap-3">
                    <Link href={route('dosen.lpm.reviews.index')} className="text-[11px] font-semibold uppercase tracking-widest text-neutral-500 hover:text-black">
                        ← Kembali ke Daftar Review
                    </Link>
                </div>
            </div>
        </AdminLayout>
    );
}