import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import TextInput from '@/Components/TextInput';

function Box({ children, className = '', padded = true, variant = 'white' }) {
    const variants = {
        white: 'bg-white border-[#e4e4e7]',
        dark: 'bg-gradient-to-br from-slate-800 via-indigo-700 to-indigo-600 border-transparent text-white rounded-2xl shadow-lg shadow-indigo-500/20',
        accent: 'bg-black text-white border-black'
    };
    return (
        <div className={`border ${variants[variant]} ${padded ? 'p-5' : ''} ${className}`}>
            {children}
        </div>
    );
}

function SectionTitle({ children, action }) {
    return (
        <div className="flex items-center justify-between mb-5">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">{children}</h2>
            {action && <div>{action}</div>}
        </div>
    );
}

function ActionButton({ children, href, onClick, variant = 'primary', type = 'button' }) {
    const map = {
        primary: 'bg-black text-white border-black hover:bg-neutral-800',
        secondary: 'bg-white text-black border-[#e4e4e7] hover:border-black',
        danger: 'bg-white text-red-600 border-[#e4e4e7] hover:border-red-600 hover:bg-red-50',
        ghost: 'bg-transparent text-neutral-500 border-transparent hover:text-black'
    };
    const className = `inline-flex items-center justify-center px-4 py-2 text-[11px] font-semibold uppercase tracking-widest border transition-colors duration-200 ${map[variant]}`;
    if (href) {
        return <Link href={href} className={className}>{children}</Link>;
    }
    return (
        <button type={type} onClick={onClick} className={className}>
            {children}
        </button>
    );
}

const statusMap = {
    draft: { label: 'Draft', cls: 'bg-neutral-100 text-neutral-600 border-[#e4e4e7]' },
    aktif: { label: 'Aktif', cls: 'bg-black text-white border-black' },
    ditutup: { label: 'Ditutup', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    selesai: { label: 'Selesai', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

export default function Index({ programs, filters }) {
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('admin.lpm.programs.index'), { search }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleAction = (program, action, confirmMsg) => {
        if (confirmMsg && !confirm(confirmMsg)) return;
        const map = {
            activate: 'admin.lpm.programs.activate',
            close: 'admin.lpm.programs.close',
            reopen: 'admin.lpm.programs.reopen',
            finalize: 'admin.lpm.programs.finalize',
        };
        router.post(route(map[action], program.id));
    };

    const handleDelete = (program) => {
        if (confirm('Apakah Anda yakin ingin menghapus program ini?')) {
            router.delete(route('admin.lpm.programs.destroy', program.id));
        }
    };

    return (
        <AdminLayout title="Program Pengabdian">
            <Head title="Program Pengabdian" />

            <div className="space-y-6">
                <Box variant="dark" className="relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-neutral-400 mb-2">LPM</p>
                        <h1 className="text-2xl font-bold tracking-tight text-white">PROGRAM PENGABDIAN</h1>
                        <p className="text-sm text-neutral-400 mt-1">Kelola program, skema, dan periode penerimaan proposal pengabdian kepada masyarakat</p>
                    </div>
                </Box>

                <Box>
                    <SectionTitle action={<ActionButton href={route('admin.lpm.programs.create')} variant="primary">+ Tambah Program</ActionButton>}>
                        Daftar Program
                    </SectionTitle>

                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                            <TextInput
                                type="text"
                                placeholder="Cari nama program, skema, atau tahun anggaran..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full border-[#e4e4e7] focus:border-black focus:ring-black rounded-none"
                            />
                        </div>
                        <div className="flex gap-2">
                            <ActionButton type="submit" variant="primary">Cari</ActionButton>
                            {filters.search && (
                                <ActionButton
                                    onClick={() => {
                                        setSearch('');
                                        router.get(route('admin.lpm.programs.index'), {}, {
                                            preserveState: true,
                                            preserveScroll: true,
                                        });
                                    }}
                                    variant="secondary"
                                >
                                    Reset
                                </ActionButton>
                            )}
                        </div>
                    </form>
                </Box>

                <Box padded={false} className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-[#e4e4e7] table-cards">
                            <thead className="bg-[#fafafa]">
                                <tr>
                                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Program</th>
                                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Skema</th>
                                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Tahun</th>
                                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Periode</th>
                                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Pagu Dana</th>
                                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Proposal</th>
                                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Status</th>
                                    <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-[#e4e4e7]">
                                {programs.data.map((program) => (
                                    <tr key={program.id} className="hover:bg-[#fafafa] transition-colors">
                                        <td data-label="Program" className="px-5 py-4 whitespace-nowrap text-sm font-medium text-black">{program.nama_program}</td>
                                        <td data-label="Skema" className="px-5 py-4 whitespace-nowrap text-sm text-neutral-700">{program.skema}</td>
                                        <td data-label="Tahun" className="px-5 py-4 whitespace-nowrap text-sm text-neutral-700">{program.tahun_anggaran}</td>
                                        <td data-label="Periode" className="px-5 py-4 whitespace-nowrap text-xs text-neutral-500">
                                            {program.tanggal_buka} — {program.tanggal_tutup}
                                        </td>
                                        <td data-label="Pagu Dana" className="px-5 py-4 whitespace-nowrap text-sm text-neutral-700">
                                            Rp {Number(program.pagu_dana || 0).toLocaleString('id-ID')}
                                        </td>
                                        <td data-label="Proposal" className="px-5 py-4 whitespace-nowrap text-sm font-semibold text-black">{program.proposals_count}</td>
                                        <td data-label="Status" className="px-5 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-3 py-1 text-[10px] font-semibold uppercase tracking-wider border ${statusMap[program.status]?.cls || statusMap.draft.cls}`}>
                                                {statusMap[program.status]?.label || program.status}
                                            </span>
                                        </td>
                                        <td data-label="Aksi" className="px-5 py-4 whitespace-nowrap text-right">
                                            <div className="flex justify-end gap-2 flex-wrap">
                                                {program.status === 'draft' && (
                                                    <ActionButton onClick={() => handleAction(program, 'activate')} variant="primary" size="sm">Buka</ActionButton>
                                                )}
                                                {program.status === 'aktif' && (
                                                    <ActionButton onClick={() => handleAction(program, 'close', 'Tutup program ini?')} variant="secondary" size="sm">Tutup</ActionButton>
                                                )}
                                                {program.status === 'ditutup' && (
                                                    <ActionButton onClick={() => handleAction(program, 'reopen')} variant="secondary" size="sm">Buka Lagi</ActionButton>
                                                )}
                                                {(program.status === 'aktif' || program.status === 'ditutup') && (
                                                    <ActionButton onClick={() => handleAction(program, 'finalize', 'Tandai program selesai?')} variant="ghost" size="sm">Selesai</ActionButton>
                                                )}
                                                <ActionButton href={route('admin.lpm.programs.edit', program.id)} variant="secondary" size="sm">Edit</ActionButton>
                                                <ActionButton onClick={() => handleDelete(program)} variant="danger" size="sm">Hapus</ActionButton>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {programs.data.length === 0 && (
                                    <tr className="table-cards-empty">
                                        <td colSpan="8" className="px-5 py-12 text-center text-sm text-neutral-500">
                                            Tidak ada data program.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {programs.links && (
                        <div className="px-5 py-4 border-t border-[#e4e4e7] flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-xs text-neutral-500 uppercase tracking-wider">
                                Menampilkan {programs.from} sampai {programs.to} dari {programs.total} data
                            </div>
                            <div className="flex gap-1">
                                {programs.links.map((link, key) => (
                                    link.url ? (
                                        <Link
                                            key={key}
                                            href={link.url}
                                            className={`px-3 py-2 text-xs font-medium border transition-colors ${
                                                link.active
                                                    ? 'bg-black text-white border-black'
                                                    : 'bg-white text-neutral-700 border-[#e4e4e7] hover:border-black hover:text-black'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ) : (
                                        <span
                                            key={key}
                                            className="px-3 py-2 text-xs font-medium border bg-[#fafafa] text-neutral-400 border-[#e4e4e7] cursor-not-allowed"
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    )
                                ))}
                            </div>
                        </div>
                    )}
                </Box>
            </div>
        </AdminLayout>
    );
}