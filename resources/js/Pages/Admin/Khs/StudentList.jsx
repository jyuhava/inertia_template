import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import Pagination from '@/Components/Pagination';

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

export default function StudentList({ mahasiswas, filters }) {
    const { data, setData, get, processing } = useForm({
        search: filters.search || '',
    });

    const onSearch = (e) => {
        e.preventDefault();
        get(route('admin.khs.student-list'), { preserveState: true });
    };

    return (
        <AdminLayout>
            <Head title="Daftar Mahasiswa - KHS" />

            <div className="p-6 lg:p-8 min-h-dvh bg-[#fafafa]">
                <Box variant="black" className="mb-6">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/75 mb-1">Manajemen Akademik</p>
                        <h1 className="text-xl font-bold uppercase tracking-tight text-white">Daftar Mahasiswa (KHS)</h1>
                    </div>
                </Box>

                <Box>
                    <SectionTitle>
                        Pilih Mahasiswa
                    </SectionTitle>

                    <form onSubmit={onSearch} className="flex gap-3 mb-6">
                        <input
                            type="text"
                            value={data.search}
                            onChange={e => setData('search', e.target.value)}
                            placeholder="Cari NIM, Nama, atau Prodi..."
                            className="flex-1 px-3 py-2 text-xs border border-[#ccc] bg-white focus:outline-none focus:border-black"
                        />
                        <ActionButton type="submit" variant="primary" disabled={processing}>Cari</ActionButton>
                        {filters.search && (
                            <ActionButton href={route('admin.khs.student-list')} variant="secondary">Reset</ActionButton>
                        )}
                    </form>

                    <div className="overflow-x-auto border border-[#e5e5e5]">
                        <table className="min-w-full text-left table-cards">
                            <thead className="bg-[#f5f5f5] border-b border-[#e5e5e5]">
                                <tr>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500">NIM</th>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Nama Lengkap</th>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Program Studi</th>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Angkatan</th>
                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#e5e5e5]">
                                {mahasiswas.data.length === 0 ? (
                                    <tr className="table-cards-empty">
                                        <td colSpan="5" className="px-4 py-8 text-center text-xs text-neutral-400 uppercase tracking-widest">
                                            Tidak ada data mahasiswa ditemukan.
                                        </td>
                                    </tr>
                                ) : (
                                    mahasiswas.data.map((mahasiswa) => (
                                        <tr key={mahasiswa.id} className="hover:bg-[#fafafa]">
                                            <td data-label="NIM" className="px-4 py-3 text-sm font-semibold text-neutral-900">{mahasiswa.nim}</td>
                                            <td data-label="Nama Lengkap" className="px-4 py-3 text-sm text-neutral-900">{mahasiswa.nama_lengkap}</td>
                                            <td data-label="Program Studi" className="px-4 py-3 text-sm text-neutral-600">{mahasiswa.prodi?.nama_prodi}</td>
                                            <td data-label="Angkatan" className="px-4 py-3 text-sm text-neutral-600">{mahasiswa.angkatan}</td>
                                            <td data-label="Aksi" className="px-4 py-3 text-right">
                                                <ActionButton href={route('admin.mahasiswa.khs.index', mahasiswa.id)} variant="primary">Lihat KHS</ActionButton>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-6">
                        <Pagination links={mahasiswas.links} />
                    </div>
                </Box>
            </div>
        </AdminLayout>
    );
}
