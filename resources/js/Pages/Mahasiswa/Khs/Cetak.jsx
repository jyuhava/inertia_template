import { Head } from '@inertiajs/react';
import { useEffect } from 'react';

export default function Cetak({ mahasiswa, periodeKrs, krs, ips, ipk, totalSks, totalMutu, tanggalCetak }) {
    useEffect(() => {
        window.print();
    }, []);

    const getNilaiHurufColor = (nilaiHuruf) => {
        const colors = {
            A: 'font-bold text-neutral-900',
            'A-': 'font-bold text-neutral-800',
            'B+': 'font-bold text-neutral-700',
            B: 'font-bold text-neutral-700',
            'B-': 'font-bold text-neutral-600',
            'C+': 'font-bold text-neutral-600',
            C: 'font-bold text-neutral-500',
            'C-': 'font-bold text-neutral-500',
            'D+': 'font-bold text-neutral-500',
            D: 'font-bold text-neutral-500',
            E: 'font-bold text-neutral-400',
            '-': 'text-neutral-800',
        };
        return colors[nilaiHuruf] || 'text-neutral-800';
    };

    return (
        <div className="min-h-screen bg-white">
            <Head title={`KHS - ${mahasiswa.nama_lengkap} - ${periodeKrs.semester?.nama_semester} ${periodeKrs.tahun_ajaran?.tahun_mulai}/${periodeKrs.tahun_ajaran?.tahun_selesai}`} />

            <div className="mx-auto max-w-4xl p-8 print:p-6">
                <div className="mb-8 border-b-2 border-black pb-4 text-center">
                    <div className="mb-2 text-lg font-bold text-neutral-900">SISTEM INFORMASI AKADEMIK</div>
                    <div className="mb-2 text-xl font-bold text-neutral-900">KARTU HASIL STUDI (KHS)</div>
                    <div className="text-base font-bold text-neutral-700">
                        {periodeKrs.semester?.nama_semester} {periodeKrs.tahun_ajaran?.tahun_mulai}/{periodeKrs.tahun_ajaran?.tahun_selesai}
                    </div>
                </div>

                <div className="mb-6 grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <div className="flex">
                            <span className="w-32 font-bold">Nama</span>
                            <span className="mr-2">:</span>
                            <span>{mahasiswa.nama_lengkap}</span>
                        </div>
                        <div className="flex">
                            <span className="w-32 font-bold">NIM</span>
                            <span className="mr-2">:</span>
                            <span>{mahasiswa.nim}</span>
                        </div>
                        <div className="flex">
                            <span className="w-32 font-bold">Program Studi</span>
                            <span className="mr-2">:</span>
                            <span>{mahasiswa.prodi?.nama_prodi}</span>
                        </div>
                        <div className="flex">
                            <span className="w-32 font-bold">Angkatan</span>
                            <span className="mr-2">:</span>
                            <span>{mahasiswa.angkatan}</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex">
                            <span className="w-32 font-bold">Semester</span>
                            <span className="mr-2">:</span>
                            <span>{periodeKrs.semester?.nama_semester}</span>
                        </div>
                        <div className="flex">
                            <span className="w-32 font-bold">Tahun Ajaran</span>
                            <span className="mr-2">:</span>
                            <span>{periodeKrs.tahun_ajaran?.tahun_mulai}/{periodeKrs.tahun_ajaran?.tahun_selesai}</span>
                        </div>
                        <div className="flex">
                            <span className="w-32 font-bold">IPS</span>
                            <span className="mr-2">:</span>
                            <span className="font-bold">{ips}</span>
                        </div>
                        <div className="flex">
                            <span className="w-32 font-bold">IPK</span>
                            <span className="mr-2">:</span>
                            <span className="font-bold">{ipk}</span>
                        </div>
                    </div>
                </div>

                <div className="mb-6">
                    <table className="w-full border-collapse border border-black text-sm">
                        <thead>
                            <tr className="bg-neutral-100">
                                <th className="w-12 border border-black px-2 py-2 text-center font-bold">No</th>
                                <th className="w-20 border border-black px-2 py-2 text-center font-bold">Kode MK</th>
                                <th className="border border-black px-2 py-2 text-left font-bold">Nama Mata Kuliah</th>
                                <th className="w-16 border border-black px-2 py-2 text-center font-bold">SKS</th>
                                <th className="w-20 border border-black px-2 py-2 text-center font-bold">Nilai Angka</th>
                                <th className="w-20 border border-black px-2 py-2 text-center font-bold">Nilai Huruf</th>
                                <th className="w-16 border border-black px-2 py-2 text-center font-bold">Bobot</th>
                                <th className="w-16 border border-black px-2 py-2 text-center font-bold">Mutu</th>
                            </tr>
                        </thead>
                        <tbody>
                            {krs.map((item, index) => (
                                <tr key={index}>
                                    <td className="border border-black px-2 py-2 text-center">{index + 1}</td>
                                    <td className="border border-black px-2 py-2 text-center font-bold">{item.kode_mata_kuliah}</td>
                                    <td className="border border-black px-2 py-2">{item.nama_mata_kuliah}</td>
                                    <td className="border border-black px-2 py-2 text-center">{item.sks}</td>
                                    <td className="border border-black px-2 py-2 text-center">{item.nilai_angka || '-'}</td>
                                    <td className={`border border-black px-2 py-2 text-center ${getNilaiHurufColor(item.nilai_huruf)}`}>
                                        {item.nilai_huruf}
                                    </td>
                                    <td className="border border-black px-2 py-2 text-center">{item.bobot.toFixed(2)}</td>
                                    <td className="border border-black px-2 py-2 text-center">{item.mutu.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="bg-neutral-100 font-bold">
                                <td colSpan="3" className="border border-black px-2 py-2 text-right">
                                    TOTAL
                                </td>
                                <td className="border border-black px-2 py-2 text-center">{totalSks}</td>
                                <td className="border border-black px-2 py-2 text-center">-</td>
                                <td className="border border-black px-2 py-2 text-center">-</td>
                                <td className="border border-black px-2 py-2 text-center">-</td>
                                <td className="border border-black px-2 py-2 text-center">{totalMutu.toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div className="mb-6 grid grid-cols-2 gap-8">
                    <div className="border border-black p-4">
                        <div className="text-center">
                            <div className="mb-2 text-lg font-bold">IPS Semester Ini</div>
                            <div className="text-3xl font-bold text-neutral-900">{ips}</div>
                            <div className="mt-1 text-sm text-neutral-600">dari 4.00</div>
                        </div>
                    </div>
                    <div className="border border-black p-4">
                        <div className="text-center">
                            <div className="mb-2 text-lg font-bold">IPK Kumulatif</div>
                            <div className="text-3xl font-bold text-neutral-900">{ipk}</div>
                            <div className="mt-1 text-sm text-neutral-600">dari 4.00</div>
                        </div>
                    </div>
                </div>

                <div className="mb-6">
                    <div className="mb-2 font-bold">Keterangan Nilai:</div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <div>A = 85-100 (Bobot: 4.0)</div>
                            <div>A- = 80-84 (Bobot: 3.7)</div>
                            <div>B+ = 75-79 (Bobot: 3.3)</div>
                            <div>B = 70-74 (Bobot: 3.0)</div>
                            <div>B- = 65-69 (Bobot: 2.7)</div>
                        </div>
                        <div>
                            <div>C+ = 60-64 (Bobot: 2.3)</div>
                            <div>C = 55-59 (Bobot: 2.0)</div>
                            <div>C- = 50-54 (Bobot: 1.7)</div>
                            <div>D+ = 45-49 (Bobot: 1.3)</div>
                            <div>D = 40-44 (Bobot: 1.0)</div>
                            <div>E = 0-39 (Bobot: 0.0)</div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex items-end justify-between">
                    <div className="text-sm text-neutral-600">
                        <div>Dicetak pada: {tanggalCetak}</div>
                        <div>Sistem Informasi Akademik</div>
                    </div>
                    <div className="text-center">
                        <div className="mb-16">Mengetahui,</div>
                        <div className="mb-1 w-48 border-b border-black"></div>
                        <div className="text-sm">Koordinator Program Studi</div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @media print {
                    @page {
                        margin: 1cm;
                        size: A4;
                    }
                    body {
                        print-color-adjust: exact;
                        -webkit-print-color-adjust: exact;
                    }
                    .print\\:p-6 {
                        padding: 1.5rem !important;
                    }
                }
            `}</style>
        </div>
    );
}
