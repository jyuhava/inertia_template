import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';

function Box({ children, className = '', padded = true, variant = 'white' }) {
    const variants = {
        white: 'bg-white border-neutral-200',
        gray: 'bg-neutral-50 border-neutral-200',
        dark: 'bg-neutral-900 border-neutral-900 text-white',
    };
    return (
        <div className={`border shadow-sm ${padded ? 'p-5' : ''} ${variants[variant] || variants.white} ${className}`}>
            {children}
        </div>
    );
}

function SectionTitle({ children, action }) {
    return (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight text-neutral-900">{children}</h2>
            {action ? <div>{action}</div> : null}
        </div>
    );
}

function ScorePill({ score }) {
    const n = Number(score || 0);
    if (!score) {
        return <span className="border border-neutral-300 bg-neutral-50 px-2 py-1 text-xs text-neutral-600">Belum ada</span>;
    }
    return <span className="border border-neutral-900 bg-neutral-900 px-2 py-1 text-xs font-semibold text-white">{n}</span>;
}

function GradePill({ grade }) {
    if (!grade) return null;
    return <span className="border border-neutral-300 bg-white px-2 py-1 text-xs font-semibold text-neutral-800">{grade}</span>;
}

function StatusPill({ status }) {
    const isFinal = status === 'final';
    return (
        <span className={`border px-2 py-1 text-xs font-semibold ${isFinal ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-300 bg-white text-neutral-800'}`}>
            {isFinal ? 'Final' : 'Draft'}
        </span>
    );
}

function ActionButton({ children, href, variant = 'primary' }) {
    const map = {
        primary: 'bg-neutral-900 text-white border-neutral-900 hover:bg-neutral-800',
        secondary: 'bg-white text-neutral-800 border-neutral-300 hover:bg-neutral-50',
    };
    return (
        <Link href={href} className={`inline-flex items-center justify-center border px-3 py-2 text-xs font-semibold transition ${map[variant]}`}>
            {children}
        </Link>
    );
}

export default function Index({ dosen, periodeAktif, jadwalKuliah, mahasiswas }) {
    const sorted = [...mahasiswas].sort((a, b) => (a.nim || '').localeCompare(b.nim || ''));

    const totalMahasiswa = sorted.length;
    const totalFinal = sorted.filter((m) => m.penilaian?.status === 'final').length;
    const totalDraft = totalMahasiswa - totalFinal;
    const scored = sorted.filter((m) => m.penilaian?.nilai_akhir !== null && m.penilaian?.nilai_akhir !== undefined);
    const avgScore = scored.length
        ? (scored.reduce((sum, m) => sum + Number(m.penilaian.nilai_akhir || 0), 0) / scored.length).toFixed(1)
        : '-';
    const finalRate = totalMahasiswa ? Math.round((totalFinal / totalMahasiswa) * 100) : 0;

    const formatTime = (value) => String(value || '-').slice(0, 5);

    return (
        <AdminLayout title="Daftar Mahasiswa">
            <Head title={`Daftar Mahasiswa - ${jadwalKuliah.mata_kuliah?.nama_mata_kuliah || 'Kelas'}`} />

            <div className="space-y-6">
                <section className="relative overflow-hidden border border-neutral-900 bg-neutral-900 p-7 text-white shadow-sm">
                    <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Manajemen Peserta Kelas</p>
                            <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">{jadwalKuliah.mata_kuliah?.nama_mata_kuliah}</h1>
                            <p className="mt-2 text-sm text-neutral-300">
                                {jadwalKuliah.mata_kuliah?.kode_mata_kuliah} • {jadwalKuliah.mata_kuliah?.sks} SKS
                            </p>
                            <p className="text-sm text-neutral-300">
                                {jadwalKuliah.hari}, {formatTime(jadwalKuliah.jam_mulai)} - {formatTime(jadwalKuliah.jam_selesai)} • Ruang {jadwalKuliah.ruangan}
                            </p>
                            <p className="mt-1 text-xs text-neutral-400">
                                Dosen: {dosen?.nama_lengkap || '-'}{periodeAktif ? ` • ${periodeAktif.nama_periode || 'Periode Aktif'}` : ''}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <ActionButton href={route('dosen.jadwal')} variant="secondary">
                                ← Kembali ke Jadwal
                            </ActionButton>
                            <ActionButton href={route('dosen.penilaian', jadwalKuliah.id)} variant="secondary">
                                Input Nilai
                            </ActionButton>
                            <ActionButton href={route('dosen.absensi.index', jadwalKuliah.id)} variant="primary">
                                Kelola Absensi
                            </ActionButton>
                        </div>
                    </div>
                </section>

                <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <Box>
                        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Total Mahasiswa</p>
                        <p className="mt-1 text-3xl font-bold text-neutral-900">{totalMahasiswa}</p>
                    </Box>
                    <Box>
                        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Nilai Final</p>
                        <p className="mt-1 text-3xl font-bold text-neutral-900">{totalFinal}</p>
                    </Box>
                    <Box>
                        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Belum Final</p>
                        <p className="mt-1 text-3xl font-bold text-neutral-900">{totalDraft}</p>
                    </Box>
                    <Box>
                        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Rata-rata Nilai</p>
                        <p className="mt-1 text-3xl font-bold text-neutral-900">{avgScore}</p>
                    </Box>
                </section>

                <Box>
                    <div className="mb-2 flex items-center justify-between">
                        <p className="text-sm font-medium text-neutral-700">Progress Finalisasi Nilai</p>
                        <p className="text-sm font-semibold text-neutral-900">{finalRate}%</p>
                    </div>
                    <div className="h-2 overflow-hidden bg-neutral-200">
                        <div className="h-full bg-neutral-900" style={{ width: `${finalRate}%` }} />
                    </div>
                </Box>

                <Box>
                    <SectionTitle
                        action={
                            <span className="inline-flex border border-neutral-300 px-2 py-1 text-xs font-semibold text-neutral-700">
                                {totalMahasiswa} mahasiswa
                            </span>
                        }
                    >
                        Daftar Mahasiswa
                    </SectionTitle>

                    {sorted.length === 0 ? (
                        <div className="border border-dashed border-neutral-300 p-10 text-center text-sm text-neutral-500">
                            Tidak ada mahasiswa yang mengambil mata kuliah ini.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-neutral-200 text-sm">
                                <thead className="bg-neutral-50">
                                    <tr className="text-left text-xs uppercase tracking-widest text-neutral-600">
                                        <th className="px-4 py-3">No</th>
                                        <th className="px-4 py-3">Mahasiswa</th>
                                        <th className="px-4 py-3">Program Studi</th>
                                        <th className="px-4 py-3">Nilai</th>
                                        <th className="px-4 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100">
                                    {sorted.map((m, index) => (
                                        <tr key={m.id} className="hover:bg-neutral-50">
                                            <td className="px-4 py-3 text-neutral-700">{index + 1}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center border border-neutral-300 bg-neutral-100 font-semibold text-neutral-800">
                                                        {(m.nama_lengkap || m.nama || 'M').charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-neutral-900">{m.nama_lengkap || m.nama || 'Nama tidak tersedia'}</p>
                                                        <p className="text-xs text-neutral-500">{m.nim || 'NIM tidak tersedia'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-neutral-800">{m.prodi?.nama_prodi || '-'}</p>
                                                <p className="text-xs text-neutral-500">{m.prodi?.kode_prodi || '-'}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <ScorePill score={m.penilaian?.nilai_akhir} />
                                                    <GradePill grade={m.penilaian?.nilai_huruf} />
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <StatusPill status={m.penilaian?.status} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Box>
            </div>
        </AdminLayout>
    );
}
