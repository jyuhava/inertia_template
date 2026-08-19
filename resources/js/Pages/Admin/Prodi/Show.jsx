import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';

function Box({ children, className = '', padded = true, variant = 'white' }) {
    const variants = {
        white: 'bg-white border-[#e5e5e5]',
        black: 'bg-black border-black text-white',
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

function StatusBadge({ status }) {
    const map = {
        aktif: 'bg-black text-white border-black',
        nonaktif: 'bg-white text-red-600 border-red-200',
    };
    return (
        <span className={`inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-widest border ${map[status] || map.nonaktif}`}>
            {status === 'aktif' ? 'Aktif' : 'Nonaktif'}
        </span>
    );
}

function JenjangBadge({ jenjang }) {
    return (
        <span className="inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-widest bg-[#f5f5f5] border border-[#e5e5e5] text-neutral-900">
            {jenjang}
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

export default function Show({ prodi }) {
    return (
        <AdminLayout title="Detail Program Studi">
            <Head title="Detail Program Studi" />

            <div className="p-6 lg:p-8 min-h-screen bg-[#fafafa]">
                <Box variant="black" className="mb-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-400 mb-1">Manajemen Akademik</p>
                            <h1 className="text-xl font-bold uppercase tracking-tight text-white">Detail Program Studi</h1>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <ActionButton href={route('admin.prodi.edit', prodi.id)} variant="secondary">Edit</ActionButton>
                            <ActionButton href={route('admin.prodi.index')} variant="ghost">Kembali</ActionButton>
                        </div>
                    </div>
                </Box>

                <Box>
                    <SectionTitle>Informasi Program Studi</SectionTitle>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <DetailItem label="Kode Program Studi">
                                <p className="text-lg font-bold text-neutral-900">{prodi.kode_prodi}</p>
                            </DetailItem>

                            <DetailItem label="Nama Program Studi">
                                {prodi.nama_prodi}
                            </DetailItem>

                            <DetailItem label="Jenjang">
                                <JenjangBadge jenjang={prodi.jenjang} />
                            </DetailItem>

                            <DetailItem label="Status">
                                <StatusBadge status={prodi.status} />
                            </DetailItem>
                        </div>

                        <div className="space-y-4">
                            <DetailItem label="Jumlah Mahasiswa">
                                {prodi.mahasiswas_count} mahasiswa
                            </DetailItem>

                            <DetailItem label="Tanggal Dibuat">
                                {new Date(prodi.created_at).toLocaleDateString('id-ID', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </DetailItem>

                            <DetailItem label="Terakhir Diperbarui">
                                {new Date(prodi.updated_at).toLocaleDateString('id-ID', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </DetailItem>
                        </div>
                    </div>

                    {prodi.deskripsi && (
                        <div className="mt-6 pt-6 border-t border-[#e5e5e5]">
                            <DetailItem label="Deskripsi">
                                <div className="p-4 bg-[#f5f5f5] border border-[#e5e5e5] text-neutral-700 whitespace-pre-wrap">
                                    {prodi.deskripsi}
                                </div>
                            </DetailItem>
                        </div>
                    )}
                </Box>
            </div>
        </AdminLayout>
    );
}
