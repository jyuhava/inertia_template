import AdminLayout from '@/Layouts/AdminLayout';
import Modal from '@/Components/Modal';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

const STATUS_OPTIONS = [
    { value: 'hadir', label: 'Hadir' },
    { value: 'tidak_hadir', label: 'Tidak Hadir' },
    { value: 'izin', label: 'Izin' },
    { value: 'sakit', label: 'Sakit' },
];

const statusTone = {
    hadir: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
    tidak_hadir: 'bg-rose-100 text-rose-700 ring-rose-200',
    izin: 'bg-amber-100 text-amber-700 ring-amber-200',
    sakit: 'bg-sky-100 text-sky-700 ring-sky-200',
};

const statusButtonClass = {
    hadir: 'border-emerald-200 text-emerald-700 hover:bg-emerald-50',
    tidak_hadir: 'border-rose-200 text-rose-700 hover:bg-rose-50',
    izin: 'border-amber-200 text-amber-700 hover:bg-amber-50',
    sakit: 'border-sky-200 text-sky-700 hover:bg-sky-50',
};

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

function StatusPill({ status }) {
    const label = STATUS_OPTIONS.find((opt) => opt.value === status)?.label || 'Tidak Hadir';
    const tone = statusTone[status] || statusTone.tidak_hadir;
    return <span className={`inline-flex px-2.5 py-1 text-xs font-semibold ring-1 ${tone}`}>{label}</span>;
}

function ActionButton({ children, href, onClick, variant = 'primary', type = 'button' }) {
    const map = {
        primary: 'bg-neutral-900 text-white border-neutral-900 hover:bg-neutral-800',
        secondary: 'bg-white text-neutral-800 border-neutral-300 hover:bg-neutral-50',
        danger: 'bg-white text-neutral-900 border-neutral-900 hover:bg-neutral-900 hover:text-white',
    };
    const className = `inline-flex items-center justify-center border px-3 py-2 text-xs font-semibold transition ${map[variant]}`;
    if (href) {
        return (
            <Link href={href} className={className}>
                {children}
            </Link>
        );
    }
    return (
        <button type={type} onClick={onClick} className={className}>
            {children}
        </button>
    );
}

export default function Index({ dosen, periodeAktif, jadwalKuliah, mahasiswas, pertemuanList, absensiData }) {
    const { flash } = usePage().props;
    const [selectedTanggal, setSelectedTanggal] = useState(pertemuanList[0]?.tanggal || '');
    const [showCreatePertemuan, setShowCreatePertemuan] = useState(false);
    const [pertemuanToDelete, setPertemuanToDelete] = useState(null);

    const {
        data: formPertemuan,
        setData: setFormPertemuan,
        post: postPertemuan,
        processing: processingPertemuan,
        errors: errorsPertemuan,
        reset: resetPertemuan,
    } = useForm({
        tanggal: '',
        jam_mulai: '',
        jam_selesai: '',
    });

    const {
        data: formAbsensi,
        setData: setFormAbsensi,
        put: putAbsensi,
        processing: processingAbsensi,
        errors: errorsAbsensi,
    } = useForm({
        tanggal: '',
        absensi: [],
    });

    const formatDate = (value) =>
        new Date(value).toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });

    const formatTime = (value) => String(value || '-').slice(0, 5);

    const initAbsensiForDate = (tanggal) => {
        const absensiTanggal = absensiData[tanggal] || [];
        const absensiForm = mahasiswas.map((mahasiswa) => {
            const existingAbsensi = absensiTanggal.find((a) => a.mahasiswa_id === mahasiswa.id);
            return {
                mahasiswa_id: mahasiswa.id,
                status: existingAbsensi?.status || 'tidak_hadir',
                keterangan: existingAbsensi?.keterangan || '',
            };
        });

        setFormAbsensi({
            tanggal,
            absensi: absensiForm,
        });
    };

    useEffect(() => {
        if (selectedTanggal) {
            initAbsensiForDate(selectedTanggal);
        }
    }, [selectedTanggal]);

    const selectedPertemuan = useMemo(
        () => pertemuanList.find((item) => item.tanggal === selectedTanggal) || null,
        [pertemuanList, selectedTanggal],
    );

    const attendanceStats = useMemo(() => {
        const rows = formAbsensi.absensi || [];
        const byStatus = rows.reduce(
            (acc, row) => {
                const key = row.status || 'tidak_hadir';
                acc[key] = (acc[key] || 0) + 1;
                return acc;
            },
            { hadir: 0, tidak_hadir: 0, izin: 0, sakit: 0 },
        );

        return {
            hadir: byStatus.hadir || 0,
            tidak_hadir: byStatus.tidak_hadir || 0,
            izin: byStatus.izin || 0,
            sakit: byStatus.sakit || 0,
        };
    }, [formAbsensi.absensi]);

    const handleCreatePertemuan = (e) => {
        e.preventDefault();
        postPertemuan(route('dosen.absensi.pertemuan.create', jadwalKuliah.id), {
            onSuccess: () => {
                resetPertemuan();
                setShowCreatePertemuan(false);
            },
        });
    };

    const handleAbsensiChange = (mahasiswaId, field, value) => {
        const updatedAbsensi = (formAbsensi.absensi || []).map((item) =>
            item.mahasiswa_id === mahasiswaId ? { ...item, [field]: value } : item,
        );
        setFormAbsensi({
            ...formAbsensi,
            absensi: updatedAbsensi,
        });
    };

    const applyStatusToAll = (status) => {
        const updatedAbsensi = (formAbsensi.absensi || []).map((item) => ({
            ...item,
            status,
        }));
        setFormAbsensi({
            ...formAbsensi,
            absensi: updatedAbsensi,
        });
    };

    const clearAllKeterangan = () => {
        const updatedAbsensi = (formAbsensi.absensi || []).map((item) => ({
            ...item,
            keterangan: '',
        }));
        setFormAbsensi({
            ...formAbsensi,
            absensi: updatedAbsensi,
        });
    };

    const handleUpdateAbsensi = (e) => {
        e.preventDefault();
        putAbsensi(route('dosen.absensi.update', jadwalKuliah.id));
    };

    /**
     * Hapus satu pertemuan beserta seluruh data absensi mahasiswa pada
     * tanggal tersebut. Endpointnya sudah ada di backend
     * (dosen.absensi.pertemuan.delete); yang belum ada sebelumnya adalah
     * tombolnya di halaman ini.
     *
     * `@tanggal` wajib dikirim sebagai query string karena route memakai
     * satu parameter (jadwalKuliah) untuk DELETE.
     */
    const confirmDeletePertemuan = () => {
        if (!pertemuanToDelete) return;

        router.delete(route('dosen.absensi.pertemuan.delete', jadwalKuliah.id), {
            data: { tanggal: pertemuanToDelete.tanggal },
            preserveScroll: true,
            onSuccess: () => {
                // Pointew yang sedang dihapus tidak boleh tetap terpilih.
                if (selectedTanggal === pertemuanToDelete.tanggal) {
                    const remaining = pertemuanList.filter((item) => item.tanggal !== pertemuanToDelete.tanggal);
                    setSelectedTanggal(remaining[0]?.tanggal || '');
                }
                setPertemuanToDelete(null);
            },
        });
    };

    return (
        <AdminLayout title="Absensi Mahasiswa">
            <Head title={`Absensi - ${jadwalKuliah.mata_kuliah?.nama_mata_kuliah || 'Kelas'}`} />

            <div className="space-y-6">
                {flash.error ? (
                    <Box variant="gray" className="!border-neutral-900 !bg-neutral-100">
                        <p className="text-sm font-semibold text-neutral-900">{flash.error}</p>
                    </Box>
                ) : null}

                {flash.message ? (
                    <Box variant="gray" className="!border-neutral-400">
                        <p className="text-sm text-neutral-800">{flash.message}</p>
                    </Box>
                ) : null}

                {Object.keys(errorsAbsensi).length > 0 ? (
                    <Box variant="gray" className="!border-neutral-900 !bg-neutral-100">
                        <p className="text-sm font-semibold text-neutral-900">Terjadi kesalahan saat menyimpan absensi.</p>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-800">
                            {Object.values(errorsAbsensi).map((error, index) => (
                                <li key={index}>{error}</li>
                            ))}
                        </ul>
                    </Box>
                ) : null}

                <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 shadow-teal-500/20 p-4 text-white shadow-lg sm:p-5">
                    <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-widest text-white/75">Manajemen Kehadiran</p>
                            <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">{jadwalKuliah.mata_kuliah?.nama_mata_kuliah}</h1>
                            <p className="mt-2 text-sm text-white/85">
                                {jadwalKuliah.mata_kuliah?.kode_mata_kuliah} • {jadwalKuliah.mata_kuliah?.sks} SKS
                            </p>
                            <p className="text-sm text-white/85">
                                {jadwalKuliah.hari}, {formatTime(jadwalKuliah.jam_mulai)} - {formatTime(jadwalKuliah.jam_selesai)} • Ruang {jadwalKuliah.ruangan}
                            </p>
                            <p className="mt-1 text-xs text-white/75">
                                Dosen: {dosen?.nama_lengkap || '-'}{periodeAktif ? ` • ${periodeAktif.nama_periode || 'Periode Aktif'}` : ''}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <ActionButton href={route('dosen.jadwal')} variant="secondary">
                                ← Kembali ke Jadwal
                            </ActionButton>
                            <ActionButton href={route('dosen.absensi.rekap', jadwalKuliah.id)} variant="secondary">
                                Lihat Rekap
                            </ActionButton>
                            <ActionButton onClick={() => setShowCreatePertemuan(true)} variant="primary">
                                + Buat Pertemuan
                            </ActionButton>
                        </div>
                    </div>
                </section>

                <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <Box>
                        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Total Mahasiswa</p>
                        <p className="mt-1 text-3xl font-bold text-neutral-900">{mahasiswas.length}</p>
                    </Box>
                    <Box>
                        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Total Pertemuan</p>
                        <p className="mt-1 text-3xl font-bold text-neutral-900">{pertemuanList.length}</p>
                    </Box>
                    <Box>
                        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Hadir (Pertemuan Dipilih)</p>
                        <p className="mt-1 text-3xl font-bold text-neutral-900">{attendanceStats.hadir}</p>
                    </Box>
                    <Box>
                        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Tidak Hadir (Pertemuan Dipilih)</p>
                        <p className="mt-1 text-3xl font-bold text-neutral-900">{attendanceStats.tidak_hadir}</p>
                    </Box>
                </section>

                <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    <div className="lg:col-span-4">
                        <Box>
                            <SectionTitle
                                action={
                                    <span className="inline-flex border border-neutral-300 px-2 py-1 text-xs font-semibold text-neutral-700">
                                        {pertemuanList.length} sesi
                                    </span>
                                }
                            >
                                Daftar Pertemuan
                            </SectionTitle>

                            {pertemuanList.length === 0 ? (
                                <div className="border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
                                    Belum ada pertemuan. Buat pertemuan pertama untuk mulai input absensi.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {pertemuanList.map((pertemuan, index) => {
                                        const selected = selectedTanggal === pertemuan.tanggal;
                                        return (
                                            <div
                                                key={`${pertemuan.tanggal}-${index}`}
                                                className={`flex items-stretch border transition ${
                                                    selected
                                                        ? 'border-neutral-900 bg-neutral-100'
                                                        : 'border-neutral-200 bg-white hover:bg-neutral-50'
                                                }`}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedTanggal(pertemuan.tanggal)}
                                                    className="flex-1 p-3 text-left"
                                                >
                                                    <p className="text-sm font-semibold text-neutral-900">Pertemuan {index + 1}</p>
                                                    <p className="mt-0.5 text-xs text-neutral-600">{formatDate(pertemuan.tanggal)}</p>
                                                    <p className="mt-1 text-xs text-neutral-500">
                                                        {formatTime(pertemuan.jam_mulai)} - {formatTime(pertemuan.jam_selesai)}
                                                    </p>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setPertemuanToDelete(pertemuan)}
                                                    title={`Hapus Pertemuan ${index + 1}`}
                                                    aria-label={`Hapus Pertemuan ${index + 1} tanggal ${pertemuan.tanggal}`}
                                                    className="flex w-11 shrink-0 items-center justify-center border-l border-neutral-200 text-neutral-400 transition hover:bg-red-50 hover:text-red-600"
                                                >
                                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={1.5}
                                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                        />
                                                    </svg>
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </Box>
                    </div>

                    <div className="lg:col-span-8">
                        {!selectedTanggal ? (
                            <Box className="p-10 text-center">
                                <p className="text-lg font-semibold text-neutral-900">Pilih Pertemuan Terlebih Dahulu</p>
                                <p className="mt-2 text-sm text-neutral-500">Pilih salah satu pertemuan di panel kiri untuk mulai mengisi absensi mahasiswa.</p>
                            </Box>
                        ) : (
                            <Box>
                                <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-neutral-200 pb-4">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Sesi Aktif</p>
                                        <h3 className="text-lg font-semibold text-neutral-900">{formatDate(selectedTanggal)}</h3>
                                        <p className="text-xs text-neutral-500">
                                            Jam {selectedPertemuan ? `${formatTime(selectedPertemuan.jam_mulai)} - ${formatTime(selectedPertemuan.jam_selesai)}` : '-'}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2 text-xs">
                                        <StatusPill status="hadir" />
                                        <StatusPill status="izin" />
                                        <StatusPill status="sakit" />
                                        <StatusPill status="tidak_hadir" />
                                    </div>
                                </div>

                                <form onSubmit={handleUpdateAbsensi} className="space-y-4">
                                    {mahasiswas.length === 0 ? (
                                        <div className="border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
                                            Belum ada mahasiswa pada kelas ini.
                                        </div>
                                    ) : (
                                        <>
                                            <Box variant="gray" className="!p-3">
                                                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600">Aksi Cepat</p>
                                                        <button
                                                            type="button"
                                                            onClick={() => applyStatusToAll('hadir')}
                                                            className="border border-neutral-300 bg-white px-2.5 py-1 text-xs font-semibold text-neutral-800 hover:bg-neutral-100"
                                                        >
                                                            Set Semua Hadir
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => applyStatusToAll('tidak_hadir')}
                                                            className="border border-neutral-900 bg-white px-2.5 py-1 text-xs font-semibold text-neutral-900 hover:bg-neutral-900 hover:text-white"
                                                        >
                                                            Set Semua Tidak Hadir
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={clearAllKeterangan}
                                                            className="border border-neutral-300 bg-white px-2.5 py-1 text-xs font-semibold text-neutral-700 hover:bg-neutral-100"
                                                        >
                                                            Kosongkan Keterangan
                                                        </button>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <StatusPill status="hadir" /> <span className="text-xs text-neutral-600">{attendanceStats.hadir}</span>
                                                        <StatusPill status="izin" /> <span className="text-xs text-neutral-600">{attendanceStats.izin}</span>
                                                        <StatusPill status="sakit" /> <span className="text-xs text-neutral-600">{attendanceStats.sakit}</span>
                                                        <StatusPill status="tidak_hadir" /> <span className="text-xs text-neutral-600">{attendanceStats.tidak_hadir}</span>
                                                    </div>
                                                </div>
                                            </Box>

                                            {mahasiswas.map((mahasiswa, index) => {
                                                const absensiItem = formAbsensi.absensi.find((a) => a.mahasiswa_id === mahasiswa.id);
                                                if (!absensiItem) return null;

                                                return (
                                                    <div key={mahasiswa.id} className="border border-neutral-200 bg-white p-4 hover:shadow-sm">
                                                        <div className="mb-3 flex items-center justify-between gap-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex h-9 w-9 items-center justify-center border border-neutral-300 bg-neutral-100 text-sm font-semibold text-neutral-800">
                                                                    {(mahasiswa.nama_lengkap || 'M').charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-semibold text-neutral-900">{mahasiswa.nama_lengkap || mahasiswa.nama || '-'}</p>
                                                                    <p className="text-xs text-neutral-500">
                                                                        {mahasiswa.nim} • {mahasiswa.prodi?.nama_prodi || '-'} • #{index + 1}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <StatusPill status={absensiItem.status || 'tidak_hadir'} />
                                                        </div>

                                                        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
                                                            <div className="lg:col-span-7">
                                                                <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-neutral-600">Status Kehadiran</label>
                                                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                                                    {STATUS_OPTIONS.map((option) => {
                                                                        const active = (absensiItem.status || 'tidak_hadir') === option.value;
                                                                        return (
                                                                            <button
                                                                                key={option.value}
                                                                                type="button"
                                                                                onClick={() => handleAbsensiChange(mahasiswa.id, 'status', option.value)}
                                                                                className={`border px-2.5 py-2 text-xs font-semibold transition ${
                                                                                    active
                                                                                        ? `${statusButtonClass[option.value]} ring-2 ring-offset-1 ring-neutral-900`
                                                                                        : `bg-white ${statusButtonClass[option.value]}`
                                                                                }`}
                                                                            >
                                                                                {option.label}
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                            <div className="lg:col-span-5">
                                                                <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-neutral-600">Keterangan</label>
                                                                <input
                                                                    type="text"
                                                                    value={absensiItem.keterangan || ''}
                                                                    onChange={(e) => handleAbsensiChange(mahasiswa.id, 'keterangan', e.target.value)}
                                                                    placeholder="Opsional: alasan izin/sakit"
                                                                    className="block w-full border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-neutral-900 focus:ring-neutral-900"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </>
                                    )}

                                    {mahasiswas.length > 0 ? (
                                        <div className="flex justify-end border-t border-neutral-200 pt-4">
                                            <button
                                                type="submit"
                                                disabled={processingAbsensi}
                                                className="border border-neutral-900 bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                {processingAbsensi ? 'Menyimpan...' : 'Simpan Absensi'}
                                            </button>
                                        </div>
                                    ) : null}
                                </form>
                            </Box>
                        )}
                    </div>
                </section>
            </div>

            {showCreatePertemuan ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md border border-neutral-200 bg-white p-5 shadow-2xl">
                        <div className="mb-4 flex items-center justify-between border-b border-neutral-200 pb-3">
                            <h3 className="text-lg font-semibold text-neutral-900">Buat Pertemuan Baru</h3>
                            <button
                                type="button"
                                onClick={() => setShowCreatePertemuan(false)}
                                className="border border-neutral-300 p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                            >
                                X
                            </button>
                        </div>

                        <form onSubmit={handleCreatePertemuan} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-neutral-800">Tanggal</label>
                                <input
                                    type="date"
                                    value={formPertemuan.tanggal}
                                    onChange={(e) => setFormPertemuan('tanggal', e.target.value)}
                                    className="block w-full border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-neutral-900 focus:ring-neutral-900"
                                    required
                                />
                                {errorsPertemuan.tanggal ? <p className="mt-1 text-xs text-neutral-900">{errorsPertemuan.tanggal}</p> : null}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-neutral-800">Jam Mulai</label>
                                    <input
                                        type="time"
                                        value={formPertemuan.jam_mulai}
                                        onChange={(e) => setFormPertemuan('jam_mulai', e.target.value)}
                                        className="block w-full border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-neutral-900 focus:ring-neutral-900"
                                        required
                                    />
                                    {errorsPertemuan.jam_mulai ? <p className="mt-1 text-xs text-neutral-900">{errorsPertemuan.jam_mulai}</p> : null}
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-neutral-800">Jam Selesai</label>
                                    <input
                                        type="time"
                                        value={formPertemuan.jam_selesai}
                                        onChange={(e) => setFormPertemuan('jam_selesai', e.target.value)}
                                        className="block w-full border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-neutral-900 focus:ring-neutral-900"
                                        required
                                    />
                                    {errorsPertemuan.jam_selesai ? <p className="mt-1 text-xs text-neutral-900">{errorsPertemuan.jam_selesai}</p> : null}
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <ActionButton onClick={() => setShowCreatePertemuan(false)} variant="secondary">
                                    Batal
                                </ActionButton>
                                <ActionButton type="submit" variant="primary">
                                    {processingPertemuan ? 'Membuat...' : 'Buat Pertemuan'}
                                </ActionButton>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}

            {pertemuanToDelete ? (
                <Modal show={Boolean(pertemuanToDelete)} onClose={() => setPertemuanToDelete(null)} maxWidth="md">
                    <div className="border border-[#e4e4e7] bg-white p-6">
                        <div className="mb-4 flex items-center">
                            <div className="mr-3 flex h-10 w-10 items-center justify-center border border-red-100 bg-red-50">
                                <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-sm font-bold uppercase tracking-wider text-black">Konfirmasi Hapus Pertemuan</h3>
                        </div>
                        <p className="mb-2 text-sm text-neutral-600">
                            Apakah Anda yakin ingin menghapus pertemuan tanggal{' '}
                            <span className="font-semibold text-neutral-900">{formatDate(pertemuanToDelete.tanggal)}</span>?
                        </p>
                        <p className="mb-6 text-sm text-neutral-600">
                            Seluruh data absensi mahasiswa pada pertemuan tersebut ({(absensiData[pertemuanToDelete.tanggal] || []).length} catatan)
                            akan ikut terhapus. Tindakan ini tidak dapat dibatalkan.
                        </p>
                        <div className="flex justify-end gap-2">
                            <ActionButton onClick={() => setPertemuanToDelete(null)} variant="secondary">
                                Batal
                            </ActionButton>
                            <ActionButton onClick={confirmDeletePertemuan} variant="danger">
                                Hapus Pertemuan
                            </ActionButton>
                        </div>
                    </div>
                </Modal>
            ) : null}
        </AdminLayout>
    );
}
