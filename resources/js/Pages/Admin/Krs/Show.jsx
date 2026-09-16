import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

function Box({ children, className = '', padded = true, variant = 'white' }) {
    const variants = {
        white: 'bg-white border-[#e5e5e5]',
        black: 'bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 border-transparent text-white rounded-2xl shadow-lg shadow-violet-500/20',
        gray: 'bg-[#f5f5f5] border-[#e5e5e5]',
    };
    return (
        <div className={`border ${variants[variant]} ${padded ? 'p-6' : ''} ${className}`}>
            {children}
        </div>
    );
}

function SectionTitle({ children, action }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-900">{children}</h2>
            {action && <div>{action}</div>}
        </div>
    );
}

function ActionButton({ children, href, onClick, variant = 'primary', type = 'button' }) {
    const map = {
        primary: 'bg-black text-white border-black hover:bg-neutral-800',
        secondary: 'bg-white text-black border-[#ccc] hover:bg-[#f5f5f5]',
        danger: 'bg-white text-red-600 border-red-200 hover:bg-red-50',
        ghost: 'bg-transparent text-neutral-500 border-transparent hover:text-black',
    };
    const base = 'inline-flex items-center justify-center px-4 py-2 text-[10px] font-bold uppercase tracking-widest border transition-colors duration-200';
    if (href) {
        return (
            <Link href={href} className={`${base} ${map[variant]}`}>
                {children}
            </Link>
        );
    }
    return (
        <button type={type} onClick={onClick} className={`${base} ${map[variant]}`}>
            {children}
        </button>
    );
}

function StatusBadge({ status, label }) {
    const map = {
        menunggu_persetujuan: 'bg-[#f5f5f5] text-neutral-900 border-[#e5e5e5]',
        disetujui: 'bg-black text-white border-black',
        ditolak: 'bg-white text-red-600 border-red-200',
        dibatalkan: 'bg-white text-neutral-500 border-[#e5e5e5]',
    };
    return (
        <span className={`inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-widest border ${map[status] || map.menunggu_persetujuan}`}>
            {label || status}
        </span>
    );
}

function HariBadge({ hari }) {
    return (
        <span className="inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-widest bg-[#f5f5f5] border border-[#e5e5e5] text-neutral-900">
            {hari}
        </span>
    );
}

function DetailItem({ label, children }) {
    return (
        <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1.5">{label}</label>
            <div className="text-sm text-neutral-900">{children}</div>
        </div>
    );
}

function StatCard({ label, value }) {
    return (
        <div className="p-4 bg-[#f5f5f5] border border-[#e5e5e5]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">{label}</p>
            <p className="text-2xl font-bold text-neutral-900">{value}</p>
        </div>
    );
}

export default function Show({ mahasiswa, periodeKrs, krsData, totalSks }) {
    const handleApprove = (krsId, catatan = '') => {
        if (confirm('Yakin ingin menyetujui KRS ini?')) {
            router.patch(`/admin/krs/${krsId}/approve`, {
                catatan_admin: catatan
            });
        }
    };

    const handleReject = (krsId, catatan) => {
        if (!catatan.trim()) {
            alert('Catatan penolakan wajib diisi');
            return;
        }

        if (confirm('Yakin ingin menolak KRS ini?')) {
            router.patch(`/admin/krs/${krsId}/reject`, {
                catatan_admin: catatan
            });
        }
    };

    return (
        <AdminLayout title={`KRS - ${mahasiswa.nama_lengkap}`}>
            <Head title={`KRS - ${mahasiswa.nama_lengkap}`} />

            <div className="p-6 lg:p-8 min-h-dvh bg-[#fafafa]">
                <Box variant="black" className="mb-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/75 mb-1">Manajemen KRS</p>
                            <h1 className="text-xl font-bold uppercase tracking-tight text-white">Detail KRS Mahasiswa</h1>
                        </div>
                        <ActionButton href={route('admin.krs.index')} variant="secondary">← Kembali ke Daftar KRS</ActionButton>
                    </div>
                </Box>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Box>
                        <SectionTitle>Informasi Mahasiswa</SectionTitle>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <DetailItem label="Nama Lengkap">
                                <p className="text-lg font-bold text-neutral-900">{mahasiswa.nama_lengkap}</p>
                            </DetailItem>
                            <DetailItem label="NIM">{mahasiswa.nim}</DetailItem>
                            <DetailItem label="Program Studi">
                                {mahasiswa.prodi ? `${mahasiswa.prodi.kode_prodi} - ${mahasiswa.prodi.nama_prodi}` : mahasiswa.program_studi}
                            </DetailItem>
                            <DetailItem label="Email">{mahasiswa.user.email}</DetailItem>
                        </div>
                    </Box>

                    <Box>
                        <SectionTitle>Periode KRS</SectionTitle>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <DetailItem label="Periode">
                                <p className="text-lg font-bold text-neutral-900">{periodeKrs.nama_periode}</p>
                            </DetailItem>
                            <DetailItem label="Tahun Ajaran">{periodeKrs.tahun_ajaran.tahun}</DetailItem>
                            <DetailItem label="Semester">{periodeKrs.semester.nama_semester}</DetailItem>
                        </div>
                    </Box>
                </div>

                <Box className="mt-6">
                    <SectionTitle>Ringkasan KRS</SectionTitle>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <StatCard label="Total Mata Kuliah" value={krsData.length} />
                        <StatCard label="Total SKS Disetujui" value={totalSks} />
                        <StatCard label="Menunggu Persetujuan" value={krsData.filter(krs => krs.status === 'menunggu_persetujuan').length} />
                        <StatCard label="Ditolak" value={krsData.filter(krs => krs.status === 'ditolak').length} />
                    </div>
                </Box>

                <Box className="mt-6">
                    <SectionTitle>Detail KRS</SectionTitle>

                    {krsData.length === 0 ? (
                        <div className="text-center py-10 border border-[#e5e5e5] bg-[#fafafa]">
                            <p className="text-sm font-bold uppercase tracking-widest text-neutral-900 mb-1">Belum ada mata kuliah</p>
                            <p className="text-xs text-neutral-500">Mahasiswa belum mengambil mata kuliah untuk periode ini.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full border border-[#e5e5e5] table-cards">
                                <thead className="bg-[#f5f5f5]">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500 border-b border-[#e5e5e5]">Mata Kuliah</th>
                                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500 border-b border-[#e5e5e5]">Dosen</th>
                                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500 border-b border-[#e5e5e5]">Jadwal</th>
                                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500 border-b border-[#e5e5e5]">SKS</th>
                                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500 border-b border-[#e5e5e5]">Status</th>
                                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500 border-b border-[#e5e5e5]">Tanggal</th>
                                        <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-neutral-500 border-b border-[#e5e5e5]">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-[#e5e5e5]">
                                    {krsData.map((krs) => (
                                        <tr key={krs.id} className="hover:bg-[#fafafa]">
                                            <td data-label="Mata Kuliah" className="px-4 py-3 text-sm text-neutral-900">
                                                <p className="font-bold">{krs.jadwal_kuliah.mata_kuliah.nama_mata_kuliah}</p>
                                                <p className="text-xs text-neutral-500">{krs.jadwal_kuliah.mata_kuliah.kode_mata_kuliah}</p>
                                            </td>
                                            <td data-label="Dosen" className="px-4 py-3 text-sm text-neutral-900">{krs.jadwal_kuliah.dosen.nama_lengkap}</td>
                                            <td data-label="Jadwal" className="px-4 py-3 text-sm text-neutral-900">
                                                <HariBadge hari={krs.jadwal_kuliah.hari} />
                                                <div className="text-xs text-neutral-500 mt-1">{krs.jadwal_kuliah.jam_mulai} - {krs.jadwal_kuliah.jam_selesai}</div>
                                                <div className="text-xs text-neutral-500">Ruang: {krs.jadwal_kuliah.ruangan}</div>
                                            </td>
                                            <td data-label="SKS" className="px-4 py-3 text-sm text-neutral-900">{krs.jadwal_kuliah.mata_kuliah.sks} SKS</td>
                                            <td data-label="Status" className="px-4 py-3 text-sm text-neutral-900">
                                                <StatusBadge status={krs.status} label={krs.status_display} />
                                                {krs.catatan_admin && <div className="text-xs text-neutral-500 mt-1">Catatan: {krs.catatan_admin}</div>}
                                                {krs.approved_by && <div className="text-xs text-neutral-500 mt-1">Oleh: {krs.approved_by.name}</div>}
                                            </td>
                                            <td data-label="Tanggal" className="px-4 py-3 text-sm text-neutral-500">
                                                <div>Pengajuan: {new Date(krs.created_at).toLocaleDateString('id-ID')}</div>
                                                {krs.tanggal_approval && <div>Approval: {new Date(krs.tanggal_approval).toLocaleDateString('id-ID')}</div>}
                                            </td>
                                            <td data-label="Aksi" className="px-4 py-3 text-right">
                                                {krs.status === 'menunggu_persetujuan' && (
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => handleApprove(krs.id)} className="text-xs font-bold uppercase tracking-widest text-neutral-900 hover:text-neutral-600 underline">Setujui</button>
                                                        <button onClick={() => { const catatan = prompt('Masukkan alasan penolakan:'); if (catatan) handleReject(krs.id, catatan); }} className="text-xs font-bold uppercase tracking-widest text-red-600 hover:text-red-800 underline">Tolak</button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Box>
            </div>
        </AdminLayout>
    );
}
