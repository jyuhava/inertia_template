import { Head } from '@inertiajs/react';
import { useEffect } from 'react';

export default function Cetak({ mahasiswa, periodeKrs, krs, ips, ipk, totalSks, totalMutu, tanggalCetak }) {
    useEffect(() => {
        window.print();
    }, []);

    return (
        <div className="bg-white p-8 max-w-4xl mx-auto print:p-0">
            <Head title={`Cetak KHS - ${mahasiswa.nim}`} />

            {/* Header */}
            <div className="text-center mb-8 border-b-2 border-double border-black pb-4">
                <h1 className="text-2xl font-bold uppercase tracking-wider mb-1">KARTU HASIL STUDI (KHS)</h1>
                <h2 className="text-xl font-bold uppercase tracking-wide">STIT AL-WAFI BOGOR</h2>
                <p className="text-sm mt-1 text-neutral-600">Jl. Raya Jakarta-Bogor Km. 44, Pakansari, Cibinong, Bogor, Jawa Barat</p>
            </div>

            {/* Student Info */}
            <div className="grid grid-cols-2 gap-8 mb-6 text-sm">
                <div>
                    <div className="grid grid-cols-3 mb-1">
                        <span className="font-semibold text-neutral-700">Nama</span>
                        <span className="col-span-2 text-neutral-900">: {mahasiswa.nama_lengkap}</span>
                    </div>
                    <div className="grid grid-cols-3 mb-1">
                        <span className="font-semibold text-neutral-700">NIM</span>
                        <span className="col-span-2 text-neutral-900">: {mahasiswa.nim}</span>
                    </div>
                    <div className="grid grid-cols-3 mb-1">
                        <span className="font-semibold text-neutral-700">Program Studi</span>
                        <span className="col-span-2 text-neutral-900">: {mahasiswa.prodi?.nama_prodi}</span>
                    </div>
                </div>
                <div>
                    <div className="grid grid-cols-3 mb-1">
                        <span className="font-semibold text-neutral-700">Semester</span>
                        <span className="col-span-2 text-neutral-900">: {periodeKrs.semester?.nama_semester}</span>
                    </div>
                    <div className="grid grid-cols-3 mb-1">
                        <span className="font-semibold text-neutral-700">Tahun Ajaran</span>
                        <span className="col-span-2 text-neutral-900">: {periodeKrs.tahun_ajaran?.tahun_mulai}/{periodeKrs.tahun_ajaran?.tahun_selesai}</span>
                    </div>
                    <div className="grid grid-cols-3 mb-1">
                        <span className="font-semibold text-neutral-700">Periode</span>
                        <span className="col-span-2 text-neutral-900">: {periodeKrs.nama_periode}</span>
                    </div>
                </div>
            </div>

            {/* Table */}
            <table className="w-full border-collapse border border-black mb-6 text-sm">
                <thead>
                    <tr className="bg-neutral-100">
                        <th className="border border-black py-2 px-3 text-center w-12 text-[10px] font-bold uppercase tracking-widest">No</th>
                        <th className="border border-black py-2 px-3 text-left text-[10px] font-bold uppercase tracking-widest">Kode</th>
                        <th className="border border-black py-2 px-3 text-left text-[10px] font-bold uppercase tracking-widest">Mata Kuliah</th>
                        <th className="border border-black py-2 px-3 text-center w-16 text-[10px] font-bold uppercase tracking-widest">SKS</th>
                        <th className="border border-black py-2 px-3 text-center w-16 text-[10px] font-bold uppercase tracking-widest">Nilai</th>
                        <th className="border border-black py-2 px-3 text-center w-16 text-[10px] font-bold uppercase tracking-widest">Bobot</th>
                        <th className="border border-black py-2 px-3 text-center w-20 text-[10px] font-bold uppercase tracking-widest">Mutu</th>
                    </tr>
                </thead>
                <tbody>
                    {krs.map((item, index) => (
                        <tr key={index}>
                            <td className="border border-black py-2 px-3 text-center text-neutral-700">{index + 1}</td>
                            <td className="border border-black py-2 px-3 font-mono text-neutral-900">{item.kode_mata_kuliah}</td>
                            <td className="border border-black py-2 px-3 text-neutral-900">{item.nama_mata_kuliah}</td>
                            <td className="border border-black py-2 px-3 text-center text-neutral-900">{item.sks}</td>
                            <td className="border border-black py-2 px-3 text-center font-bold text-neutral-900">{item.nilai_huruf}</td>
                            <td className="border border-black py-2 px-3 text-center text-neutral-900">{item.bobot}</td>
                            <td className="border border-black py-2 px-3 text-center text-neutral-900">{item.mutu}</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr className="bg-neutral-50 font-bold">
                        <td colSpan="3" className="border border-black py-2 px-3 text-right text-neutral-900">Total</td>
                        <td className="border border-black py-2 px-3 text-center text-neutral-900">{totalSks}</td>
                        <td colSpan="2" className="border border-black"></td>
                        <td className="border border-black py-2 px-3 text-center text-neutral-900">{totalMutu}</td>
                    </tr>
                </tfoot>
            </table>

            {/* Summary */}
            <div className="flex justify-end mb-12">
                <div className="border border-black p-4 w-64">
                    <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium text-neutral-700">IPS:</span>
                        <span className="font-bold text-neutral-900">{ips}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-sm font-medium text-neutral-700">IPK:</span>
                        <span className="font-bold text-neutral-900">{ipk}</span>
                    </div>
                </div>
            </div>

            {/* Signature */}
            <div className="flex justify-end text-sm">
                <div className="text-center w-64">
                    <p className="mb-16 text-neutral-900">Bogor, {tanggalCetak}</p>
                    <p className="font-bold underline text-neutral-900">Bagian Akademik</p>
                    <p className="text-neutral-700">STIT Al-Wafi Bogor</p>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    @page {
                        margin: 1cm;
                    }
                }
            `}</style>
        </div>
    );
}
