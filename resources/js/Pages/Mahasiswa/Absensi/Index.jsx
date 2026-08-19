import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { router } from '@inertiajs/react';

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

function StatusBadge({ status }) {
    const map = {
        green: 'bg-neutral-900 text-white',
        yellow: 'bg-neutral-200 text-neutral-900',
        red: 'bg-white text-neutral-900 border border-neutral-900',
    };
    return <span className={`inline-flex px-2 py-1 text-xs font-bold ${map[status?.color] || 'bg-neutral-100 text-neutral-700'}`}>{status?.label}</span>;
}

function CountPill({ variant, label, count }) {
    const map = {
        hadir: 'bg-neutral-900 text-white',
        alpa: 'bg-white text-neutral-900 border border-neutral-900',
        izin: 'bg-neutral-200 text-neutral-900',
        sakit: 'bg-neutral-100 text-neutral-700',
    };
    return <span className={`inline-flex items-center px-2 py-0.5 text-xs font-bold ${map[variant]}`}>{label}: {count}</span>;
}

export default function Index({ auth, mahasiswa, periodeKrs, periodeKrsList, krsList, statistik }) {
    const [selectedPeriode, setSelectedPeriode] = useState(periodeKrs?.id || '');

    const handlePeriodeChange = (e) => {
        const periodeId = e.target.value;
        setSelectedPeriode(periodeId);

        if (periodeId) {
            router.get('/mahasiswa/absensi', { periode_krs_id: periodeId }, {
                preserveState: true,
                preserveScroll: true,
            });
        }
    };

    const getPercentageClass = (percentage) => {
        if (percentage >= 80) return 'text-neutral-900';
        if (percentage >= 70) return 'text-neutral-600';
        return 'text-neutral-400';
    };

    return (
        <AdminLayout title="Daftar Kehadiran">
            <Head title="Daftar Kehadiran" />

            <div className="space-y-6">
                <Box variant="black" className="relative overflow-hidden">
                    <div className="absolute right-0 top-0 h-20 w-20 bg-neutral-800" />
                    <div className="relative">
                        <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">Rekap Kehadiran</p>
                        <h1 className="mt-2 text-2xl font-bold md:text-3xl">Daftar Kehadiran</h1>
                        <p className="mt-1 text-sm text-neutral-300">{mahasiswa.nama} • NIM {mahasiswa.nim}</p>
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
                    <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                        <div className="flex items-center gap-4">
                            <label htmlFor="periode" className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                                Periode KRS
                            </label>
                            <select
                                id="periode"
                                value={selectedPeriode}
                                onChange={handlePeriodeChange}
                                className="border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none"
                            >
                                <option value="">-- Pilih Periode --</option>
                                {periodeKrsList.map((periode) => (
                                    <option key={periode.id} value={periode.id}>
                                        {periode.label} {periode.is_active && '(Aktif)'}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {periodeKrs && (
                            <div className="text-sm text-neutral-600">
                                <span className="font-bold">Periode Aktif:</span> {periodeKrs.tahun_ajaran} - {periodeKrs.semester}
                            </div>
                        )}
                    </div>
                </Box>

                {periodeKrs && krsList.length > 0 && (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Box variant="gray">
                            <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">Total Mata Kuliah</p>
                            <p className="mt-2 text-3xl font-bold text-neutral-900">{statistik.total_mata_kuliah}</p>
                        </Box>
                        <Box variant={statistik.rata_rata_kehadiran >= 80 ? 'black' : statistik.rata_rata_kehadiran >= 70 ? 'gray' : 'white'}>
                            <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">Rata-rata Kehadiran</p>
                            <p className="mt-2 text-3xl font-bold">{statistik.rata_rata_kehadiran}%</p>
                        </Box>
                    </div>
                )}

                <Box>
                    <SectionTitle>Daftar Mata Kuliah</SectionTitle>

                    {!periodeKrs ? (
                        <div className="border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
                            Silakan pilih periode KRS untuk melihat data kehadiran
                        </div>
                    ) : krsList.length === 0 ? (
                        <div className="border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
                            Tidak ada data mata kuliah untuk periode ini
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="border-b border-neutral-200 text-left text-xs font-bold uppercase tracking-widest text-neutral-500">
                                        <th className="py-3 pr-4">Mata Kuliah</th>
                                        <th className="py-3 pr-4 text-center">SKS</th>
                                        <th className="py-3 pr-4">Dosen</th>
                                        <th className="py-3 pr-4 text-center">Jadwal</th>
                                        <th className="py-3 pr-4 text-center">Pertemuan</th>
                                        <th className="py-3 pr-4 text-center">Kehadiran</th>
                                        <th className="py-3 pr-4 text-center">Persentase</th>
                                        <th className="py-3 pr-4 text-center">Status</th>
                                        <th className="py-3 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100">
                                    {krsList.map((krs) => (
                                        <tr key={krs.id} className="hover:bg-neutral-50">
                                            <td className="py-4 pr-4">
                                                <p className="font-bold text-neutral-900">{krs.nama_mata_kuliah}</p>
                                                <p className="text-xs text-neutral-500">{krs.kode_mata_kuliah}</p>
                                            </td>
                                            <td className="py-4 pr-4 text-center font-bold text-neutral-900">{krs.sks}</td>
                                            <td className="py-4 pr-4 text-neutral-700">{krs.dosen}</td>
                                            <td className="py-4 pr-4 text-center">
                                                <p className="font-bold text-neutral-900">{krs.hari}</p>
                                                <p className="text-xs text-neutral-500">{krs.jam_mulai} - {krs.jam_selesai}</p>
                                                <p className="text-xs text-neutral-500">{krs.ruangan}</p>
                                            </td>
                                            <td className="py-4 pr-4 text-center text-neutral-700">{krs.total_pertemuan}</td>
                                            <td className="py-4 pr-4 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <CountPill variant="hadir" label="H" count={krs.hadir} />
                                                    {(krs.tidak_hadir > 0 || krs.izin > 0 || krs.sakit > 0) && (
                                                        <div className="flex flex-wrap justify-center gap-1">
                                                            {krs.tidak_hadir > 0 && <CountPill variant="alpa" label="A" count={krs.tidak_hadir} />}
                                                            {krs.izin > 0 && <CountPill variant="izin" label="I" count={krs.izin} />}
                                                            {krs.sakit > 0 && <CountPill variant="sakit" label="S" count={krs.sakit} />}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4 pr-4 text-center">
                                                <span className={`text-lg font-bold ${getPercentageClass(krs.persentase_kehadiran)}`}>
                                                    {krs.persentase_kehadiran}%
                                                </span>
                                            </td>
                                            <td className="py-4 pr-4 text-center">
                                                <StatusBadge status={krs.status_kehadiran} />
                                            </td>
                                            <td className="py-4 text-center">
                                                <Link
                                                    href={`/mahasiswa/absensi/${krs.jadwal_kuliah_id}?periode_krs_id=${periodeKrs.id}`}
                                                    className="text-xs font-bold uppercase tracking-widest text-neutral-900 hover:underline"
                                                >
                                                    Detail
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Box>

                {krsList.length > 0 && (
                    <Box variant="gray">
                        <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-neutral-900">Keterangan:</h4>
                        <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                            <div className="flex items-center gap-2">
                                <span className="inline-block h-6 w-8 bg-neutral-900"></span>
                                <span className="text-neutral-700">H = Hadir</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="inline-block h-6 w-8 border border-neutral-900 bg-white"></span>
                                <span className="text-neutral-700">A = Tidak Hadir (Alpa)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="inline-block h-6 w-8 bg-neutral-200"></span>
                                <span className="text-neutral-700">I = Izin</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="inline-block h-6 w-8 bg-neutral-100"></span>
                                <span className="text-neutral-700">S = Sakit</span>
                            </div>
                        </div>
                        <div className="mt-3 border-t border-neutral-200 pt-3">
                            <p className="text-sm text-neutral-700">
                                <strong>Catatan:</strong> Minimal kehadiran 75% untuk dapat mengikuti ujian akhir semester.
                            </p>
                        </div>
                    </Box>
                )}
            </div>
        </AdminLayout>
    );
}
