import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { useState } from 'react';

function Box({ children, className = '', padded = true, variant = 'white' }) {
    const variants = {
        white: 'bg-white border-[#e4e4e7]',
        dark: 'bg-[#0a0a0a] border-[#222] text-white',
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

const sectionStatus = {
    1: { key: 'program_id', label: 'Identitas Proposal' },
    2: { key: 'ringkasan', label: 'Ringkasan & Permasalahan' },
    3: { key: 'solusi', label: 'Solusi & Metode' },
    4: { key: 'jadwal', label: 'Jadwal, RAB & Luaran' },
    5: { key: 'members', label: 'Tim Pengusul' },
};
const totalSections = Object.keys(sectionStatus).length;

const fieldRows = {
    jadwal: { fields: { kegiatan: '', bulan: '' }, emptyLabel: 'kegiatan' },
    rab: { fields: { uraian: '', harga_satuan: '', jumlah: 1 }, emptyLabel: 'uraian' },
    luaran_target: { fields: { jenis: '', keterangan: '' }, emptyLabel: 'jenis' },
};

function arrayInput(form, field, setData) {
    const rows = form.data[field] || [];
    const add = () => setData(field, [...rows, { ...fieldRows[field].fields }]);
    const update = (index, key, value) => {
        const next = rows.map((r, i) => (i === index ? { ...r, [key]: value } : r));
        setData(field, next);
    };
    const remove = (index) => setData(field, rows.filter((_, i) => i !== index));
    return { rows, add, update, remove };
}

export default function Form({ programs, proposal, members, documents, dosenList, dosen, memberRow }) {
    const isEdit = Boolean(proposal);
    const canEdit = !isEdit || proposal.can_edit;
    const [section, setSection] = useState(1);

    let initialMembers = (proposal ? members : []).map((m) => ({
        user_id: m.user_id,
        peran: m.peran || 'anggota',
        status_persetujuan: m.status_persetujuan || 'menunggu',
        _name: m.user?.dosen?.nama_lengkap || m.user?.name || '',
    }));

    let initialJadwal = [];
    let initialRab = [];
    let initialLuaran = [];
    if (proposal) {
        initialJadwal = Array.isArray(proposal.jadwal) ? proposal.jadwal : [];
        initialRab = Array.isArray(proposal.rab) ? proposal.rab : [];
        initialLuaran = Array.isArray(proposal.luaran_target) ? proposal.luaran_target : [];
    } else {
        initialJadwal = [{ kegiatan: '', bulan: '' }];
        initialRab = [{ uraian: '', harga_satuan: '', jumlah: 1 }];
        initialLuaran = [{ jenis: '', keterangan: '' }];
    }

    const form = useForm({
        program_id: proposal?.program_id || '',
        judul: proposal?.judul || '',
        mitra: proposal?.mitra || '',
        ringkasan: proposal?.ringkasan || '',
        permasalahan: proposal?.permasalahan || '',
        solusi: proposal?.solusi || '',
        metode: proposal?.metode || '',
        jadwal: initialJadwal,
        rab: initialRab,
        luaran_target: initialLuaran,
        members: initialMembers,
    });

    const jadwalHelper = arrayInput(form, 'jadwal', form.setData);
    const rabHelper = arrayInput(form, 'rab', form.setData);
    const luaranHelper = arrayInput(form, 'luaran_target', form.setData);

    const addMember = () => {
        form.setData('members', [...form.data.members, { user_id: '', peran: 'anggota', status_persetujuan: 'menunggu', _name: '' }]);
    };
    const removeMember = (index) => {
        form.setData('members', form.data.members.filter((_, i) => i !== index));
    };
    const updateMember = (index, key, value) => {
        const next = form.data.members.map((m, i) => {
            if (i !== index) return m;
            const updated = { ...m, [key]: value };
            if (key === 'user_id') {
                const match = dosenList.find((d) => d.id == value);
                updated._name = match?.name || '';
            }
            return updated;
        });
        form.setData('members', next);
    };

    const touched = {};
    for (let i = 1; i <= totalSections; i++) {
        const { key } = sectionStatus[i];
        if (key === 'program_id') touched[i] = Boolean(form.data.program_id) && Boolean(form.data.judul);
        else if (key === 'jadwal') touched[i] = form.data.jadwal.length > 0 && form.data.luaran_target.length > 0;
        else if (key === 'solusi') touched[i] = Boolean(form.data.solusi) && Boolean(form.data.metode);
        else if (key === 'ringkasan') touched[i] = Boolean(form.data.ringkasan) || Boolean(form.data.permasalahan);
        else touched[i] = form.data.members.length > 0;
    }

    const submit = (e) => {
        e.preventDefault();
        if (isEdit) {
            form.put(route('dosen.lpm.proposals.update', proposal.id), { preserveScroll: true });
        } else {
            form.post(route('dosen.lpm.proposals.store'), { preserveScroll: true });
        }
    };

    const submitProposal = () => {
        if (!confirm('Ajukan proposal ke LPM? Proposal tidak dapat diubah setelah diajukan (kecuali dikembalikan).')) return;
        if (documents.length === 0) {
            alert('Proposal wajib memiliki minimal satu dokumen pendukung. Unggah dokumen di tab Dokumen terlebih dahulu.');
            return;
        }
        router.post(route('dosen.lpm.proposals.submit', proposal.id), { catatan: '' }, { preserveScroll: true });
    };

    const handleDocumentUpload = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        router.post(route('dosen.lpm.proposals.documents.upload', proposal.id), fd, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => e.target.reset(),
        });
    };

    const handleDocumentDelete = (doc) => {
        if (confirm('Hapus dokumen ini?')) {
            router.delete(route('dosen.lpm.proposals.documents.destroy', doc.id));
        }
    };

    const confirmMembershipAction = (setuju) => {
        router.post(route('dosen.lpm.proposals.confirm-membership', proposal.id), { setuju }, { preserveScroll: true });
    };

    const canSubmit = isEdit && canEdit;
    const fileUrl = (path) => (path ? `/storage/${path}` : '#');

    return (
        <AdminLayout title={isEdit ? 'Lengkapi Proposal' : 'Pengajuan Baru'}>
            <Head title={isEdit ? 'Lengkapi Proposal' : 'Pengajuan Baru'} />

            <div className="space-y-6">
                <Box variant="dark" className="relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-neutral-400 mb-2">LPM</p>
                        <h1 className="text-2xl font-bold tracking-tight text-white">
                            {isEdit ? 'LENGKAPI PROPOSAL' : 'PENGAJUAN PROPOSAL BARU'}
                        </h1>
                        <p className="text-sm text-neutral-400 mt-1">
                            {isEdit ? proposal.judul : 'Isi proposal secara bertahap, lalu lengkapi dokumen dan ajukan.'}
                        </p>
                    </div>
                </Box>

                {!isEdit && (
                    <Box>
                        {programs.length === 0 ? (
                            <p className="text-sm text-neutral-500">Belum ada program yang sedang menerima proposal.</p>
                        ) : (
                            <>
                                <SectionTitle>Pilih Program</SectionTitle>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {programs.map((program) => (
                                        <label
                                            key={program.id}
                                            className={`border p-4 cursor-pointer transition-colors ${form.data.program_id == program.id ? 'border-black bg-neutral-50' : 'border-[#e4e4e7] hover:border-black'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="radio"
                                                    name="program"
                                                    className="accent-black"
                                                    checked={form.data.program_id == program.id}
                                                    onChange={() => form.setData('program_id', program.id)}
                                                />
                                                <div className="flex-1">
                                                    <p className="text-sm font-semibold text-black">{program.nama_program}</p>
                                                    <p className="text-xs text-neutral-500">{program.skema} • {program.tahun_anggaran}</p>
                                                </div>
                                            </div>
                                            <div className="mt-3 text-[11px] text-neutral-500 space-y-1">
                                                <p>Periode: {program.tanggal_buka} — {program.tanggal_tutup}</p>
                                                <p>Pagu: Rp {Number(program.pagu_dana || 0).toLocaleString('id-ID')} • Maks: Rp {Number(program.maksimal_dana || 0).toLocaleString('id-ID')}</p>
                                                {!program.is_terbuka && <p className="text-red-600 font-semibold uppercase">Periode telah ditutup</p>}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                                {form.errors.program_id && <p className="mt-2 text-xs text-red-600">{form.errors.program_id}</p>}
                            </>
                        )}
                    </Box>
                )}

                {/* Stepper */}
                <Box padded={false} className="overflow-hidden">
                    <div className="flex overflow-x-auto divide-x divide-[#e4e4e7]">
                        {Object.entries(sectionStatus).map(([num, s]) => (
                            <button
                                key={num}
                                type="button"
                                onClick={() => setSection(Number(num))}
                                className={`flex-1 min-w-32 px-4 py-3 text-[10px] font-semibold uppercase tracking-wider transition-colors ${section === Number(num) ? 'bg-black text-white' : 'text-neutral-500 hover:bg-neutral-50'}`}
                            >
                                {Number(num)}. {s.label}
                                {touched[num] && <span className={`ml-1 ${section === Number(num) ? 'text-green-400' : 'text-green-600'}`}>✓</span>}
                            </button>
                        ))}
                    </div>
                </Box>

                <form onSubmit={submit}>
                    <Box className="space-y-4">
                        {section === 1 && (
                            <>
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">Judul Proposal *</label>
                                        <input
                                            type="text"
                                            className="w-full border border-[#e4e4e7] px-3 py-2 text-sm focus:border-black rounded-none"
                                            value={form.data.judul}
                                            onChange={(e) => form.setData('judul', e.target.value)}
                                            placeholder="Judul pengabdian kepada masyarakat"
                                        />
                                        {form.errors.judul && <p className="mt-1 text-xs text-red-600">{form.errors.judul}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">Mitra (opsional)</label>
                                        <input
                                            type="text"
                                            className="w-full border border-[#e4e4e7] px-3 py-2 text-sm focus:border-black rounded-none"
                                            value={form.data.mitra}
                                            onChange={(e) => form.setData('mitra', e.target.value)}
                                            placeholder="Nama lembaga/pihak mitra"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {section === 2 && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">Ringkasan Proposal *</label>
                                    <textarea
                                        rows="3"
                                        className="w-full border border-[#e4e4e7] px-3 py-2 text-sm focus:border-black rounded-none"
                                        value={form.data.ringkasan}
                                        onChange={(e) => form.setData('ringkasan', e.target.value)}
                                        placeholder="Ringkasan singkat latar belakang dan tujuan"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">Permasalahan Mitra *</label>
                                    <textarea
                                        rows="4"
                                        className="w-full border border-[#e4e4e7] px-3 py-2 text-sm focus:border-black rounded-none"
                                        value={form.data.permasalahan}
                                        onChange={(e) => form.setData('permasalahan', e.target.value)}
                                        placeholder="Uraikan permasalahan yang dihadapi mitra"
                                    />
                                </div>
                            </div>
                        )}

                        {section === 3 && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">Solusi yang Ditawarkan *</label>
                                    <textarea
                                        rows="4"
                                        className="w-full border border-[#e4e4e7] px-3 py-2 text-sm focus:border-black rounded-none"
                                        value={form.data.solusi}
                                        onChange={(e) => form.setData('solusi', e.target.value)}
                                        placeholder="Solusi yang ditawarkan kepada mitra"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">Metode Pelaksanaan *</label>
                                    <textarea
                                        rows="4"
                                        className="w-full border border-[#e4e4e7] px-3 py-2 text-sm focus:border-black rounded-none"
                                        value={form.data.metode}
                                        onChange={(e) => form.setData('metode', e.target.value)}
                                        placeholder="Tahapan & metode pelaksanaan kegiatan"
                                    />
                                </div>
                            </div>
                        )}

                        {section === 4 && (
                            <div className="space-y-6">
                                <div>
                                    <SectionTitle action={<button type="button" onClick={jadwalHelper.add} className="text-[11px] font-semibold uppercase tracking-wider text-black hover:underline">+ Tambah Jadwal</button>}>
                                        Jadwal Pelaksanaan
                                    </SectionTitle>
                                    <div className="space-y-2">
                                        {jadwalHelper.rows.map((row, i) => (
                                            <div key={i} className="flex gap-2">
                                                <input
                                                    type="text"
                                                    className="flex-1 border border-[#e4e4e7] px-3 py-2 text-sm focus:border-black rounded-none"
                                                    placeholder="Kegiatan"
                                                    value={row.kegiatan}
                                                    onChange={(e) => jadwalHelper.update(i, 'kegiatan', e.target.value)}
                                                />
                                                <input
                                                    type="text"
                                                    className="w-32 border border-[#e4e4e7] px-3 py-2 text-sm focus:border-black rounded-none"
                                                    placeholder="Bulan (mis. Juni)"
                                                    value={row.bulan}
                                                    onChange={(e) => jadwalHelper.update(i, 'bulan', e.target.value)}
                                                />
                                                <button type="button" onClick={() => jadwalHelper.remove(i)} className="text-[11px] font-semibold uppercase text-red-600 px-2">Hapus</button>
                                            </div>
                                        ))}
                                    </div>
                                    {form.errors['jadwal.0.kegiatan'] && <p className="mt-1 text-xs text-red-600">{form.errors['jadwal.0.kegiatan']}</p>}
                                </div>

                                <div>
                                    <SectionTitle action={<button type="button" onClick={rabHelper.add} className="text-[11px] font-semibold uppercase tracking-wider text-black hover:underline">+ Tambah RAB</button>}>
                                        RAB (Rencana Anggaran Biaya)
                                    </SectionTitle>
                                    <div className="space-y-2">
                                        {rabHelper.rows.map((row, i) => (
                                            <div key={i} className="flex gap-2 flex-col sm:flex-row">
                                                <input
                                                    type="text"
                                                    className="flex-1 border border-[#e4e4e7] px-3 py-2 text-sm focus:border-black rounded-none"
                                                    placeholder="Uraian"
                                                    value={row.uraian}
                                                    onChange={(e) => rabHelper.update(i, 'uraian', e.target.value)}
                                                />
                                                <input
                                                    type="number"
                                                    min="0"
                                                    className="w-full sm:w-40 border border-[#e4e4e7] px-3 py-2 text-sm focus:border-black rounded-none"
                                                    placeholder="Harga Satuan"
                                                    value={row.harga_satuan}
                                                    onChange={(e) => rabHelper.update(i, 'harga_satuan', e.target.value)}
                                                />
                                                <input
                                                    type="number"
                                                    min="1"
                                                    className="w-full sm:w-24 border border-[#e4e4e7] px-3 py-2 text-sm focus:border-black rounded-none"
                                                    placeholder="Jumlah"
                                                    value={row.jumlah}
                                                    onChange={(e) => rabHelper.update(i, 'jumlah', e.target.value)}
                                                />
                                                <button type="button" onClick={() => rabHelper.remove(i)} className="text-[11px] font-semibold uppercase text-red-600 px-2">Hapus</button>
                                            </div>
                                        ))}
                                    </div>
                                    {form.errors['rab.0.uraian'] && <p className="mt-1 text-xs text-red-600">{form.errors['rab.0.uraian']}</p>}
                                </div>

                                <div>
                                    <SectionTitle action={<button type="button" onClick={luaranHelper.add} className="text-[11px] font-semibold uppercase tracking-wider text-black hover:underline">+ Tambah Luaran</button>}>
                                        Target Luaran
                                    </SectionTitle>
                                    <div className="space-y-2">
                                        {luaranHelper.rows.map((row, i) => (
                                            <div key={i} className="flex gap-2">
                                                <input
                                                    type="text"
                                                    className="flex-1 border border-[#e4e4e7] px-3 py-2 text-sm focus:border-black rounded-none"
                                                    placeholder="Jenis luaran (mis. Artikel, Publikasi, Modul)"
                                                    value={row.jenis}
                                                    onChange={(e) => luaranHelper.update(i, 'jenis', e.target.value)}
                                                />
                                                <input
                                                    type="text"
                                                    className="flex-1 border border-[#e4e4e7] px-3 py-2 text-sm focus:border-black rounded-none"
                                                    placeholder="Keterangan (opsional)"
                                                    value={row.keterangan}
                                                    onChange={(e) => luaranHelper.update(i, 'keterangan', e.target.value)}
                                                />
                                                <button type="button" onClick={() => luaranHelper.remove(i)} className="text-[11px] font-semibold uppercase text-red-600 px-2">Hapus</button>
                                            </div>
                                        ))}
                                    </div>
                                    {form.errors['luaran_target.0.jenis'] && <p className="mt-1 text-xs text-red-600">{form.errors['luaran_target.0.jenis']}</p>}
                                </div>
                            </div>
                        )}

                        {section === 5 && (
                            <div>
                                <SectionTitle action={<button type="button" onClick={addMember} className="text-[11px] font-semibold uppercase tracking-wider text-black hover:underline">+ Tambah Anggota</button>}>
                                    Tim Pengusul
                                </SectionTitle>
                                <p className="text-xs text-neutral-500 mb-3">Ketua adalah Anda. Tambahkan maksimal anggota sesuai ketentuan program.</p>
                                <div className="space-y-2">
                                    {form.data.members.map((member, i) => (
                                        <div key={i} className="flex gap-2 flex-col sm:flex-row border border-[#e4e4e7] p-3">
                                            <select
                                                className="flex-1 border border-[#e4e4e7] bg-white px-3 py-2 text-sm focus:border-black rounded-none"
                                                value={member.user_id || ''}
                                                onChange={(e) => updateMember(i, 'user_id', e.target.value)}
                                            >
                                                <option value="">Pilih dosen anggota...</option>
                                                {dosenList.filter((d) => d.id != proposal?.ketua_user_id).map((d) => (
                                                    <option key={d.id} value={d.id}>{d.name}</option>
                                                ))}
                                            </select>
                                            <select
                                                className="w-full sm:w-40 border border-[#e4e4e7] bg-white px-3 py-2 text-sm focus:border-black rounded-none"
                                                value={member.peran}
                                                onChange={(e) => updateMember(i, 'peran', e.target.value)}
                                            >
                                                <option value="anggota">Anggota</option>
                                                <option value="bendahara">Bendahara</option>
                                                <option value="sekretaris">Sekretaris</option>
                                            </select>
                                            <button type="button" onClick={() => removeMember(i)} className="text-[11px] font-semibold uppercase text-red-600 px-2">Hapus</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between pt-4 border-t border-[#e4e4e7]">
                            <ActionButton variant="secondary" type="button" onClick={() => setSection(Math.max(1, section - 1))} disabled={section === 1}>
                                ← Sebelumnya
                            </ActionButton>
                            {section < totalSections ? (
                                <ActionButton variant="primary" type="button" onClick={() => setSection(section + 1)}>
                                    Selanjutnya →
                                </ActionButton>
                            ) : (
                                <ActionButton type="submit" variant="primary" disabled={form.processing}>
                                    {form.processing ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Simpan Draft & Lanjut'}
                                </ActionButton>
                            )}
                        </div>
                    </Box>
                </form>

                {/* Dokumen (edit only) */}
                {isEdit && (
                    <Box>
                        <SectionTitle>Dokumen Pendukung</SectionTitle>
                        <p className="text-xs text-neutral-500 mb-3">Proposal wajib memiliki minimal satu dokumen untuk dapat diajukan.</p>

                        {documents.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                                {documents.map((doc) => (
                                    <span key={doc.id} className="inline-flex items-center gap-2 px-3 py-1.5 text-[11px] font-medium border border-[#e4e4e7] text-neutral-700">
                                        <a href={fileUrl(doc.path)} target="_blank" rel="noopener noreferrer" className="hover:text-black underline">{doc.jenis} — {doc.nama_file}</a>
                                        <button type="button" onClick={() => handleDocumentDelete(doc)} className="text-red-600 hover:text-red-800">×</button>
                                    </span>
                                ))}
                            </div>
                        )}

                        <form onSubmit={handleDocumentUpload} className="flex gap-2 flex-col sm:flex-row">
                            <input name="jenis" type="text" placeholder="Jenis dokumen (mis. Proposal PDF)" required className="w-full sm:w-64 border border-[#e4e4e7] px-3 py-2 text-sm focus:border-black rounded-none" />
                            <input name="file" type="file" required accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" className="flex-1 text-sm" />
                            <button type="submit" className="px-4 py-2 text-[11px] font-semibold uppercase tracking-widest border border-black bg-black text-white hover:bg-neutral-800">
                                Unggah
                            </button>
                        </form>
                    </Box>
                )}

                {/* Member confirmation (for non-chair members) */}
                {isEdit && memberRow && memberRow.status_persetujuan === 'menunggu' && !proposal.is_ketua && (
                    <Box>
                        <SectionTitle>Konfirmasi Keanggotaan</SectionTitle>
                        <p className="text-xs text-neutral-500 mb-3">Anda terdaftar sebagai anggota tim pengusul proposal "{proposal.judul}". Setujui keanggotaan ini?</p>
                        <div className="flex gap-2">
                            <ActionButton type="button" variant="primary" onClick={() => confirmMembershipAction(true)}>Setujui</ActionButton>
                            <ActionButton type="button" variant="danger" onClick={() => confirmMembershipAction(false)}>Tolak</ActionButton>
                        </div>
                    </Box>
                )}

                {/* Submit bar */}
                {canSubmit && (
                    <Box variant="dark">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <p className="text-sm font-semibold text-white">Proposal siap diajukan ke LPM?</p>
                                <p className="text-xs text-neutral-400">Setelah diajukan, proposal memasuki proses verifikasi.</p>
                            </div>
                            <ActionButton type="button" onClick={submitProposal} variant="primary">
                                Ajukan Proposal
                            </ActionButton>
                        </div>
                    </Box>
                )}

                <div className="flex gap-3">
                    <ActionButton href={route('dosen.lpm.proposals.index')} variant="ghost">← Kembali ke Daftar Proposal</ActionButton>
                </div>
            </div>
        </AdminLayout>
    );
}