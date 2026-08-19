import { useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';

export default function CalonMahasiswaDashboard({ 
    calonMahasiswa, 
    dokumenRequired, 
    dokumenOptional, 
    uploadedDocs, 
    progress,
    canSubmit 
}) {
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [selectedDokumen, setSelectedDokumen] = useState(null);

    const { data: profileData, setData: setProfileData, put: updateProfile, processing: updatingProfile, errors: profileErrors } = useForm({
        nama_lengkap: calonMahasiswa.nama_lengkap || '',
        jenis_kelamin: calonMahasiswa.jenis_kelamin || '',
        tempat_lahir: calonMahasiswa.tempat_lahir || '',
        tanggal_lahir: calonMahasiswa.tanggal_lahir || '',
        agama: calonMahasiswa.agama || '',
        alamat: calonMahasiswa.alamat || '',
        no_hp: calonMahasiswa.no_hp || '',
        nama_ayah: calonMahasiswa.nama_ayah || '',
        pekerjaan_ayah: calonMahasiswa.pekerjaan_ayah || '',
        nama_ibu: calonMahasiswa.nama_ibu || '',
        pekerjaan_ibu: calonMahasiswa.pekerjaan_ibu || '',
        no_hp_ortu: calonMahasiswa.no_hp_ortu || '',
        alamat_ortu: calonMahasiswa.alamat_ortu || '',
        asal_sekolah: calonMahasiswa.asal_sekolah || '',
        tahun_lulus: calonMahasiswa.tahun_lulus || '',
        jurusan_sekolah: calonMahasiswa.jurusan_sekolah || '',
        nilai_rata_rata: calonMahasiswa.nilai_rata_rata || '',
    });

    const { data: uploadData, setData: setUploadData, post: uploadFile, processing: uploading, errors: uploadErrors } = useForm({
        dokumen_pmb_id: '',
        file: null,
    });

    const { post: submitApplication, processing: submitting } = useForm();

    const getStatusBadge = (status) => {
        const badges = {
            draft: { color: 'bg-gray-100 text-gray-800', text: 'Draft' },
            submitted: { color: 'bg-blue-100 text-blue-800', text: 'Disubmit' },
            verified: { color: 'bg-yellow-100 text-yellow-800', text: 'Diverifikasi' },
            accepted: { color: 'bg-green-100 text-green-800', text: 'Diterima' },
            rejected: { color: 'bg-red-100 text-red-800', text: 'Ditolak' },
        };
        return badges[status] || badges.draft;
    };

    const handleUpdateProfile = (e) => {
        e.preventDefault();
        updateProfile(route('calon-mahasiswa.profile.update'), {
            onSuccess: () => {
                setShowProfileModal(false);
            },
        });
    };

    const handleUploadDokumen = (e) => {
        e.preventDefault();
        console.log('Uploading document:', {
            dokumen_pmb_id: uploadData.dokumen_pmb_id,
            file: uploadData.file,
            route: route('calon-mahasiswa.dokumen.upload')
        });
        
        uploadFile(route('calon-mahasiswa.dokumen.upload'), {
            onSuccess: () => {
                console.log('Upload successful');
                setShowUploadModal(false);
                setSelectedDokumen(null);
                setUploadData('file', null);
            },
            onError: (errors) => {
                console.error('Upload failed:', errors);
            }
        });
    };

    const handleSubmitApplication = () => {
        submitApplication(route('calon-mahasiswa.submit'), {
            onSuccess: () => {
                setShowSubmitModal(false);
            },
        });
    };

    const openUploadModal = (dokumen) => {
        console.log('Opening upload modal for dokumen:', dokumen);
        setSelectedDokumen(dokumen);
        setUploadData('dokumen_pmb_id', dokumen.id);
        setShowUploadModal(true);
        console.log('Upload modal should be visible now');
    };

    const statusBadge = getStatusBadge(calonMahasiswa.status_pendaftaran);

    return (
        <AdminLayout title="Dashboard Calon Mahasiswa">
            <Head title="Dashboard Calon Mahasiswa" />

            <div className="space-y-6">
                {/* Welcome Section */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl shadow-xl text-white p-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold">Selamat Datang!</h1>
                            <p className="text-blue-100 mt-2">{calonMahasiswa.nama_lengkap}</p>
                            <p className="text-blue-200 text-sm">No. Pendaftaran: {calonMahasiswa.no_pendaftaran}</p>
                        </div>
                        <div className="mt-4 md:mt-0 text-center">
                            <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm text-white`}>
                                Status: {statusBadge.text}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Progress Section */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-900">Progress Pendaftaran</h2>
                        <span className="text-2xl font-bold text-blue-600">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                        <div 
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <p className="text-sm text-gray-600">
                        {progress === 100 
                            ? 'Semua dokumen telah diupload. Anda dapat submit pendaftaran.'
                            : `Upload ${dokumenRequired.length - Object.keys(uploadedDocs).length} dokumen lagi untuk menyelesaikan pendaftaran.`
                        }
                    </p>
                </div>

                {/* Action Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Edit Profil</h3>
                            <p className="text-gray-600 text-sm mb-4">Perbarui data pribadi Anda</p>
                            <SecondaryButton 
                                onClick={() => setShowProfileModal(true)}
                                disabled={!calonMahasiswa.is_editable}
                                className="w-full"
                            >
                                Edit Data
                            </SecondaryButton>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Dokumen</h3>
                            <p className="text-gray-600 text-sm mb-4">Upload berkas persyaratan</p>
                            <PrimaryButton 
                                onClick={() => document.getElementById('dokumen-section').scrollIntoView({ behavior: 'smooth' })}
                                className="w-full"
                            >
                                Kelola Dokumen
                            </PrimaryButton>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Submit Pendaftaran</h3>
                            <p className="text-gray-600 text-sm mb-4">Kirim pendaftaran untuk diproses</p>
                            <PrimaryButton 
                                onClick={() => setShowSubmitModal(true)}
                                disabled={!canSubmit}
                                className="w-full"
                            >
                                Submit
                            </PrimaryButton>
                        </div>
                    </div>
                </div>

                {/* Dokumen Section */}
                <div id="dokumen-section" className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900">Dokumen Persyaratan</h2>
                        <p className="text-sm text-gray-600 mt-1">Upload semua dokumen yang diperlukan</p>
                    </div>

                    <div className="p-6">
                        {/* Required Documents */}
                        <div className="mb-8">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Dokumen Wajib</h3>
                            <div className="space-y-4">
                                {/* Hard-coded documents untuk testing */}
                                {dokumenRequired.map((dokumen) => {
                                    const uploaded = uploadedDocs[dokumen.id];
                                    return (
                                        <div key={dokumen.id} className="border border-gray-200 rounded-lg p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-2 mb-2">
                                                        <h4 className="font-medium text-gray-900">{dokumen.nama_dokumen}</h4>
                                                        {uploaded ? (
                                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${uploaded.status_badge}`}>
                                                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                                    {uploaded.status_verifikasi === 'approved' ? (
                                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                    ) : uploaded.status_verifikasi === 'rejected' ? (
                                                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                                    ) : (
                                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                                    )}
                                                                </svg>
                                                                {uploaded.status_verifikasi === 'approved' ? 'Disetujui' :
                                                                 uploaded.status_verifikasi === 'rejected' ? 'Ditolak' : 'Pending'}
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                                </svg>
                                                                Belum Upload
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-600 mt-1">{dokumen.deskripsi}</p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Format: {dokumen.jenis_file.toUpperCase()} • Max: {dokumen.max_size_mb}MB
                                                    </p>
                                                    {uploaded && (
                                                        <div className={`mt-2 p-2 rounded text-xs ${
                                                            uploaded.status_verifikasi === 'approved' ? 'bg-green-50 border border-green-200' :
                                                            uploaded.status_verifikasi === 'rejected' ? 'bg-red-50 border border-red-200' :
                                                            'bg-blue-50 border border-blue-200'
                                                        }`}>
                                                            <p className={`font-medium ${
                                                                uploaded.status_verifikasi === 'approved' ? 'text-green-800' :
                                                                uploaded.status_verifikasi === 'rejected' ? 'text-red-800' :
                                                                'text-blue-800'
                                                            }`}>
                                                                📄 {uploaded.original_name}
                                                            </p>
                                                            <p className={`${
                                                                uploaded.status_verifikasi === 'approved' ? 'text-green-600' :
                                                                uploaded.status_verifikasi === 'rejected' ? 'text-red-600' :
                                                                'text-blue-600'
                                                            }`}>
                                                                {uploaded.status_verifikasi === 'rejected' && uploaded.catatan_verifikasi ? 
                                                                    `Ditolak: ${uploaded.catatan_verifikasi}` :
                                                                    `Uploaded: ${new Date(uploaded.tanggal_upload).toLocaleDateString('id-ID')} • Size: ${uploaded.file_size_mb} MB${uploaded.status_verifikasi === 'pending' ? ' • Sedang direview' : ''}`
                                                                }
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    {uploaded ? (
                                                        <>
                                                            <a 
                                                                href={route('calon-mahasiswa.dokumen.download', uploaded.id)}
                                                                target="_blank"
                                                                className="text-blue-600 hover:text-blue-700 text-sm font-medium hover:underline"
                                                            >
                                                                Lihat
                                                            </a>
                                                            {calonMahasiswa.can_upload_dokumen && (
                                                                <SecondaryButton
                                                                    size="sm"
                                                                    onClick={() => openUploadModal(dokumen)}
                                                                >
                                                                    {uploaded.status_verifikasi === 'rejected' ? 'Upload Ulang' : 'Ganti'}
                                                                </SecondaryButton>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <PrimaryButton
                                                            size="sm"
                                                            onClick={() => openUploadModal(dokumen)}
                                                            disabled={!calonMahasiswa.can_upload_dokumen}
                                                        >
                                                            Upload
                                                        </PrimaryButton>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}


                            </div>
                        </div>

                        {/* Optional Documents */}
                        {dokumenOptional.length > 0 && (
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Dokumen Opsional</h3>
                                <div className="space-y-4">
                                    {dokumenOptional.map((dokumen) => {
                                        const uploaded = uploadedDocs[dokumen.id];
                                        return (
                                            <div key={dokumen.id} className="border border-gray-200 rounded-lg p-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center space-x-2 mb-2">
                                                            <h4 className="font-medium text-gray-900">{dokumen.nama_dokumen}</h4>
                                                            {uploaded ? (
                                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${uploaded.status_badge}`}>
                                                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                                        {uploaded.status_verifikasi === 'approved' ? (
                                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                        ) : uploaded.status_verifikasi === 'rejected' ? (
                                                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                                        ) : (
                                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                                        )}
                                                                    </svg>
                                                                    {uploaded.status_verifikasi === 'approved' ? 'Disetujui' :
                                                                     uploaded.status_verifikasi === 'rejected' ? 'Ditolak' : 'Pending'}
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                        <p className="text-sm text-gray-600 mt-1">{dokumen.deskripsi}</p>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Format: {dokumen.jenis_file.toUpperCase()} • Max: {dokumen.max_size_mb}MB
                                                        </p>
                                                        {uploaded && (
                                                            <div className={`mt-2 p-2 rounded text-xs ${
                                                                uploaded.status_verifikasi === 'approved' ? 'bg-green-50 border border-green-200' :
                                                                uploaded.status_verifikasi === 'rejected' ? 'bg-red-50 border border-red-200' :
                                                                'bg-blue-50 border border-blue-200'
                                                            }`}>
                                                                <p className={`font-medium ${
                                                                    uploaded.status_verifikasi === 'approved' ? 'text-green-800' :
                                                                    uploaded.status_verifikasi === 'rejected' ? 'text-red-800' :
                                                                    'text-blue-800'
                                                                }`}>
                                                                    📄 {uploaded.original_name}
                                                                </p>
                                                                <p className={`${
                                                                    uploaded.status_verifikasi === 'approved' ? 'text-green-600' :
                                                                    uploaded.status_verifikasi === 'rejected' ? 'text-red-600' :
                                                                    'text-blue-600'
                                                                }`}>
                                                                    {uploaded.status_verifikasi === 'rejected' && uploaded.catatan_penolakan ? 
                                                                        `Ditolak: ${uploaded.catatan_penolakan}` :
                                                                        `Uploaded: ${new Date(uploaded.created_at).toLocaleDateString('id-ID')} • Size: ${(uploaded.ukuran_file / 1024 / 1024).toFixed(2)} MB${uploaded.status_verifikasi === 'pending' ? ' • Sedang direview' : ''}`
                                                                    }
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        {uploaded ? (
                                                            <>
                                                                <a 
                                                                    href={route('calon-mahasiswa.dokumen.download', uploaded.id)}
                                                                    target="_blank"
                                                                    className="text-blue-600 hover:text-blue-700 text-sm font-medium hover:underline"
                                                                >
                                                                    Lihat
                                                                </a>
                                                                {calonMahasiswa.can_upload_dokumen && (
                                                                    <SecondaryButton
                                                                        size="sm"
                                                                        onClick={() => openUploadModal(dokumen)}
                                                                    >
                                                                        {uploaded.status_verifikasi === 'rejected' ? 'Upload Ulang' : 'Ganti'}
                                                                    </SecondaryButton>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <SecondaryButton
                                                                size="sm"
                                                                onClick={() => openUploadModal(dokumen)}
                                                                disabled={!calonMahasiswa.can_upload_dokumen}
                                                            >
                                                                Upload
                                                            </SecondaryButton>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Information Card */}
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                    <div className="flex items-start">
                        <svg className="w-6 h-6 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <h3 className="font-semibold text-blue-900 mb-2">Informasi Penting</h3>
                            <ul className="text-sm text-blue-800 space-y-1">
                                <li>• Pastikan semua dokumen yang diupload jelas dan sesuai persyaratan</li>
                                <li>• Setelah submit, pendaftaran tidak dapat diubah</li>
                                <li>• Proses verifikasi membutuhkan waktu 1-3 hari kerja</li>
                                <li>• Hubungi panitia PMB jika mengalami kendala</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Profile Modal */}
            <Modal show={showProfileModal} onClose={() => setShowProfileModal(false)} maxWidth="4xl">
                <form onSubmit={handleUpdateProfile} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-6">Edit Profil</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-96 overflow-y-auto">
                        <div>
                            <InputLabel htmlFor="nama_lengkap" value="Nama Lengkap" />
                            <TextInput
                                id="nama_lengkap"
                                value={profileData.nama_lengkap}
                                onChange={(e) => setProfileData('nama_lengkap', e.target.value)}
                                className="mt-1 block w-full"
                                required
                            />
                            <InputError message={profileErrors.nama_lengkap} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="jenis_kelamin" value="Jenis Kelamin" />
                            <select
                                id="jenis_kelamin"
                                value={profileData.jenis_kelamin}
                                onChange={(e) => setProfileData('jenis_kelamin', e.target.value)}
                                className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                            >
                                <option value="L">Laki-laki</option>
                                <option value="P">Perempuan</option>
                            </select>
                        </div>

                        {/* Add more fields as needed */}
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                        <SecondaryButton onClick={() => setShowProfileModal(false)}>
                            Batal
                        </SecondaryButton>
                        <PrimaryButton disabled={updatingProfile}>
                            {updatingProfile ? 'Menyimpan...' : 'Simpan'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Upload Modal - Redesigned */}
            <Modal show={showUploadModal} onClose={() => setShowUploadModal(false)} maxWidth="lg">
                <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
                        📁 Upload {selectedDokumen?.nama_dokumen}
                    </h2>
                    
                    {selectedDokumen && (
                        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h3 className="font-medium text-blue-900 mb-2">Persyaratan File:</h3>
                            <p className="text-sm text-blue-800 mb-2">{selectedDokumen.deskripsi}</p>
                            <div className="text-xs text-blue-700">
                                <span className="font-medium">Format:</span> {selectedDokumen.jenis_file.toUpperCase()} • 
                                <span className="font-medium"> Max:</span> {selectedDokumen.max_size_mb}MB
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleUploadDokumen}>
                        {/* Simple File Input */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Pilih File Dokumen
                            </label>
                            
                            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-8">
                                <div className="text-center">
                                    {/* Upload Icon */}
                                    <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                    </div>
                                    
                                    {/* File Input */}
                                    <input
                                        id="dokumen-file"
                                        type="file"
                                        onChange={(e) => {
                                            console.log('File selected!', e.target.files[0]);
                                            const file = e.target.files[0];
                                            if (file) {
                                                setUploadData('file', file);
                                            }
                                        }}
                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                                        accept={selectedDokumen?.jenis_file ? 
                                            selectedDokumen.jenis_file.split(',').map(type => `.${type.trim()}`).join(',') 
                                            : '*'
                                        }
                                        required
                                    />
                                    
                                    <p className="mt-3 text-sm text-gray-600">
                                        Klik "Choose File" atau drag & drop file disini
                                    </p>
                                </div>
                            </div>
                            
                            {/* File Info */}
                            {uploadData.file && (
                                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="flex items-center">
                                        <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <div>
                                            <p className="text-sm font-medium text-green-800">File berhasil dipilih:</p>
                                            <p className="text-sm text-green-700">{uploadData.file.name}</p>
                                            <p className="text-xs text-green-600">
                                                Ukuran: {(uploadData.file.size / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            <InputError message={uploadErrors.file} className="mt-2" />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end space-x-3">
                            <SecondaryButton 
                                type="button"
                                onClick={() => setShowUploadModal(false)}
                            >
                                Batal
                            </SecondaryButton>
                            <PrimaryButton 
                                type="submit"
                                disabled={uploading || !uploadData.file}
                                className="min-w-[120px]"
                            >
                                {uploading ? (
                                    <div className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Uploading...
                                    </div>
                                ) : (
                                    'Upload File'
                                )}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Submit Modal */}
            <Modal show={showSubmitModal} onClose={() => setShowSubmitModal(false)}>
                <div className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">
                        Konfirmasi Submit Pendaftaran
                    </h2>
                    
                    <p className="text-gray-600 mb-6">
                        Apakah Anda yakin ingin submit pendaftaran? Setelah disubmit, 
                        data tidak dapat diubah lagi dan akan masuk ke proses verifikasi.
                    </p>

                    <div className="flex justify-end space-x-3">
                        <SecondaryButton onClick={() => setShowSubmitModal(false)}>
                            Batal
                        </SecondaryButton>
                        <PrimaryButton 
                            onClick={handleSubmitApplication}
                            disabled={submitting}
                        >
                            {submitting ? 'Memproses...' : 'Ya, Submit'}
                        </PrimaryButton>
                    </div>
                </div>
            </Modal>
        </AdminLayout>
    );
}
