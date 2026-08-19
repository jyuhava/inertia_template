import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';

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

function StatCard({ label, value, note, variant = 'white' }) {
    return (
        <Box variant={variant} className="relative overflow-hidden">
            <div className="absolute right-0 top-0 h-10 w-10 bg-neutral-100" />
            <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">{label}</p>
            <p className="mt-2 text-3xl font-bold">{value}</p>
            {note ? <p className="mt-2 text-xs text-neutral-400">{note}</p> : null}
        </Box>
    );
}

export default function Index({ courses }) {
    const totalCourses = courses.length;

    return (
        <AdminLayout title="LMS Mahasiswa">
            <Head title="LMS - Dashboard" />

            <div className="space-y-6">
                <Box variant="black" className="relative overflow-hidden">
                    <div className="absolute right-0 top-0 h-24 w-24 bg-neutral-800" />
                    <div className="absolute bottom-0 left-0 h-16 w-16 bg-neutral-800" />
                    <div className="relative">
                        <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">Learning Center</p>
                        <h1 className="mt-2 text-2xl font-bold md:text-3xl">Kelas LMS Saya</h1>
                        <p className="mt-2 max-w-2xl text-sm text-neutral-300">
                            Akses semua materi, tugas, dan progres pembelajaran Anda pada semester aktif.
                        </p>
                    </div>
                </Box>

                <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <StatCard label="Total Kelas LMS" value={totalCourses} />
                    <StatCard label="Status" value="Aktif" variant="black" />
                    <StatCard label="Akses" value="24/7" />
                </section>

                {courses.length === 0 ? (
                    <div className="border border-dashed border-neutral-300 bg-white p-12 text-center text-sm text-neutral-500">
                        Belum ada kelas yang terintegrasi dengan LMS untuk akun Anda.
                    </div>
                ) : (
                    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {courses.map((course) => (
                            <Link
                                key={course.id}
                                href={route('mahasiswa.lms.show', course.id)}
                                className="overflow-hidden bg-white shadow-sm ring-1 ring-neutral-200 transition hover:-translate-y-0.5 hover:shadow-md"
                            >
                                <div className="h-28 bg-neutral-900">
                                    {course.thumbnail ? (
                                        <img src={course.thumbnail} alt={course.mata_kuliah} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-2xl font-bold text-white">{course.kode}</div>
                                    )}
                                </div>
                                <div className="p-5">
                                    <h3 className="text-base font-bold text-neutral-900">{course.mata_kuliah}</h3>
                                    <p className="mt-1 text-xs text-neutral-500">Dosen: {course.dosen}</p>
                                    <p className="mt-3 line-clamp-3 text-sm text-neutral-600">{course.description || 'Tidak ada deskripsi kursus.'}</p>
                                    <div className="mt-4 inline-flex bg-neutral-900 px-2.5 py-1 text-xs font-bold text-white">Masuk Kelas</div>
                                </div>
                            </Link>
                        ))}
                    </section>
                )}
            </div>
        </AdminLayout>
    );
}
