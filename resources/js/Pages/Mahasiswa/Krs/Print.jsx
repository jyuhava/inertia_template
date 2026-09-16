import { Head, Link } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import QRCodeSVG from '@/Components/QRCodeSVG';

export default function Print({ periodeAktif, krsData, mahasiswa }) {
    const [logoError, setLogoError] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            window.print();
        }, 600);
        return () => clearTimeout(timer);
    }, []);

    const totalSks = useMemo(() => {
        return krsData.reduce((total, krs) => total + (krs.jadwal_kuliah?.mata_kuliah?.sks || 0), 0);
    }, [krsData]);

    const formattedTanggal = useMemo(() => {
        return new Date().toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    }, []);

    const semesterName = periodeAktif?.semester?.nama_semester || periodeAktif?.semester?.nama || 'Semester';
    const tahunMulai = periodeAktif?.tahun_ajaran?.tahun_mulai || periodeAktif?.tahunAjaran?.tahun_mulai || '';
    const tahunSelesai = periodeAktif?.tahun_ajaran?.tahun_selesai || periodeAktif?.tahunAjaran?.tahun_selesai || '';
    const tahunLabel = tahunMulai && tahunSelesai ? `${tahunMulai}/${tahunSelesai}` : (periodeAktif?.tahunAjaran?.tahun || periodeAktif?.tahun_ajaran?.tahun || '-');

    // QR verification payload
    const qrVerificationPayload = useMemo(() => {
        const docId = `KRS-${mahasiswa.nim}-${periodeAktif?.id || 'AKTIF'}`;
        return `https://alwafi.ac.id/verify/krs?doc=${docId}&nim=${mahasiswa.nim}&sks=${totalSks}&status=APPROVED`;
    }, [mahasiswa, periodeAktif, totalSks]);

    return (
        <div className="min-h-dvh bg-neutral-100 print:bg-white text-neutral-900 font-serif selection:bg-neutral-200">
            <Head title={`KRS - ${mahasiswa.nama_lengkap} (${mahasiswa.nim}) - ${semesterName}`} />

            {/* SCREEN ONLY TOOLBAR */}
            <div className="print:hidden sticky top-0 z-50 bg-neutral-900 text-white shadow-md font-sans">
                <div className="mx-auto max-w-5xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/mahasiswa/krs"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded border border-neutral-700 transition"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Kembali ke KRS
                        </Link>
                        <span className="text-xs text-neutral-400 hidden sm:inline">|</span>
                        <div className="text-xs text-neutral-300">
                            <span className="font-semibold text-white">Pratinjau Cetak KRS:</span> {mahasiswa.nama_lengkap} ({mahasiswa.nim})
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => window.print()}
                            className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-bold uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded shadow transition cursor-pointer"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            Cetak / Simpan PDF
                        </button>
                    </div>
                </div>
            </div>

            {/* MAIN PRINT DOCUMENT CONTAINER (A4 standard) */}
            <div className="mx-auto max-w-[210mm] my-6 print:my-0 bg-white p-8 sm:p-12 print:p-0 shadow-lg print:shadow-none border border-neutral-200 print:border-none">
                
                {/* 1. KOP SURAT RESMI */}
                <div className="relative border-b-4 border-black pb-3">
                    <div className="flex items-center justify-between gap-4">
                        {/* Logo Kiri */}
                        <div className="flex-shrink-0 w-24 h-24 flex items-center justify-center">
                            {!logoError ? (
                                <img
                                    src="https://alwafi.ac.id/assets/img/stit.png"
                                    alt="Logo STIT Al-Wafi"
                                    className="max-h-24 max-w-24 object-contain"
                                    onError={() => setLogoError(true)}
                                />
                            ) : (
                                <div className="w-20 h-20 border-2 border-neutral-800 rounded-full flex flex-col items-center justify-center text-center p-1">
                                    <span className="font-bold text-[9px] uppercase leading-tight tracking-tighter">STIT</span>
                                    <span className="font-extrabold text-[11px] uppercase leading-tight text-neutral-900">AL-WAFI</span>
                                    <span className="text-[7px] leading-tight text-neutral-600">BOGOR</span>
                                </div>
                            )}
                        </div>

                        {/* Teks Kop Surat */}
                        <div className="flex-grow text-center font-serif">
                            <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-neutral-800 leading-tight">
                                YAYASAN AL-SUDAIS INDONESIA
                            </h3>
                            <h1 className="text-base sm:text-lg md:text-xl font-bold uppercase tracking-wider text-black leading-tight mt-0.5">
                                SEKOLAH TINGGI ILMU TARBIYAH (STIT) AL-WAFI BOGOR
                            </h1>
                            <p className="text-xs font-semibold text-neutral-900 tracking-wide mt-0.5">
                                PROGRAM STUDI {mahasiswa.prodi?.nama_prodi?.toUpperCase() || 'MANAJEMEN PENDIDIKAN ISLAM (MPI)'} - JENJANG S1
                            </p>
                            <p className="text-[10px] sm:text-[11px] text-neutral-700 leading-tight mt-1 font-sans">
                                Jl. Raya Arco No.1 RT.02/RW.01, Ragamukti, Citayam, Tajur Halang, Bogor, Jawa Barat
                            </p>
                            <p className="text-[9.5px] text-neutral-600 leading-tight mt-0.5 font-sans">
                                Website: <span className="text-neutral-800 font-medium">www.alwafi.ac.id</span> | Email: <span className="text-neutral-800 font-medium">info@alwafi.ac.id</span>
                            </p>
                        </div>

                        {/* Spacer Penyeimbang */}
                        <div className="flex-shrink-0 w-24 h-24 hidden sm:flex items-center justify-center opacity-0 print:flex">
                            <div className="w-20 h-20"></div>
                        </div>
                    </div>

                    {/* Garis Ganda Pembatas Kop */}
                    <div className="mt-2.5 border-t border-black"></div>
                </div>

                {/* 2. JUDUL DOKUMEN */}
                <div className="text-center my-5">
                    <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider text-black underline underline-offset-4">
                        KARTU RENCANA STUDI (KRS)
                    </h2>
                    <p className="text-xs sm:text-sm font-semibold text-neutral-800 uppercase tracking-wide mt-1">
                        SEMESTER {semesterName.toUpperCase()} TAHUN AKADEMIK {tahunLabel}
                    </p>
                </div>

                {/* 3. BIODATA MAHASISWA */}
                <div className="mb-5 text-xs text-neutral-900 font-sans">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 p-3.5 bg-neutral-50 print:bg-transparent border border-neutral-300 print:border-neutral-400 rounded-sm">
                        <div className="space-y-1">
                            <div className="flex">
                                <span className="w-28 text-neutral-600 font-medium">Nama Mahasiswa</span>
                                <span className="mr-2 font-bold">:</span>
                                <span className="font-bold uppercase text-neutral-900">{mahasiswa.nama_lengkap}</span>
                            </div>
                            <div className="flex">
                                <span className="w-28 text-neutral-600 font-medium">NIM</span>
                                <span className="mr-2 font-bold">:</span>
                                <span className="font-mono font-bold text-neutral-900">{mahasiswa.nim}</span>
                            </div>
                            <div className="flex">
                                <span className="w-28 text-neutral-600 font-medium">Program Studi</span>
                                <span className="mr-2 font-bold">:</span>
                                <span className="font-medium text-neutral-900">{mahasiswa.prodi?.nama_prodi || 'Manajemen Pendidikan Islam'}</span>
                            </div>
                            <div className="flex">
                                <span className="w-28 text-neutral-600 font-medium">Jenjang Studi</span>
                                <span className="mr-2 font-bold">:</span>
                                <span className="font-medium text-neutral-900">Strata Satu (S1)</span>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="flex">
                                <span className="w-28 text-neutral-600 font-medium">Semester</span>
                                <span className="mr-2 font-bold">:</span>
                                <span className="font-bold text-neutral-900">{semesterName}</span>
                            </div>
                            <div className="flex">
                                <span className="w-28 text-neutral-600 font-medium">Tahun Akademik</span>
                                <span className="mr-2 font-bold">:</span>
                                <span className="font-medium text-neutral-900">{tahunLabel}</span>
                            </div>
                            <div className="flex">
                                <span className="w-28 text-neutral-600 font-medium">Total SKS Diambil</span>
                                <span className="mr-2 font-bold">:</span>
                                <span className="font-bold text-neutral-900 font-mono">{totalSks} SKS</span>
                            </div>
                            <div className="flex">
                                <span className="w-28 text-neutral-600 font-medium">Status Pengajuan</span>
                                <span className="mr-2 font-bold">:</span>
                                <span className="font-semibold text-emerald-700 print:text-black">Disetujui / Sah</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. TABEL MATA KULIAH KRS */}
                <div className="mb-6">
                    <table className="w-full border-collapse border border-black text-xs font-sans">
                        <thead>
                            <tr className="bg-neutral-100 print:bg-neutral-100 text-black font-bold uppercase text-[10px] tracking-wider">
                                <th className="border border-black px-2 py-2 text-center w-8">No</th>
                                <th className="border border-black px-2 py-2 text-center w-20">Kode MK</th>
                                <th className="border border-black px-3 py-2 text-left">Nama Mata Kuliah</th>
                                <th className="border border-black px-2 py-2 text-center w-10">SKS</th>
                                <th className="border border-black px-2 py-2 text-center w-12">Kelas</th>
                                <th className="border border-black px-2 py-2 text-center w-28">Hari & Waktu</th>
                                <th className="border border-black px-2 py-2 text-center w-16">Ruang</th>
                                <th className="border border-black px-3 py-2 text-left">Dosen Pengampu</th>
                            </tr>
                        </thead>
                        <tbody>
                            {krsData.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="border border-black px-3 py-6 text-center text-neutral-500 italic">
                                        Tidak ada mata kuliah yang diambil pada periode ini.
                                    </td>
                                </tr>
                            ) : (
                                krsData.map((krs, index) => (
                                    <tr key={krs.id || index} className={index % 2 === 1 ? 'bg-neutral-50/50 print:bg-transparent' : ''}>
                                        <td className="border border-black px-2 py-1.5 text-center text-neutral-800">{index + 1}</td>
                                        <td className="border border-black px-2 py-1.5 text-center font-mono font-medium text-neutral-900">
                                            {krs.jadwal_kuliah?.mata_kuliah?.kode_mata_kuliah}
                                        </td>
                                        <td className="border border-black px-3 py-1.5 text-neutral-900 font-medium">
                                            {krs.jadwal_kuliah?.mata_kuliah?.nama_mata_kuliah}
                                        </td>
                                        <td className="border border-black px-2 py-1.5 text-center font-semibold text-neutral-900">
                                            {krs.jadwal_kuliah?.mata_kuliah?.sks}
                                        </td>
                                        <td className="border border-black px-2 py-1.5 text-center font-medium text-neutral-800">
                                            Reguler
                                        </td>
                                        <td className="border border-black px-2 py-1.5 text-center text-neutral-800">
                                            {krs.jadwal_kuliah?.hari ? `${krs.jadwal_kuliah?.hari}, ${krs.jadwal_kuliah?.jam_mulai} - ${krs.jadwal_kuliah?.jam_selesai}` : '-'}
                                        </td>
                                        <td className="border border-black px-2 py-1.5 text-center text-neutral-800 font-mono">
                                            {krs.jadwal_kuliah?.ruangan || '-'}
                                        </td>
                                        <td className="border border-black px-3 py-1.5 text-neutral-900 text-[11px]">
                                            {krs.jadwal_kuliah?.dosen?.nama_lengkap || '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        <tfoot>
                            <tr className="bg-neutral-100 print:bg-neutral-100 font-bold text-black border-t-2 border-black">
                                <td colSpan="3" className="border border-black px-3 py-2 text-right uppercase tracking-wider">
                                    Total SKS Yang Diambil
                                </td>
                                <td className="border border-black px-2 py-2 text-center text-neutral-900 font-mono text-sm">
                                    {totalSks}
                                </td>
                                <td colSpan="4" className="border border-black px-3 py-2 text-left text-neutral-500 font-normal italic">
                                    Maksimal beban SKS sesuai evaluasi indeks prestasi akademik.
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* 5. PENGESAHAN 3 PIHAK DENGAN QR CODE */}
                <div className="font-sans text-xs break-inside-avoid mt-8">
                    <div className="grid grid-cols-3 gap-4 text-center">
                        
                        {/* Kolom 1: Mahasiswa */}
                        <div>
                            <p className="text-neutral-500 text-[11px] mb-1 opacity-0 print:opacity-0">Bogor, {formattedTanggal}</p>
                            <p className="font-medium text-neutral-900 mb-16">Mahasiswa,</p>
                            <p className="font-bold text-neutral-900 underline uppercase tracking-wide">{mahasiswa.nama_lengkap}</p>
                            <p className="text-neutral-600 font-mono text-[11px] mt-0.5">NIM: {mahasiswa.nim}</p>
                        </div>

                        {/* Kolom 2: Pembimbing Akademik */}
                        <div>
                            <p className="text-neutral-500 text-[11px] mb-1 opacity-0 print:opacity-0">Bogor, {formattedTanggal}</p>
                            <p className="font-medium text-neutral-900 mb-16">Pembimbing Akademik,</p>
                            <p className="font-bold text-neutral-900 underline uppercase tracking-wide">( ............................................ )</p>
                            <p className="text-neutral-600 font-mono text-[11px] mt-0.5">NIDN / NIP. ............................</p>
                        </div>

                        {/* Kolom 3: Ketua Program Studi / QR Verification */}
                        <div>
                            <p className="text-neutral-700 text-[11px] mb-1">
                                Bogor, {formattedTanggal}
                            </p>
                            <p className="font-medium text-neutral-900 mb-2">
                                Ketua Program Studi / Akademik,
                            </p>

                            {/* QR CODE DIGITAL SIGNATURE & VERIFICATION */}
                            <div className="my-2 flex flex-col items-center justify-center">
                                <div className="p-1.5 border border-neutral-300 print:border-black rounded bg-white inline-block shadow-sm print:shadow-none">
                                    <QRCodeSVG
                                        value={qrVerificationPayload}
                                        size={72}
                                        title="QR Verifikasi KRS STIT Al-Wafi"
                                    />
                                </div>
                                <p className="text-[9px] text-neutral-500 font-mono mt-0.5">
                                    Dokumen Terverifikasi Digital
                                </p>
                            </div>

                            <p className="font-bold text-neutral-900 underline uppercase tracking-wide mt-1">
                                Bagian Akademik STIT Al-Wafi
                            </p>
                            <p className="text-neutral-600 font-mono text-[11px]">
                                NIDN / NIP. 2108198501
                            </p>
                        </div>
                    </div>

                    {/* Catatan Legalitas Dokumen */}
                    <div className="mt-8 pt-3 border-t border-dashed border-neutral-300 print:border-neutral-400 text-[9.5px] text-neutral-500 flex flex-col sm:flex-row justify-between items-center gap-1 font-sans">
                        <p>
                            * Dokumen KRS ini sah dan diterbitkan secara resmi melalui Sistem Informasi Akademik STIT Al-Wafi Bogor.
                        </p>
                        <p className="font-mono text-[9px] text-neutral-400">
                            DOC-ID: KRS-{mahasiswa.nim}-{periodeAktif?.id || 'AKTIF'}
                        </p>
                    </div>
                </div>

            </div>

            {/* PRINT CSS STYLING */}
            <style jsx global>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 10mm 15mm 10mm 15mm;
                    }
                    html, body {
                        background: #ffffff !important;
                        color: #000000 !important;
                        font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .break-inside-avoid {
                        break-inside: avoid !important;
                        page-break-inside: avoid !important;
                    }
                }
            `}</style>
        </div>
    );
}
