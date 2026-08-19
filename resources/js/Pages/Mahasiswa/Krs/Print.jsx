import { Head } from '@inertiajs/react';
import { useEffect } from 'react';

export default function Print({ periodeAktif, krsData, mahasiswa }) {
    useEffect(() => {
        window.print();
    }, []);

    const getTotalSks = () => {
        return krsData.reduce((total, krs) => total + (krs.jadwal_kuliah?.mata_kuliah?.sks || 0), 0);
    };

    return (
        <>
            <Head title={`KRS - ${mahasiswa.nama_lengkap}`} />

            <div className="min-h-screen bg-white p-8 print:p-0">
                <div className="mx-auto max-w-4xl">
                    <div className="mb-8 border-b-2 border-black pb-4 text-center">
                        <h1 className="mb-2 text-xl font-bold uppercase">KARTU RENCANA STUDI (KRS)</h1>
                        <h2 className="text-lg font-bold">SISTEM INFORMASI AKADEMIK</h2>
                        <p className="mt-2 text-sm">
                            {periodeAktif.nama_periode} - Tahun Ajaran {periodeAktif.tahun_ajaran?.tahun_mulai}/{periodeAktif.tahun_ajaran?.tahun_selesai}
                        </p>
                    </div>

                    <div className="mb-6">
                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <div className="flex">
                                    <span className="w-24 font-bold">NIM</span>
                                    <span className="mr-2">:</span>
                                    <span>{mahasiswa.nim}</span>
                                </div>
                                <div className="flex">
                                    <span className="w-24 font-bold">Nama</span>
                                    <span className="mr-2">:</span>
                                    <span>{mahasiswa.nama_lengkap}</span>
                                </div>
                                <div className="flex">
                                    <span className="w-24 font-bold">Program Studi</span>
                                    <span className="mr-2">:</span>
                                    <span>{mahasiswa.prodi?.nama_prodi}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex">
                                    <span className="w-24 font-bold">Semester</span>
                                    <span className="mr-2">:</span>
                                    <span>{periodeAktif.semester?.nama_semester}</span>
                                </div>
                                <div className="flex">
                                    <span className="w-24 font-bold">Total SKS</span>
                                    <span className="mr-2">:</span>
                                    <span className="font-bold">{getTotalSks()}</span>
                                </div>
                                <div className="flex">
                                    <span className="w-24 font-bold">Tanggal</span>
                                    <span className="mr-2">:</span>
                                    <span>{new Date().toLocaleDateString('id-ID')}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mb-8">
                        <table className="w-full border-collapse border border-black text-sm">
                            <thead>
                                <tr className="bg-neutral-100">
                                    <th className="border border-black px-3 py-2 text-center font-bold">No</th>
                                    <th className="border border-black px-3 py-2 text-center font-bold">Kode MK</th>
                                    <th className="border border-black px-3 py-2 text-center font-bold">Mata Kuliah</th>
                                    <th className="border border-black px-3 py-2 text-center font-bold">SKS</th>
                                    <th className="border border-black px-3 py-2 text-center font-bold">Kelas</th>
                                    <th className="border border-black px-3 py-2 text-center font-bold">Hari</th>
                                    <th className="border border-black px-3 py-2 text-center font-bold">Jam</th>
                                    <th className="border border-black px-3 py-2 text-center font-bold">Ruang</th>
                                    <th className="border border-black px-3 py-2 text-center font-bold">Dosen</th>
                                </tr>
                            </thead>
                            <tbody>
                                {krsData.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" className="border border-black px-3 py-4 text-center text-neutral-500">
                                            Tidak ada mata kuliah yang diambil
                                        </td>
                                    </tr>
                                ) : (
                                    krsData.map((krs, index) => (
                                        <tr key={krs.id}>
                                            <td className="border border-black px-3 py-2 text-center">{index + 1}</td>
                                            <td className="border border-black px-3 py-2 text-center">
                                                {krs.jadwal_kuliah?.mata_kuliah?.kode_mata_kuliah}
                                            </td>
                                            <td className="border border-black px-3 py-2">
                                                {krs.jadwal_kuliah?.mata_kuliah?.nama_mata_kuliah}
                                            </td>
                                            <td className="border border-black px-3 py-2 text-center">
                                                {krs.jadwal_kuliah?.mata_kuliah?.sks}
                                            </td>
                                            <td className="border border-black px-3 py-2 text-center">A</td>
                                            <td className="border border-black px-3 py-2 text-center">
                                                {krs.jadwal_kuliah?.hari}
                                            </td>
                                            <td className="border border-black px-3 py-2 text-center">
                                                {krs.jadwal_kuliah?.jam_mulai} - {krs.jadwal_kuliah?.jam_selesai}
                                            </td>
                                            <td className="border border-black px-3 py-2 text-center">
                                                {krs.jadwal_kuliah?.ruangan}
                                            </td>
                                            <td className="border border-black px-3 py-2">
                                                {krs.jadwal_kuliah?.dosen?.nama_lengkap}
                                            </td>
                                        </tr>
                                    ))
                                )}
                                <tr className="bg-neutral-100 font-bold">
                                    <td colSpan="3" className="border border-black px-3 py-2 text-center">
                                        TOTAL SKS
                                    </td>
                                    <td className="border border-black px-3 py-2 text-center">{getTotalSks()}</td>
                                    <td colSpan="5" className="border border-black px-3 py-2"></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-12 flex justify-between">
                        <div className="text-center">
                            <p className="mb-16">Mahasiswa</p>
                            <p className="inline-block border-t border-black px-8 pt-2">{mahasiswa.nama_lengkap}</p>
                            <p className="text-sm">NIM: {mahasiswa.nim}</p>
                        </div>

                        <div className="text-center">
                            <p className="mb-16">Pembimbing Akademik</p>
                            <p className="inline-block border-t border-black px-8 pt-2">(............................)</p>
                            <p className="text-sm">NIP: ............................</p>
                        </div>

                        <div className="text-center">
                            <p>
                                Jakarta,{' '}
                                {new Date().toLocaleDateString('id-ID', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                })}
                            </p>
                            <p className="mb-12">Koordinator Program Studi</p>
                            <p className="inline-block border-t border-black px-8 pt-2">(............................)</p>
                            <p className="text-sm">NIP: ............................</p>
                        </div>
                    </div>

                    <div className="mt-8 border-t pt-4 text-center text-xs text-neutral-600">
                        <p>* Dokumen ini dicetak secara otomatis dari Sistem Informasi Akademik</p>
                        <p>* Periode KRS: {new Date(periodeAktif.tanggal_mulai).toLocaleDateString('id-ID')} - {new Date(periodeAktif.tanggal_selesai).toLocaleDateString('id-ID')}</p>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @media print {
                    body { margin: 0; }
                    .print\\:p-0 { padding: 0 !important; }
                }
            `}</style>
        </>
    );
}
