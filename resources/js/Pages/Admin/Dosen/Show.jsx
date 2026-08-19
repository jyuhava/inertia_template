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

function StatusBadge({ status, label }) {
    const map = {
        aktif: 'bg-black text-white border-black',
        nonaktif: 'bg-white text-red-600 border-red-200',
        pensiun: 'bg-[#f5f5f5] text-neutral-600 border-[#e5e5e5]',
    };
    return (
        <span className={`inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-widest border ${map[status] || map.pensiun}`}>
            {label || status}
        </span>
    );
}

function JabatanBadge({ jabatan }) {
    return (
        <span className="inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-widest bg-[#f5f5f5] border border-[#e5e5e5] text-neutral-900">
            {jabatan || 'Belum ditentukan'}
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

export default function Show({ dosen }) {
    return (
        <AdminLayout title="Detail Dosen">
            <Head title="Detail Dosen" />

            <div className="p-6 lg:p-8 min-h-screen bg-[#fafafa]">
                <Box variant="black" className="mb-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-400 mb-1">Manajemen Dosen</p>
                            <h1 className="text-xl font-bold uppercase tracking-tight text-white">Detail Dosen</h1>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <ActionButton href={route('admin.dosen.edit', dosen.id)} variant="secondary">Edit</ActionButton>
                            <ActionButton href={route('admin.user-management.reset-password.form', dosen.user.id)} variant="danger">Reset Password</ActionButton>
                            <ActionButton href={route('admin.dosen.index')} variant="ghost">Kembali</ActionButton>
                        </div>
                    </div>
                </Box>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Box>
                        <SectionTitle>Informasi Akademik</SectionTitle>
                        <div className="space-y-4">
                            <DetailItem label="NIP">
                                <p className="text-lg font-bold text-neutral-900">{dosen.nip}</p>
                            </DetailItem>

                            <DetailItem label="Nama Lengkap">
                                {dosen.nama_lengkap}
                            </DetailItem>

                            <DetailItem label="Pendidikan Terakhir">
                                {dosen.pendidikan_terakhir}
                            </DetailItem>

                            <DetailItem label="Bidang Keahlian">
                                {dosen.bidang_keahlian}
                            </DetailItem>

                            <DetailItem label="Jabatan Akademik">
                                <JabatanBadge jabatan={dosen.jabatan_akademik} />
                            </DetailItem>

                            <DetailItem label="Status">
                                <StatusBadge status={dosen.status} label={dosen.status_display} />
                            </DetailItem>
                        </div>
                    </Box>

                    <Box>
                        <SectionTitle>Informasi Pribadi</SectionTitle>
                        <div className="space-y-4">
                            <DetailItem label="Jenis Kelamin">
                                {dosen.jenis_kelamin_display}
                            </DetailItem>

                            <DetailItem label="Tempat, Tanggal Lahir">
                                {dosen.tempat_lahir}, {new Date(dosen.tanggal_lahir).toLocaleDateString('id-ID', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </DetailItem>

                            <DetailItem label="Alamat">
                                {dosen.alamat}
                            </DetailItem>

                            <DetailItem label="No. HP">
                                {dosen.no_hp}
                            </DetailItem>

                            <DetailItem label="Email">
                                {dosen.user.email}
                            </DetailItem>

                            <DetailItem label="Tanggal Dibuat">
                                {new Date(dosen.created_at).toLocaleDateString('id-ID', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </DetailItem>

                            <DetailItem label="Terakhir Diperbarui">
                                {new Date(dosen.updated_at).toLocaleDateString('id-ID', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </DetailItem>
                        </div>
                    </Box>
                </div>
            </div>
        </AdminLayout>
    );
}
