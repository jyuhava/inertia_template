import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

function Box({ children, className = '', padded = true, variant = 'white' }) {
    const variants = {
        white: 'bg-white border border-neutral-200',
        black: 'bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 border-transparent text-white rounded-2xl shadow-lg shadow-violet-500/20',
        gray: 'bg-neutral-50 border border-neutral-200',
    };
    return (
        <div className={`${variants[variant] || variants.white} ${padded ? 'p-5' : ''} ${className}`}>
            {children}
        </div>
    );
}

function SectionTitle({ children, action }) {
    return (
        <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-900">{children}</h2>
            {action ? <div>{action}</div> : null}
        </div>
    );
}

function DetailItem({ label, children }) {
    return (
        <div>
            <dt className="text-xs font-bold uppercase tracking-widest text-neutral-500">{label}</dt>
            <dd className="mt-1 text-sm font-bold text-neutral-900">{children}</dd>
        </div>
    );
}

export default function Index({ mahasiswa, periodeAktif, totalSks, nomorSurat, tanggalHariIni }) {
    const [keperluan, setKeperluan] = useState('Persyaratan Kelengkapan Administrasi dan Akademik');

    const keperluanPilihan = [
        'Persyaratan Kelengkapan Administrasi dan Akademik',
        'Pengajuan Beasiswa',
        'Pengurusan Tunjangan Gaji Orang Tua (PNS / BUMN / Swasta)',
        'Pengurusan BPJS Kesehatan / Asuransi',
        'Pengurusan Paspor / Visa Studi',
        'Syarat Pendaftaran Magang / Program MBKM',
        'Syarat Mengikuti Perlombaan / Kejuaraan Akademik',
    ];

    const handlePrint = (e) => {
        e.preventDefault();
        const url = `/mahasiswa/surat-aktif/cetak?keperluan=${encodeURIComponent(keperluan)}`;
        window.open(url, '_blank');
    };

    const semesterName = periodeAktif?.semester?.nama_semester || periodeAktif?.semester?.nama || 'Semester';
    const tahunMulai = periodeAktif?.tahun_ajaran?.tahun_mulai || periodeAktif?.tahunAjaran?.tahun_mulai || '';
    const tahunSelesai = periodeAktif?.tahun_ajaran?.tahun_selesai || periodeAktif?.tahunAjaran?.tahun_selesai || '';
    const tahunLabel = tahunMulai && tahunSelesai ? `${tahunMulai}/${tahunSelesai}` : (periodeAktif?.tahunAjaran?.tahun || periodeAktif?.tahun_ajaran?.tahun || '-');

    return (
        <AdminLayout title="Surat Keterangan Mahasiswa Aktif">
            <Head title="Surat Keterangan Mahasiswa Aktif" />

            <div className="space-y-6">
                {/* Header Banner */}
                <Box variant="black" className="relative overflow-hidden">
                    <div className="absolute right-0 top-0 h-20 w-20 bg-white/10" />
                    <div className="relative flex flex-col justify-between gap-4 md:flex-row md:items-start">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-white/75">Layanan Dokumen Akademik</p>
                            <h1 className="mt-2 text-2xl font-bold md:text-3xl">Surat Keterangan Mahasiswa Aktif</h1>
                            <p className="mt-1 text-sm text-white/85">
                                Diterbitkan secara resmi oleh Sistem Informasi Akademik STIT Al-Wafi Bogor
                            </p>
                        </div>
                        <button
                            onClick={handlePrint}
                            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-neutral-900 shadow-sm transition hover:bg-white/85 active:scale-[0.98] cursor-pointer"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            Cetak / Download PDF
                        </button>
                    </div>
                </Box>

                {/* Status Ringkasan */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <Box variant="gray">
                        <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">Status Akademik</p>
                        <p className="mt-2 text-2xl font-bold text-emerald-700">MAHASISWA AKTIF</p>
                        <p className="mt-1 text-xs text-neutral-500">{semesterName} • {tahunLabel}</p>
                    </Box>
                    <Box variant="gray">
                        <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">Beban SKS Periode Ini</p>
                        <p className="mt-2 text-2xl font-bold text-neutral-900">{totalSks} SKS</p>
                        <p className="mt-1 text-xs text-neutral-500">KRS Terdaftar</p>
                    </Box>
                    <Box variant="gray">
                        <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">Nomor Dokumen Resmi</p>
                        <p className="mt-2 text-sm font-mono font-bold text-neutral-900 truncate">{nomorSurat}</p>
                        <p className="mt-1 text-xs text-neutral-500">Tanggal: {tanggalHariIni}</p>
                    </Box>
                </div>

                {/* Form Opsi Keperluan & Cetak */}
                <Box>
                    <SectionTitle>Pengaturan & Keperluan Surat</SectionTitle>
                    <form onSubmit={handlePrint} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-neutral-700 mb-1.5">
                                Pilih Template Keperluan Surat:
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                                {keperluanPilihan.map((item, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setKeperluan(item)}
                                        className={`text-left p-2.5 text-xs font-medium border transition ${
                                            keperluan === item
                                                ? 'border-black bg-neutral-900 text-white font-bold'
                                                : 'border-neutral-200 bg-white hover:border-neutral-400 text-neutral-800'
                                        }`}
                                    >
                                        {item}
                                    </button>
                                ))}
                            </div>

                            <label className="block text-xs font-bold uppercase tracking-widest text-neutral-700 mb-1">
                                Atau Tuliskan Keperluan Khusus:
                            </label>
                            <input
                                type="text"
                                value={keperluan}
                                onChange={(e) => setKeperluan(e.target.value)}
                                className="w-full border border-neutral-300 px-3.5 py-2 text-sm text-neutral-900 focus:border-black focus:outline-none"
                                placeholder="Contoh: Pengajuan Beasiswa Pendidikan Prestasi"
                                required
                            />
                        </div>

                        <div className="pt-2 flex items-center justify-between border-t border-neutral-200">
                            <p className="text-xs text-neutral-500">
                                Dokumen ini dilengkapi tanda tangan digital ber-QR Code dan sah secara hukum.
                            </p>
                            <button
                                type="submit"
                                className="inline-flex items-center gap-2 bg-black text-white px-5 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-neutral-800 transition cursor-pointer"
                            >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                </svg>
                                Cetak Surat Keterangan Aktif
                            </button>
                        </div>
                    </form>
                </Box>

                {/* Pratinjau Data Mahasiswa */}
                <Box>
                    <SectionTitle>Data Yang Akan Tercantum Pada Surat</SectionTitle>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 text-sm">
                        <DetailItem label="Nama Lengkap">{mahasiswa.nama_lengkap}</DetailItem>
                        <DetailItem label="NIM">{mahasiswa.nim}</DetailItem>
                        <DetailItem label="Program Studi">{mahasiswa.prodi?.nama_prodi || 'Manajemen Pendidikan Islam'}</DetailItem>
                        <DetailItem label="Jenjang">{mahasiswa.prodi?.jenjang || 'S1 (Sarjana)'}</DetailItem>
                        <DetailItem label="Semester / Angkatan">{semesterName} / {mahasiswa.angkatan || '-'}</DetailItem>
                        <DetailItem label="Tahun Akademik">{tahunLabel}</DetailItem>
                        <div className="md:col-span-2 lg:col-span-3">
                            <DetailItem label="Alamat Mahasiswa">
                                {mahasiswa.alamat || 'Jl. Raya Arco No.1 RT.02/RW.01, Ragamukti, Citayam, Tajur Halang, Bogor'}
                            </DetailItem>
                        </div>
                    </div>
                </Box>
            </div>
        </AdminLayout>
    );
}

