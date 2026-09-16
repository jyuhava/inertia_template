import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';

function Box({ children, className = '', padded = true, variant = 'white' }) {
    const variants = {
        white: 'bg-white border-[#e5e5e5]',
        black: 'bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 border-transparent text-white rounded-2xl shadow-lg shadow-violet-500/20',
        gray: 'bg-[#f4f4f5] border-[#e5e5e5]',
        outline: 'bg-transparent border-[#e5e5e5]',
    };
    return (
        <div className={`border ${variants[variant]} ${padded ? 'p-5 sm:p-6' : ''} ${className}`}>
            {children}
        </div>
    );
}

function SectionTitle({ children, action }) {
    return (
        <div className="mb-4 flex items-center justify-between border-b border-[#e5e5e5] pb-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-black">{children}</h2>
            {action ? <div>{action}</div> : null}
        </div>
    );
}

function StatCard({ title, value }) {
    return (
        <Box className="relative overflow-hidden">
            <p className="text-[10px] uppercase tracking-widest text-neutral-500">{title}</p>
            <p className="mt-2 text-3xl font-bold text-black">{value}</p>
        </Box>
    );
}

export default function Index({ schedules }) {
    const handleActivate = (jadwalId) => {
        router.post(route('dosen.lms.store'), {
            jadwal_kuliah_id: jadwalId,
        });
    };

    const totalKelas = schedules.length;
    const activeLms = schedules.filter((item) => item.lms_course).length;
    const pendingLms = totalKelas - activeLms;
    const totalMahasiswa = schedules.reduce((sum, item) => sum + Number(item.jumlah_mahasiswa_aktual || 0), 0);

    return (
        <AdminLayout title="LMS Dosen">
            <Head title="LMS - Kursus Saya" />

            <div className="space-y-6">
                <section className="border border-black bg-black p-6 text-white sm:p-8">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-400">Learning Management</p>
                            <h1 className="mt-2 text-2xl font-bold uppercase tracking-tight sm:text-3xl">Kelas LMS Dosen</h1>
                            <p className="mt-2 max-w-2xl text-xs text-neutral-400">
                                Aktifkan LMS untuk setiap jadwal mengajar, lalu kelola bab, materi, dan tugas dalam satu panel.
                            </p>
                        </div>
                        <div className="border border-white/30 bg-white/10 px-4 py-3 text-xs text-neutral-300 backdrop-blur">
                            Status integrasi LMS diperbarui otomatis berdasarkan kelas aktif Anda.
                        </div>
                    </div>
                </section>

                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard title="Total Kelas" value={totalKelas} />
                    <StatCard title="LMS Aktif" value={activeLms} />
                    <StatCard title="Belum Aktif" value={pendingLms} />
                    <StatCard title="Total Mahasiswa" value={totalMahasiswa} />
                </section>

                {schedules.length === 0 ? (
                    <Box className="text-center">
                        <p className="text-sm text-neutral-500">Anda belum memiliki jadwal aktif untuk dikelola di LMS.</p>
                    </Box>
                ) : (
                    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {schedules.map((schedule) => {
                            const isActive = !!schedule.lms_course;
                            return (
                                <Box key={schedule.id} className="flex flex-col">
                                    <div className="mb-4 flex items-start justify-between gap-3">
                                        <div>
                                            <h3 className="text-sm font-bold uppercase tracking-wider text-black">
                                                {schedule.mata_kuliah?.nama_mata_kuliah || `MK ID ${schedule.mata_kuliah_id}`}
                                            </h3>
                                            <p className="text-[10px] uppercase tracking-widest text-neutral-500">
                                                {schedule.mata_kuliah?.kode_mata_kuliah || '-'} • {schedule.mata_kuliah?.sks || 0} SKS
                                            </p>
                                        </div>
                                        <span
                                            className={`border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest ${
                                                isActive ? 'border-black bg-black text-white' : 'border-[#e5e5e5] bg-white text-black'
                                            }`}
                                        >
                                            {isActive ? 'Aktif' : 'Belum Aktif'}
                                        </span>
                                    </div>

                                    <div className="space-y-1 border border-[#e5e5e5] bg-[#f4f4f5] p-3 text-xs text-neutral-600">
                                        <p>
                                            <span className="font-semibold text-black">Jadwal:</span> {schedule.hari}, {String(schedule.jam_mulai || '-').slice(0, 5)} -{' '}
                                            {String(schedule.jam_selesai || '-').slice(0, 5)}
                                        </p>
                                        <p>
                                            <span className="font-semibold text-black">Ruang:</span> {schedule.ruangan || '-'}
                                        </p>
                                        <p>
                                            <span className="font-semibold text-black">Mahasiswa:</span> {schedule.jumlah_mahasiswa_aktual || 0}/{schedule.kapasitas || 0}
                                        </p>
                                    </div>

                                    <div className="mt-auto pt-4 flex justify-end">
                                        {isActive ? (
                                            <Link
                                                href={route('dosen.lms.show', schedule.lms_course.id)}
                                                className="border border-black bg-black px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-white hover:text-black"
                                            >
                                                Kelola Kelas
                                            </Link>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => handleActivate(schedule.id)}
                                                className="border border-[#e5e5e5] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-black transition hover:border-black hover:bg-neutral-100"
                                            >
                                                Aktifkan LMS
                                            </button>
                                        )}
                                    </div>
                                </Box>
                            );
                        })}
                    </section>
                )}
            </div>
        </AdminLayout>
    );
}
