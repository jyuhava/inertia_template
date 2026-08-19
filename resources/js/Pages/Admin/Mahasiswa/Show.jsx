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
        lulus: 'bg-[#f5f5f5] text-neutral-900 border-[#e5e5e5]',
    };
    return (
        <span className={`inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-widest border ${map[status] || map.nonaktif}`}>
            {label || status}
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

function KomitmenBox({ hasUploadedKomitmen, mahasiswa, komitmenUrl }) {
    if (hasUploadedKomitmen) {
        return (
            <div className="p-4 bg-[#f5f5f5] border border-[#e5e5e5]">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-neutral-900"></div>
                    <p className="text-sm font-bold text-neutral-900">Surat komitmen sudah diupload</p>
                </div>
                {mahasiswa.komitmen_uploaded_at && (
                    <p className="text-xs text-neutral-500 mb-3">
                        Upload: {new Date(mahasiswa.komitmen_uploaded_at).toLocaleDateString('id-ID', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </p>
                )}
                {komitmenUrl && (
                    <div className="flex items-center gap-2 flex-wrap">
                        <a href={komitmenUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-black text-white border border-black hover:bg-neutral-800 transition-colors">
                            Lihat File
                        </a>
                        <a href={komitmenUrl} download className="inline-flex items-center px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-white text-black border border-[#ccc] hover:bg-[#f5f5f5] transition-colors">
                            Download
                        </a>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="p-4 bg-white border border-red-200">
            <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-red-500"></div>
                <p className="text-sm font-bold text-red-600">Surat komitmen belum diupload</p>
            </div>
            <p className="text-xs text-neutral-500">Mahasiswa belum dapat mengakses fitur akademik.</p>
        </div>
    );
}

export default function Show({ mahasiswa, hasUploadedKomitmen, komitmenUrl }) {
    return (
        <AdminLayout title="Detail Mahasiswa">
            <Head title="Detail Mahasiswa" />

            <div className="p-6 lg:p-8 min-h-screen bg-[#fafafa]">
                <Box variant="black" className="mb-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-400 mb-1">Manajemen Mahasiswa</p>
                            <h1 className="text-xl font-bold uppercase tracking-tight text-white">Detail Mahasiswa</h1>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <ActionButton href={route('admin.mahasiswa.edit', mahasiswa.id)} variant="secondary">Edit</ActionButton>
                            <ActionButton href={route('admin.user-management.reset-password.form', mahasiswa.user.id)} variant="danger">Reset Password</ActionButton>
                            <ActionButton href={route('admin.mahasiswa.index')} variant="ghost">Kembali</ActionButton>
                        </div>
                    </div>
                </Box>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Box>
                        <SectionTitle>Informasi Akademik</SectionTitle>
                        <div className="space-y-4">
                            <DetailItem label="NIM">
                                <p className="text-lg font-bold text-neutral-900">{mahasiswa.nim}</p>
                            </DetailItem>

                            <DetailItem label="Nama Lengkap">
                                {mahasiswa.nama_lengkap}
                            </DetailItem>

                            <DetailItem label="Program Studi">
                                {mahasiswa.prodi ? `${mahasiswa.prodi.kode_prodi} - ${mahasiswa.prodi.nama_prodi} (${mahasiswa.prodi.jenjang})` : mahasiswa.program_studi}
                            </DetailItem>

                            <DetailItem label="Angkatan">
                                {mahasiswa.angkatan}
                            </DetailItem>

                            <DetailItem label="Status">
                                <StatusBadge status={mahasiswa.status} label={mahasiswa.status_display} />
                            </DetailItem>
                        </div>
                    </Box>

                    <Box>
                        <SectionTitle>Informasi Pribadi</SectionTitle>
                        <div className="space-y-4">
                            <DetailItem label="Jenis Kelamin">
                                {mahasiswa.jenis_kelamin === 'L' ? 'Laki-laki' : mahasiswa.jenis_kelamin === 'P' ? 'Perempuan' : mahasiswa.jenis_kelamin}
                            </DetailItem>

                            <DetailItem label="Tempat Lahir">
                                {mahasiswa.tempat_lahir}
                            </DetailItem>

                            <DetailItem label="Tanggal Lahir">
                                {new Date(mahasiswa.tanggal_lahir).toLocaleDateString('id-ID', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </DetailItem>

                            <DetailItem label="No. HP">
                                {mahasiswa.no_hp}
                            </DetailItem>

                            <DetailItem label="Email">
                                {mahasiswa.user.email}
                            </DetailItem>
                        </div>
                    </Box>
                </div>

                <Box className="mt-6">
                    <SectionTitle>Alamat</SectionTitle>
                    <div className="p-4 bg-[#f5f5f5] border border-[#e5e5e5] text-sm text-neutral-900 whitespace-pre-line">
                        {mahasiswa.alamat}
                    </div>
                </Box>

                <Box className="mt-6">
                    <SectionTitle>Surat Komitmen</SectionTitle>
                    <KomitmenBox hasUploadedKomitmen={hasUploadedKomitmen} mahasiswa={mahasiswa} komitmenUrl={komitmenUrl} />
                </Box>

                <Box className="mt-6">
                    <SectionTitle>Informasi Sistem</SectionTitle>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <DetailItem label="Dibuat pada">
                            {new Date(mahasiswa.created_at).toLocaleDateString('id-ID', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </DetailItem>

                        <DetailItem label="Terakhir diperbarui">
                            {new Date(mahasiswa.updated_at).toLocaleDateString('id-ID', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </DetailItem>

                        <DetailItem label="ID User">
                            {mahasiswa.user_id}
                        </DetailItem>
                    </div>
                </Box>
            </div>
        </AdminLayout>
    );
}
