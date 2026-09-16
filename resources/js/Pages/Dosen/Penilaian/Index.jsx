import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';

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

function ScorePill({ score }) {
    const n = Number(score || 0);
    if (!score && score !== 0) {
        return <span className="border border-neutral-300 bg-neutral-50 px-2 py-1 text-xs text-neutral-600">Belum ada</span>;
    }
    return <span className="border border-neutral-900 bg-neutral-900 px-2 py-1 text-xs font-semibold text-white">{n}</span>;
}

function GradePill({ grade }) {
    if (!grade) return null;
    return <span className="border border-neutral-300 bg-white px-2 py-1 text-xs font-semibold text-neutral-800">{grade}</span>;
}

function StatusPill({ status }) {
    const final = status === 'final';
    return (
        <span className={`border px-2 py-1 text-xs font-semibold ${final ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-300 bg-white text-neutral-800'}`}>
            {final ? 'Final' : 'Draft'}
        </span>
    );
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

export default function Index({ dosen, periodeAktif, jadwalKuliah, mahasiswas }) {
    const [editingId, setEditingId] = useState(null);

    const sorted = [...mahasiswas].sort((a, b) => (a.nim || '').localeCompare(b.nim || ''));
    const allNilaiIsFinal = sorted.length > 0 && sorted.every((m) => m.penilaian?.status === 'final');
    const hasAnyNilai = sorted.some((m) => m.penilaian?.nilai_akhir !== null && m.penilaian?.nilai_akhir !== undefined);

    const totalMahasiswa = sorted.length;
    const totalFinal = sorted.filter((m) => m.penilaian?.status === 'final').length;
    const totalDraft = totalMahasiswa - totalFinal;
    const scored = sorted.filter((m) => m.penilaian?.nilai_akhir !== null && m.penilaian?.nilai_akhir !== undefined);
    const avgScore = scored.length
        ? (scored.reduce((sum, m) => sum + Number(m.penilaian.nilai_akhir || 0), 0) / scored.length).toFixed(1)
        : '-';
    const finalRate = totalMahasiswa ? Math.round((totalFinal / totalMahasiswa) * 100) : 0;

    const handleFinalisasiNilai = () => {
        if (!confirm('Yakin ingin finalisasi semua nilai? Nilai akan dikunci, namun Anda masih bisa membatalkan finalisasi untuk mengedit kembali.')) return;
        router.post(route('dosen.penilaian.finalisasi', jadwalKuliah.id));
    };

    const handleUnfinalisasiNilai = () => {
        if (!confirm('Yakin ingin membatalkan finalisasi? Nilai akan kembali ke status draft dan dapat diedit lagi.')) return;
        router.post(route('dosen.penilaian.unfinalisasi', jadwalKuliah.id));
    };

    const formatTime = (value) => String(value || '-').slice(0, 5);

    return (
        <AdminLayout title="Input Penilaian">
            <Head title={`Input Nilai - ${jadwalKuliah.mata_kuliah?.nama_mata_kuliah || 'Kelas'}`} />

            <div className="space-y-6">
                <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 shadow-teal-500/20 p-4 text-white shadow-lg sm:p-5">
                    <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-widest text-white/75">Penilaian Kelas</p>
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
                            <ActionButton href={route('dosen.mahasiswa', jadwalKuliah.id)} variant="secondary">
                                Daftar Mahasiswa
                            </ActionButton>
                            {hasAnyNilai && !allNilaiIsFinal ? (
                                <ActionButton onClick={handleFinalisasiNilai} variant="primary">
                                    Finalisasi Semua Nilai
                                </ActionButton>
                            ) : allNilaiIsFinal ? (
                                <ActionButton onClick={handleUnfinalisasiNilai} variant="secondary">
                                    Unfinalisasi Nilai
                                </ActionButton>
                            ) : null}
                        </div>
                    </div>
                </section>

                <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <Box>
                        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Total Mahasiswa</p>
                        <p className="mt-1 text-3xl font-bold text-neutral-900">{totalMahasiswa}</p>
                    </Box>
                    <Box>
                        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Nilai Final</p>
                        <p className="mt-1 text-3xl font-bold text-neutral-900">{totalFinal}</p>
                    </Box>
                    <Box>
                        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Belum Final</p>
                        <p className="mt-1 text-3xl font-bold text-neutral-900">{totalDraft}</p>
                    </Box>
                    <Box>
                        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Rata-rata Nilai</p>
                        <p className="mt-1 text-3xl font-bold text-neutral-900">{avgScore}</p>
                    </Box>
                </section>

                <Box>
                    <div className="mb-2 flex items-center justify-between">
                        <p className="text-sm font-medium text-neutral-700">Progress Finalisasi Nilai</p>
                        <p className="text-sm font-semibold text-neutral-900">{finalRate}%</p>
                    </div>
                    <div className="h-2 overflow-hidden bg-neutral-200">
                        <div className="h-full bg-neutral-900" style={{ width: `${finalRate}%` }} />
                    </div>
                    <div className="mt-3 border border-neutral-300 bg-neutral-50 p-3 text-xs text-neutral-700">
                        Bobot penilaian: Tugas 30% • UTS 30% • UAS 40%. Nilai akhir dan grade dihitung otomatis saat data disimpan.
                    </div>
                </Box>

                <Box>
                    <SectionTitle>Input Nilai Mahasiswa</SectionTitle>

                    {sorted.length === 0 ? (
                        <div className="border border-dashed border-neutral-300 p-10 text-center text-sm text-neutral-500">
                            Tidak ada mahasiswa yang mengambil mata kuliah ini.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {sorted.map((mahasiswa) => (
                                <PenilaianRow
                                    key={mahasiswa.id}
                                    mahasiswa={mahasiswa}
                                    isEditing={editingId === mahasiswa.id}
                                    onEdit={() => setEditingId(mahasiswa.id)}
                                    onCancel={() => setEditingId(null)}
                                    onSaved={() => setEditingId(null)}
                                    allNilaiIsFinal={allNilaiIsFinal}
                                />
                            ))}
                        </div>
                    )}
                </Box>
            </div>
        </AdminLayout>
    );
}

function PenilaianRow({ mahasiswa, isEditing, onEdit, onCancel, onSaved, allNilaiIsFinal }) {
    const { data, setData, put, processing, errors, reset } = useForm({
        nilai_tugas: mahasiswa.penilaian?.nilai_tugas || '',
        nilai_uts: mahasiswa.penilaian?.nilai_uts || '',
        nilai_uas: mahasiswa.penilaian?.nilai_uas || '',
        catatan: mahasiswa.penilaian?.catatan || '',
    });

    const save = (e) => {
        e.preventDefault();
        put(route('dosen.penilaian.update', mahasiswa.penilaian.id), {
            onSuccess: onSaved,
        });
    };

    const cancel = () => {
        reset();
        onCancel();
    };

    const normalize = (value) => {
        if (value === '' || value === null || value === undefined) return null;
        const n = Number(value);
        if (!Number.isFinite(n)) return null;
        return Math.max(0, Math.min(100, n));
    };

    const nilaiTugas = normalize(data.nilai_tugas);
    const nilaiUts = normalize(data.nilai_uts);
    const nilaiUas = normalize(data.nilai_uas);
    const hasAnyComponent = nilaiTugas !== null || nilaiUts !== null || nilaiUas !== null;

    const simulatedFinal = hasAnyComponent
        ? ((nilaiTugas ?? 0) * 0.3 + (nilaiUts ?? 0) * 0.3 + (nilaiUas ?? 0) * 0.4).toFixed(2)
        : null;

    const toGrade = (nilaiAkhir) => {
        const n = Number(nilaiAkhir);
        if (!Number.isFinite(n)) return '-';
        if (n >= 85) return 'A';
        if (n >= 80) return 'B+';
        if (n >= 75) return 'B';
        if (n >= 70) return 'C+';
        if (n >= 65) return 'C';
        if (n >= 60) return 'D';
        return 'E';
    };

    const simulatedGrade = simulatedFinal ? toGrade(simulatedFinal) : '-';

    if (isEditing) {
        return (
            <div className="overflow-hidden border border-neutral-900 bg-white shadow-sm">
                <div className="border-b border-neutral-200 bg-neutral-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center border border-neutral-300 bg-neutral-100 font-semibold text-neutral-800">
                                {(mahasiswa.nama_lengkap || 'M').charAt(0)}
                            </div>
                            <div>
                                <p className="font-semibold text-neutral-900">{mahasiswa.nama_lengkap}</p>
                                <p className="text-xs text-neutral-500">
                                    {mahasiswa.nim} • {mahasiswa.prodi?.nama_prodi}
                                </p>
                            </div>
                        </div>
                        <StatusPill status={mahasiswa.penilaian?.status} />
                    </div>
                </div>

                <form onSubmit={save} className="space-y-4 p-4 md:p-5">
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                        <div className="space-y-4 lg:col-span-8">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <div className="border border-neutral-200 bg-neutral-50 p-3">
                                    <div className="mb-2 flex items-center justify-between">
                                        <InputLabel htmlFor={`nilai_tugas_${mahasiswa.id}`} value="Nilai Tugas" />
                                        <span className="border border-neutral-300 bg-white px-2 py-0.5 text-[11px] font-semibold text-neutral-700">30%</span>
                                    </div>
                                    <TextInput
                                        id={`nilai_tugas_${mahasiswa.id}`}
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        className="mt-1 block w-full border-neutral-300 bg-white text-right text-sm font-semibold focus:border-neutral-900 focus:ring-neutral-900"
                                        value={data.nilai_tugas}
                                        onChange={(e) => setData('nilai_tugas', e.target.value)}
                                        placeholder="0 - 100"
                                    />
                                    <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-500">
                                        <span>Bobot 30%</span>
                                        <span>{nilaiTugas ?? 0}</span>
                                    </div>
                                    <div className="mt-1.5 h-1.5 overflow-hidden bg-neutral-200">
                                        <div className="h-full bg-neutral-900 transition-all duration-300" style={{ width: `${nilaiTugas ?? 0}%` }} />
                                    </div>
                                    <InputError message={errors.nilai_tugas} className="mt-2" />
                                </div>

                                <div className="border border-neutral-200 bg-neutral-50 p-3">
                                    <div className="mb-2 flex items-center justify-between">
                                        <InputLabel htmlFor={`nilai_uts_${mahasiswa.id}`} value="Nilai UTS" />
                                        <span className="border border-neutral-300 bg-white px-2 py-0.5 text-[11px] font-semibold text-neutral-700">30%</span>
                                    </div>
                                    <TextInput
                                        id={`nilai_uts_${mahasiswa.id}`}
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        className="mt-1 block w-full border-neutral-300 bg-white text-right text-sm font-semibold focus:border-neutral-900 focus:ring-neutral-900"
                                        value={data.nilai_uts}
                                        onChange={(e) => setData('nilai_uts', e.target.value)}
                                        placeholder="0 - 100"
                                    />
                                    <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-500">
                                        <span>Bobot 30%</span>
                                        <span>{nilaiUts ?? 0}</span>
                                    </div>
                                    <div className="mt-1.5 h-1.5 overflow-hidden bg-neutral-200">
                                        <div className="h-full bg-neutral-900 transition-all duration-300" style={{ width: `${nilaiUts ?? 0}%` }} />
                                    </div>
                                    <InputError message={errors.nilai_uts} className="mt-2" />
                                </div>

                                <div className="border border-neutral-200 bg-neutral-50 p-3">
                                    <div className="mb-2 flex items-center justify-between">
                                        <InputLabel htmlFor={`nilai_uas_${mahasiswa.id}`} value="Nilai UAS" />
                                        <span className="border border-neutral-300 bg-white px-2 py-0.5 text-[11px] font-semibold text-neutral-700">40%</span>
                                    </div>
                                    <TextInput
                                        id={`nilai_uas_${mahasiswa.id}`}
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        className="mt-1 block w-full border-neutral-300 bg-white text-right text-sm font-semibold focus:border-neutral-900 focus:ring-neutral-900"
                                        value={data.nilai_uas}
                                        onChange={(e) => setData('nilai_uas', e.target.value)}
                                        placeholder="0 - 100"
                                    />
                                    <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-500">
                                        <span>Bobot 40%</span>
                                        <span>{nilaiUas ?? 0}</span>
                                    </div>
                                    <div className="mt-1.5 h-1.5 overflow-hidden bg-neutral-200">
                                        <div className="h-full bg-neutral-900 transition-all duration-300" style={{ width: `${nilaiUas ?? 0}%` }} />
                                    </div>
                                    <InputError message={errors.nilai_uas} className="mt-2" />
                                </div>
                            </div>

                            <div>
                                <InputLabel htmlFor={`catatan_${mahasiswa.id}`} value="Catatan Evaluasi (Opsional)" />
                                <textarea
                                    id={`catatan_${mahasiswa.id}`}
                                    className="mt-1 block w-full border-neutral-300 bg-white text-sm shadow-sm focus:border-neutral-900 focus:ring-neutral-900"
                                    rows="3"
                                    value={data.catatan}
                                    onChange={(e) => setData('catatan', e.target.value)}
                                    placeholder="Contoh: Tingkatkan konsistensi tugas mingguan dan latihan soal UAS."
                                />
                                <div className="mt-1 text-[11px] text-neutral-500">
                                    Catatan ini akan tampil pada detail penilaian mahasiswa.
                                </div>
                                <InputError message={errors.catatan} className="mt-2" />
                            </div>
                        </div>

                        <div className="lg:col-span-4">
                            <Box variant="dark" className="!p-4">
                                <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Preview Real-time</p>
                                <p className="mt-2 text-xs text-neutral-300">
                                    Rumus: (Tugas x 30%) + (UTS x 30%) + (UAS x 40%)
                                </p>

                                <div className="mt-4 grid grid-cols-2 gap-2">
                                    <Box variant="dark" className="!border-white/20 !p-3">
                                        <p className="text-[11px] uppercase tracking-widest text-neutral-400">Nilai Akhir</p>
                                        <p className="mt-1 text-2xl font-bold">{simulatedFinal || '-'}</p>
                                    </Box>
                                    <Box variant="dark" className="!border-white/20 !p-3">
                                        <p className="text-[11px] uppercase tracking-widest text-neutral-400">Nilai Huruf</p>
                                        <span className="mt-1 inline-flex border border-white/20 bg-white/10 px-2.5 py-1 text-sm font-bold text-white">
                                            {simulatedGrade}
                                        </span>
                                    </Box>
                                </div>

                                <div className="mt-4 border border-white/20 bg-white/5 p-3 text-xs leading-relaxed text-neutral-300">
                                    Simpan nilai untuk memperbarui nilai akhir dan grade secara permanen.
                                </div>
                            </Box>
                        </div>
                    </div>

                    <div className="flex flex-col-reverse gap-2 border-t border-neutral-200 pt-4 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={cancel}
                            className="inline-flex items-center justify-center border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center justify-center border border-neutral-900 bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {processing ? 'Menyimpan...' : 'Simpan Nilai'}
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div className="border border-neutral-200 p-4 hover:bg-neutral-50">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center border border-neutral-300 bg-neutral-100 font-semibold text-neutral-800">
                        {(mahasiswa.nama_lengkap || 'M').charAt(0)}
                    </div>
                    <div>
                        <p className="font-semibold text-neutral-900">{mahasiswa.nama_lengkap}</p>
                        <p className="text-xs text-neutral-500">
                            {mahasiswa.nim} • {mahasiswa.prodi?.nama_prodi}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <StatusPill status={mahasiswa.penilaian?.status} />
                    {!allNilaiIsFinal && mahasiswa.penilaian?.status !== 'final' ? (
                        <button
                            onClick={onEdit}
                            className="border border-neutral-300 bg-white px-2.5 py-1 text-xs font-semibold text-neutral-800 hover:bg-neutral-50"
                        >
                            Edit
                        </button>
                    ) : null}
                </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
                <div className="border border-neutral-200 bg-neutral-50 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-widest text-neutral-500">Tugas</p>
                    <p className="mt-1 text-sm font-semibold text-neutral-900">{mahasiswa.penilaian?.nilai_tugas ?? '-'}</p>
                </div>
                <div className="border border-neutral-200 bg-neutral-50 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-widest text-neutral-500">UTS</p>
                    <p className="mt-1 text-sm font-semibold text-neutral-900">{mahasiswa.penilaian?.nilai_uts ?? '-'}</p>
                </div>
                <div className="border border-neutral-200 bg-neutral-50 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-widest text-neutral-500">UAS</p>
                    <p className="mt-1 text-sm font-semibold text-neutral-900">{mahasiswa.penilaian?.nilai_uas ?? '-'}</p>
                </div>
                <div className="border border-neutral-200 bg-neutral-50 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-widest text-neutral-500">Nilai Akhir</p>
                    <div className="mt-1 flex items-center gap-2">
                        <ScorePill score={mahasiswa.penilaian?.nilai_akhir} />
                        <GradePill grade={mahasiswa.penilaian?.nilai_huruf} />
                    </div>
                </div>
                <div className="border border-neutral-200 bg-neutral-50 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-widest text-neutral-500">Catatan</p>
                    <p className="mt-1 line-clamp-2 text-xs text-neutral-700">{mahasiswa.penilaian?.catatan || '-'}</p>
                </div>
            </div>
        </div>
    );
}
