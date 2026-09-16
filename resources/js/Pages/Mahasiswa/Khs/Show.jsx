import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';

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

function ActionButton({ children, href, variant = 'primary' }) {
    const map = {
        primary: 'bg-neutral-900 text-white hover:bg-neutral-800',
        secondary: 'bg-white text-neutral-900 border border-neutral-200 hover:bg-neutral-50',
    };
    return (
        <Link href={href} className={`inline-flex items-center px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${map[variant]}`}>
            {children}
        </Link>
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

function GradeBadge({ nilai }) {
    const map = {
        A: 'bg-neutral-900 text-white',
        'A-': 'bg-neutral-800 text-white',
        'B+': 'bg-neutral-700 text-white',
        B: 'bg-neutral-600 text-white',
        'B-': 'bg-neutral-500 text-white',
        'C+': 'bg-neutral-300 text-neutral-900',
        C: 'bg-neutral-200 text-neutral-900',
        'C-': 'bg-neutral-100 text-neutral-900',
        'D+': 'bg-white text-neutral-900 border border-neutral-900',
        D: 'bg-white text-neutral-700 border border-neutral-300',
        E: 'bg-white text-neutral-500 border border-neutral-200',
    };
    return <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-bold ${map[nilai] || 'bg-neutral-100 text-neutral-700'}`}>{nilai}</span>;
}

function EmptyState({ icon, title, description }) {
    return (
        <div className="border border-dashed border-neutral-300 p-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center bg-neutral-100 text-neutral-600">
                {icon}
            </div>
            <h3 className="text-sm font-bold text-neutral-900">{title}</h3>
            <p className="mt-1 text-xs text-neutral-500">{description}</p>
        </div>
    );
}

export default function Show({ mahasiswa, periodeKrs, krs, ips, ipk, totalSks, totalMutu }) {
    return (
        <AdminLayout title={`KHS - ${periodeKrs.semester?.nama_semester} ${periodeKrs.tahun_ajaran?.tahun_mulai}/${periodeKrs.tahun_ajaran?.tahun_selesai}`}>
            <Head title={`KHS - ${periodeKrs.semester?.nama_semester} ${periodeKrs.tahun_ajaran?.tahun_mulai}/${periodeKrs.tahun_ajaran?.tahun_selesai}`} />

            <div className="space-y-6">
                <Box variant="black" className="relative overflow-hidden">
                    <div className="absolute right-0 top-0 h-20 w-20 bg-white/10" />
                    <div className="relative flex flex-col justify-between gap-4 md:flex-row md:items-start">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-white/75">Kartu Hasil Studi</p>
                            <h1 className="mt-2 text-2xl font-bold md:text-3xl">
                                {periodeKrs.semester?.nama_semester} {periodeKrs.tahun_ajaran?.tahun_mulai}/{periodeKrs.tahun_ajaran?.tahun_selesai}
                            </h1>
                            <p className="mt-1 text-sm text-white/85">{periodeKrs.nama_periode}</p>
                        </div>
                        <ActionButton href={`/mahasiswa/khs/${periodeKrs.id}/cetak`} variant="primary">
                            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            Cetak KHS
                        </ActionButton>
                    </div>
                </Box>

                <Box>
                    <SectionTitle>Informasi Mahasiswa</SectionTitle>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <DetailItem label="Nama Lengkap">{mahasiswa.nama_lengkap}</DetailItem>
                        <DetailItem label="NIM">{mahasiswa.nim}</DetailItem>
                        <DetailItem label="Program Studi">{mahasiswa.prodi?.nama_prodi}</DetailItem>
                        <DetailItem label="Angkatan">{mahasiswa.angkatan}</DetailItem>
                    </div>
                </Box>

                <Box>
                    <SectionTitle>Daftar Nilai Mata Kuliah</SectionTitle>

                    {krs.length === 0 ? (
                        <EmptyState
                            icon={
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            }
                            title="Tidak ada mata kuliah"
                            description="Tidak ada mata kuliah yang diambil pada semester ini."
                        />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm table-cards">
                                <thead>
                                    <tr className="border-b border-neutral-200 text-left text-xs font-bold uppercase tracking-widest text-neutral-500">
                                        <th className="py-3 pr-4">No</th>
                                        <th className="py-3 pr-4">Kode MK</th>
                                        <th className="py-3 pr-4">Nama Mata Kuliah</th>
                                        <th className="py-3 pr-4 text-center">SKS</th>
                                        <th className="py-3 pr-4 text-center">Nilai Angka</th>
                                        <th className="py-3 pr-4 text-center">Nilai Huruf</th>
                                        <th className="py-3 pr-4 text-center">Bobot</th>
                                        <th className="py-3 text-center">Mutu</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100">
                                    {krs.map((item, index) => (
                                        <tr key={index} className="hover:bg-neutral-50">
                                            <td data-label="No" className="py-4 pr-4 text-neutral-900">{index + 1}</td>
                                            <td data-label="Kode MK" className="py-4 pr-4 font-bold text-neutral-900">{item.kode_mata_kuliah}</td>
                                            <td data-label="Nama Mata Kuliah" className="py-4 pr-4 text-neutral-900">{item.nama_mata_kuliah}</td>
                                            <td data-label="SKS" className="py-4 pr-4 text-center font-bold text-neutral-900">{item.sks}</td>
                                            <td data-label="Nilai Angka" className="py-4 pr-4 text-center text-neutral-700">{item.nilai_angka || '-'}</td>
                                            <td data-label="Nilai Huruf" className="py-4 pr-4 text-center">
                                                <GradeBadge nilai={item.nilai_huruf} />
                                            </td>
                                            <td data-label="Bobot" className="py-4 pr-4 text-center text-neutral-700">{item.bobot.toFixed(2)}</td>
                                            <td data-label="Mutu" className="py-4 text-center font-bold text-neutral-900">{item.mutu.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="border-t border-neutral-200 bg-neutral-50">
                                    <tr className="table-cards-empty">
                                        <td colSpan="3" className="py-4 pr-4 text-right text-sm font-bold text-neutral-900">
                                            TOTAL
                                        </td>
                                        <td data-label="Kode MK" className="py-4 pr-4 text-center text-sm font-bold text-neutral-900">{totalSks}</td>
                                        <td data-label="Nama Mata Kuliah" className="py-4 pr-4 text-center text-sm text-neutral-500">-</td>
                                        <td data-label="SKS" className="py-4 pr-4 text-center text-sm text-neutral-500">-</td>
                                        <td data-label="Nilai Angka" className="py-4 pr-4 text-center text-sm text-neutral-500">-</td>
                                        <td data-label="Nilai Huruf" className="py-4 text-center text-sm font-bold text-neutral-900">{totalMutu.toFixed(2)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </Box>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <Box className="text-center">
                        <SectionTitle>IPS Semester Ini</SectionTitle>
                        <div className="text-4xl font-bold text-neutral-900">{ips}</div>
                        <div className="mt-1 text-xs font-bold uppercase tracking-widest text-neutral-500">dari 4.00</div>
                        <div className="mt-4 text-sm text-neutral-600">
                            <div>Total SKS: {totalSks}</div>
                            <div>Total Mutu: {totalMutu.toFixed(2)}</div>
                        </div>
                    </Box>

                    <Box className="text-center">
                        <SectionTitle>IPK Kumulatif</SectionTitle>
                        <div className="text-4xl font-bold text-neutral-900">{ipk}</div>
                        <div className="mt-1 text-xs font-bold uppercase tracking-widest text-neutral-500">dari 4.00</div>
                        <div className="mt-4 text-sm text-neutral-600">Sampai semester ini</div>
                    </Box>
                </div>
            </div>
        </AdminLayout>
    );
}
