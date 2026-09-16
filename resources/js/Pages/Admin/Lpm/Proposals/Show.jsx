import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { useState } from 'react';

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

function SectionTitle({ children, action }) {
    return (
        <div className="flex items-center justify-between mb-5">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">{children}</h2>
            {action && <div>{action}</div>}
        </div>
    );
}

function ActionButton({ children, href, onClick, variant = 'primary', type = 'button', disabled }) {
    const map = {
        primary: 'bg-black text-white border-black hover:bg-neutral-800',
        secondary: 'bg-white text-black border-[#e4e4e7] hover:border-black',
        danger: 'bg-white text-red-600 border-[#e4e4e7] hover:border-red-600 hover:bg-red-50',
        ghost: 'bg-transparent text-neutral-500 border-transparent hover:text-black'
    };
    const className = `inline-flex items-center justify-center px-4 py-2 text-[11px] font-semibold uppercase tracking-widest border transition-colors duration-200 ${map[variant]} ${disabled ? 'opacity-50 pointer-events-none' : ''}`;
    if (href) {
        return <Link href={href} className={className}>{children}</Link>;
    }
    return (
        <button type={type} onClick={onClick} disabled={disabled} className={className}>
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

const fileUrl = (path) => (path ? `/storage/${path}` : '#');

export default function Show({ proposal, reviewableReviewers, reviewSummary }) {
    const [note, setNote] = useState(proposal.alasan_verifikasi || '');
    const [confirmNote, setConfirmNote] = useState('');
    const [selectedReviewers, setSelectedReviewers] = useState(
        proposal.reviews.filter((r) => r.status === 'draft').map((r) => r.reviewer_user_id)
    );
    const [decision, setDecision] = useState('passed');

    const verifyForm = useForm({ catatan: note });
    const contractForm = useForm({});
    const activityForm = useForm({});
    const reportForms = {};
    const outputForms = {};

    const doPost = (routeName, data = {}, opts = {}) => {
        router.post(route(routeName, data.id || proposal.id), data, opts);
    };

    const runAction = (routeName, confirmMsg, data = {}) => {
        if (confirmMsg && !confirm(confirmMsg)) return;
        doPost(routeName, { ...data, id: proposal.id }, { preserveScroll: true });
    };

    const assignReviewers = () => {
        if (selectedReviewers.length === 0) {
            alert('Pilih minimal satu reviewer.');
            return;
        }
        router.post(route('admin.lpm.proposals.assign-reviewers', proposal.id), { reviewers: selectedReviewers }, { preserveScroll: true });
    };

    const handleDecision = () => {
        runAction('admin.lpm.proposals.decide-review', null, { keputusan: decision, catatan: confirmNote });
    };

    const contractSubmit = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        contractForm.post(route('admin.lpm.proposals.contract', proposal.id), {
            forceFormData: true,
            data: fd,
            preserveScroll: true,
        });
    };

    const activitySubmit = (e) => {
        e.preventDefault();
        const formEl = e.target;
        const fd = new FormData(formEl);
        activityForm.post(route('admin.lpm.proposals.activities.store', proposal.id), {
            forceFormData: true,
            data: fd,
            preserveScroll: true,
            onSuccess: () => formEl.reset(),
        });
    };

    const validateReport = (report, status) => {
        const catatan = prompt(status === 'ditolak' ? 'Alasan penolakan laporan:' : 'Catatan validasi (opsional):');
        if (status === 'ditolak' || catatan !== null) {
            router.post(route('admin.lpm.reports.validate', report.id), { status, catatan: catatan || '' }, { preserveScroll: true });
        }
    };

    const validateOutput = (output, status) => {
        const catatan = prompt(status === 'ditolak' ? 'Alasan penolakan luaran:' : 'Catatan validasi (opsional):');
        if (status === 'ditolak' || catatan !== null) {
            router.post(route('admin.lpm.outputs.validate', output.id), { status, catatan: catatan || '' }, { preserveScroll: true });
        }
    };

    const rupiah = (n) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`;

    const status = proposal.status;

    return (
        <AdminLayout title="Detail Proposal">
            <Head title={proposal.judul} />

            <div className="space-y-6">
                {/* Header */}
                <Box variant="dark" className="relative overflow-hidden">
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-neutral-400 mb-2">
                                {proposal.program?.nama_program || 'Program'} — {proposal.program?.skema || ''}
                            </p>
                            <h1 className="text-2xl font-bold tracking-tight text-white">{proposal.judul}</h1>
                            <p className="text-sm text-neutral-400 mt-1">
                                Ketua: {proposal.ketua?.dosen?.nama_lengkap || proposal.ketua?.name} • Versi {proposal.versi}
                            </p>
                        </div>
                        <div className="flex flex-col items-start sm:items-end gap-2 flex-shrink-0">
                            <span className={`inline-flex px-3 py-1 text-[10px] font-semibold uppercase tracking-wider border ${statusColors[status] || statusColors.draft}`}>
                                {proposal.status_display}
                            </span>
                            {proposal.alasan_verifikasi && (
                                <span className="text-xs text-neutral-400 max-w-64 text-right italic">"{proposal.alasan_verifikasi}"</span>
                            )}
                        </div>
                    </div>

                    {/* Progress */}
                    <div className="relative z-10 mt-5">
                        <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                            <span>Progres</span>
                            <span>{reviewSummary.progress}%</span>
                        </div>
                        <div className="bg-white/10 h-2">
                            <div className="bg-white h-2" style={{ width: `${reviewSummary.progress}%` }} />
                        </div>
                    </div>
                </Box>

                {/* Workflow actions */}
                {status === 'submitted' && (
                    <Box>
                        <SectionTitle>Aksi Verifikasi Administrasi</SectionTitle>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">Catatan (opsional)</label>
                                <textarea
                                    rows="2"
                                    className="w-full border border-[#e4e4e7] px-3 py-2 text-sm focus:border-black focus:ring-black rounded-none"
                                    value={note}
                                    onChange={(e) => { setNote(e.target.value); verifyForm.setData('catatan', e.target.value); }}
                                    placeholder="Catatan untuk ketua proposal..."
                                />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <ActionButton type="button" variant="primary" onClick={() => runAction('admin.lpm.proposals.verify-approve', null, { catatan: note })}>
                                    Setujui → Verifikasi Admin
                                </ActionButton>
                                <ActionButton type="button" variant="secondary" onClick={() => runAction('admin.lpm.proposals.verify-return', null, { catatan: prompt('Alasan pengembalian:', '') || '' })}>
                                    Kembalikan ke Ketua
                                </ActionButton>
                                <ActionButton type="button" variant="danger" onClick={() => {
                                    const c = prompt('Alasan penolakan:');
                                    if (c) runAction('admin.lpm.proposals.reject', null, { catatan: c });
                                }}>
                                    Tolak Proposal
                                </ActionButton>
                            </div>
                        </div>
                    </Box>
                )}

                {status === 'under_admin_review' && (
                    <Box>
                        <SectionTitle>Hasil Verifikasi Administrasi</SectionTitle>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">Catatan (opsional)</label>
                                <textarea
                                    rows="2"
                                    className="w-full border border-[#e4e4e7] px-3 py-2 text-sm focus:border-black focus:ring-black rounded-none"
                                    value={note}
                                    onChange={(e) => { setNote(e.target.value); verifyForm.setData('catatan', e.target.value); }}
                                />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <ActionButton type="button" variant="primary" onClick={() => runAction('admin.lpm.proposals.verify-admin-approve', null, { catatan: note })}>
                                    Lolos Verifikasi → Siap Review
                                </ActionButton>
                                <ActionButton type="button" variant="secondary" onClick={() => runAction('admin.lpm.proposals.verify-return', null, { catatan: prompt('Alasan pengembalian:', '') || '' })}>
                                    Kembalikan untuk Perbaikan
                                </ActionButton>
                                <ActionButton type="button" variant="danger" onClick={() => {
                                    const c = prompt('Alasan penolakan:');
                                    if (c) runAction('admin.lpm.proposals.reject', null, { catatan: c });
                                }}>
                                    Tolak Proposal
                                </ActionButton>
                            </div>
                        </div>
                    </Box>
                )}

                {status === 'admin_approved' && (
                    <Box>
                        <SectionTitle>Tugaskan Reviewer</SectionTitle>
                        <p className="text-xs text-neutral-500 mb-3">Pilih dosen yang akan menilai proposal ini.</p>
                        <div className="space-y-2 mb-4">
                            {reviewableReviewers.map((reviewer) => (
                                <label key={reviewer.id} className="flex items-center gap-3 border border-[#e4e4e7] px-4 py-3 cursor-pointer hover:border-black transition-colors">
                                    <input
                                        type="checkbox"
                                        className="accent-black"
                                        checked={selectedReviewers.includes(reviewer.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedReviewers([...selectedReviewers, reviewer.id]);
                                            } else {
                                                setSelectedReviewers(selectedReviewers.filter((id) => id !== reviewer.id));
                                            }
                                        }}
                                    />
                                    <span className="text-sm text-neutral-800">
                                        {reviewer.name}
                                        {reviewer.assigned ? <span className="ml-2 text-[10px] uppercase tracking-wider text-emerald-700 border border-emerald-200 bg-emerald-50 px-2 py-0.5">Sudah ditugaskan</span> : null}
                                    </span>
                                </label>
                            ))}
                            {reviewableReviewers.length === 0 && (
                                <p className="text-xs text-neutral-500">Belum ada dosen untuk ditugaskan.</p>
                            )}
                        </div>
                        <ActionButton type="button" variant="primary" onClick={assignReviewers}>
                            Simpan Reviewer & Mulai Review
                        </ActionButton>
                    </Box>
                )}

                {status === 'under_substance_review' && (
                    <Box>
                        <SectionTitle>Review Substansi</SectionTitle>
                        <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Review Masuk</p>
                                <p className="text-xl font-bold text-black">{reviewSummary.submitted}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Lolos</p>
                                <p className="text-xl font-bold text-black">{reviewSummary.passed}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Rata-rata Skor</p>
                                <p className="text-xl font-bold text-black">{reviewSummary.average ?? '—'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Min Skor</p>
                                <p className="text-xl font-bold text-black">{reviewSummary.minimum}</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">Keputusan</label>
                                <select
                                    className="border-[#e4e4e7] bg-white px-3 py-2 text-sm focus:border-black focus:ring-black rounded-none"
                                    value={decision}
                                    onChange={(e) => setDecision(e.target.value)}
                                >
                                    <option value="passed">Lulus Seleksi</option>
                                    <option value="revision">Revisi Substansi</option>
                                    <option value="failed">Tidak Lulus</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">Catatan</label>
                                <textarea
                                    rows="2"
                                    className="w-full border border-[#e4e4e7] px-3 py-2 text-sm focus:border-black focus:ring-black rounded-none"
                                    value={confirmNote}
                                    onChange={(e) => setConfirmNote(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2">
                                <ActionButton type="button" variant="primary" onClick={handleDecision}>Simpan Keputusan</ActionButton>
                            </div>
                        </div>
                    </Box>
                )}

                {status === 'passed' && (
                    <Box>
                        <SectionTitle>Penetapan Dana</SectionTitle>
                        <p className="text-xs text-neutral-500 mb-3">
                            Proposal dinyatakan lulus seleksi. Tetapkan sebagai penerima dana untuk melanjutkan ke kontrak.
                        </p>
                        <ActionButton type="button" variant="primary" onClick={() => runAction('admin.lpm.proposals.fund', 'Tetapkan proposal sebagai penerima dana?')}>
                            Tetapkan Penerima Dana
                        </ActionButton>
                    </Box>
                )}

                {status === 'funded' && (
                    <Box>
                        <SectionTitle>Buat Kontrak & Mulai Kegiatan</SectionTitle>
                        <form onSubmit={contractSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">Nomor Kontrak</label>
                                <input
                                    name="nomor_kontrak"
                                    required
                                    className="w-full border border-[#e4e4e7] px-3 py-2 text-sm focus:border-black rounded-none"
                                    placeholder="mis. 001/LPM/STIT-AW/2025"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">Dana Disetujui (Rp)</label>
                                <input
                                    name="dana_disetujui"
                                    type="number"
                                    min="0"
                                    required
                                    className="w-full border border-[#e4e4e7] px-3 py-2 text-sm focus:border-black rounded-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">Tanggal Mulai</label>
                                <input name="tanggal_mulai" type="date" required className="w-full border border-[#e4e4e7] px-3 py-2 text-sm focus:border-black rounded-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">Tanggal Selesai</label>
                                <input name="tanggal_selesai" type="date" required className="w-full border border-[#e4e4e7] px-3 py-2 text-sm focus:border-black rounded-none" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">Kesepakatan / Poin Kontrak</label>
                                <textarea name="kesepakatan" rows="3" className="w-full border border-[#e4e4e7] px-3 py-2 text-sm focus:border-black rounded-none" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">File Kontrak (PDF/DOC) — opsional</label>
                                <input name="file_kontrak" type="file" accept=".pdf,.doc,.docx" className="w-full text-sm" />
                            </div>
                            <div className="md:col-span-2 flex gap-2">
                                <ActionButton type="submit" variant="primary" disabled={contractForm.processing}>
                                    {contractForm.processing ? 'Menyimpan...' : 'Simpan Kontrak'}
                                </ActionButton>
                            </div>
                        </form>
                    </Box>
                )}

                {status === 'contracted' && (
                    <Box>
                        <SectionTitle>Mulai Pelaksanaan</SectionTitle>
                        <p className="text-xs text-neutral-500 mb-3">Kontrak tersimpan ({proposal.contract?.nomor_kontrak}). Mulai kegiatan pengabdian.</p>
                        <ActionButton type="button" variant="primary" onClick={() => runAction('admin.lpm.proposals.start', 'Mulai kegiatan pengabdian?')}>
                            Mulai Kegiatan
                        </ActionButton>
                    </Box>
                )}

                {['ongoing', 'progress_report', 'final_report', 'output_validation'].includes(status) && (
                    <Box>
                        <SectionTitle>Catat Kegiatan Pelaksanaan</SectionTitle>
                        <form onSubmit={activitySubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">Nama Kegiatan</label>
                                <input name="nama_kegiatan" required className="w-full border border-[#e4e4e7] px-3 py-2 text-sm focus:border-black rounded-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">Tanggal</label>
                                <input name="tanggal" type="date" className="w-full border border-[#e4e4e7] px-3 py-2 text-sm focus:border-black rounded-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">Dokumentasi (Gambar/PDF)</label>
                                <input name="dokumentasi" type="file" accept=".jpg,.jpeg,.png,.pdf" className="w-full text-sm" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">Deskripsi</label>
                                <textarea name="deskripsi" rows="3" className="w-full border border-[#e4e4e7] px-3 py-2 text-sm focus:border-black rounded-none" />
                            </div>
                            <div className="md:col-span-2">
                                <ActionButton type="submit" variant="primary" disabled={activityForm.processing}>Simpan Kegiatan</ActionButton>
                            </div>
                        </form>
                    </Box>
                )}

                {/* Review hasil */}
                {proposal.reviews.length > 0 && (
                    <Box padded={false} className="overflow-hidden">
                        <div className="p-5">
                            <SectionTitle>Hasil Review Per Reviewer</SectionTitle>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-[#e4e4e7]">
                                <thead className="bg-[#fafafa]">
                                    <tr>
                                        <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Reviewer</th>
                                        <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Total Skor</th>
                                        <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Kesimpulan</th>
                                        <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-[#e4e4e7]">
                                    {proposal.reviews.map((review) => (
                                        <tr key={review.id} className="hover:bg-[#fafafa] transition-colors">
                                            <td className="px-5 py-3 text-sm text-neutral-800">
                                                {review.reviewer?.dosen?.nama_lengkap || review.reviewer?.name}
                                            </td>
                                            <td className="px-5 py-3 text-sm font-semibold text-black">{review.total_score}</td>
                                            <td className="px-5 py-3 text-sm text-neutral-700">{review.kesimpulan || '—'}</td>
                                            <td className="px-5 py-3">
                                                <span className={`inline-flex px-3 py-1 text-[10px] font-semibold uppercase tracking-wider border ${review.status === 'submitted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-neutral-100 text-neutral-500 border-[#e4e4e7]'}`}>
                                                    {review.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Box>
                )}

                {/* Kontrak */}
                {proposal.contract && (
                    <Box>
                        <SectionTitle>Kontrak</SectionTitle>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div><p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Nomor</p><p className="text-sm text-neutral-800">{proposal.contract.nomor_kontrak}</p></div>
                            <div><p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Dana</p><p className="text-sm text-neutral-800">{rupiah(proposal.contract.dana_disetujui)}</p></div>
                            <div><p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Periode</p><p className="text-sm text-neutral-800">{proposal.contract.tanggal_mulai} — {proposal.contract.tanggal_selesai}</p></div>
                            <div><p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">File</p>
                                {proposal.contract.file_kontrak ? (
                                    <a href={fileUrl(proposal.contract.file_kontrak)} target="_blank" rel="noopener noreferrer" className="text-sm text-black underline">Unduh</a>
                                ) : (<span className="text-sm text-neutral-500">Tidak ada</span>)}
                            </div>
                        </div>
                    </Box>
                )}

                {/* Laporan */}
                {proposal.reports.length > 0 && (
                    <Box>
                        <SectionTitle>Laporan</SectionTitle>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-[#e4e4e7]">
                                <thead className="bg-[#fafafa]">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Jenis</th>
                                        <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">File</th>
                                        <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Status</th>
                                        <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Aksi Validasi</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-[#e4e4e7]">
                                    {proposal.reports.map((report) => (
                                        <tr key={report.id}>
                                            <td className="px-4 py-3 text-sm text-neutral-800 capitalize">{report.jenis}</td>
                                            <td className="px-4 py-3 text-sm text-neutral-700">
                                                <a href={fileUrl(report.file_path)} target="_blank" rel="noopener noreferrer" className="underline hover:text-black">{report.file_path?.split('/').pop() || 'Unduh'}</a>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-neutral-700 capitalize">{report.status_validasi}</td>
                                            <td className="px-4 py-3">
                                                {report.status_validasi === 'menunggu' && (
                                                    <div className="flex gap-2">
                                                        <ActionButton type="button" variant="primary" size="sm" onClick={() => validateReport(report, 'valid')}>Valid</ActionButton>
                                                        <ActionButton type="button" variant="danger" size="sm" onClick={() => validateReport(report, 'ditolak')}>Tolak</ActionButton>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Box>
                )}

                {/* Luaran */}
                {proposal.outputs.length > 0 && (
                    <Box>
                        <SectionTitle>Luaran & Validasi</SectionTitle>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-[#e4e4e7] table-cards">
                                <thead className="bg-[#fafafa]">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Jenis Luaran</th>
                                        <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Deskripsi</th>
                                        <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">File</th>
                                        <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Status</th>
                                        <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-[#e4e4e7]">
                                    {proposal.outputs.map((output) => (
                                        <tr key={output.id}>
                                            <td data-label="Jenis Luaran" className="px-4 py-3 text-sm text-neutral-800">{output.jenis_luaran}</td>
                                            <td data-label="Deskripsi" className="px-4 py-3 text-xs text-neutral-600 max-w-64">
                                                <span className="block truncate">{output.judul}{output.deskripsi ? ` — ${output.deskripsi}` : ''}</span>
                                            </td>
                                            <td data-label="File" className="px-4 py-3 text-sm text-neutral-700">
                                                {output.bukti_path ? <a href={fileUrl(output.bukti_path)} target="_blank" rel="noopener noreferrer" className="underline hover:text-black">Unduh</a> : '—'}
                                            </td>
                                            <td data-label="Status" className="px-4 py-3 text-sm text-neutral-700 capitalize">{output.status_validasi}</td>
                                            <td data-label="Aksi" className="px-4 py-3">
                                                {output.status_validasi === 'menunggu' && (
                                                    <div className="flex gap-2">
                                                        <ActionButton type="button" variant="primary" size="sm" onClick={() => validateOutput(output, 'valid')}>Valid</ActionButton>
                                                        <ActionButton type="button" variant="danger" size="sm" onClick={() => validateOutput(output, 'ditolak')}>Tolak</ActionButton>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Box>
                )}

                {/* Isi proposal */}
                <Box padded={false} className="overflow-hidden">
                    <div className="p-5">
                        <SectionTitle>Isi Proposal</SectionTitle>
                    </div>
                    <div className="px-5 pb-5 space-y-4">
                        {proposal.ringkasan && <p className="text-sm text-neutral-700">{proposal.ringkasan}</p>}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {proposal.mitra && <div className="border border-[#e4e4e7] p-4"><p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-1">Mitra</p><p className="text-sm text-neutral-800">{proposal.mitra}</p></div>}
                            {proposal.permasalahan && <div className="border border-[#e4e4e7] p-4"><p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-1">Permasalahan</p><p className="text-sm text-neutral-800">{proposal.permasalahan}</p></div>}
                            {proposal.solusi && <div className="border border-[#e4e4e7] p-4"><p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-1">Solusi</p><p className="text-sm text-neutral-800">{proposal.solusi}</p></div>}
                            {proposal.metode && <div className="border border-[#e4e4e7] p-4"><p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-1">Metode</p><p className="text-sm text-neutral-800">{proposal.metode}</p></div>}
                        </div>

                        {proposal.jadwal && proposal.jadwal.length > 0 && (
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-2">Jadwal Pelaksanaan</p>
                                <table className="min-w-full divide-y divide-[#e4e4e7]">
                                    <tbody className="bg-white divide-y divide-[#e4e4e7]">
                                        {proposal.jadwal.map((item, i) => (
                                            <tr key={i}>
                                                <td className="px-4 py-2 text-sm text-neutral-800">{item.kegiatan}</td>
                                                <td className="px-4 py-2 text-xs text-neutral-500 whitespace-nowrap">{item.bulan}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {proposal.rab && proposal.rab.length > 0 && (
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-2">RAB — Total {rupiah(proposal.total_dana_rab)}</p>
                                <table className="min-w-full divide-y divide-[#e4e4e7]">
                                    <thead className="bg-[#fafafa]">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Uraian</th>
                                            <th className="px-4 py-2 text-right text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Harga Satuan</th>
                                            <th className="px-4 py-2 text-right text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Jumlah</th>
                                            <th className="px-4 py-2 text-right text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-[#e4e4e7]">
                                        {proposal.rab.map((item, i) => (
                                            <tr key={i}>
                                                <td className="px-4 py-2 text-sm text-neutral-800">{item.uraian}</td>
                                                <td className="px-4 py-2 text-sm text-neutral-700 text-right">{rupiah(item.harga_satuan)}</td>
                                                <td className="px-4 py-2 text-sm text-neutral-700 text-right">{item.jumlah}</td>
                                                <td className="px-4 py-2 text-sm font-semibold text-black text-right">{rupiah(item.jumlah * item.harga_satuan)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {proposal.luaran_target && proposal.luaran_target.length > 0 && (
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-2">Target Luaran</p>
                                <div className="flex flex-wrap gap-2">
                                    {proposal.luaran_target.map((item, i) => (
                                        <span key={i} className="inline-flex px-3 py-1 text-[11px] font-medium border border-[#e4e4e7] text-neutral-700">
                                            {item.jenis}{item.keterangan ? ` — ${item.keterangan}` : ''}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {proposal.documents.length > 0 && (
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-2">Dokumen Pendukung</p>
                                <div className="flex flex-wrap gap-2">
                                    {proposal.documents.map((doc) => (
                                        <a key={doc.id} href={fileUrl(doc.path)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium border border-[#e4e4e7] text-neutral-700 hover:border-black hover:text-black">
                                            {doc.jenis} — {doc.nama_file}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </Box>

                {/* Anggota */}
                <Box>
                    <SectionTitle>Tim Pengusul</SectionTitle>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-[#e4e4e7]">
                            <thead className="bg-[#fafafa]">
                                <tr>
                                    <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Nama</th>
                                    <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Peran</th>
                                    <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Persetujuan</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-[#e4e4e7]">
                                {proposal.members.map((member) => (
                                    <tr key={member.id}>
                                        <td className="px-4 py-3 text-sm text-neutral-800">{member.user?.dosen?.nama_lengkap || member.user?.name}</td>
                                        <td className="px-4 py-3 text-sm text-neutral-700 capitalize">{member.peran}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex px-3 py-1 text-[10px] font-semibold uppercase tracking-wider border ${
                                                member.status_persetujuan === 'menyetujui' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                : member.status_persetujuan === 'menolak' ? 'bg-red-50 text-red-700 border-red-200'
                                                : 'bg-neutral-100 text-neutral-500 border-[#e4e4e7]'
                                            }`}>
                                                {member.status_persetujuan}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Box>

                {/* Kegiatan berjalan */}
                {proposal.activities.length > 0 && (
                    <Box>
                        <SectionTitle>Kegiatan Pelaksanaan</SectionTitle>
                        <div className="space-y-3">
                            {proposal.activities.map((activity) => (
                                <div key={activity.id} className="border border-[#e4e4e7] p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-sm font-semibold text-black">{activity.nama_kegiatan}</p>
                                        {activity.tanggal && <span className="text-xs text-neutral-500">{activity.tanggal}</span>}
                                    </div>
                                    {activity.deskripsi && <p className="text-sm text-neutral-700 mt-1">{activity.deskripsi}</p>}
                                    {activity.dokumentasi && (
                                        <a href={fileUrl(activity.dokumentasi)} target="_blank" rel="noopener noreferrer" className="text-xs underline text-neutral-600 mt-1 inline-block">
                                            Lihat dokumentasi
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Box>
                )}

                <div className="flex gap-3">
                    <ActionButton href={route('admin.lpm.proposals.index')} variant="secondary">Kembali</ActionButton>
                </div>
            </div>
        </AdminLayout>
    );
}