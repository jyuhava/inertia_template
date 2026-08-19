import { Head } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';

const brown = {
    50: '#fbf7f3',
    100: '#f5ebe0',
    200: '#e8d4c2',
    300: '#d4b394',
    400: '#b88962',
    500: '#9e6b42',
    600: '#7f4f2e',
    700: '#633d25',
    800: '#4f311f',
    900: '#3f281b',
    950: '#22130d',
};

function PixelDivider({ flip = false, className = '' }) {
    const pattern = [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1],
        [1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1],
        [1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1],
        [1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1],
        [1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1],
        [1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1],
        [1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1],
        [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ];
    return (
        <div className={`flex ${flip ? 'rotate-180' : ''} ${className}`}>
            {pattern.map((row, i) => (
                <div key={i} className="flex flex-col">
                    {row.map((cell, j) => (
                        <div
                            key={j}
                            className="h-2 w-2 sm:h-3 sm:w-3"
                            style={{ backgroundColor: cell ? brown[950] : 'transparent' }}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
}

export default function Status({ calonMahasiswa }) {
    const getStatusBadge = (status) => {
        const badges = {
            draft: { border: 'border-[#d4b394]', bg: 'bg-[#f5ebe0]', text: 'text-[#633d25]', label: 'Draft' },
            submitted: { border: 'border-[#7f4f2e]', bg: 'bg-[#7f4f2e]', text: 'text-white', label: 'Disubmit' },
            verified: { border: 'border-[#d4b394]', bg: 'bg-[#d4b394]', text: 'text-[#22130d]', label: 'Diverifikasi' },
            accepted: { border: 'border-[#7f4f2e]', bg: 'bg-[#7f4f2e]', text: 'text-white', label: 'Diterima' },
            rejected: { border: 'border-[#9e6b42]', bg: 'bg-[#9e6b42]', text: 'text-white', label: 'Ditolak' },
        };
        return badges[status] || badges.draft;
    };

    const getPembayaranBadge = (status) => {
        const badges = {
            unpaid: { border: 'border-[#9e6b42]', bg: 'bg-[#9e6b42]', text: 'text-white', label: 'Belum Bayar' },
            pending: { border: 'border-[#d4b394]', bg: 'bg-[#d4b394]', text: 'text-[#22130d]', label: 'Pending' },
            paid: { border: 'border-[#7f4f2e]', bg: 'bg-[#7f4f2e]', text: 'text-white', label: 'Sudah Bayar' },
            expired: { border: 'border-[#d4b394]', bg: 'bg-[#f5ebe0]', text: 'text-[#633d25]', label: 'Expired' },
        };
        return badges[status] || badges.unpaid;
    };

    const getBerkasBadge = (status) => {
        const badges = {
            incomplete: { border: 'border-[#9e6b42]', bg: 'bg-[#9e6b42]', text: 'text-white', label: 'Belum Lengkap' },
            complete: { border: 'border-[#7f4f2e]', bg: 'bg-[#7f4f2e]', text: 'text-white', label: 'Lengkap' },
            verified: { border: 'border-[#7f4f2e]', bg: 'bg-[#7f4f2e]', text: 'text-white', label: 'Terverifikasi' },
            revision: { border: 'border-[#d4b394]', bg: 'bg-[#d4b394]', text: 'text-[#22130d]', label: 'Perlu Revisi' },
        };
        return badges[status] || badges.incomplete;
    };

    const statusPendaftaran = getStatusBadge(calonMahasiswa.status_pendaftaran);
    const statusPembayaran = getPembayaranBadge(calonMahasiswa.status_pembayaran);
    const statusBerkas = getBerkasBadge(calonMahasiswa.status_berkas);

    return (
        <GuestLayout>
            <Head title="Status Pendaftaran" />

            <div className="min-h-screen bg-[#f5f0eb] py-12">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <span className="inline-block border border-[#7f4f2e] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#7f4f2e]">
                            Penerimaan Mahasiswa Baru
                        </span>
                        <h1 className="mt-4 text-3xl font-bold text-[#22130d]">Status Pendaftaran PMB</h1>
                        <p className="mt-2 text-lg text-[#7f4f2e]">{calonMahasiswa.periode_pmb.nama_periode}</p>
                    </div>

                    <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
                        <div className="border border-[#e8d4c2] bg-white p-6 text-center">
                            <h3 className="mb-3 text-lg font-semibold text-[#22130d]">Status Pendaftaran</h3>
                            <span className={`inline-flex items-center border px-3 py-1 text-sm font-medium ${statusPendaftaran.border} ${statusPendaftaran.bg} ${statusPendaftaran.text}`}>
                                {statusPendaftaran.label}
                            </span>
                        </div>

                        <div className="border border-[#e8d4c2] bg-white p-6 text-center">
                            <h3 className="mb-3 text-lg font-semibold text-[#22130d]">Status Pembayaran</h3>
                            <span className={`inline-flex items-center border px-3 py-1 text-sm font-medium ${statusPembayaran.border} ${statusPembayaran.bg} ${statusPembayaran.text}`}>
                                {statusPembayaran.label}
                            </span>
                        </div>

                        <div className="border border-[#e8d4c2] bg-white p-6 text-center">
                            <h3 className="mb-3 text-lg font-semibold text-[#22130d]">Status Berkas</h3>
                            <span className={`inline-flex items-center border px-3 py-1 text-sm font-medium ${statusBerkas.border} ${statusBerkas.bg} ${statusBerkas.text}`}>
                                {statusBerkas.label}
                            </span>
                        </div>
                    </div>

                    <div className="mt-8 overflow-hidden border border-[#e8d4c2] bg-white shadow-sm">
                        <div className="relative bg-[#22130d] px-6 py-4">
                            <PixelDivider className="absolute -left-3 top-0 opacity-20" />
                            <PixelDivider flip className="absolute -right-3 bottom-0 opacity-20" />
                            <h2 className="relative text-lg font-semibold text-white">Informasi Pendaftar</h2>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div>
                                    <h3 className="mb-4 text-lg font-semibold text-[#22130d]">Data Pribadi</h3>
                                    <dl className="space-y-3">
                                        <div>
                                            <dt className="text-xs font-semibold uppercase tracking-wider text-[#633d25]">Nomor Pendaftaran</dt>
                                            <dd className="text-lg font-semibold text-[#7f4f2e]">{calonMahasiswa.no_pendaftaran}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs font-semibold uppercase tracking-wider text-[#633d25]">Nama Lengkap</dt>
                                            <dd className="text-[#22130d]">{calonMahasiswa.nama_lengkap}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs font-semibold uppercase tracking-wider text-[#633d25]">NIK</dt>
                                            <dd className="text-[#22130d]">{calonMahasiswa.nik}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs font-semibold uppercase tracking-wider text-[#633d25]">Email</dt>
                                            <dd className="text-[#22130d]">{calonMahasiswa.email}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs font-semibold uppercase tracking-wider text-[#633d25]">No. HP</dt>
                                            <dd className="text-[#22130d]">{calonMahasiswa.no_hp}</dd>
                                        </div>
                                    </dl>
                                </div>

                                <div>
                                    <h3 className="mb-4 text-lg font-semibold text-[#22130d]">Pilihan Program Studi</h3>
                                    <dl className="space-y-3">
                                        <div>
                                            <dt className="text-xs font-semibold uppercase tracking-wider text-[#633d25]">Pilihan 1</dt>
                                            <dd className="text-[#22130d]">
                                                {calonMahasiswa.prodi_pilihan_1?.nama_prodi} ({calonMahasiswa.prodi_pilihan_1?.jenjang})
                                            </dd>
                                        </div>
                                        {calonMahasiswa.prodi_pilihan_2 && (
                                            <div>
                                                <dt className="text-xs font-semibold uppercase tracking-wider text-[#633d25]">Pilihan 2</dt>
                                                <dd className="text-[#22130d]">
                                                    {calonMahasiswa.prodi_pilihan_2?.nama_prodi} ({calonMahasiswa.prodi_pilihan_2?.jenjang})
                                                </dd>
                                            </div>
                                        )}
                                        <div>
                                            <dt className="text-xs font-semibold uppercase tracking-wider text-[#633d25]">Tanggal Daftar</dt>
                                            <dd className="text-[#22130d]">
                                                {calonMahasiswa.tanggal_daftar ?
                                                    new Date(calonMahasiswa.tanggal_daftar).toLocaleDateString('id-ID') :
                                                    '-'
                                                }
                                            </dd>
                                        </div>
                                        {calonMahasiswa.tanggal_verifikasi && (
                                            <div>
                                                <dt className="text-xs font-semibold uppercase tracking-wider text-[#633d25]">Tanggal Verifikasi</dt>
                                                <dd className="text-[#22130d]">
                                                    {new Date(calonMahasiswa.tanggal_verifikasi).toLocaleDateString('id-ID')}
                                                </dd>
                                            </div>
                                        )}
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    {calonMahasiswa.catatan_admin && (
                        <div className="mt-8 border border-[#e8d4c2] bg-white p-6">
                            <h3 className="mb-3 text-lg font-semibold text-[#22130d]">Catatan dari Admin</h3>
                            <div className="border border-[#e8d4c2] bg-[#fbf7f3] p-4">
                                <p className="text-[#633d25]">{calonMahasiswa.catatan_admin}</p>
                            </div>
                        </div>
                    )}

                    <div className="mt-8 border border-[#e8d4c2] bg-white p-6">
                        <h3 className="mb-4 text-lg font-semibold text-[#22130d]">Langkah Selanjutnya</h3>
                        <div className="space-y-3">
                            {calonMahasiswa.status_pendaftaran === 'draft' && (
                                <div className="flex items-start">
                                    <svg className="mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-[#7f4f2e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-[#633d25]">
                                        Lengkapi data dan upload dokumen yang diperlukan, kemudian submit pendaftaran Anda.
                                    </p>
                                </div>
                            )}

                            {calonMahasiswa.status_pendaftaran === 'submitted' && (
                                <div className="flex items-start">
                                    <svg className="mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-[#7f4f2e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-[#633d25]">
                                        Pendaftaran Anda sedang dalam proses verifikasi. Silakan tunggu pengumuman selanjutnya.
                                    </p>
                                </div>
                            )}

                            {calonMahasiswa.status_pendaftaran === 'verified' && (
                                <div className="flex items-start">
                                    <svg className="mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-[#7f4f2e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-[#633d25]">
                                        Selamat! Data Anda telah terverifikasi. Silakan tunggu pengumuman hasil seleksi.
                                    </p>
                                </div>
                            )}

                            {calonMahasiswa.status_pendaftaran === 'accepted' && (
                                <div className="flex items-start">
                                    <svg className="mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-[#7f4f2e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="font-semibold text-[#7f4f2e]">
                                        Selamat! Anda diterima sebagai mahasiswa baru. Silakan lakukan registrasi ulang sesuai jadwal yang ditentukan.
                                    </p>
                                </div>
                            )}

                            {calonMahasiswa.status_pendaftaran === 'rejected' && (
                                <div className="flex items-start">
                                    <svg className="mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-[#9e6b42]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    <p className="text-[#633d25]">
                                        Mohon maaf, pendaftaran Anda belum berhasil kali ini. Tetap semangat dan coba lagi di periode selanjutnya.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-8 text-center">
                        <a
                            href={route('pmb.index')}
                            className="inline-flex items-center border border-[#7f4f2e] bg-[#7f4f2e] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#633d25]"
                        >
                            ← Kembali ke Halaman PMB
                        </a>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
