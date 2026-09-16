import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';

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

export default function Form({ program, defaultCriteria }) {
    const isEdit = Boolean(program);

    const form = useForm({
        nama_program: program?.nama_program || '',
        skema: program?.skema || '',
        tahun_anggaran: program?.tahun_anggaran || '',
        tanggal_buka: program?.tanggal_buka || '',
        tanggal_tutup: program?.tanggal_tutup || '',
        pagu_dana: program?.pagu_dana ?? '',
        maksimal_dana: program?.maksimal_dana ?? '',
        sumber_dana: program?.sumber_dana || '',
        persyaratan: program?.persyaratan || '',
        status: program?.status || 'draft',
        review_scheme: {
            minimum_score: program?.review_scheme?.minimum_score ?? 70,
            reviewer_count: program?.review_scheme?.reviewer_count ?? 2,
            criteria: (program?.review_scheme?.criteria || []).map((c) => ({
                id: c.id,
                nama_kriteria: c.nama_kriteria,
                bobot: c.bobot,
            })),
        },
    });

    const addCriterion = (nama = '', bobot = 10) => {
        form.setData('review_scheme.criteria', [
            ...form.data.review_scheme.criteria,
            { id: null, nama_kriteria: nama, bobot },
        ]);
    };

    const removeCriterion = (index) => {
        const criteria = form.data.review_scheme.criteria.filter((_, i) => i !== index);
        form.setData('review_scheme.criteria', criteria);
    };

    const submit = (e) => {
        e.preventDefault();
        if (isEdit) {
            form.put(route('admin.lpm.programs.update', program.id), { preserveScroll: true });
        } else {
            form.post(route('admin.lpm.programs.store'), { preserveScroll: true });
        }
    };

    return (
        <AdminLayout title={isEdit ? 'Edit Program' : 'Tambah Program'}>
            <Head title={isEdit ? 'Edit Program Pengabdian' : 'Tambah Program Pengabdian'} />

            <div className="space-y-6">
                <Box variant="dark" className="relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-neutral-400 mb-2">LPM</p>
                        <h1 className="text-2xl font-bold tracking-tight text-white">
                            {isEdit ? 'EDIT PROGRAM PENGABDIAN' : 'TAMBAH PROGRAM PENGABDIAN'}
                        </h1>
                        <p className="text-sm text-neutral-400 mt-1">Lengkapi data program beserta skema penilaian review</p>
                    </div>
                </Box>

                <form onSubmit={submit}>
                    <div className="space-y-6">
                        {/* Info Program */}
                        <Box>
                            <SectionTitle>Informasi Program</SectionTitle>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <InputLabel htmlFor="nama_program" value="Nama Program" />
                                    <TextInput
                                        id="nama_program"
                                        type="text"
                                        className="mt-1 block w-full border-[#e4e4e7] focus:border-black focus:ring-black rounded-none"
                                        value={form.data.nama_program}
                                        onChange={(e) => form.setData('nama_program', e.target.value)}
                                    />
                                    <InputError message={form.errors.nama_program} className="mt-1" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="skema" value="Skema" />
                                    <TextInput
                                        id="skema"
                                        type="text"
                                        placeholder="mis. Pengabdian Mandiri, Internal, dll."
                                        className="mt-1 block w-full border-[#e4e4e7] focus:border-black focus:ring-black rounded-none"
                                        value={form.data.skema}
                                        onChange={(e) => form.setData('skema', e.target.value)}
                                    />
                                    <InputError message={form.errors.skema} className="mt-1" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="tahun_anggaran" value="Tahun Anggaran" />
                                    <TextInput
                                        id="tahun_anggaran"
                                        type="text"
                                        placeholder="mis. 2025"
                                        className="mt-1 block w-full border-[#e4e4e7] focus:border-black focus:ring-black rounded-none"
                                        value={form.data.tahun_anggaran}
                                        onChange={(e) => form.setData('tahun_anggaran', e.target.value)}
                                    />
                                    <InputError message={form.errors.tahun_anggaran} className="mt-1" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="tanggal_buka" value="Tanggal Buka" />
                                    <TextInput
                                        id="tanggal_buka"
                                        type="date"
                                        className="mt-1 block w-full border-[#e4e4e7] focus:border-black focus:ring-black rounded-none"
                                        value={form.data.tanggal_buka}
                                        onChange={(e) => form.setData('tanggal_buka', e.target.value)}
                                    />
                                    <InputError message={form.errors.tanggal_buka} className="mt-1" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="tanggal_tutup" value="Tanggal Tutup" />
                                    <TextInput
                                        id="tanggal_tutup"
                                        type="date"
                                        className="mt-1 block w-full border-[#e4e4e7] focus:border-black focus:ring-black rounded-none"
                                        value={form.data.tanggal_tutup}
                                        onChange={(e) => form.setData('tanggal_tutup', e.target.value)}
                                    />
                                    <InputError message={form.errors.tanggal_tutup} className="mt-1" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="pagu_dana" value="Pagu Dana (Rp)" />
                                    <TextInput
                                        id="pagu_dana"
                                        type="number"
                                        min="0"
                                        className="mt-1 block w-full border-[#e4e4e7] focus:border-black focus:ring-black rounded-none"
                                        value={form.data.pagu_dana}
                                        onChange={(e) => form.setData('pagu_dana', e.target.value)}
                                    />
                                    <InputError message={form.errors.pagu_dana} className="mt-1" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="maksimal_dana" value="Maksimal Dana per Proposal (Rp)" />
                                    <TextInput
                                        id="maksimal_dana"
                                        type="number"
                                        min="0"
                                        className="mt-1 block w-full border-[#e4e4e7] focus:border-black focus:ring-black rounded-none"
                                        value={form.data.maksimal_dana}
                                        onChange={(e) => form.setData('maksimal_dana', e.target.value)}
                                    />
                                    <InputError message={form.errors.maksimal_dana} className="mt-1" />
                                </div>

                                <div className="md:col-span-2">
                                    <InputLabel htmlFor="sumber_dana" value="Sumber Dana" />
                                    <TextInput
                                        id="sumber_dana"
                                        type="text"
                                        placeholder="mis. Yayasan, Kemenristekdikti, hibah eksternal"
                                        className="mt-1 block w-full border-[#e4e4e7] focus:border-black focus:ring-black rounded-none"
                                        value={form.data.sumber_dana}
                                        onChange={(e) => form.setData('sumber_dana', e.target.value)}
                                    />
                                    <InputError message={form.errors.sumber_dana} className="mt-1" />
                                </div>

                                <div className="md:col-span-2">
                                    <InputLabel htmlFor="persyaratan" value="Persyaratan / Ketentuan" />
                                    <textarea
                                        id="persyaratan"
                                        rows="4"
                                        className="mt-1 block w-full border border-[#e4e4e7] px-3 py-2 text-sm focus:border-black focus:ring-black rounded-none"
                                        value={form.data.persyaratan}
                                        onChange={(e) => form.setData('persyaratan', e.target.value)}
                                    />
                                    <InputError message={form.errors.persyaratan} className="mt-1" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="status" value="Status" />
                                    <select
                                        id="status"
                                        className="mt-1 block w-full border-[#e4e4e7] bg-white px-3 py-2 text-sm focus:border-black focus:ring-black rounded-none"
                                        value={form.data.status}
                                        onChange={(e) => form.setData('status', e.target.value)}
                                    >
                                        <option value="draft">Draft</option>
                                        <option value="aktif">Aktif</option>
                                        <option value="ditutup">Ditutup</option>
                                        <option value="selesai">Selesai</option>
                                    </select>
                                    <InputError message={form.errors.status} className="mt-1" />
                                </div>
                            </div>
                        </Box>

                        {/* Skema Review */}
                        <Box>
                            <SectionTitle
                                action={
                                    <ActionButton onClick={() => addCriterion()} variant="secondary" type="button">
                                        + Tambah Kriteria
                                    </ActionButton>
                                }
                            >
                                Skema Penilaian Review
                            </SectionTitle>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                                <div>
                                    <InputLabel htmlFor="minimum_score" value="Nilai Minimum Kelulusan" />
                                    <TextInput
                                        id="minimum_score"
                                        type="number"
                                        min="0"
                                        max="100"
                                        className="mt-1 block w-full border-[#e4e4e7] focus:border-black focus:ring-black rounded-none"
                                        value={form.data.review_scheme.minimum_score}
                                        onChange={(e) => form.setData('review_scheme.minimum_score', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <InputLabel htmlFor="reviewer_count" value="Jumlah Reviewer per Proposal" />
                                    <TextInput
                                        id="reviewer_count"
                                        type="number"
                                        min="1"
                                        max="5"
                                        className="mt-1 block w-full border-[#e4e4e7] focus:border-black focus:ring-black rounded-none"
                                        value={form.data.review_scheme.reviewer_count}
                                        onChange={(e) => form.setData('review_scheme.reviewer_count', e.target.value)}
                                    />
                                </div>
                            </div>

                            {!isEdit && defaultCriteria.length > 0 && (
                                <div className="mb-4">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-2">
                                        Muat Kriteria Default
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {defaultCriteria.map((name, i) => (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => addCriterion(name, 10)}
                                                className="px-3 py-1.5 text-[11px] font-medium border border-[#e4e4e7] text-neutral-600 hover:border-black hover:text-black transition-colors"
                                            >
                                                + {name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {form.data.review_scheme.criteria.length === 0 ? (
                                <p className="text-sm text-neutral-500">Belum ada kriteria penilaian.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-[#e4e4e7]">
                                        <thead className="bg-[#fafafa]">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Nama Kriteria</th>
                                                <th className="px-4 py-2 text-left w-32 text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Bobot (%)</th>
                                                <th className="px-4 py-2 text-right w-24 text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-[#e4e4e7]">
                                            {form.data.review_scheme.criteria.map((criteria, index) => (
                                                <tr key={index}>
                                                    <td className="px-4 py-2">
                                                        <TextInput
                                                            type="text"
                                                            className="w-full border-[#e4e4e7] focus:border-black focus:ring-black rounded-none"
                                                            value={criteria.nama_kriteria}
                                                            onChange={(e) => form.setData(`review_scheme.criteria.${index}.nama_kriteria`, e.target.value)}
                                                        />
                                                        {form.errors[`review_scheme.criteria.${index}.nama_kriteria`] && (
                                                            <InputError message={form.errors[`review_scheme.criteria.${index}.nama_kriteria`]} className="mt-1" />
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <TextInput
                                                            type="number"
                                                            min="1"
                                                            max="100"
                                                            className="w-full border-[#e4e4e7] focus:border-black focus:ring-black rounded-none"
                                                            value={criteria.bobot}
                                                            onChange={(e) => form.setData(`review_scheme.criteria.${index}.bobot`, e.target.value)}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2 text-right">
                                                        <button
                                                            type="button"
                                                            onClick={() => removeCriterion(index)}
                                                            className="text-[11px] font-semibold uppercase tracking-wider text-red-600 hover:text-red-800"
                                                        >
                                                            Hapus
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Box>

                        <div className="flex gap-3 justify-end">
                            <ActionButton href={route('admin.lpm.programs.index')} variant="secondary">
                                Kembali
                            </ActionButton>
                            <ActionButton type="submit" variant="primary" disabled={form.processing}>
                                {form.processing ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Simpan Program'}
                            </ActionButton>
                        </div>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}