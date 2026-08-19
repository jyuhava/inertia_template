import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

function Box({ children, className = '', padded = true, variant = 'white' }) {
    const variants = {
        white: 'bg-white border border-neutral-200',
        black: 'bg-black text-white border border-black',
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

function StatusBadge({ status, label }) {
    const map = {
        hadir: 'bg-neutral-900 text-white',
        tidak_hadir: 'bg-white text-neutral-900 border border-neutral-900',
        izin: 'bg-neutral-200 text-neutral-900',
        sakit: 'bg-neutral-100 text-neutral-700',
    };
    return <span className={`inline-flex px-2 py-1 text-xs font-bold ${map[status] || 'bg-neutral-100 text-neutral-700'}`}>{label}</span>;
}

function StatCard({ label, value, variant = 'white' }) {
    const map = {
        white: 'bg-white border border-neutral-200',
        black: 'bg-black text-white border border-black',
        gray: 'bg-neutral-50 border border-neutral-200',
    };
    return (
        <div className={`${map[variant]} p-4 text-center`}>
            <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">{label}</p>
            <p className="mt-2 text-2xl font-bold">{value}</p>
        </div>
    );
}

export default function Detail({ auth, mahasiswa, jadwalKuliah, periodeKrs, absensiList, statistik }) {
    const getPercentageClass = (percentage) => {
        if (percentage >= 80) return 'text-neutral-900';
        if (percentage >= 70) return 'text-neutral-600';
        return 'text-neutral-400';
    };

    return (
        <AdminLayout title="Detail Kehadiran">
            <Head title="Detail Kehadiran" />

            <div className="space-y-6">
                <Box variant="black" className="relative overflow-hidden">
                    <div className="absolute right-0 top-0 h-20 w-20 bg-neutral-800" />
                    <div className="relative flex flex-col justify-between gap-4 md:flex-row md:items-start">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">Detail Kehadiran</p>
                            <h1 className="mt-2 text-2xl font-bold md:text-3xl">{jadwalKuliah.nama_mata_kuliah}</h1>
                            <p className="mt-1 text-sm text-neutral-300">
                                {jadwalKuliah.hari}, {jadwalKuliah.jam_mulai} - {jadwalKuliah.jam_selesai} • Ruang {jadwalKuliah.ruangan}
                            </p>
                        </div>
                        <Link
                            href="/mahasiswa/absensi"
                            className="text-xs font-bold uppercase tracking-widest text-white hover:underline"
                        >
                            ← Kembali ke Daftar
                        </Link>
                    </div>
                </Box>

                <Box>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <DetailItem label="NIM">{mahasiswa.nim}</DetailItem>
                        <DetailItem label="Nama">{mahasiswa.nama}</DetailItem>
                        <DetailItem label="Program Studi">{mahasiswa.prodi}</DetailItem>
                    </div>
                </Box>

                <Box>
                    <SectionTitle>Informasi Mata Kuliah</SectionTitle>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <DetailItem label="Kode Mata Kuliah">{jadwalKuliah.kode_mata_kuliah}</DetailItem>
                        <DetailItem label="Nama Mata Kuliah">{jadwalKuliah.nama_mata_kuliah}</DetailItem>
                        <DetailItem label="SKS">{jadwalKuliah.sks} SKS</DetailItem>
                        <DetailItem label="Dosen Pengampu">{jadwalKuliah.dosen}</DetailItem>
                        <DetailItem label="Jadwal">
                            {jadwalKuliah.hari}, {jadwalKuliah.jam_mulai} - {jadwalKuliah.jam_selesai}
                        </DetailItem>
                        <DetailItem label="Ruangan">{jadwalKuliah.ruangan}</DetailItem>
                    </div>
                    <div className="mt-4 border-t border-neutral-200 pt-4">
                        <p className="text-sm text-neutral-700">
                            <span className="font-bold">Periode:</span> {periodeKrs.tahun_ajaran} - {periodeKrs.semester}
                        </p>
                    </div>
                </Box>

                <Box>
                    <SectionTitle>Statistik Kehadiran</SectionTitle>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
                        <StatCard label="Total Pertemuan" value={statistik.total_pertemuan} />
                        <StatCard label="Hadir" value={statistik.hadir} variant="black" />
                        <StatCard label="Tidak Hadir" value={statistik.tidak_hadir} variant="white" />
                        <StatCard label="Izin" value={statistik.izin} variant="gray" />
                        <StatCard label="Sakit" value={statistik.sakit} variant="gray" />
                        <StatCard
                            label="Persentase"
                            value={`${statistik.persentase_kehadiran}%`}
                            variant={statistik.persentase_kehadiran >= 80 ? 'black' : statistik.persentase_kehadiran >= 70 ? 'gray' : 'white'}
                        />
                    </div>

                    <div className="mt-6">
                        <div className="mb-2 flex justify-between text-sm">
                            <span className="text-neutral-600">Progress Kehadiran</span>
                            <span className={`font-bold ${getPercentageClass(statistik.persentase_kehadiran)}`}>
                                {statistik.persentase_kehadiran}%
                            </span>
                        </div>
                        <div className="h-3 w-full bg-neutral-200">
                            <div
                                className="h-3 bg-neutral-900 transition-all duration-300"
                                style={{ width: `${statistik.persentase_kehadiran}%` }}
                            ></div>
                        </div>
                        <div className="mt-1 flex justify-between text-xs text-neutral-500">
                            <span>0%</span>
                            <span>Minimal 75%</span>
                            <span>100%</span>
                        </div>
                    </div>
                </Box>

                <Box>
                    <SectionTitle>Riwayat Kehadiran</SectionTitle>

                    {absensiList.length === 0 ? (
                        <div className="border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
                            Belum ada data kehadiran
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="border-b border-neutral-200 text-left text-xs font-bold uppercase tracking-widest text-neutral-500">
                                        <th className="py-3 pr-4">Pertemuan</th>
                                        <th className="py-3 pr-4">Tanggal</th>
                                        <th className="py-3 pr-4 text-center">Jam</th>
                                        <th className="py-3 pr-4 text-center">Status</th>
                                        <th className="py-3">Keterangan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100">
                                    {absensiList.map((absensi) => (
                                        <tr key={absensi.id} className="hover:bg-neutral-50">
                                            <td className="py-4 pr-4 font-bold text-neutral-900">Pertemuan {absensi.pertemuan_ke}</td>
                                            <td className="py-4 pr-4 text-neutral-700">{absensi.tanggal_formatted}</td>
                                            <td className="py-4 pr-4 text-center text-neutral-700">
                                                {absensi.jam_mulai} - {absensi.jam_selesai}
                                            </td>
                                            <td className="py-4 pr-4 text-center">
                                                <StatusBadge status={absensi.status} label={absensi.status_display} />
                                            </td>
                                            <td className="py-4 text-neutral-500">{absensi.keterangan || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Box>

                <Box variant="gray">
                    <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-neutral-900">Informasi Penting:</h4>
                    <ul className="space-y-1 text-sm text-neutral-700">
                        <li>• Minimal kehadiran 75% untuk dapat mengikuti ujian akhir semester</li>
                        <li>• Kehadiran di bawah 75% dapat mengakibatkan nilai E pada mata kuliah ini</li>
                        <li>• Jika ada kesalahan data kehadiran, segera hubungi dosen pengampu</li>
                    </ul>
                </Box>
            </div>
        </AdminLayout>
    );
}
