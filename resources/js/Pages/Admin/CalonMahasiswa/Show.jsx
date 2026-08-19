import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import TextAreaInput from '@/Components/TextAreaInput';
import InputError from '@/Components/InputError';

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
        draft: 'bg-[#f5f5f5] text-neutral-900 border-[#e5e5e5]',
        submitted: 'bg-white text-neutral-900 border-[#e5e5e5]',
        verified: 'bg-[#f5f5f5] text-neutral-900 border-[#e5e5e5]',
        accepted: 'bg-black text-white border-black',
        rejected: 'bg-white text-red-600 border-red-200',
    };
    return (
        <span className={`inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-widest border ${map[status] || map.draft}`}>
            {label || status}
        </span>
    );
}

function BerkasBadge({ status, label }) {
    const map = {
        incomplete: 'bg-white text-red-600 border-red-200',
        complete: 'bg-[#f5f5f5] text-neutral-900 border-[#e5e5e5]',
        verified: 'bg-black text-white border-black',
        revision: 'bg-white text-neutral-900 border-[#e5e5e5]',
    };
    return (
        <span className={`inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-widest border ${map[status] || map.incomplete}`}>
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

function StatCard({ label, value, note }) {
    return (
        <div className="p-4 bg-[#f5f5f5] border border-[#e5e5e5]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">{label}</p>
            <p className="text-2xl font-bold text-neutral-900">{value}</p>
            {note && <p className="text-xs text-neutral-500 mt-1">{note}</p>}
        </div>
    );
}

const statusLabels = {
    draft: 'Draft',
    submitted: 'Disubmit',
    verified: 'Diverifikasi',
    accepted: 'Diterima',
    rejected: 'Ditolak',
};

const berkasLabels = {
    incomplete: 'Belum Lengkap',
    complete: 'Lengkap',
    verified: 'Terverifikasi',
    revision: 'Perlu Revisi',
};

export default function Show({ calonMahasiswa, dokumenUploads, totalDokumenWajib, dokumenUploadedWajib }) {
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [showConvertModal, setShowConvertModal] = useState(false);

    const { data, setData, put, processing, errors } = useForm({
        status_pendaftaran: calonMahasiswa.status_pendaftaran,
        status_berkas: calonMahasiswa.status_berkas,
        catatan_admin: calonMahasiswa.catatan_admin || '',
    });

    const { post: convertToMahasiswa, processing: converting } = useForm();

    const handleUpdateStatus = (e) => {
        e.preventDefault();
        put(route('admin.calon-mahasiswa.update-status', calonMahasiswa.id), {
            onSuccess: () => setShowStatusModal(false),
        });
    };

    const handleConvert = () => {
        convertToMahasiswa(route('admin.calon-mahasiswa.convert', calonMahasiswa.id), {
            onSuccess: () => setShowConvertModal(false),
        });
    };

    return (
        <AdminLayout title="Detail Calon Mahasiswa">
            <Head title="Detail Calon Mahasiswa" />

            <div className="p-6 lg:p-8 min-h-screen bg-[#fafafa]">
                <Box variant="black" className="mb-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-400 mb-1">Manajemen PMB</p>
                            <h1 className="text-xl font-bold uppercase tracking-tight text-white">{calonMahasiswa.nama_lengkap}</h1>
                            <p className="text-xs text-neutral-400 mt-1">No. Pendaftaran: {calonMahasiswa.no_pendaftaran}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <ActionButton onClick={() => setShowStatusModal(true)} variant="secondary">Update Status</ActionButton>
                            {calonMahasiswa.status_pendaftaran === 'accepted' && !calonMahasiswa.converted_to_mahasiswa && (
                                <ActionButton onClick={() => setShowConvertModal(true)} variant="primary">Convert ke Mahasiswa</ActionButton>
                            )}
                            <ActionButton href={route('admin.calon-mahasiswa.index')} variant="ghost">Kembali</ActionButton>
                        </div>
                    </div>
                </Box>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                    <StatCard
                        label="Status Pendaftaran"
                        value={<StatusBadge status={calonMahasiswa.status_pendaftaran} label={statusLabels[calonMahasiswa.status_pendaftaran]} />}
                        note={calonMahasiswa.tanggal_verifikasi ? `Diverifikasi: ${new Date(calonMahasiswa.tanggal_verifikasi).toLocaleDateString('id-ID')}` : null}
                    />
                    <StatCard
                        label="Status Berkas"
                        value={<BerkasBadge status={calonMahasiswa.status_berkas} label={berkasLabels[calonMahasiswa.status_berkas]} />}
                        note={`${dokumenUploadedWajib} dari ${totalDokumenWajib} dokumen wajib`}
                    />
                    <StatCard
                        label="Tanggal Daftar"
                        value={calonMahasiswa.tanggal_daftar ? new Date(calonMahasiswa.tanggal_daftar).toLocaleDateString('id-ID') : 'Belum submit'}
                        note={calonMahasiswa.converted_to_mahasiswa ? 'Sudah menjadi mahasiswa' : null}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Box>
                        <SectionTitle>Data Pribadi</SectionTitle>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <DetailItem label="Nama Lengkap">{calonMahasiswa.nama_lengkap}</DetailItem>
                            <DetailItem label="NIK">{calonMahasiswa.nik || 'Belum diisi'}</DetailItem>
                            <DetailItem label="Jenis Kelamin">{calonMahasiswa.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</DetailItem>
                            <DetailItem label="Tempat, Tanggal Lahir">
                                {calonMahasiswa.tempat_lahir && calonMahasiswa.tanggal_lahir
                                    ? `${calonMahasiswa.tempat_lahir}, ${new Date(calonMahasiswa.tanggal_lahir).toLocaleDateString('id-ID')}`
                                    : 'Belum diisi'}
                            </DetailItem>
                            <DetailItem label="Agama">{calonMahasiswa.agama || 'Belum diisi'}</DetailItem>
                            <DetailItem label="No. HP">{calonMahasiswa.no_hp || 'Belum diisi'}</DetailItem>
                            <DetailItem label="Email">{calonMahasiswa.email || 'Belum diisi'}</DetailItem>
                            <DetailItem label="Alamat">{calonMahasiswa.alamat || 'Belum diisi'}</DetailItem>
                        </div>
                    </Box>

                    <Box>
                        <SectionTitle>Data Orang Tua</SectionTitle>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <DetailItem label="Nama Ayah">{calonMahasiswa.nama_ayah || 'Belum diisi'}</DetailItem>
                            <DetailItem label="Pekerjaan Ayah">{calonMahasiswa.pekerjaan_ayah || 'Belum diisi'}</DetailItem>
                            <DetailItem label="Nama Ibu">{calonMahasiswa.nama_ibu || 'Belum diisi'}</DetailItem>
                            <DetailItem label="Pekerjaan Ibu">{calonMahasiswa.pekerjaan_ibu || 'Belum diisi'}</DetailItem>
                            <DetailItem label="No. HP Orang Tua">{calonMahasiswa.no_hp_ortu || 'Belum diisi'}</DetailItem>
                            {calonMahasiswa.alamat_ortu && (
                                <DetailItem label="Alamat Orang Tua">{calonMahasiswa.alamat_ortu}</DetailItem>
                            )}
                        </div>
                    </Box>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    <Box>
                        <SectionTitle>Data Pendidikan</SectionTitle>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <DetailItem label="Asal Sekolah">{calonMahasiswa.asal_sekolah || 'Belum diisi'}</DetailItem>
                            <DetailItem label="Tahun Lulus">{calonMahasiswa.tahun_lulus || 'Belum diisi'}</DetailItem>
                            {calonMahasiswa.jurusan_sekolah && <DetailItem label="Jurusan">{calonMahasiswa.jurusan_sekolah}</DetailItem>}
                            {calonMahasiswa.nilai_rata_rata && <DetailItem label="Nilai Rata-rata">{calonMahasiswa.nilai_rata_rata}</DetailItem>}
                        </div>
                    </Box>

                    <Box>
                        <SectionTitle>Pilihan Program Studi</SectionTitle>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <DetailItem label="Pilihan 1">
                                {calonMahasiswa.prodi_pilihan1?.nama_prodi
                                    ? `${calonMahasiswa.prodi_pilihan1.nama_prodi} (${calonMahasiswa.prodi_pilihan1.jenjang})`
                                    : 'Belum memilih'}
                            </DetailItem>
                            <DetailItem label="Pilihan 2">
                                {calonMahasiswa.prodi_pilihan2?.nama_prodi
                                    ? `${calonMahasiswa.prodi_pilihan2.nama_prodi} (${calonMahasiswa.prodi_pilihan2.jenjang})`
                                    : 'Tidak ada pilihan kedua'}
                            </DetailItem>
                        </div>
                    </Box>
                </div>

                <Box className="mt-6">
                    <SectionTitle>Dokumen Upload</SectionTitle>
                    <div className="overflow-x-auto">
                        <table className="min-w-full border border-[#e5e5e5]">
                            <thead className="bg-[#f5f5f5]">
                                <tr>
                                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500 border-b border-[#e5e5e5]">Dokumen</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500 border-b border-[#e5e5e5]">Status</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500 border-b border-[#e5e5e5]">Tanggal Upload</th>
                                    <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-neutral-500 border-b border-[#e5e5e5]">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-[#e5e5e5]">
                                {dokumenUploads.map((upload) => (
                                    <tr key={upload.id} className="hover:bg-[#fafafa]">
                                        <td className="px-4 py-3 text-sm text-neutral-900">
                                            <p className="font-bold">
                                                {upload.dokumen_pmb.nama_dokumen}
                                                {upload.dokumen_pmb.wajib && (
                                                    <span className="ml-2 inline-flex px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-white text-red-600 border border-red-200">Wajib</span>
                                                )}
                                            </p>
                                            <p className="text-xs text-neutral-500">{upload.original_name}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-widest border ${
                                                upload.status_verifikasi === 'approved' ? 'bg-black text-white border-black' :
                                                upload.status_verifikasi === 'rejected' ? 'bg-white text-red-600 border-red-200' :
                                                'bg-[#f5f5f5] text-neutral-900 border-[#e5e5e5]'
                                            }`}>
                                                {upload.status_verifikasi === 'approved' ? 'Disetujui' :
                                                 upload.status_verifikasi === 'rejected' ? 'Ditolak' : 'Pending'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-neutral-500">{new Date(upload.tanggal_upload).toLocaleDateString('id-ID')}</td>
                                        <td className="px-4 py-3 text-right">
                                            <a
                                                href={route('admin.calon-mahasiswa.download-dokumen', upload.id)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs font-bold uppercase tracking-widest text-neutral-900 hover:text-neutral-600 underline"
                                            >
                                                Download
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {dokumenUploads.length === 0 && (
                            <div className="text-center py-10 border border-[#e5e5e5] bg-[#fafafa] mt-0">
                                <p className="text-sm font-bold uppercase tracking-widest text-neutral-900 mb-1">Belum ada dokumen</p>
                                <p className="text-xs text-neutral-500">Calon mahasiswa belum mengupload dokumen.</p>
                            </div>
                        )}
                    </div>
                </Box>

                {calonMahasiswa.catatan_admin && (
                    <Box className="mt-6">
                        <SectionTitle>Catatan Admin</SectionTitle>
                        <div className="p-4 bg-[#f5f5f5] border border-[#e5e5e5] text-sm text-neutral-700 whitespace-pre-wrap">
                            {calonMahasiswa.catatan_admin}
                        </div>
                    </Box>
                )}
            </div>

            <Modal show={showStatusModal} onClose={() => setShowStatusModal(false)}>
                <form onSubmit={handleUpdateStatus} className="p-6 bg-white">
                    <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-900 mb-4">Update Status Calon Mahasiswa</h2>

                    <div className="space-y-4">
                        <div>
                            <InputLabel htmlFor="status_pendaftaran" value="Status Pendaftaran" />
                            <select
                                id="status_pendaftaran"
                                value={data.status_pendaftaran}
                                onChange={(e) => setData('status_pendaftaran', e.target.value)}
                                className="mt-1 block w-full border-[#e5e5e5] focus:border-black focus:ring-black text-sm"
                            >
                                <option value="draft">Draft</option>
                                <option value="submitted">Disubmit</option>
                                <option value="verified">Diverifikasi</option>
                                <option value="accepted">Diterima</option>
                                <option value="rejected">Ditolak</option>
                            </select>
                            <InputError message={errors.status_pendaftaran} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="status_berkas" value="Status Berkas" />
                            <select
                                id="status_berkas"
                                value={data.status_berkas}
                                onChange={(e) => setData('status_berkas', e.target.value)}
                                className="mt-1 block w-full border-[#e5e5e5] focus:border-black focus:ring-black text-sm"
                            >
                                <option value="incomplete">Belum Lengkap</option>
                                <option value="complete">Lengkap</option>
                                <option value="verified">Terverifikasi</option>
                                <option value="revision">Perlu Revisi</option>
                            </select>
                            <InputError message={errors.status_berkas} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="catatan_admin" value="Catatan" />
                            <TextAreaInput
                                id="catatan_admin"
                                value={data.catatan_admin}
                                onChange={(e) => setData('catatan_admin', e.target.value)}
                                className="mt-1 block w-full border-[#e5e5e5] focus:border-black focus:ring-black"
                                rows={3}
                                placeholder="Catatan untuk calon mahasiswa..."
                            />
                            <InputError message={errors.catatan_admin} className="mt-2" />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-2">
                        <ActionButton type="button" onClick={() => setShowStatusModal(false)} variant="secondary">Batal</ActionButton>
                        <ActionButton type="submit" variant="primary" disabled={processing}>{processing ? 'Menyimpan...' : 'Simpan'}</ActionButton>
                    </div>
                </form>
            </Modal>

            <Modal show={showConvertModal} onClose={() => setShowConvertModal(false)}>
                <div className="p-6 bg-white">
                    <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-900 mb-4">Convert ke Mahasiswa</h2>
                    <p className="text-sm text-neutral-700 mb-4">
                        Apakah Anda yakin ingin mengkonversi <strong>{calonMahasiswa.nama_lengkap}</strong> menjadi mahasiswa aktif? Proses ini akan membuat akun mahasiswa baru, generate NIM otomatis, dan data tidak dapat dikembalikan.
                    </p>
                    <div className="flex justify-end gap-2">
                        <ActionButton onClick={() => setShowConvertModal(false)} variant="secondary">Batal</ActionButton>
                        <ActionButton onClick={handleConvert} variant="primary" disabled={converting}>{converting ? 'Memproses...' : 'Ya, Convert'}</ActionButton>
                    </div>
                </div>
            </Modal>
        </AdminLayout>
    );
}
