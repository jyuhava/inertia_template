import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';

function Box({ children, className = '', padded = true, variant = 'white' }) {
    const variants = {
        white: 'bg-white border-[#e5e5e5]',
        black: 'bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 border-transparent text-white rounded-2xl shadow-lg shadow-violet-500/20',
        gray: 'bg-[#f5f5f5] border-[#e5e5e5]',
        info: 'bg-[#f5f5f5] border-[#e5e5e5]',
        warning: 'bg-white border-yellow-200',
    };
    return (
        <div className={`border ${variants[variant]} ${padded ? 'p-6' : ''} ${className}`}>
            {children}
        </div>
    );
}

function SectionTitle({ children }) {
    return (
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-900 mb-4">{children}</h2>
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
            <a href={href} className={`${base} ${map[variant]}`}>
                {children}
            </a>
        );
    }
    return (
        <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${map[variant]}`}>
            {children}
        </button>
    );
}

export default function Index({ prodis, errors, flash }) {
    const { data, setData, post, processing, reset } = useForm({
        prodi_id: '',
        csv_file: null,
    });

    const [selectedFile, setSelectedFile] = useState(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setSelectedFile(file);
        setData('csv_file', file);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/admin/bulk-mahasiswa/import', {
            forceFormData: true,
            onSuccess: () => {
                reset();
                setSelectedFile(null);
            },
        });
    };

    return (
        <AdminLayout title="Import Mahasiswa Bulk">
            <Head title="Import Mahasiswa Bulk" />

            <div className="p-6 lg:p-8 min-h-dvh bg-[#fafafa]">
                <Box variant="black" className="mb-6">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/75 mb-1">Manajemen Akademik</p>
                        <h1 className="text-xl font-bold uppercase tracking-tight text-white">Import Mahasiswa Bulk</h1>
                        <p className="mt-2 text-xs text-white/85">Upload file CSV untuk menambahkan mahasiswa secara massal.</p>
                    </div>
                </Box>

                {flash?.success && (
                    <Box variant="black" className="mb-6">
                        <p className="text-xs font-bold uppercase tracking-widest">{flash.success}</p>
                    </Box>
                )}

                {flash?.import_errors && flash.import_errors.length > 0 && (
                    <Box variant="warning" className="mb-6">
                        <SectionTitle>Beberapa data gagal diimport</SectionTitle>
                        <ul className="list-disc list-inside max-h-40 overflow-y-auto text-xs text-neutral-700 space-y-1">
                            {flash.import_errors.map((error, index) => (
                                <li key={index}>{error}</li>
                            ))}
                        </ul>
                    </Box>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Box>
                        <SectionTitle>Import Data Mahasiswa</SectionTitle>

                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1.5">
                                    Program Studi <span className="text-red-600">*</span>
                                </label>
                                <select
                                    value={data.prodi_id}
                                    onChange={(e) => setData('prodi_id', e.target.value)}
                                    className="w-full px-3 py-2 text-xs border border-[#ccc] bg-white focus:outline-none focus:border-black"
                                    required
                                >
                                    <option value="">Pilih Program Studi</option>
                                    {prodis.map((prodi) => (
                                        <option key={prodi.id} value={prodi.id}>
                                            {prodi.kode_prodi} - {prodi.nama_prodi}
                                        </option>
                                    ))}
                                </select>
                                {errors.prodi_id && <div className="text-red-600 text-xs mt-1">{errors.prodi_id}</div>}
                            </div>

                            <div className="mb-4">
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1.5">
                                    File CSV <span className="text-red-600">*</span>
                                </label>
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    accept=".csv,.txt"
                                    className="w-full px-3 py-2 text-xs border border-[#ccc] bg-white focus:outline-none focus:border-black"
                                    required
                                />
                                {errors.csv_file && <div className="text-red-600 text-xs mt-1">{errors.csv_file}</div>}
                                <p className="text-[10px] uppercase tracking-widest text-neutral-400 mt-1">Format yang didukung: CSV (max 2MB)</p>
                                {selectedFile && (
                                    <p className="text-xs text-neutral-900 mt-1 font-medium">File terpilih: {selectedFile.name}</p>
                                )}
                            </div>

                            <div className="flex flex-col gap-3">
                                <ActionButton type="submit" disabled={processing} variant="primary">
                                    {processing && (
                                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    )}
                                    Import Mahasiswa
                                </ActionButton>

                                <div className="flex gap-2">
                                    <ActionButton href="/admin/bulk-mahasiswa/template?delimiter=," variant="secondary">Template (,)</ActionButton>
                                    <ActionButton href="/admin/bulk-mahasiswa/template?delimiter=;" variant="secondary">Template (;)</ActionButton>
                                </div>
                            </div>
                        </form>
                    </Box>

                    <Box variant="info">
                        <SectionTitle>Petunjuk Penggunaan</SectionTitle>

                        <div className="space-y-4 text-xs text-neutral-700">
                            <div>
                                <h3 className="font-bold text-neutral-900 mb-1">1. Download Template</h3>
                                <p>Pilih template sesuai dengan aplikasi yang digunakan:</p>
                                <ul className="list-disc list-inside ml-2 mt-1 text-neutral-600">
                                    <li><strong>Template (,)</strong> - Untuk Excel, Google Sheets, atau aplikasi yang menggunakan koma</li>
                                    <li><strong>Template (;)</strong> - Untuk Excel versi Eropa atau aplikasi yang menggunakan semicolon</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="font-bold text-neutral-900 mb-1">2. Format File CSV</h3>
                                <p>File CSV harus memiliki kolom berikut (urutan harus sesuai):</p>
                                <ul className="list-disc list-inside ml-2 mt-1 text-neutral-600">
                                    <li>nim</li>
                                    <li>nama_lengkap</li>
                                    <li>jenis_kelamin (L/P)</li>
                                    <li>no_ktp</li>
                                    <li>tempat_lahir</li>
                                    <li>tanggal_lahir (YYYY-MM-DD)</li>
                                    <li>no_hp</li>
                                    <li>alamat</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="font-bold text-neutral-900 mb-1">3. Auto-Detection</h3>
                                <p className="text-neutral-600">Sistem secara otomatis mendeteksi delimiter CSV (koma atau semicolon) berdasarkan isi file.</p>
                            </div>

                            <div>
                                <h3 className="font-bold text-neutral-900 mb-1">4. Data Otomatis</h3>
                                <ul className="list-disc list-inside ml-2 text-neutral-600">
                                    <li><strong>Email:</strong> Dibuat otomatis dari nama dengan domain @alwafi.ac.id</li>
                                    <li><strong>Password:</strong> Default "password" untuk semua mahasiswa</li>
                                    <li><strong>Angkatan:</strong> Tahun saat ini</li>
                                    <li><strong>Status:</strong> Aktif</li>
                                </ul>
                            </div>

                            <Box variant="warning" className="!p-4">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-yellow-700 mb-1">Perhatian</h3>
                                <p className="text-yellow-700">NIM dan email yang sudah ada akan dilewati. Pastikan data belum pernah diimport sebelumnya.</p>
                            </Box>
                        </div>
                    </Box>
                </div>
            </div>
        </AdminLayout>
    );
}
