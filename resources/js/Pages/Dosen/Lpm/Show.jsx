import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';

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
const rupiah = (n) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`;

export default function Show({ proposal, isReviewer, isKetua }) {
    const reportForm = useForm({});
    const outputForm = useForm({});

    const handleReport = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        reportForm.post(route('dosen.lpm.proposals.reports.upload', proposal.id), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => e.target.reset(),
        });
    };

    const handleOutput = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        outputForm.post(route('dosen.lpm.proposals.outputs.store', proposal.id), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => e.target.reset(),
        });
    };

    const canUploadLaporan = ['ongoing', 'progress_report', 'final_report'].includes(proposal.status);
    const canUploadLuaran = ['final_report', 'output_validation'].includes(proposal.status);
    const showContent = proposal.documents.length > 0 || proposal.rab?.length || proposal.jadwal?.length || proposal.luaran_target?.length;

    return (
        <AdminLayout title="Detail Proposal">
            <Head title={proposal.judul} />

            <div className="space-y-6">
                <Box variant="dark" className="relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-neutral-400 mb-2">
                            {proposal.program?.nama_program || ''} — {proposal.program?.skema || ''}
                        </p>
                        <h1 className="text-2xl font-bold tracking-tight text-white">{proposal.judul}</h1>
                        <p className="text-sm text-neutral-400 mt-1">
                            Versi {proposal.versi}
                            {proposal.tanggal_submit ? ` • Diajukan ${proposal.tanggal_submit}` : ''}
                        </p>
                    </div>
                    <div className="absolute top-5 right-5 z-10">
                        <span className={`inline-flex px-3 py-1 text-[10px] font-semibold uppercase tracking-wider border ${statusColors[proposal.status] || statusColors.draft}`}>
                            {proposal.status_display}
                        </span>
                    </div>
                </Box>

                {proposal.alasan_verifikasi && (
                    <Box className="border-amber-300 bg-amber-50">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 mb-1">Catatan dari LPM</p>
                        <p className="text-sm text-amber-800">{proposal.alasan_verifikasi}</p>
                    </Box>
                )}

                {/* Ringkasan */}
                {proposal.ringkasan && (
                    <Box>
                        <SectionTitle>Ringkasan</SectionTitle>
                        <p className="text-sm text-neutral-700">{proposal.ringkasan}</p>
                    </Box>
                )}

                {/* Detail */}
                {showContent && (
                    <Box padded={false} className="overflow-hidden">
                        <div className="p-5">
                            <SectionTitle>Detail Proposal</SectionTitle>
                        </div>
                        <div className="px-5 pb-5 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {proposal.mitra && <div className="border border-[#e4e4e7] p-4"><p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-1">Mitra</p><p className="text-sm text-neutral-800">{proposal.mitra}</p></div>}
                                {proposal.permasalahan && <div className="border border-[#e4e4e7] p-4"><p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-1">Permasalahan</p><p className="text-sm text-neutral-800">{proposal.permasalahan}</p></div>}
                                {proposal.solusi && <div className="border border-[#e4e4e7] p-4"><p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-1">Solusi</p><p className="text-sm text-neutral-800">{proposal.solusi}</p></div>}
                                {proposal.metode && <div className="border border-[#e4e4e7] p-4"><p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-1">Metode</p><p className="text-sm text-neutral-800">{proposal.metode}</p></div>}
                            </div>

                            {proposal.jadwal && proposal.jadwal.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-2">Jadwal Pelaksanaan</p>
                                    <div className="space-y-1">
                                        {proposal.jadwal.map((item, i) => (
                                            <div key={i} className="flex justify-between border border-[#e4e4e7] px-3 py-2">
                                                <span className="text-sm text-neutral-800">{item.kegiatan}</span>
                                                <span className="text-xs text-neutral-500">{item.bulan}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {proposal.rab && proposal.rab.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-2">RAB — Total {rupiah(proposal.total_dana_rab)}</p>
                                    <div className="overflow-x-auto">
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
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-2">Dokumen</p>
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
                )}

                {/* Tim */}
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
                                        <td className="px-4 py-3 text-sm text-neutral-800">{member.user?.dosen?.nama_lengkap || member.user?.name || 'Anda'}</td>
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

                {/* Hasil review */}
                {proposal.reviews.length > 0 && (
                    <Box>
                        <SectionTitle>Hasil Review</SectionTitle>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {proposal.reviews.map((review) => (
                                <div key={review.id} className="border border-[#e4e4e7] p-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-semibold text-black">{review.reviewer?.dosen?.nama_lengkap || review.reviewer?.name}</p>
                                        <span className={`text-[10px] font-semibold uppercase tracking-wider border px-2 py-0.5 ${review.status === 'submitted' ? (review.kesimpulan === 'lolos' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200') : 'bg-neutral-100 text-neutral-500 border-[#e4e4e7]'}`}>
                                            {review.status === 'submitted' ? `${review.kesimpulan} • ${review.total_score}` : review.status}
                                        </span>
                                    </div>
                                    {review.catatan && <p className="text-xs text-neutral-600 mt-2 italic">"{review.catatan}"</p>}
                                </div>
                            ))}
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
                                {proposal.contract.file_kontrak ? <a href={fileUrl(proposal.contract.file_kontrak)} target="_blank" rel="noopener noreferrer" className="text-sm text-black underline">Unduh</a> : <span className="text-sm text-neutral-500">—</span>}
                            </div>
                        </div>
                    </Box>
                )}

                {/* Kegiatan */}
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
                                    {activity.dokumentasi && <a href={fileUrl(activity.dokumentasi)} target="_blank" rel="noopener noreferrer" className="text-xs underline text-neutral-600 mt-1 inline-block">Lihat dokumentasi</a>}
                                </div>
                            ))}
                        </div>
                    </Box>
                )}

                {/* Laporan & Luaran submission */}
                {canUploadLaporan && (
                    <Box>
                        <SectionTitle>Unggah Laporan</SectionTitle>
                        <form onSubmit={handleReport} className="flex gap-2 flex-col sm:flex-row">
                            <select name="jenis" required className="w-full sm:w-44 border border-[#e4e4e7] bg-white px-3 py-2 text-sm focus:border-black rounded-none">
                                <option value="kemajuan">Laporan Kemajuan</option>
                                <option value="akhir">Laporan Akhir</option>
                            </select>
                            <input name="file" type="file" required accept=".pdf,.doc,.docx" className="flex-1 text-sm" />
                            <button type="submit" disabled={reportForm.processing} className="px-4 py-2 text-[11px] font-semibold uppercase tracking-widest border border-black bg-black text-white hover:bg-neutral-800">
                                Unggah
                            </button>
                        </form>
                        {proposal.reports.length > 0 && (
                            <div className="mt-4 space-y-2">
                                {proposal.reports.map((report) => (
                                    <div key={report.id} className="flex items-center justify-between border border-[#e4e4e7] px-3 py-2">
                                        <div className="flex items-center gap-3">
                                            <a href={fileUrl(report.file_path)} target="_blank" rel="noopener noreferrer" className="text-sm underline text-neutral-800">{report.file_path?.split('/').pop() || report.jenis}</a>
                                            <span className="text-xs text-neutral-500 capitalize">{report.jenis}</span>
                                        </div>
                                        <span className={`text-[10px] font-semibold uppercase tracking-wider border px-2 py-0.5 ${
                                            report.status_validasi === 'valid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                            : report.status_validasi === 'ditolak' ? 'bg-red-50 text-red-700 border-red-200'
                                            : 'bg-neutral-100 text-neutral-500 border-[#e4e4e7]'
                                        }`}>
                                            {report.status_validasi}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Box>
                )}

                {canUploadLuaran && (
                    <Box>
                        <SectionTitle>Unggah Luaran</SectionTitle>
                        <form onSubmit={handleOutput} className="flex gap-2 flex-col sm:flex-row">
                            <input name="jenis_luaran" type="text" required placeholder="Jenis luaran (mis. Artikel, Buku, HKI)" className="w-full sm:w-56 border border-[#e4e4e7] px-3 py-2 text-sm focus:border-black rounded-none" />
                            <input name="judul" type="text" required placeholder="Judul luaran" className="w-full sm:w-56 border border-[#e4e4e7] px-3 py-2 text-sm focus:border-black rounded-none" />
                            <input name="deskripsi" type="text" placeholder="Deskripsi (opsional)" className="w-full sm:w-56 border border-[#e4e4e7] px-3 py-2 text-sm focus:border-black rounded-none" />
                            <input name="bukti" type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip" className="flex-1 text-sm" />
                            <button type="submit" disabled={outputForm.processing} className="px-4 py-2 text-[11px] font-semibold uppercase tracking-widest border border-black bg-black text-white hover:bg-neutral-800">
                                Unggah
                            </button>
                        </form>
                        {proposal.outputs.length > 0 && (
                            <div className="mt-4 space-y-2">
                                {proposal.outputs.map((output) => (
                                    <div key={output.id} className="flex items-center justify-between border border-[#e4e4e7] px-3 py-2">
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm text-neutral-800">{output.jenis_luaran}</span>
                                            <span className="text-xs text-neutral-500">— {output.judul}</span>
                                            {output.deskripsi && <span className="text-xs text-neutral-500">({output.deskripsi})</span>}
                                            {output.bukti_path && <a href={fileUrl(output.bukti_path)} target="_blank" rel="noopener noreferrer" className="text-xs underline text-neutral-700">Unduh</a>}
                                        </div>
                                        <span className={`text-[10px] font-semibold uppercase tracking-wider border px-2 py-0.5 ${
                                            output.status_validasi === 'valid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                            : output.status_validasi === 'ditolak' ? 'bg-red-50 text-red-700 border-red-200'
                                            : 'bg-neutral-100 text-neutral-500 border-[#e4e4e7]'
                                        }`}>
                                            {output.status_validasi}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Box>
                )}

                <div className="flex gap-3">
                    {isKetua && (
                        <ActionButton href={route('dosen.lpm.proposals.edit', proposal.id)} variant="secondary">Lengkapi / Edit Proposal</ActionButton>
                    )}
                    <ActionButton href={route('dosen.lpm.proposals.index')} variant="ghost">← Kembali ke Daftar Proposal</ActionButton>
                </div>
            </div>
        </AdminLayout>
    );
}