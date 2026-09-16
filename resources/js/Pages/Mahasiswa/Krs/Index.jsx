import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    AcademicCapIcon,
    BookOpenIcon,
    CalendarDaysIcon,
    CheckCircleIcon,
    ClipboardDocumentListIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    PlusIcon,
    PrinterIcon,
} from '@heroicons/react/24/outline';

/* ------------------------------------------------------------------ *
 * Token warna — identitas STIT Al Wafi (emas)
 * ------------------------------------------------------------------ */
const TONES = {
    brand: { icon: 'bg-brand-50 text-brand-600', chip: 'bg-brand-50 text-brand-700', solid: 'bg-brand-700 text-white' },
    soft: { icon: 'bg-brand-100 text-brand-700', chip: 'bg-brand-100 text-brand-700', solid: 'bg-brand-600 text-white' },
};

function StatCell({ icon: Icon, label, value, tone = 'brand' }) {
    const t = TONES[tone];
    return (
        <div className="flex items-center gap-2.5 bg-white p-3">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${t.icon}`}>
                <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
                <p className="text-lg font-bold leading-none text-neutral-900">{value}</p>
                <p className="mt-1 truncate text-[10px] font-bold uppercase tracking-wider text-neutral-500">{label}</p>
            </div>
        </div>
    );
}

function SectionCard({ title, count, action, children }) {
    return (
        <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-neutral-200">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 bg-neutral-50 px-3 py-2.5">
                <div className="flex items-center gap-2">
                    <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-600">{title}</h2>
                    {count !== undefined ? (
                        <span className="rounded-md bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold text-brand-700">
                            {count}
                        </span>
                    ) : null}
                </div>
                {action}
            </div>
            <div className="p-3">{children}</div>
        </section>
    );
}

function StatusBadge({ status }) {
    const map = {
        menunggu_persetujuan: { cls: 'bg-brand-50 text-brand-700', label: 'Menunggu' },
        disetujui: { cls: 'bg-brand-700 text-white', label: 'Disetujui' },
        ditolak: { cls: 'bg-white text-brand-800 ring-1 ring-brand-300', label: 'Ditolak' },
    };
    const { cls, label } = map[status] || { cls: 'bg-brand-50 text-brand-700', label: status };
    return (
        <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${cls}`}>
            {label}
        </span>
    );
}

function HariBadge({ hari }) {
    if (!hari) return <span className="text-neutral-400">-</span>;
    return (
        <span className="inline-flex rounded-md bg-brand-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            {hari}
        </span>
    );
}

function EmptyState({ icon: Icon, title, description }) {
    return (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50/60 px-4 py-6 text-center">
            <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-500">
                <Icon className="h-4 w-4" />
            </span>
            <p className="mt-2.5 text-xs font-bold text-neutral-800">{title}</p>
            <p className="mx-auto mt-0.5 max-w-sm text-[11px] text-neutral-500">{description}</p>
        </div>
    );
}

export default function Index({ periodeAktif, krsData, jadwalTersedia, mahasiswa, message }) {
    const handleTambahKrs = (jadwalKuliahId) => {
        if (confirm('Yakin ingin mengambil mata kuliah ini?')) {
            router.post('/mahasiswa/krs', {
                jadwal_kuliah_id: jadwalKuliahId,
            });
        }
    };

    const handleBatalKrs = (krsId) => {
        if (confirm('Yakin ingin membatalkan mata kuliah ini dari KRS?')) {
            router.delete(`/mahasiswa/krs/${krsId}`);
        }
    };

    const getTotalSks = () => {
        return krsData.reduce((total, krs) => total + (krs.jadwal_kuliah?.mata_kuliah?.sks || 0), 0);
    };

    if (!periodeAktif) {
        return (
            <AdminLayout title="KRS - Kartu Rencana Studi">
                <Head title="KRS - Kartu Rencana Studi" />

                <div className="rounded-xl border border-dashed border-neutral-300 bg-white px-4 py-10 text-center">
                    <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                        <ExclamationTriangleIcon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-3 text-sm font-bold uppercase tracking-wider text-neutral-900">
                        Periode KRS Tidak Aktif
                    </h3>
                    <p className="mx-auto mt-1.5 max-w-md text-[11px] text-neutral-500">
                        {message ||
                            'Tidak ada periode KRS yang aktif saat ini. Silakan hubungi admin untuk informasi lebih lanjut.'}
                    </p>
                </div>
            </AdminLayout>
        );
    }

    const jumlahDisetujui = krsData.filter((k) => k.status === 'disetujui').length;
    const jumlahMenunggu = krsData.filter((k) => k.status === 'menunggu_persetujuan').length;

    return (
        <AdminLayout title="KRS - Kartu Rencana Studi">
            <Head title="KRS - Kartu Rencana Studi" />

            <div className="space-y-3">
                {/* Hero */}
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 px-4 py-3.5 shadow-md shadow-brand-900/25">
                    <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/10" />
                    <div className="pointer-events-none absolute -bottom-12 -left-6 h-28 w-28 rounded-full bg-white/10" />

                    <div className="relative flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-white ring-1 ring-white/20">
                                <ClipboardDocumentListIcon className="h-3 w-3" />
                                Kartu Rencana Studi
                            </span>

                            <h1 className="mt-2 text-lg font-bold leading-tight text-white md:text-xl">
                                {periodeAktif.nama_periode}
                            </h1>

                            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-white/85">
                                <span className="inline-flex items-center gap-1">
                                    <CalendarDaysIcon className="h-3.5 w-3.5 text-white/70" />
                                    {periodeAktif.tahun_ajaran?.tahun_mulai}/{periodeAktif.tahun_ajaran?.tahun_selesai}{' '}
                                    {periodeAktif.semester?.nama_semester}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                    <ClockIcon className="h-3.5 w-3.5 text-white/70" />
                                    {new Date(periodeAktif.tanggal_mulai).toLocaleDateString('id-ID')} —{' '}
                                    {new Date(periodeAktif.tanggal_selesai).toLocaleDateString('id-ID')}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <p className="text-2xl font-bold leading-none text-white">{getTotalSks()}</p>
                                <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-white/75">
                                    Total SKS
                                </p>
                            </div>

                            {krsData.length > 0 ? (
                                <a
                                    href="/mahasiswa/krs/print"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-900 shadow-sm transition hover:bg-white/85"
                                >
                                    <PrinterIcon className="h-3.5 w-3.5" />
                                    Cetak
                                </a>
                            ) : null}
                        </div>
                    </div>
                </div>

                {/* Stat strip */}
                <section className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-neutral-200 shadow-sm ring-1 ring-neutral-200 lg:grid-cols-4">
                    <StatCell icon={AcademicCapIcon} label="Total SKS" value={getTotalSks()} />
                    <StatCell icon={ClipboardDocumentListIcon} label="MK Diambil" value={krsData.length} tone="soft" />
                    <StatCell icon={CheckCircleIcon} label="Disetujui" value={jumlahDisetujui} />
                    <StatCell icon={ClockIcon} label="Menunggu" value={jumlahMenunggu} tone="soft" />
                </section>

                {/* MK diambil */}
                <SectionCard title="Mata Kuliah yang Diambil" count={krsData.length}>
                    {krsData.length === 0 ? (
                        <EmptyState
                            icon={ClipboardDocumentListIcon}
                            title="Belum ada mata kuliah yang diambil"
                            description="Pilih mata kuliah dari daftar yang tersedia di bawah."
                        />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-xs table-cards">
                                <thead>
                                    <tr className="border-b border-neutral-200 text-left text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                                        <th className="py-2 pr-3">Mata Kuliah</th>
                                        <th className="py-2 pr-3">Dosen</th>
                                        <th className="py-2 pr-3">Jadwal</th>
                                        <th className="py-2 pr-3">SKS</th>
                                        <th className="py-2 pr-3">Ruangan</th>
                                        <th className="py-2 pr-3">Status</th>
                                        <th className="py-2">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100">
                                    {krsData.map((krs) => (
                                        <tr key={krs.id} className="transition hover:bg-neutral-50">
                                            <td data-label="Mata Kuliah" className="py-2.5 pr-3">
                                                <p className="font-bold text-neutral-900">
                                                    {krs.jadwal_kuliah?.mata_kuliah?.nama_mata_kuliah}
                                                </p>
                                                <p className="text-[10px] text-neutral-400">
                                                    {krs.jadwal_kuliah?.mata_kuliah?.kode_mata_kuliah}
                                                </p>
                                            </td>
                                            <td data-label="Dosen" className="py-2.5 pr-3 text-neutral-700">
                                                {krs.jadwal_kuliah?.dosen?.nama_lengkap}
                                            </td>
                                            <td data-label="Jadwal" className="py-2.5 pr-3">
                                                <HariBadge hari={krs.jadwal_kuliah?.hari} />
                                                <p className="mt-1 text-[10px] text-neutral-400">
                                                    {krs.jadwal_kuliah?.jam_mulai} - {krs.jadwal_kuliah?.jam_selesai}
                                                </p>
                                            </td>
                                            <td data-label="SKS" className="py-2.5 pr-3 font-bold text-neutral-900">
                                                {krs.jadwal_kuliah?.mata_kuliah?.sks}
                                            </td>
                                            <td data-label="Ruangan" className="py-2.5 pr-3 text-neutral-700">
                                                {krs.jadwal_kuliah?.ruangan}
                                            </td>
                                            <td data-label="Status" className="py-2.5 pr-3">
                                                <StatusBadge status={krs.status} />
                                                {krs.catatan_admin ? (
                                                    <p className="mt-1 text-[10px] text-neutral-400">
                                                        Catatan: {krs.catatan_admin}
                                                    </p>
                                                ) : null}
                                            </td>
                                            <td data-label="Aksi" className="py-2.5">
                                                {krs.status === 'menunggu_persetujuan' ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleBatalKrs(krs.id)}
                                                        className="inline-flex items-center rounded-lg border border-brand-200 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-800 transition hover:bg-brand-50"
                                                    >
                                                        Batalkan
                                                    </button>
                                                ) : null}
                                                {krs.status === 'ditolak' ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleTambahKrs(krs.jadwal_kuliah.id)}
                                                        className="inline-flex items-center gap-1 rounded-lg bg-brand-700 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white transition hover:bg-brand-800"
                                                    >
                                                        <PlusIcon className="h-3 w-3" />
                                                        Ambil Lagi
                                                    </button>
                                                ) : null}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </SectionCard>

                {/* MK tersedia */}
                <SectionCard title="Mata Kuliah yang Tersedia" count={jadwalTersedia.length}>
                    {jadwalTersedia.length === 0 ? (
                        <EmptyState
                            icon={BookOpenIcon}
                            title="Tidak ada mata kuliah yang tersedia"
                            description="Semua mata kuliah sudah diambil atau tidak ada jadwal untuk semester ini."
                        />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-xs table-cards">
                                <thead>
                                    <tr className="border-b border-neutral-200 text-left text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                                        <th className="py-2 pr-3">Mata Kuliah</th>
                                        <th className="py-2 pr-3">Dosen</th>
                                        <th className="py-2 pr-3">Jadwal</th>
                                        <th className="py-2 pr-3">SKS</th>
                                        <th className="py-2 pr-3">Kapasitas</th>
                                        <th className="py-2 pr-3">Ruangan</th>
                                        <th className="py-2">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100">
                                    {jadwalTersedia.map((jadwal) => (
                                        <tr key={jadwal.id} className="transition hover:bg-neutral-50">
                                            <td data-label="Mata Kuliah" className="py-2.5 pr-3">
                                                <p className="font-bold text-neutral-900">
                                                    {jadwal.mata_kuliah?.nama_mata_kuliah}
                                                </p>
                                                <p className="text-[10px] text-neutral-400">
                                                    {jadwal.mata_kuliah?.kode_mata_kuliah}
                                                </p>
                                            </td>
                                            <td data-label="Dosen" className="py-2.5 pr-3 text-neutral-700">
                                                {jadwal.dosen?.nama_lengkap}
                                            </td>
                                            <td data-label="Jadwal" className="py-2.5 pr-3">
                                                <HariBadge hari={jadwal.hari} />
                                                <p className="mt-1 text-[10px] text-neutral-400">
                                                    {jadwal.jam_mulai} - {jadwal.jam_selesai}
                                                </p>
                                            </td>
                                            <td data-label="SKS" className="py-2.5 pr-3 font-bold text-neutral-900">
                                                {jadwal.mata_kuliah?.sks}
                                            </td>
                                            <td data-label="Kapasitas" className="py-2.5 pr-3">
                                                <span className="font-bold text-neutral-900">
                                                    {jadwal.jumlah_mahasiswa}/{jadwal.kapasitas}
                                                </span>
                                                {!jadwal.tersedia ? (
                                                    <span className="ml-1.5 inline-flex rounded-md bg-brand-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-700">
                                                        Penuh
                                                    </span>
                                                ) : null}
                                            </td>
                                            <td data-label="Ruangan" className="py-2.5 pr-3 text-neutral-700">
                                                {jadwal.ruangan}
                                            </td>
                                            <td data-label="Aksi" className="py-2.5">
                                                <button
                                                    type="button"
                                                    onClick={() => handleTambahKrs(jadwal.id)}
                                                    disabled={!jadwal.tersedia}
                                                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition ${
                                                        jadwal.tersedia
                                                            ? 'bg-brand-700 text-white hover:bg-brand-800'
                                                            : 'cursor-not-allowed border border-neutral-200 bg-neutral-100 text-neutral-400'
                                                    }`}
                                                >
                                                    {jadwal.tersedia ? <PlusIcon className="h-3 w-3" /> : null}
                                                    {jadwal.tersedia ? 'Ambil' : 'Penuh'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </SectionCard>
            </div>
        </AdminLayout>
    );
}
