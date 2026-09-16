import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { useMemo } from 'react';

function Box({ children, className = '', padded = true, variant = 'white' }) {
    const variants = {
        white: 'bg-white border-neutral-200',
        gray: 'bg-neutral-50 border-neutral-200',
        black: 'bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 border-transparent text-white rounded-2xl shadow-lg shadow-violet-500/20',
    };
    return (
        <div className={`border ${variants[variant]} ${padded ? 'p-6' : ''} ${className}`}>
            {children}
        </div>
    );
}

function SectionTitle({ children, action, light = false }) {
    return (
        <div className="flex items-center justify-between mb-4">
            <h3 className={`text-xs font-bold uppercase tracking-widest ${light ? 'text-neutral-300' : 'text-neutral-900'}`}>{children}</h3>
            {action && <div>{action}</div>}
        </div>
    );
}

function ActionButton({ children, href, onClick, variant = 'primary', type = 'button' }) {
    const map = {
        primary: 'bg-black text-white border-black hover:bg-neutral-800',
        secondary: 'bg-white text-neutral-900 border-neutral-300 hover:bg-neutral-50',
    };
    const className = `inline-flex items-center border px-4 py-2 text-[11px] font-bold uppercase tracking-widest transition-colors ${map[variant]}`;
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

function StatCard({ label, value }) {
    return (
        <Box>
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">{label}</p>
            <p className="text-3xl font-bold text-neutral-900">{value}</p>
        </Box>
    );
}

function Badge({ children, variant = 'default' }) {
    const map = {
        default: 'bg-neutral-100 text-neutral-700 border-neutral-200',
        active: 'bg-black text-white border-black',
        inactive: 'bg-white text-neutral-500 border-neutral-300',
    };
    return (
        <span className={`inline-flex border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${map[variant]}`}>
            {children}
        </span>
    );
}

function ContentBox({ title, empty, children }) {
    return (
        <Box className="h-full">
            <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-900 mb-4">{title}</h4>
            {empty ? (
                <div className="border border-dashed border-neutral-300 bg-neutral-50 p-4 text-xs text-neutral-500 text-center">
                    {empty}
                </div>
            ) : (
                <div className="space-y-3">{children}</div>
            )}
        </Box>
    );
}

function ContentItem({ title, subtitle, meta }) {
    return (
        <div className="border border-neutral-200 p-3 hover:bg-neutral-50 transition-colors">
            <p className="text-sm font-semibold text-neutral-900">{title}</p>
            {subtitle && <p className="mt-0.5 text-xs text-neutral-500">{subtitle}</p>}
            {meta && <div className="mt-2 flex flex-wrap gap-2">{meta}</div>}
        </div>
    );
}

export default function Show({ course }) {
    const chapters = course?.chapters || [];
    const totalMaterials = useMemo(() => chapters.reduce((sum, c) => sum + (c.materials?.length || 0), 0), [chapters]);
    const totalAssignments = useMemo(() => chapters.reduce((sum, c) => sum + (c.assignments?.length || 0), 0), [chapters]);
    const totalForums = useMemo(() => chapters.reduce((sum, c) => sum + (c.forums?.length || 0), 0), [chapters]);

    return (
        <AdminLayout title="Detail Kelas LMS">
            <Head title={`LMS - ${course.jadwal_kuliah?.mata_kuliah?.nama_mata_kuliah || 'Kelas'}`} />

            <div className="space-y-6">
                {/* Header */}
                <Box variant="black" className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/75 mb-2">Pantauan Kelas LMS</p>
                        <h1 className="text-2xl font-bold text-white">{course.jadwal_kuliah?.mata_kuliah?.nama_mata_kuliah}</h1>
                        <p className="mt-2 text-sm text-white/85">
                            {course.jadwal_kuliah?.mata_kuliah?.kode_mata_kuliah} • {course.jadwal_kuliah?.hari},{' '}
                            {String(course.jadwal_kuliah?.jam_mulai || '-').slice(0, 5)} - {String(course.jadwal_kuliah?.jam_selesai || '-').slice(0, 5)}
                        </p>
                        <p className="text-xs text-white/75 mt-1">Dosen: {course.jadwal_kuliah?.dosen?.nama_lengkap || '-'}</p>
                        <p className="text-xs text-white/75">Program Studi: {course.jadwal_kuliah?.mata_kuliah?.prodi?.nama_prodi || '-'}</p>
                    </div>
                    <ActionButton href={route('admin.lms-courses.index')} variant="secondary">
                        ← Kembali ke Daftar
                    </ActionButton>
                </Box>

                {/* Stats */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <StatCard label="Total Topik" value={chapters.length} />
                    <StatCard label="Materi" value={totalMaterials} />
                    <StatCard label="Tugas" value={totalAssignments} />
                    <StatCard label="Forum" value={totalForums} />
                </div>

                {/* Chapters */}
                {chapters.length === 0 ? (
                    <Box className="text-center">
                        <p className="text-sm text-neutral-500">Dosen belum menambahkan topik materi ke dalam kelas LMS ini.</p>
                    </Box>
                ) : (
                    <div className="space-y-4">
                        {chapters.map((chapter, index) => (
                            <Box key={chapter.id}>
                                <div className="mb-6 border-b border-neutral-200 pb-4">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">Topik {index + 1}</p>
                                    <h2 className="text-lg font-bold text-neutral-900">{chapter.title}</h2>
                                    <p className="text-xs text-neutral-500 mt-1">
                                        {chapter.materials?.length || 0} materi • {chapter.assignments?.length || 0} tugas • {chapter.forums?.length || 0} forum
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                                    <ContentBox
                                        title="Materi Pembelajaran"
                                        empty={(chapter.materials || []).length === 0 ? 'Belum ada materi.' : null}
                                    >
                                        {(chapter.materials || []).map((material) => (
                                            <ContentItem
                                                key={material.id}
                                                title={material.title}
                                                subtitle={material.type?.toUpperCase()}
                                            />
                                        ))}
                                    </ContentBox>

                                    <ContentBox
                                        title="Tugas dan Evaluasi"
                                        empty={(chapter.assignments || []).length === 0 ? 'Belum ada tugas.' : null}
                                    >
                                        {(chapter.assignments || []).map((assignment) => (
                                            <ContentItem
                                                key={assignment.id}
                                                title={assignment.title}
                                                subtitle={
                                                    assignment.deadline
                                                        ? `Deadline: ${new Date(assignment.deadline).toLocaleString('id-ID')}`
                                                        : 'Tanpa deadline'
                                                }
                                                meta={[
                                                    <Badge key="komponen" variant="default">{assignment.komponen || 'harian'}</Badge>,
                                                    <Badge key="bobot" variant="default">Bobot {assignment.bobot_komponen || 1}</Badge>,
                                                ]}
                                            />
                                        ))}
                                    </ContentBox>

                                    <ContentBox
                                        title="Forum Diskusi"
                                        empty={(chapter.forums || []).length === 0 ? 'Belum ada forum.' : null}
                                    >
                                        {(chapter.forums || []).map((forum) => (
                                            <ContentItem
                                                key={forum.id}
                                                title={forum.title}
                                                meta={[
                                                    <Badge key="status" variant={forum.is_active ? 'active' : 'inactive'}>
                                                        {forum.is_active ? 'Aktif' : 'Nonaktif'}
                                                    </Badge>,
                                                    <Badge key="threads" variant="default">{forum.threads_count || 0} thread</Badge>,
                                                ]}
                                            />
                                        ))}
                                    </ContentBox>
                                </div>
                            </Box>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
