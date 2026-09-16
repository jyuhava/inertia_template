import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';

function Box({ children, className = '', padded = true, variant = 'white' }) {
    const variants = {
        white: 'bg-white border-[#e5e5e5]',
        black: 'bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 border-transparent text-white rounded-2xl shadow-lg shadow-violet-500/20',
        gray: 'bg-[#f5f5f5] border-[#e5e5e5]',
    };
    return (
        <div className={`border ${variants[variant]} ${padded ? 'p-6' : ''} ${className}`}>
            {children}
        </div>
    );
}

function SectionTitle({ children, action }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-900">{children}</h2>
            {action && <div>{action}</div>}
        </div>
    );
}

function ActionButton({ children, href, onClick, variant = 'primary', type = 'button' }) {
    const map = {
        primary: 'bg-black text-white border-black hover:bg-neutral-800',
        secondary: 'bg-white text-black border-[#ccc] hover:bg-[#f5f5f5]',
        danger: 'bg-white text-red-600 border-red-200 hover:bg-red-50',
        ghost: 'bg-transparent text-neutral-500 border-transparent hover:text-black',
    };
    const base = 'inline-flex items-center justify-center px-4 py-2 text-[10px] font-bold uppercase tracking-widest border transition-colors duration-200';
    if (href) {
        return (
            <Link href={href} className={`${base} ${map[variant]}`}>
                {children}
            </Link>
        );
    }
    return (
        <button type={type} onClick={onClick} className={`${base} ${map[variant]}`}>
            {children}
        </button>
    );
}

function StatCard({ label, value }) {
    return (
        <Box className="flex items-center gap-3">
            <div className="w-2 h-8 bg-black"></div>
            <div>
                <div className="text-2xl font-bold text-neutral-900 leading-none">{value}</div>
                <div className="text-[10px] uppercase tracking-widest text-neutral-500 mt-1">{label}</div>
            </div>
        </Box>
    );
}

export default function Index({ courses }) {
    const totalCourses = courses.length;
    const totalChapters = courses.reduce((sum, c) => sum + Number(c.chapters_count || 0), 0);
    const uniqueProdi = [...new Set(courses.map((c) => c.jadwal_kuliah?.mata_kuliah?.prodi?.nama_prodi).filter(Boolean))].length;

    return (
        <AdminLayout title="LMS Admin">
            <Head title="LMS - Semua Kursus" />

            <div className="p-6 lg:p-8 min-h-dvh bg-[#fafafa]">
                <Box variant="black" className="mb-6">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/75 mb-1">Kontrol LMS</p>
                        <h1 className="text-xl font-bold uppercase tracking-tight text-white">Daftar Kursus LMS</h1>
                        <p className="mt-2 text-xs text-white/85 max-w-2xl">
                            Pantau seluruh kursus LMS lintas prodi, dosen, dan kelas dari panel admin.
                        </p>
                    </div>
                </Box>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <StatCard label="Total Kursus" value={totalCourses} />
                    <StatCard label="Total Bab" value={totalChapters} />
                    <StatCard label="Prodi Terlibat" value={uniqueProdi} />
                </div>

                <Box>
                    <SectionTitle action={
                        <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest bg-[#f5f5f5] border border-[#e5e5e5] text-neutral-700">
                            {totalCourses} kursus
                        </span>
                    }>
                        Kursus Aktif LMS
                    </SectionTitle>

                    {courses.length === 0 ? (
                        <div className="text-center py-12 border border-[#e5e5e5]">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-900">Belum ada kursus LMS</h3>
                            <p className="mt-2 text-xs text-neutral-500">Belum ada kursus LMS yang aktif.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto border border-[#e5e5e5]">
                            <table className="min-w-full text-left table-cards">
                                <thead className="bg-[#f5f5f5] border-b border-[#e5e5e5]">
                                    <tr>
                                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Mata Kuliah</th>
                                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Dosen</th>
                                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Prodi</th>
                                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Jumlah Bab</th>
                                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#e5e5e5]">
                                    {courses.map((course) => (
                                        <tr key={course.id} className="hover:bg-[#fafafa]">
                                            <td data-label="Mata Kuliah" className="px-4 py-3">
                                                <p className="text-sm font-semibold text-neutral-900">{course.jadwal_kuliah?.mata_kuliah?.nama_mata_kuliah || '-'}</p>
                                                <p className="text-xs text-neutral-500">{course.jadwal_kuliah?.mata_kuliah?.kode_mata_kuliah || '-'}</p>
                                            </td>
                                            <td data-label="Dosen" className="px-4 py-3 text-sm text-neutral-600">{course.jadwal_kuliah?.dosen?.nama_lengkap || '-'}</td>
                                            <td data-label="Prodi" className="px-4 py-3 text-sm text-neutral-600">{course.jadwal_kuliah?.mata_kuliah?.prodi?.nama_prodi || '-'}</td>
                                            <td data-label="Jumlah Bab" className="px-4 py-3 text-sm text-neutral-600">{course.chapters_count || 0} Bab</td>
                                            <td data-label="Aksi" className="px-4 py-3 text-right">
                                                <ActionButton href={route('admin.lms-courses.show', course.id)} variant="primary">Lihat Detail</ActionButton>
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
