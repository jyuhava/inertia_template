import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

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

function SectionTitle({ children, action }) {
    return (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-900">{children}</h2>
            {action ? <div>{action}</div> : null}
        </div>
    );
}

function ActionButton({ children, href, onClick, variant = 'primary', type = 'button', disabled = false }) {
    const map = {
        primary: 'bg-black text-white border border-black hover:bg-neutral-800',
        secondary: 'bg-white text-neutral-900 border border-neutral-300 hover:bg-neutral-50',
        danger: 'bg-white text-neutral-900 border border-neutral-900 hover:bg-neutral-100',
    };
    const className = `inline-flex items-center px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${map[variant] || map.primary} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`;
    if (href) {
        return (
            <a href={href} className={className}>
                {children}
            </a>
        );
    }
    return (
        <button type={type} onClick={onClick} disabled={disabled} className={className}>
            {children}
        </button>
    );
}

function Alert({ children, variant = 'warning' }) {
    const map = {
        warning: 'bg-white border-l-4 border-neutral-900 text-neutral-900',
        success: 'bg-neutral-50 border-l-4 border-neutral-900 text-neutral-900',
        error: 'bg-white border-l-4 border-neutral-500 text-neutral-700',
    };
    return (
        <div className={`mb-6 p-4 ${map[variant] || map.warning}`}>
            {children}
        </div>
    );
}

export default function Index({ mahasiswa, hasUploaded, komitmenUrl, flash }) {
    const { data, setData, post, processing, errors } = useForm({
        surat_komitmen: null,
    });

    const [selectedFile, setSelectedFile] = useState(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setSelectedFile(file);
        setData('surat_komitmen', file);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/mahasiswa/surat-komitmen/upload', {
            forceFormData: true,
            onSuccess: () => {
                setSelectedFile(null);
                setData('surat_komitmen', null);
            },
        });
    };

    const handleDelete = () => {
        if (confirm('Apakah Anda yakin ingin menghapus surat komitmen?')) {
            post('/mahasiswa/surat-komitmen/delete', {
                method: 'delete',
            });
        }
    };

    return (
        <AdminLayout title="Surat Komitmen">
            <Head title="Surat Komitmen" />

            <div className="max-w-5xl mx-auto space-y-6">
                <Box variant="black" className="text-center relative overflow-hidden">
                    <div className="absolute right-0 top-0 h-32 w-32 bg-neutral-800/30" />
                    <div className="absolute bottom-0 left-0 h-24 w-24 bg-neutral-800/20" />
                    <div className="relative">
                        <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">STIT AL-WAFI BOGOR</p>
                        <h1 className="mt-1 text-2xl font-bold md:text-3xl">Surat Komitmen Mahasiswa</h1>
                        <p className="mt-2 text-sm text-neutral-300">Upload surat komitmen untuk mengakses fitur akademik.</p>
                    </div>
                </Box>

                {!hasUploaded && (
                    <Alert variant="warning">
                        <div className="flex items-start gap-3">
                            <svg className="h-5 w-5 text-neutral-900 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <p className="text-sm">
                                <strong>Perhatian!</strong> Anda harus mengupload surat komitmen untuk dapat mengakses fitur lainnya seperti KRS, KHS, dan Absensi.
                            </p>
                        </div>
                    </Alert>
                )}

                {flash?.success && (
                    <Alert variant="success">
                        <p className="text-sm">{flash.success}</p>
                    </Alert>
                )}

                {flash?.error && (
                    <Alert variant="error">
                        <p className="text-sm">{flash.error}</p>
                    </Alert>
                )}

                {flash?.warning && (
                    <Alert variant="warning">
                        <p className="text-sm">{flash.warning}</p>
                    </Alert>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Box>
                        <SectionTitle>{hasUploaded ? 'Perbarui Surat Komitmen' : 'Upload Surat Komitmen'}</SectionTitle>

                        {hasUploaded && (
                            <div className="mb-5 p-4 bg-neutral-50 border border-neutral-200">
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-neutral-900" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-sm font-bold text-neutral-900">Surat komitmen sudah diupload</span>
                                </div>
                                <div className="mt-2 flex gap-3 text-sm">
                                    <a
                                        href={komitmenUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-bold text-neutral-900 underline hover:text-neutral-600"
                                    >
                                        Lihat File
                                    </a>
                                    <span className="text-neutral-300">|</span>
                                    <button
                                        onClick={handleDelete}
                                        className="font-bold text-neutral-900 underline hover:text-neutral-600"
                                    >
                                        Hapus
                                    </button>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-neutral-700 mb-2">
                                    File Surat Komitmen (PDF) <span className="text-neutral-900">*</span>
                                </label>
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    accept=".pdf"
                                    required={!hasUploaded}
                                    className="w-full border border-neutral-300 px-3 py-2 text-sm text-neutral-700 file:mr-3 file:border-0 file:bg-neutral-900 file:px-3 file:py-1.5 file:text-xs file:font-bold file:uppercase file:tracking-widest file:text-white hover:file:bg-neutral-800 focus:outline-none focus:border-neutral-900"
                                />
                                {errors.surat_komitmen && (
                                    <div className="text-rose-600 text-xs mt-2">{errors.surat_komitmen}</div>
                                )}
                                <p className="text-xs text-neutral-500 mt-2">Format: PDF, Maksimal: 2MB</p>
                                {selectedFile && (
                                    <p className="text-sm text-neutral-900 mt-2 font-medium">File terpilih: {selectedFile.name}</p>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <ActionButton type="submit" disabled={processing}>
                                    {processing && (
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    )}
                                    {hasUploaded ? 'Update Surat Komitmen' : 'Upload Surat Komitmen'}
                                </ActionButton>

                                <ActionButton href="/mahasiswa/surat-komitmen/download" variant="secondary">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                    </svg>
                                    Download Template
                                </ActionButton>
                            </div>
                        </form>
                    </Box>

                    <Box variant="gray">
                        <SectionTitle>Petunjuk Penggunaan</SectionTitle>

                        <div className="space-y-4 text-sm text-neutral-800">
                            <div>
                                <h3 className="font-bold text-neutral-900 mb-1">1. Download Template</h3>
                                <p className="text-neutral-600">Klik tombol "Download Template" untuk mendapatkan form surat komitmen kosong.</p>
                            </div>

                            <div>
                                <h3 className="font-bold text-neutral-900 mb-1">2. Isi Surat Komitmen</h3>
                                <p className="text-neutral-600">Isi data diri dan tanda tangan pada surat komitmen. Pastikan menggunakan materai 10.000.</p>
                            </div>

                            <div>
                                <h3 className="font-bold text-neutral-900 mb-1">3. Scan & Upload</h3>
                                <p className="text-neutral-600">Scan surat komitmen yang sudah ditandatangani dalam format PDF (maksimal 2MB).</p>
                            </div>

                            <div>
                                <h3 className="font-bold text-neutral-900 mb-1">4. Akses Fitur</h3>
                                <p className="text-neutral-600">Setelah berhasil upload, Anda dapat mengakses semua fitur mahasiswa seperti KRS, KHS, dan Absensi.</p>
                            </div>
                        </div>

                        <div className="mt-6 p-4 bg-white border border-neutral-200">
                            <h3 className="text-sm font-bold text-neutral-900 mb-1">⚠️ Penting</h3>
                            <p className="text-neutral-700 text-sm">
                                Surat komitmen wajib diupload sebelum dapat menggunakan sistem akademik.
                                Pastikan file yang diupload jelas dan dapat dibaca.
                            </p>
                        </div>
                    </Box>
                </div>
            </div>
        </AdminLayout>
    );
}
