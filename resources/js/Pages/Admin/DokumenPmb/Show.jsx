import { Head, Link } from '@inertiajs/react';
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

function StatusBadge({ aktif }) {
    const map = {
        true: 'bg-black text-white border-black',
        false: 'bg-white text-red-600 border-red-200',
    };
    return (
        <span className={`inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-widest border ${map[aktif] || map.false}`}>
            {aktif ? 'Aktif' : 'Nonaktif'}
        </span>
    );
}

function WajibBadge({ wajib }) {
    return (
        <span className={`inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-widest border ${wajib ? 'bg-white text-red-600 border-red-200' : 'bg-[#f5f5f5] text-neutral-900 border-[#e5e5e5]'}`}>
            {wajib ? 'Wajib' : 'Opsional'}
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
        <div className="p-4 bg-[#f5f5f5] border border-[#e5e5e5] text-center">
            <p className="text-2xl font-bold text-neutral-900">{value}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mt-1">{label}</p>
        </div>
    );
}

export default function Show({ dokumenPmb }) {
    return (
        <AdminLayout title="Detail Dokumen PMB">
            <Head title="Detail Dokumen PMB" />

            <div className="p-6 lg:p-8 min-h-dvh bg-[#fafafa]">
                <Box variant="black" className="mb-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/75 mb-1">Manajemen PMB</p>
                            <h1 className="text-xl font-bold uppercase tracking-tight text-white">Detail Dokumen PMB</h1>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <ActionButton href={route('admin.dokumen-pmb.edit', dokumenPmb.id)} variant="secondary">Edit</ActionButton>
                            <ActionButton href={route('admin.dokumen-pmb.index')} variant="ghost">Kembali</ActionButton>
                        </div>
                    </div>
                </Box>

                <Box>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <h2 className="text-lg font-bold text-neutral-900">{dokumenPmb.nama_dokumen}</h2>
                        <div className="flex items-center gap-2">
                            <WajibBadge wajib={dokumenPmb.wajib} />
                            <StatusBadge aktif={dokumenPmb.aktif} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <DetailItem label="Kode Dokumen">
                            <code className="inline-block px-2 py-1 bg-[#f5f5f5] border border-[#e5e5e5] text-xs font-mono text-neutral-900">
                                {dokumenPmb.kode_dokumen}
                            </code>
                        </DetailItem>

                        <DetailItem label="Jenis File">
                            {dokumenPmb.jenis_file.toUpperCase()}
                        </DetailItem>

                        <DetailItem label="Ukuran Maksimal">
                            {dokumenPmb.max_size_mb} MB
                        </DetailItem>

                        <DetailItem label="Urutan">
                            {dokumenPmb.urutan}
                        </DetailItem>

                        <DetailItem label="Jumlah Upload">
                            {dokumenPmb.upload_dokumen_count || 0} file
                        </DetailItem>

                        <DetailItem label="Dibuat">
                            {new Date(dokumenPmb.created_at).toLocaleDateString('id-ID')}
                        </DetailItem>
                    </div>

                    {dokumenPmb.deskripsi && (
                        <div className="mt-6 pt-6 border-t border-[#e5e5e5]">
                            <DetailItem label="Deskripsi">
                                <div className="p-4 bg-[#f5f5f5] border border-[#e5e5e5] text-sm text-neutral-700 whitespace-pre-wrap">
                                    {dokumenPmb.deskripsi}
                                </div>
                            </DetailItem>
                        </div>
                    )}
                </Box>

                {dokumenPmb.upload_dokumen_count > 0 && (
                    <Box className="mt-6">
                        <SectionTitle>Statistik Upload</SectionTitle>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <StatCard label="Total Upload" value={dokumenPmb.upload_stats?.total || 0} />
                            <StatCard label="Disetujui" value={dokumenPmb.upload_stats?.approved || 0} />
                            <StatCard label="Pending" value={dokumenPmb.upload_stats?.pending || 0} />
                            <StatCard label="Ditolak" value={dokumenPmb.upload_stats?.rejected || 0} />
                        </div>
                    </Box>
                )}
            </div>
        </AdminLayout>
    );
}
