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

function ActionButton({ children, href, variant = 'primary' }) {
    const map = {
        primary: 'bg-neutral-900 text-white border-neutral-900 hover:bg-neutral-800',
        secondary: 'bg-white text-neutral-800 border-neutral-300 hover:bg-neutral-50',
        outline: 'bg-transparent text-neutral-800 border-neutral-300 hover:bg-neutral-50',
    };
    return (
        <Link href={href} className={`inline-flex items-center justify-center border px-3 py-1.5 text-xs font-semibold transition ${map[variant]}`}>
            {children}
        </Link>
    );
}

function HariPill({ hari }) {
    return (
        <span className="inline-flex items-center border border-neutral-900 bg-neutral-900 px-3 py-1 text-xs font-semibold text-white">
            {hari}
        </span>
    );
}

export default function Index({ dosen, periodeAktif, jadwalKuliahs }) {
    const formatTime = (value) => String(value || '-').slice(0, 5);

    const hariUrutan = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

    const jadwalPerHari = hariUrutan.reduce((acc, hari) => {
        acc[hari] = jadwalKuliahs.filter((jadwal) => jadwal.hari === hari);
        return acc;
    }, {});

    const totalMahasiswa = jadwalKuliahs.reduce((sum, jadwal) => sum + (jadwal.jumlah_mahasiswa_aktual || 0), 0);
    const totalSks = jadwalKuliahs.reduce((sum, jadwal) => sum + (jadwal.mata_kuliah?.sks || 0), 0);
    const hariIni = new Date().toLocaleDateString('id-ID', { weekday: 'long' });
    const jumlahKelasHariIni = jadwalKuliahs.filter((jadwal) => jadwal.hari?.toLowerCase() === hariIni.toLowerCase()).length;

    if (!periodeAktif) {
        return (
            <AdminLayout title="Jadwal Mengajar">
                <Head title="Jadwal Mengajar" />
                <Box variant="gray" className="!border-neutral-300 p-8 text-center">
                    <p className="text-lg font-semibold text-neutral-900">Tidak ada periode KRS aktif</p>
                    <p className="mt-2 text-sm text-neutral-600">Silakan hubungi admin untuk mengaktifkan periode KRS.</p>
                </Box>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Jadwal Mengajar">
            <Head title="Jadwal Mengajar" />

            <div className="space-y-6">
                <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 shadow-teal-500/20 p-4 text-white shadow-lg sm:p-5">
                    <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-widest text-white/75">Jadwal Pengajaran</p>
                            <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">Jadwal Mengajar Dosen</h1>
                            <p className="mt-2 text-sm text-white/85">
                                {dosen?.nama_lengkap || '-'} • NIP {dosen?.nip || '-'}
                            </p>
                            <p className="text-sm text-white/85">
                                {periodeAktif.nama_periode || 'Periode Aktif'} • Semester {periodeAktif.semester?.nama_semester || '-'}
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Box variant="dark" className="!bg-white/10 !p-3 !border-white/20">
                                <p className="text-[11px] font-semibold uppercase tracking-widest text-white/75">Kelas Aktif</p>
                                <p className="mt-1 text-xl font-bold">{jadwalKuliahs.length}</p>
                            </Box>
                            <Box variant="dark" className="!bg-white/10 !p-3 !border-white/20">
                                <p className="text-[11px] font-semibold uppercase tracking-widest text-white/75">Total Mahasiswa</p>
                                <p className="mt-1 text-xl font-bold">{totalMahasiswa}</p>
                            </Box>
                            <Box variant="dark" className="!bg-white/10 !p-3 !border-white/20">
                                <p className="text-[11px] font-semibold uppercase tracking-widest text-white/75">Total SKS</p>
                                <p className="mt-1 text-xl font-bold">{totalSks}</p>
                            </Box>
                            <Box variant="dark" className="!bg-white/10 !p-3 !border-white/20">
                                <p className="text-[11px] font-semibold uppercase tracking-widest text-white/75">Kelas Hari Ini</p>
                                <p className="mt-1 text-xl font-bold">{jumlahKelasHariIni}</p>
                            </Box>
                        </div>
                    </div>
                </section>

                {jadwalKuliahs.length === 0 ? (
                    <Box className="p-10 text-center">
                        <p className="text-lg font-semibold text-neutral-900">Belum ada jadwal mengajar</p>
                        <p className="mt-2 text-sm text-neutral-500">Jadwal akan tampil setelah admin menugaskan kelas pada periode ini.</p>
                    </Box>
                ) : (
                    <section className="space-y-6">
                        {hariUrutan.map(
                            (hari) =>
                                jadwalPerHari[hari].length > 0 && (
                                    <Box key={hari}>
                                        <div className="mb-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <HariPill hari={hari} />
                                                <span className="text-sm text-neutral-500">{jadwalPerHari[hari].length} mata kuliah</span>
                                            </div>
                                            <span className="text-xs text-neutral-400">Urut berdasarkan jam mulai</span>
                                        </div>

                                        <div className="space-y-3">
                                            {jadwalPerHari[hari]
                                                .sort((a, b) => String(a.jam_mulai).localeCompare(String(b.jam_mulai)))
                                                .map((jadwal) => (
                                                    <div key={jadwal.id} className="border border-neutral-200 p-4">
                                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                                            <div>
                                                                <p className="font-semibold text-neutral-900">
                                                                    {jadwal.mata_kuliah?.nama_mata_kuliah}
                                                                </p>
                                                                <p className="text-xs text-neutral-500">
                                                                    {jadwal.mata_kuliah?.kode_mata_kuliah} • {jadwal.mata_kuliah?.sks} SKS
                                                                </p>
                                                                {jadwal.keterangan ? (
                                                                    <p className="mt-1 text-xs text-neutral-500">{jadwal.keterangan}</p>
                                                                ) : null}
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-sm font-semibold text-neutral-900">
                                                                    {formatTime(jadwal.jam_mulai)} - {formatTime(jadwal.jam_selesai)}
                                                                </p>
                                                                <p className="text-xs text-neutral-500">Ruang {jadwal.ruangan}</p>
                                                            </div>
                                                        </div>

                                                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                                                            <div className="border border-neutral-300 bg-neutral-50 px-3 py-1.5 text-xs text-neutral-700">
                                                                {jadwal.jumlah_mahasiswa_aktual}/{jadwal.kapasitas} mahasiswa
                                                            </div>
                                                            <div className="flex flex-wrap gap-2">
                                                                <ActionButton href={route('dosen.mahasiswa', jadwal.id)} variant="secondary">
                                                                    Daftar Mahasiswa
                                                                </ActionButton>
                                                                <ActionButton href={route('dosen.absensi.index', jadwal.id)} variant="secondary">
                                                                    Absensi
                                                                </ActionButton>
                                                                <ActionButton href={route('dosen.penilaian', jadwal.id)} variant="primary">
                                                                    Input Nilai
                                                                </ActionButton>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </Box>
                                )
                        )}
                    </section>
                )}
            </div>
        </AdminLayout>
    );
}
