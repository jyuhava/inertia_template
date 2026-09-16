import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

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

function ActionButton({ children, href, onClick, variant = 'primary', type = 'button', disabled = false }) {
    const map = {
        primary: 'bg-black text-white border-black hover:bg-neutral-800',
        secondary: 'bg-white text-black border-[#ccc] hover:bg-[#f5f5f5]',
        danger: 'bg-white text-red-600 border-red-200 hover:bg-red-50',
        ghost: 'bg-transparent text-neutral-500 border-transparent hover:text-black',
    };
    const base = 'inline-flex items-center justify-center px-4 py-2 text-[10px] font-bold uppercase tracking-widest border transition-colors duration-200 disabled:opacity-50';
    if (href) {
        return (
            <Link href={href} className={`${base} ${map[variant]}`}>
                {children}
            </Link>
        );
    }
    return (
        <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${map[variant]}`}>
            {children}
        </button>
    );
}

function StatusBadge({ status }) {
    const map = {
        aktif: 'bg-black text-white border-black',
        cuti: 'bg-amber-100 text-amber-800 border-amber-200',
        nonaktif: 'bg-white text-red-600 border-red-200',
        lulus: 'bg-[#f5f5f5] text-neutral-900 border-[#e5e5e5]',
        dropout: 'bg-red-100 text-red-700 border-red-200',
        mengundurkan_diri: 'bg-red-50 text-red-600 border-red-100',
        pindah: 'bg-blue-50 text-blue-700 border-blue-100',
        dikeluarkan: 'bg-red-100 text-red-800 border-red-200',
    };
    return (
        <span className={`inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-widest border ${map[status] || map.nonaktif}`}>
            {status?.replace(/_/g, ' ')}
        </span>
    );
}

function DetailItem({ label, children }) {
    return (
        <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1.5">{label}</label>
            <div className="text-sm text-neutral-900">{children || '-'}</div>
        </div>
    );
}

function fmtDate(value, withTime = false) {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('id-ID', {
        year: 'numeric', month: 'long', day: 'numeric',
        ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
    });
}

const TABS = [
    'Overview', 'Biodata', 'Kontak', 'Alamat', 'Orang Tua/Wali', 'Registrasi',
    'Riwayat Pendidikan', 'Riwayat Status', 'Kebutuhan Khusus', 'Beasiswa/Bantuan', 'Dokumen', 'PDDikti',
];

function TabButton({ label, active, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest whitespace-nowrap border-b-2 transition-colors ${
                active ? 'border-black text-black' : 'border-transparent text-neutral-400 hover:text-neutral-700'
            }`}
        >
            {label}
        </button>
    );
}

function OverviewTab({ mahasiswa }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Box className="md:col-span-1 flex flex-col items-center text-center">
                <div className="w-28 h-28 rounded-full bg-[#f5f5f5] border border-[#e5e5e5] flex items-center justify-center overflow-hidden mb-4">
                    {mahasiswa.foto ? (
                        <img src={`/storage/${mahasiswa.foto}`} alt={mahasiswa.nama_lengkap} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-3xl font-bold text-neutral-400">{mahasiswa.nama_lengkap?.charAt(0)}</span>
                    )}
                </div>
                <p className="text-lg font-bold text-neutral-900">{mahasiswa.nama_lengkap}</p>
                <p className="text-sm text-neutral-500">{mahasiswa.nim}</p>
                <div className="mt-3"><StatusBadge status={mahasiswa.status} /></div>
            </Box>
            <Box className="md:col-span-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <DetailItem label="Program Studi">{mahasiswa.prodi ? `${mahasiswa.prodi.kode_prodi} - ${mahasiswa.prodi.nama_prodi}` : mahasiswa.program_studi}</DetailItem>
                    <DetailItem label="Angkatan">{mahasiswa.angkatan}</DetailItem>
                    <DetailItem label="Jenis Kelamin">{mahasiswa.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</DetailItem>
                    <DetailItem label="Email">{mahasiswa.email || mahasiswa.user?.email}</DetailItem>
                    <DetailItem label="No. HP">{mahasiswa.no_hp}</DetailItem>
                    <DetailItem label="Status PDDikti">{mahasiswa.pddikti_mapping?.status_display || 'Belum Terhubung'}</DetailItem>
                </div>
            </Box>
        </div>
    );
}

function BiodataTab({ mahasiswa }) {
    return (
        <Box>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <DetailItem label="NIM">{mahasiswa.nim}</DetailItem>
                <DetailItem label="NIK">{mahasiswa.no_ktp}</DetailItem>
                <DetailItem label="NISN">{mahasiswa.nisn}</DetailItem>
                <DetailItem label="NPWP">{mahasiswa.npwp}</DetailItem>
                <DetailItem label="Nama Lengkap">{mahasiswa.nama_lengkap}</DetailItem>
                <DetailItem label="Jenis Kelamin">{mahasiswa.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</DetailItem>
                <DetailItem label="Tempat Lahir">{mahasiswa.tempat_lahir}</DetailItem>
                <DetailItem label="Tanggal Lahir">{fmtDate(mahasiswa.tanggal_lahir)}</DetailItem>
                <DetailItem label="Agama">{mahasiswa.agama}</DetailItem>
                <DetailItem label="Kewarganegaraan">{mahasiswa.kewarganegaraan}</DetailItem>
            </div>
            <div className="mt-6">
                <ActionButton href={route('admin.mahasiswa.edit', mahasiswa.id)} variant="secondary">Edit Biodata</ActionButton>
            </div>
        </Box>
    );
}

function KontakTab({ mahasiswa }) {
    const { data, setData, post, processing, reset, errors } = useForm({
        jenis: 'hp', nilai: '', nama_kontak: '', is_primary: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.mahasiswa.kontak.store', mahasiswa.id), { onSuccess: () => reset() });
    };

    return (
        <div className="space-y-6">
            <Box padded={false} className="overflow-hidden">
                <table className="min-w-full divide-y divide-[#e5e5e5]">
                    <thead className="bg-[#fafafa]">
                        <tr>
                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500">Jenis</th>
                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500">Nilai</th>
                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500">Nama Kontak</th>
                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500">Utama</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e5e5e5]">
                        {(mahasiswa.kontaks || []).map((k) => (
                            <tr key={k.id}>
                                <td className="px-4 py-3 text-sm capitalize">{k.jenis}</td>
                                <td className="px-4 py-3 text-sm">{k.nilai}</td>
                                <td className="px-4 py-3 text-sm">{k.nama_kontak || '-'}</td>
                                <td className="px-4 py-3 text-sm">{k.is_primary ? 'Ya' : '-'}</td>
                                <td className="px-4 py-3 text-right">
                                    <Link as="button" method="delete" href={route('admin.mahasiswa.kontak.destroy', [mahasiswa.id, k.id])} className="text-[10px] font-bold uppercase text-red-600">Hapus</Link>
                                </td>
                            </tr>
                        ))}
                        {(!mahasiswa.kontaks || mahasiswa.kontaks.length === 0) && (
                            <tr><td colSpan="5" className="px-4 py-8 text-center text-sm text-neutral-500">Belum ada kontak.</td></tr>
                        )}
                    </tbody>
                </table>
            </Box>

            <Box>
                <SectionTitle>Tambah Kontak</SectionTitle>
                <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
                    <div>
                        <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">Jenis</label>
                        <select value={data.jenis} onChange={(e) => setData('jenis', e.target.value)} className="w-full border-[#e5e5e5] rounded-none text-sm">
                            <option value="email">Email</option>
                            <option value="hp">HP</option>
                            <option value="telepon">Telepon</option>
                            <option value="whatsapp">WhatsApp</option>
                            <option value="darurat">Kontak Darurat</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">Nilai</label>
                        <input value={data.nilai} onChange={(e) => setData('nilai', e.target.value)} className="w-full border-[#e5e5e5] rounded-none text-sm" />
                        {errors.nilai && <p className="text-xs text-red-600 mt-1">{errors.nilai}</p>}
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">Nama Kontak</label>
                        <input value={data.nama_kontak} onChange={(e) => setData('nama_kontak', e.target.value)} className="w-full border-[#e5e5e5] rounded-none text-sm" />
                    </div>
                    <ActionButton type="submit" disabled={processing}>Simpan</ActionButton>
                </form>
            </Box>
        </div>
    );
}

function AlamatForm({ mahasiswa, jenis, existing }) {
    const { data, setData, post, processing } = useForm({
        jenis,
        jalan: existing?.jalan || '',
        dusun: existing?.dusun || '',
        rt: existing?.rt || '',
        rw: existing?.rw || '',
        kelurahan: existing?.kelurahan || '',
        kecamatan: existing?.kecamatan || '',
        kabupaten_kota: existing?.kabupaten_kota || '',
        provinsi: existing?.provinsi || '',
        kode_pos: existing?.kode_pos || '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.mahasiswa.alamat.store', mahasiswa.id));
    };

    return (
        <Box>
            <SectionTitle>{jenis === 'ktp' ? 'Alamat KTP' : 'Alamat Domisili'}</SectionTitle>
            <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {['jalan', 'dusun', 'rt', 'rw', 'kelurahan', 'kecamatan', 'kabupaten_kota', 'provinsi', 'kode_pos'].map((field) => (
                    <div key={field}>
                        <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">{field.replace(/_/g, ' ')}</label>
                        <input value={data[field]} onChange={(e) => setData(field, e.target.value)} className="w-full border-[#e5e5e5] rounded-none text-sm" />
                    </div>
                ))}
                <div className="col-span-full">
                    <ActionButton type="submit" disabled={processing}>Simpan</ActionButton>
                </div>
            </form>
        </Box>
    );
}

function AlamatTab({ mahasiswa }) {
    const alamats = mahasiswa.alamats || [];
    const ktp = alamats.find((a) => a.jenis === 'ktp');
    const domisili = alamats.find((a) => a.jenis === 'domisili');

    return (
        <div className="space-y-6">
            <AlamatForm mahasiswa={mahasiswa} jenis="ktp" existing={ktp} />
            <AlamatForm mahasiswa={mahasiswa} jenis="domisili" existing={domisili} />
        </div>
    );
}

function OrangTuaForm({ mahasiswa, jenis, existing, label }) {
    const { data, setData, post, processing } = useForm({
        jenis,
        nama: existing?.nama || '',
        nik: existing?.nik || '',
        tanggal_lahir: existing?.tanggal_lahir?.slice(0, 10) || '',
        pendidikan: existing?.pendidikan || '',
        pekerjaan: existing?.pekerjaan || '',
        penghasilan: existing?.penghasilan || '',
        kebutuhan_khusus: existing?.kebutuhan_khusus || '',
        no_hp: existing?.no_hp || '',
        email: existing?.email || '',
        alamat: existing?.alamat || '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.mahasiswa.orang-tua.store', mahasiswa.id));
    };

    return (
        <Box>
            <SectionTitle>{label}</SectionTitle>
            <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                    <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">Nama</label>
                    <input value={data.nama} onChange={(e) => setData('nama', e.target.value)} className="w-full border-[#e5e5e5] rounded-none text-sm" required />
                </div>
                <div>
                    <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">NIK</label>
                    <input value={data.nik} onChange={(e) => setData('nik', e.target.value)} className="w-full border-[#e5e5e5] rounded-none text-sm" />
                </div>
                <div>
                    <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">Tanggal Lahir</label>
                    <input type="date" value={data.tanggal_lahir} onChange={(e) => setData('tanggal_lahir', e.target.value)} className="w-full border-[#e5e5e5] rounded-none text-sm" />
                </div>
                <div>
                    <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">Pendidikan</label>
                    <input value={data.pendidikan} onChange={(e) => setData('pendidikan', e.target.value)} className="w-full border-[#e5e5e5] rounded-none text-sm" />
                </div>
                <div>
                    <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">Pekerjaan</label>
                    <input value={data.pekerjaan} onChange={(e) => setData('pekerjaan', e.target.value)} className="w-full border-[#e5e5e5] rounded-none text-sm" />
                </div>
                <div>
                    <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">Penghasilan</label>
                    <input value={data.penghasilan} onChange={(e) => setData('penghasilan', e.target.value)} className="w-full border-[#e5e5e5] rounded-none text-sm" />
                </div>
                <div>
                    <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">Kebutuhan Khusus</label>
                    <input value={data.kebutuhan_khusus} onChange={(e) => setData('kebutuhan_khusus', e.target.value)} className="w-full border-[#e5e5e5] rounded-none text-sm" />
                </div>
                <div>
                    <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">No. HP</label>
                    <input value={data.no_hp} onChange={(e) => setData('no_hp', e.target.value)} className="w-full border-[#e5e5e5] rounded-none text-sm" />
                </div>
                <div>
                    <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">Email</label>
                    <input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} className="w-full border-[#e5e5e5] rounded-none text-sm" />
                </div>
                <div className="col-span-full">
                    <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">Alamat</label>
                    <textarea value={data.alamat} onChange={(e) => setData('alamat', e.target.value)} className="w-full border-[#e5e5e5] rounded-none text-sm" rows={2} />
                </div>
                <div className="col-span-full">
                    <ActionButton type="submit" disabled={processing}>Simpan</ActionButton>
                </div>
            </form>
        </Box>
    );
}

function OrangTuaTab({ mahasiswa }) {
    return (
        <div className="space-y-6">
            <OrangTuaForm mahasiswa={mahasiswa} jenis="ayah" existing={mahasiswa.ayah} label="Ayah" />
            <OrangTuaForm mahasiswa={mahasiswa} jenis="ibu" existing={mahasiswa.ibu} label="Ibu" />
            <OrangTuaForm mahasiswa={mahasiswa} jenis="wali" existing={mahasiswa.wali} label="Wali (jika ada)" />
        </div>
    );
}

function RegistrasiTab({ mahasiswa }) {
    return (
        <Box padded={false} className="overflow-hidden">
            <table className="min-w-full divide-y divide-[#e5e5e5]">
                <thead className="bg-[#fafafa]">
                    <tr>
                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500">Periode Masuk</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500">Prodi</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500">Jenis</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500">Jalur Masuk</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500">Asal</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500">PT Asal</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500">Tanggal Masuk</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e5e5]">
                    {(mahasiswa.registrasis || []).map((r) => (
                        <tr key={r.id}>
                            <td className="px-4 py-3 text-sm">{r.periode_masuk}</td>
                            <td className="px-4 py-3 text-sm">{r.prodi?.nama_prodi}</td>
                            <td className="px-4 py-3 text-sm capitalize">{r.jenis_pendaftaran}</td>
                            <td className="px-4 py-3 text-sm">{r.jalur_masuk || '-'}</td>
                            <td className="px-4 py-3 text-sm capitalize">{r.asal_mahasiswa}</td>
                            <td className="px-4 py-3 text-sm">{r.pt_asal || '-'}</td>
                            <td className="px-4 py-3 text-sm">{fmtDate(r.tanggal_masuk)}</td>
                        </tr>
                    ))}
                    {(!mahasiswa.registrasis || mahasiswa.registrasis.length === 0) && (
                        <tr><td colSpan="7" className="px-4 py-8 text-center text-sm text-neutral-500">Belum ada data registrasi.</td></tr>
                    )}
                </tbody>
            </table>
        </Box>
    );
}

function RiwayatPendidikanTab({ mahasiswa }) {
    const { data, setData, post, processing, reset, errors } = useForm({
        jenjang_pendidikan: 'SMA', nama_institusi: '', npsn: '', program_jurusan: '',
        tanggal_lulus: '', nomor_ijazah: '', nisn: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.mahasiswa.riwayat-pendidikan.store', mahasiswa.id), { onSuccess: () => reset() });
    };

    return (
        <div className="space-y-6">
            <Box padded={false} className="overflow-hidden">
                <table className="min-w-full divide-y divide-[#e5e5e5]">
                    <thead className="bg-[#fafafa]">
                        <tr>
                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500">Jenjang</th>
                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500">Institusi</th>
                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500">Jurusan</th>
                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500">Tanggal Lulus</th>
                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500">No. Ijazah</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e5e5e5]">
                        {(mahasiswa.riwayat_pendidikans || []).map((r) => (
                            <tr key={r.id}>
                                <td className="px-4 py-3 text-sm">{r.jenjang_pendidikan}</td>
                                <td className="px-4 py-3 text-sm">{r.nama_institusi}</td>
                                <td className="px-4 py-3 text-sm">{r.program_jurusan || '-'}</td>
                                <td className="px-4 py-3 text-sm">{fmtDate(r.tanggal_lulus)}</td>
                                <td className="px-4 py-3 text-sm">{r.nomor_ijazah || '-'}</td>
                                <td className="px-4 py-3 text-right">
                                    <Link as="button" method="delete" href={route('admin.mahasiswa.riwayat-pendidikan.destroy', [mahasiswa.id, r.id])} className="text-[10px] font-bold uppercase text-red-600">Hapus</Link>
                                </td>
                            </tr>
                        ))}
                        {(!mahasiswa.riwayat_pendidikans || mahasiswa.riwayat_pendidikans.length === 0) && (
                            <tr><td colSpan="6" className="px-4 py-8 text-center text-sm text-neutral-500">Belum ada riwayat pendidikan.</td></tr>
                        )}
                    </tbody>
                </table>
            </Box>

            <Box>
                <SectionTitle>Tambah Riwayat Pendidikan</SectionTitle>
                <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div>
                        <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">Jenjang</label>
                        <select value={data.jenjang_pendidikan} onChange={(e) => setData('jenjang_pendidikan', e.target.value)} className="w-full border-[#e5e5e5] rounded-none text-sm">
                            {['SMA', 'SMK', 'MA', 'D1', 'D2', 'D3', 'lainnya'].map((j) => <option key={j} value={j}>{j}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">Nama Institusi</label>
                        <input value={data.nama_institusi} onChange={(e) => setData('nama_institusi', e.target.value)} className="w-full border-[#e5e5e5] rounded-none text-sm" required />
                        {errors.nama_institusi && <p className="text-xs text-red-600 mt-1">{errors.nama_institusi}</p>}
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">NPSN</label>
                        <input value={data.npsn} onChange={(e) => setData('npsn', e.target.value)} className="w-full border-[#e5e5e5] rounded-none text-sm" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">Program/Jurusan</label>
                        <input value={data.program_jurusan} onChange={(e) => setData('program_jurusan', e.target.value)} className="w-full border-[#e5e5e5] rounded-none text-sm" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">Tanggal Lulus</label>
                        <input type="date" value={data.tanggal_lulus} onChange={(e) => setData('tanggal_lulus', e.target.value)} className="w-full border-[#e5e5e5] rounded-none text-sm" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">No. Ijazah</label>
                        <input value={data.nomor_ijazah} onChange={(e) => setData('nomor_ijazah', e.target.value)} className="w-full border-[#e5e5e5] rounded-none text-sm" />
                    </div>
                    <div className="col-span-full">
                        <ActionButton type="submit" disabled={processing}>Simpan</ActionButton>
                    </div>
                </form>
            </Box>
        </div>
    );
}

function RiwayatStatusTab({ mahasiswa, tahunAjarans }) {
    const { data, setData, post, processing, reset, errors } = useForm({
        status: 'aktif', tanggal_berlaku: '', tahun_ajaran_id: '', alasan: '', keterangan: '', dokumen_pendukung: null,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.mahasiswa.status-history.store', mahasiswa.id), {
            forceFormData: true,
            onSuccess: () => reset(),
        });
    };

    return (
        <div className="space-y-6">
            <Box padded={false} className="overflow-hidden">
                <table className="min-w-full divide-y divide-[#e5e5e5]">
                    <thead className="bg-[#fafafa]">
                        <tr>
                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500">Tanggal Berlaku</th>
                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500">Status</th>
                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500">Alasan</th>
                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500">Diubah Oleh</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e5e5e5]">
                        {(mahasiswa.status_histories || []).map((s) => (
                            <tr key={s.id}>
                                <td className="px-4 py-3 text-sm">{fmtDate(s.tanggal_berlaku)}</td>
                                <td className="px-4 py-3 text-sm"><StatusBadge status={s.status} /></td>
                                <td className="px-4 py-3 text-sm">{s.alasan || '-'}</td>
                                <td className="px-4 py-3 text-sm">{s.changed_by?.name || '-'}</td>
                            </tr>
                        ))}
                        {(!mahasiswa.status_histories || mahasiswa.status_histories.length === 0) && (
                            <tr><td colSpan="4" className="px-4 py-8 text-center text-sm text-neutral-500">Belum ada riwayat status.</td></tr>
                        )}
                    </tbody>
                </table>
            </Box>

            <Box>
                <SectionTitle>Catat Perubahan Status</SectionTitle>
                <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div>
                        <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">Status</label>
                        <select value={data.status} onChange={(e) => setData('status', e.target.value)} className="w-full border-[#e5e5e5] rounded-none text-sm">
                            {['aktif', 'cuti', 'nonaktif', 'lulus', 'dropout', 'mengundurkan_diri', 'pindah', 'dikeluarkan'].map((s) => (
                                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">Tanggal Berlaku</label>
                        <input type="date" value={data.tanggal_berlaku} onChange={(e) => setData('tanggal_berlaku', e.target.value)} className="w-full border-[#e5e5e5] rounded-none text-sm" required />
                        {errors.tanggal_berlaku && <p className="text-xs text-red-600 mt-1">{errors.tanggal_berlaku}</p>}
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">Tahun Ajaran</label>
                        <select value={data.tahun_ajaran_id} onChange={(e) => setData('tahun_ajaran_id', e.target.value)} className="w-full border-[#e5e5e5] rounded-none text-sm">
                            <option value="">-</option>
                            {(tahunAjarans || []).map((t) => <option key={t.id} value={t.id}>{t.nama_tahun_ajaran}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">Alasan</label>
                        <input value={data.alasan} onChange={(e) => setData('alasan', e.target.value)} className="w-full border-[#e5e5e5] rounded-none text-sm" />
                    </div>
                    <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">Keterangan</label>
                        <input value={data.keterangan} onChange={(e) => setData('keterangan', e.target.value)} className="w-full border-[#e5e5e5] rounded-none text-sm" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">Dokumen Pendukung</label>
                        <input type="file" onChange={(e) => setData('dokumen_pendukung', e.target.files[0])} className="w-full text-sm" />
                    </div>
                    <div className="col-span-full">
                        <ActionButton type="submit" disabled={processing}>Simpan</ActionButton>
                    </div>
                </form>
            </Box>
        </div>
    );
}

function KebutuhanKhususTab({ mahasiswa }) {
    const { data, setData, post, processing, reset } = useForm({ jenis_kebutuhan: 'lainnya', keterangan: '' });

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.mahasiswa.kebutuhan-khusus.store', mahasiswa.id), { onSuccess: () => reset() });
    };

    return (
        <div className="space-y-6">
            <Box padded={false} className="overflow-hidden">
                <table className="min-w-full divide-y divide-[#e5e5e5]">
                    <thead className="bg-[#fafafa]">
                        <tr>
                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500">Jenis</th>
                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500">Keterangan</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e5e5e5]">
                        {(mahasiswa.kebutuhan_khusus || []).map((k) => (
                            <tr key={k.id}>
                                <td className="px-4 py-3 text-sm capitalize">{k.jenis_kebutuhan.replace(/_/g, ' ')}</td>
                                <td className="px-4 py-3 text-sm">{k.keterangan || '-'}</td>
                                <td className="px-4 py-3 text-right">
                                    <Link as="button" method="delete" href={route('admin.mahasiswa.kebutuhan-khusus.destroy', [mahasiswa.id, k.id])} className="text-[10px] font-bold uppercase text-red-600">Hapus</Link>
                                </td>
                            </tr>
                        ))}
                        {(!mahasiswa.kebutuhan_khusus || mahasiswa.kebutuhan_khusus.length === 0) && (
                            <tr><td colSpan="3" className="px-4 py-8 text-center text-sm text-neutral-500">Tidak ada kebutuhan khusus.</td></tr>
                        )}
                    </tbody>
                </table>
            </Box>

            <Box>
                <SectionTitle>Tambah Kebutuhan Khusus</SectionTitle>
                <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                    <div>
                        <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">Jenis</label>
                        <select value={data.jenis_kebutuhan} onChange={(e) => setData('jenis_kebutuhan', e.target.value)} className="w-full border-[#e5e5e5] rounded-none text-sm">
                            {['tuna_netra', 'tuna_rungu', 'tuna_daksa', 'tuna_grahita', 'kesulitan_belajar_spesifik', 'autis', 'lainnya'].map((j) => (
                                <option key={j} value={j}>{j.replace(/_/g, ' ')}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">Keterangan</label>
                        <input value={data.keterangan} onChange={(e) => setData('keterangan', e.target.value)} className="w-full border-[#e5e5e5] rounded-none text-sm" />
                    </div>
                    <div className="col-span-full">
                        <ActionButton type="submit" disabled={processing}>Simpan</ActionButton>
                    </div>
                </form>
            </Box>
        </div>
    );
}

function BeasiswaTab({ mahasiswa }) {
    const { data, setData, post, processing, reset, errors } = useForm({
        jenis_bantuan: 'kip_kuliah', nama_bantuan: '', nomor_bantuan: '', tanggal_mulai: '', tanggal_selesai: '', status: 'aktif', keterangan: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.mahasiswa.beasiswa.store', mahasiswa.id), { onSuccess: () => reset() });
    };

    return (
        <div className="space-y-6">
            <Box padded={false} className="overflow-hidden">
                <table className="min-w-full divide-y divide-[#e5e5e5]">
                    <thead className="bg-[#fafafa]">
                        <tr>
                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500">Jenis</th>
                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500">Nomor</th>
                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500">Periode</th>
                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500">Status</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e5e5e5]">
                        {(mahasiswa.beasiswas || []).map((b) => (
                            <tr key={b.id}>
                                <td className="px-4 py-3 text-sm capitalize">{b.jenis_bantuan.replace(/_/g, ' ')}</td>
                                <td className="px-4 py-3 text-sm">{b.nomor_bantuan || '-'}</td>
                                <td className="px-4 py-3 text-sm">{fmtDate(b.tanggal_mulai)} - {fmtDate(b.tanggal_selesai)}</td>
                                <td className="px-4 py-3 text-sm capitalize">{b.status}</td>
                                <td className="px-4 py-3 text-right">
                                    <Link as="button" method="delete" href={route('admin.mahasiswa.beasiswa.destroy', [mahasiswa.id, b.id])} className="text-[10px] font-bold uppercase text-red-600">Hapus</Link>
                                </td>
                            </tr>
                        ))}
                        {(!mahasiswa.beasiswas || mahasiswa.beasiswas.length === 0) && (
                            <tr><td colSpan="5" className="px-4 py-8 text-center text-sm text-neutral-500">Belum ada beasiswa/bantuan.</td></tr>
                        )}
                    </tbody>
                </table>
            </Box>

            <Box>
                <SectionTitle>Tambah Beasiswa/Bantuan</SectionTitle>
                <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div>
                        <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">Jenis Bantuan</label>
                        <select value={data.jenis_bantuan} onChange={(e) => setData('jenis_bantuan', e.target.value)} className="w-full border-[#e5e5e5] rounded-none text-sm">
                            {['kip_kuliah', 'beasiswa_internal', 'beasiswa_eksternal', 'bantuan_pemerintah', 'lainnya'].map((j) => (
                                <option key={j} value={j}>{j.replace(/_/g, ' ')}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">Nomor Bantuan</label>
                        <input value={data.nomor_bantuan} onChange={(e) => setData('nomor_bantuan', e.target.value)} className="w-full border-[#e5e5e5] rounded-none text-sm" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">Status</label>
                        <select value={data.status} onChange={(e) => setData('status', e.target.value)} className="w-full border-[#e5e5e5] rounded-none text-sm">
                            {['aktif', 'selesai', 'dibatalkan'].map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">Tanggal Mulai</label>
                        <input type="date" value={data.tanggal_mulai} onChange={(e) => setData('tanggal_mulai', e.target.value)} className="w-full border-[#e5e5e5] rounded-none text-sm" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">Tanggal Selesai</label>
                        <input type="date" value={data.tanggal_selesai} onChange={(e) => setData('tanggal_selesai', e.target.value)} className="w-full border-[#e5e5e5] rounded-none text-sm" />
                        {errors.tanggal_selesai && <p className="text-xs text-red-600 mt-1">{errors.tanggal_selesai}</p>}
                    </div>
                    <div className="col-span-full">
                        <ActionButton type="submit" disabled={processing}>Simpan</ActionButton>
                    </div>
                </form>
            </Box>
        </div>
    );
}

function DokumenTab({ mahasiswa }) {
    const { data, setData, post, processing, reset, errors } = useForm({
        jenis_dokumen: 'ktp', nomor_dokumen: '', file: null, tanggal_terbit: '', tanggal_kedaluwarsa: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.mahasiswa.dokumen.store', mahasiswa.id), {
            forceFormData: true,
            onSuccess: () => reset(),
        });
    };

    return (
        <div className="space-y-6">
            <Box padded={false} className="overflow-hidden">
                <table className="min-w-full divide-y divide-[#e5e5e5]">
                    <thead className="bg-[#fafafa]">
                        <tr>
                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500">Jenis</th>
                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500">Nomor</th>
                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500">Verifikasi</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e5e5e5]">
                        {(mahasiswa.dokumens || []).map((d) => (
                            <tr key={d.id}>
                                <td className="px-4 py-3 text-sm capitalize">{d.jenis_dokumen.replace(/_/g, ' ')}</td>
                                <td className="px-4 py-3 text-sm">{d.nomor_dokumen || '-'}</td>
                                <td className="px-4 py-3 text-sm capitalize">{d.status_verifikasi}</td>
                                <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                                    <a href={route('admin.mahasiswa.dokumen.download', [mahasiswa.id, d.id])} className="text-[10px] font-bold uppercase text-neutral-700">Unduh</a>
                                    {d.status_verifikasi === 'pending' && (
                                        <>
                                            <Link as="button" method="patch" data={{ status_verifikasi: 'approved' }} href={route('admin.mahasiswa.dokumen.verify', [mahasiswa.id, d.id])} className="text-[10px] font-bold uppercase text-green-700">Setujui</Link>
                                            <Link as="button" method="patch" data={{ status_verifikasi: 'rejected' }} href={route('admin.mahasiswa.dokumen.verify', [mahasiswa.id, d.id])} className="text-[10px] font-bold uppercase text-red-600">Tolak</Link>
                                        </>
                                    )}
                                    <Link as="button" method="delete" href={route('admin.mahasiswa.dokumen.destroy', [mahasiswa.id, d.id])} className="text-[10px] font-bold uppercase text-red-600">Hapus</Link>
                                </td>
                            </tr>
                        ))}
                        {(!mahasiswa.dokumens || mahasiswa.dokumens.length === 0) && (
                            <tr><td colSpan="4" className="px-4 py-8 text-center text-sm text-neutral-500">Belum ada dokumen.</td></tr>
                        )}
                    </tbody>
                </table>
            </Box>

            <Box>
                <SectionTitle>Unggah Dokumen</SectionTitle>
                <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div>
                        <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">Jenis Dokumen</label>
                        <select value={data.jenis_dokumen} onChange={(e) => setData('jenis_dokumen', e.target.value)} className="w-full border-[#e5e5e5] rounded-none text-sm">
                            {['ktp', 'kk', 'ijazah', 'skl', 'akta_kelahiran', 'pas_foto', 'kartu_kip', 'dokumen_transfer', 'surat_pernyataan', 'lainnya'].map((j) => (
                                <option key={j} value={j}>{j.replace(/_/g, ' ')}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">Nomor Dokumen</label>
                        <input value={data.nomor_dokumen} onChange={(e) => setData('nomor_dokumen', e.target.value)} className="w-full border-[#e5e5e5] rounded-none text-sm" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">File (PDF/JPG/PNG)</label>
                        <input type="file" onChange={(e) => setData('file', e.target.files[0])} className="w-full text-sm" required />
                        {errors.file && <p className="text-xs text-red-600 mt-1">{errors.file}</p>}
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">Tanggal Terbit</label>
                        <input type="date" value={data.tanggal_terbit} onChange={(e) => setData('tanggal_terbit', e.target.value)} className="w-full border-[#e5e5e5] rounded-none text-sm" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">Tanggal Kedaluwarsa</label>
                        <input type="date" value={data.tanggal_kedaluwarsa} onChange={(e) => setData('tanggal_kedaluwarsa', e.target.value)} className="w-full border-[#e5e5e5] rounded-none text-sm" />
                    </div>
                    <div className="col-span-full">
                        <ActionButton type="submit" disabled={processing}>Unggah</ActionButton>
                    </div>
                </form>
            </Box>
        </div>
    );
}

function PddiktiTab({ mahasiswa }) {
    const mappingForm = useForm({
        pddikti_id: mahasiswa.pddikti_mapping?.pddikti_id || '',
        pddikti_nim: mahasiswa.pddikti_mapping?.pddikti_nim || '',
    });

    const saveMapping = (e) => {
        e.preventDefault();
        mappingForm.put(route('admin.mahasiswa.pddikti.mapping.update', mahasiswa.id));
    };

    const sync = () => {
        router.post(route('admin.mahasiswa.pddikti.sync', mahasiswa.id));
    };

    return (
        <div className="space-y-6">
            <Box>
                <SectionTitle
                    action={<ActionButton onClick={sync} variant="secondary">Sinkronkan Sekarang</ActionButton>}
                >
                    Mapping PDDikti
                </SectionTitle>
                <p className="text-xs text-neutral-500 mb-4 bg-[#fafafa] border border-[#e5e5e5] p-3">
                    Integrasi Neo Feeder belum terpasang di sistem ini. Sinkronisasi akan mencatat percobaan
                    pada log dan menandai status sebagai gagal sampai client resmi tersedia.
                </p>
                <form onSubmit={saveMapping} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">ID Mahasiswa PDDikti</label>
                        <input value={mappingForm.data.pddikti_id} onChange={(e) => mappingForm.setData('pddikti_id', e.target.value)} className="w-full border-[#e5e5e5] rounded-none text-sm" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">NIM PDDikti</label>
                        <input value={mappingForm.data.pddikti_nim} onChange={(e) => mappingForm.setData('pddikti_nim', e.target.value)} className="w-full border-[#e5e5e5] rounded-none text-sm" />
                    </div>
                    <div className="col-span-full">
                        <ActionButton type="submit" disabled={mappingForm.processing}>Simpan Mapping</ActionButton>
                    </div>
                </form>
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <DetailItem label="Status Mapping">{mahasiswa.pddikti_mapping?.status_display || 'Belum Terhubung'}</DetailItem>
                    <DetailItem label="Terakhir Sinkron">{mahasiswa.pddikti_mapping?.last_synced_at ? fmtDate(mahasiswa.pddikti_mapping.last_synced_at, true) : '-'}</DetailItem>
                </div>
            </Box>

            <Box padded={false} className="overflow-hidden">
                <div className="px-6 py-4 border-b border-[#e5e5e5]">
                    <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-900">Log Sinkronisasi</h2>
                </div>
                <table className="min-w-full divide-y divide-[#e5e5e5]">
                    <thead className="bg-[#fafafa]">
                        <tr>
                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500">Waktu</th>
                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500">Aksi</th>
                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500">Status</th>
                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500">Pesan</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e5e5e5]">
                        {(mahasiswa.pddikti_sync_logs || []).map((log) => (
                            <tr key={log.id}>
                                <td className="px-4 py-3 text-sm">{fmtDate(log.created_at, true)}</td>
                                <td className="px-4 py-3 text-sm">{log.action}</td>
                                <td className="px-4 py-3 text-sm capitalize">{log.status}</td>
                                <td className="px-4 py-3 text-sm">{log.message || '-'}</td>
                            </tr>
                        ))}
                        {(!mahasiswa.pddikti_sync_logs || mahasiswa.pddikti_sync_logs.length === 0) && (
                            <tr><td colSpan="4" className="px-4 py-8 text-center text-sm text-neutral-500">Belum ada log sinkronisasi.</td></tr>
                        )}
                    </tbody>
                </table>
            </Box>
        </div>
    );
}

export default function Show({ mahasiswa, tahunAjarans }) {
    const [tab, setTab] = useState('Overview');

    return (
        <AdminLayout title="Detail Mahasiswa">
            <Head title={`Detail Mahasiswa - ${mahasiswa.nama_lengkap}`} />

            <div className="p-6 lg:p-8 min-h-dvh bg-[#fafafa]">
                <Box variant="black" className="mb-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/75 mb-1">Manajemen Mahasiswa</p>
                            <h1 className="text-xl font-bold uppercase tracking-tight text-white">{mahasiswa.nama_lengkap}</h1>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <ActionButton href={route('admin.mahasiswa.edit', mahasiswa.id)} variant="secondary">Edit</ActionButton>
                            {mahasiswa.user && (
                                <ActionButton href={route('admin.user-management.reset-password.form', mahasiswa.user.id)} variant="danger">Reset Password</ActionButton>
                            )}
                            <ActionButton href={route('admin.mahasiswa.index')} variant="ghost">Kembali</ActionButton>
                        </div>
                    </div>
                </Box>

                <Box padded={false} className="mb-6 overflow-x-auto">
                    <div className="flex px-2">
                        {TABS.map((t) => (
                            <TabButton key={t} label={t} active={tab === t} onClick={() => setTab(t)} />
                        ))}
                    </div>
                </Box>

                {tab === 'Overview' && <OverviewTab mahasiswa={mahasiswa} />}
                {tab === 'Biodata' && <BiodataTab mahasiswa={mahasiswa} />}
                {tab === 'Kontak' && <KontakTab mahasiswa={mahasiswa} />}
                {tab === 'Alamat' && <AlamatTab mahasiswa={mahasiswa} />}
                {tab === 'Orang Tua/Wali' && <OrangTuaTab mahasiswa={mahasiswa} />}
                {tab === 'Registrasi' && <RegistrasiTab mahasiswa={mahasiswa} />}
                {tab === 'Riwayat Pendidikan' && <RiwayatPendidikanTab mahasiswa={mahasiswa} />}
                {tab === 'Riwayat Status' && <RiwayatStatusTab mahasiswa={mahasiswa} tahunAjarans={tahunAjarans} />}
                {tab === 'Kebutuhan Khusus' && <KebutuhanKhususTab mahasiswa={mahasiswa} />}
                {tab === 'Beasiswa/Bantuan' && <BeasiswaTab mahasiswa={mahasiswa} />}
                {tab === 'Dokumen' && <DokumenTab mahasiswa={mahasiswa} />}
                {tab === 'PDDikti' && <PddiktiTab mahasiswa={mahasiswa} />}
            </div>
        </AdminLayout>
    );
}
