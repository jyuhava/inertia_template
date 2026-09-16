import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';

const brown = {
    50: '#fbf7f3',
    100: '#f5ebe0',
    200: '#e8d4c2',
    300: '#d4b394',
    400: '#b88962',
    500: '#9e6b42',
    600: '#7f4f2e',
    700: '#633d25',
    800: '#4f311f',
    900: '#3f281b',
    950: '#22130d',
};

function PixelDivider({ flip = false, className = '' }) {
    const pattern = [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1],
        [1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1],
        [1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1],
        [1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1],
        [1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1],
        [1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1],
        [1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1],
        [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ];
    return (
        <div className={`flex ${flip ? 'rotate-180' : ''} ${className}`}>
            {pattern.map((row, i) => (
                <div key={i} className="flex flex-col">
                    {row.map((cell, j) => (
                        <div
                            key={j}
                            className="h-2 w-2 sm:h-3 sm:w-3"
                            style={{ backgroundColor: cell ? brown[950] : 'transparent' }}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
}

function StepButton({ children, onClick, disabled = false, variant = 'primary', type = 'button' }) {
    const base = 'inline-flex items-center border px-4 py-2.5 text-xs font-semibold uppercase tracking-widest transition';
    const map = {
        primary: `border-[#7f4f2e] bg-[#7f4f2e] text-white hover:bg-[#633d25] ${disabled ? 'opacity-40' : ''}`,
        secondary: `border-[#e8d4c2] bg-white text-[#633d25] hover:bg-[#f5ebe0] ${disabled ? 'opacity-40' : ''}`,
    };
    return (
        <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${map[variant]}`}>
            {children}
        </button>
    );
}

export default function Register({ periodePmb, prodis }) {
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 4;

    const { data, setData, post, processing, errors, reset } = useForm({
        nama_lengkap: '',
        nik: '',
        jenis_kelamin: '',
        tempat_lahir: '',
        tanggal_lahir: '',
        agama: '',
        alamat: '',
        no_hp: '',
        email: '',
        nama_ayah: '',
        pekerjaan_ayah: '',
        nama_ibu: '',
        pekerjaan_ibu: '',
        no_hp_ortu: '',
        alamat_ortu: '',
        asal_sekolah: '',
        tahun_lulus: '',
        jurusan_sekolah: '',
        nilai_rata_rata: '',
        prodi_pilihan_1: '',
        prodi_pilihan_2: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('pmb.store'));
    };

    const nextStep = () => {
        if (currentStep < totalSteps) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const getStepTitle = (step) => {
        const titles = {
            1: 'Data Pribadi',
            2: 'Data Orang Tua',
            3: 'Data Pendidikan',
            4: 'Pilihan Prodi & Akun',
        };
        return titles[step];
    };

    const inputClass =
        'mt-1 block w-full border-[#e8d4c2] bg-[#fbf7f3] px-3 py-2 text-sm text-[#22130d] shadow-none focus:border-[#7f4f2e] focus:outline-none focus:ring-1 focus:ring-[#7f4f2e]';
    const selectClass =
        'mt-1 block w-full border-[#e8d4c2] bg-[#fbf7f3] px-3 py-2 text-sm text-[#22130d] focus:border-[#7f4f2e] focus:outline-none focus:ring-1 focus:ring-[#7f4f2e]';
    const labelClass = 'block text-xs font-semibold uppercase tracking-wider text-[#633d25]';

    return (
        <GuestLayout>
            <Head title="Pendaftaran PMB" />

            <div className="min-h-dvh bg-[#f5f0eb] py-12">
                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <span className="inline-block border border-[#7f4f2e] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#7f4f2e]">
                            Penerimaan Mahasiswa Baru
                        </span>
                        <h1 className="mt-4 text-3xl font-bold text-[#22130d]">Pendaftaran Mahasiswa Baru</h1>
                        <p className="mt-2 text-lg text-[#7f4f2e]">{periodePmb.nama_periode}</p>
                        <p className="text-sm text-[#633d25]">
                            Periode: {new Date(periodePmb.tanggal_buka).toLocaleDateString('id-ID')} -{' '}
                            {new Date(periodePmb.tanggal_tutup).toLocaleDateString('id-ID')}
                        </p>
                    </div>

                    <div className="mt-8">
                        <div className="mb-6 flex items-center justify-between">
                            {[1, 2, 3, 4].map((step) => (
                                <div key={step} className="flex flex-1 flex-col items-center">
                                    <div
                                        className={`flex h-10 w-10 items-center justify-center border text-sm font-semibold ${
                                            step <= currentStep
                                                ? 'border-[#7f4f2e] bg-[#7f4f2e] text-white'
                                                : 'border-[#e8d4c2] bg-white text-[#633d25]'
                                        }`}
                                    >
                                        {step}
                                    </div>
                                    <p className="mt-2 hidden text-center text-xs text-[#633d25] sm:block">{getStepTitle(step)}</p>
                                </div>
                            ))}
                        </div>
                        <div className="h-1.5 w-full border border-[#e8d4c2] bg-white">
                            <div
                                className="h-full bg-[#7f4f2e] transition-all duration-300"
                                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                            />
                        </div>
                    </div>

                    <div className="mt-8 overflow-hidden border border-[#e8d4c2] bg-white shadow-sm">
                        <div className="relative bg-[#22130d] px-6 py-4">
                            <PixelDivider className="absolute -left-3 top-0 opacity-20" />
                            <PixelDivider flip className="absolute -right-3 bottom-0 opacity-20" />
                            <h2 className="relative text-lg font-semibold text-white">
                                Langkah {currentStep}: {getStepTitle(currentStep)}
                            </h2>
                        </div>

                        <form onSubmit={submit} className="space-y-6 p-6">
                            {currentStep === 1 && (
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div className="md:col-span-2">
                                        <InputLabel htmlFor="nama_lengkap" value="Nama Lengkap *" className={labelClass} />
                                        <TextInput
                                            id="nama_lengkap"
                                            type="text"
                                            name="nama_lengkap"
                                            value={data.nama_lengkap}
                                            className={inputClass}
                                            onChange={(e) => setData('nama_lengkap', e.target.value)}
                                            required
                                        />
                                        <InputError message={errors.nama_lengkap} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="nik" value="NIK (16 digit) *" className={labelClass} />
                                        <TextInput
                                            id="nik"
                                            type="text"
                                            name="nik"
                                            value={data.nik}
                                            className={inputClass}
                                            onChange={(e) => setData('nik', e.target.value)}
                                            maxLength="16"
                                            required
                                        />
                                        <InputError message={errors.nik} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="jenis_kelamin" value="Jenis Kelamin *" className={labelClass} />
                                        <select
                                            id="jenis_kelamin"
                                            name="jenis_kelamin"
                                            value={data.jenis_kelamin}
                                            onChange={(e) => setData('jenis_kelamin', e.target.value)}
                                            className={selectClass}
                                            required
                                        >
                                            <option value="">Pilih Jenis Kelamin</option>
                                            <option value="L">Laki-laki</option>
                                            <option value="P">Perempuan</option>
                                        </select>
                                        <InputError message={errors.jenis_kelamin} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="tempat_lahir" value="Tempat Lahir *" className={labelClass} />
                                        <TextInput
                                            id="tempat_lahir"
                                            type="text"
                                            name="tempat_lahir"
                                            value={data.tempat_lahir}
                                            className={inputClass}
                                            onChange={(e) => setData('tempat_lahir', e.target.value)}
                                            required
                                        />
                                        <InputError message={errors.tempat_lahir} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="tanggal_lahir" value="Tanggal Lahir *" className={labelClass} />
                                        <TextInput
                                            id="tanggal_lahir"
                                            type="date"
                                            name="tanggal_lahir"
                                            value={data.tanggal_lahir}
                                            className={inputClass}
                                            onChange={(e) => setData('tanggal_lahir', e.target.value)}
                                            required
                                        />
                                        <InputError message={errors.tanggal_lahir} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="agama" value="Agama *" className={labelClass} />
                                        <select
                                            id="agama"
                                            name="agama"
                                            value={data.agama}
                                            onChange={(e) => setData('agama', e.target.value)}
                                            className={selectClass}
                                            required
                                        >
                                            <option value="">Pilih Agama</option>
                                            <option value="Islam">Islam</option>
                                            <option value="Kristen">Kristen</option>
                                            <option value="Katolik">Katolik</option>
                                            <option value="Hindu">Hindu</option>
                                            <option value="Buddha">Buddha</option>
                                            <option value="Konghucu">Konghucu</option>
                                        </select>
                                        <InputError message={errors.agama} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="no_hp" value="No. HP *" className={labelClass} />
                                        <TextInput
                                            id="no_hp"
                                            type="text"
                                            name="no_hp"
                                            value={data.no_hp}
                                            className={inputClass}
                                            onChange={(e) => setData('no_hp', e.target.value)}
                                            placeholder="08xxxxxxxxxx"
                                            required
                                        />
                                        <InputError message={errors.no_hp} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="email" value="Email *" className={labelClass} />
                                        <TextInput
                                            id="email"
                                            type="email"
                                            name="email"
                                            value={data.email}
                                            className={inputClass}
                                            onChange={(e) => setData('email', e.target.value)}
                                            required
                                        />
                                        <InputError message={errors.email} className="mt-2" />
                                    </div>

                                    <div className="md:col-span-2">
                                        <InputLabel htmlFor="alamat" value="Alamat Lengkap *" className={labelClass} />
                                        <textarea
                                            id="alamat"
                                            name="alamat"
                                            value={data.alamat}
                                            onChange={(e) => setData('alamat', e.target.value)}
                                            className={inputClass}
                                            rows="3"
                                            required
                                        />
                                        <InputError message={errors.alamat} className="mt-2" />
                                    </div>
                                </div>
                            )}

                            {currentStep === 2 && (
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div>
                                        <InputLabel htmlFor="nama_ayah" value="Nama Ayah *" className={labelClass} />
                                        <TextInput
                                            id="nama_ayah"
                                            type="text"
                                            name="nama_ayah"
                                            value={data.nama_ayah}
                                            className={inputClass}
                                            onChange={(e) => setData('nama_ayah', e.target.value)}
                                            required
                                        />
                                        <InputError message={errors.nama_ayah} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="pekerjaan_ayah" value="Pekerjaan Ayah *" className={labelClass} />
                                        <TextInput
                                            id="pekerjaan_ayah"
                                            type="text"
                                            name="pekerjaan_ayah"
                                            value={data.pekerjaan_ayah}
                                            className={inputClass}
                                            onChange={(e) => setData('pekerjaan_ayah', e.target.value)}
                                            required
                                        />
                                        <InputError message={errors.pekerjaan_ayah} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="nama_ibu" value="Nama Ibu *" className={labelClass} />
                                        <TextInput
                                            id="nama_ibu"
                                            type="text"
                                            name="nama_ibu"
                                            value={data.nama_ibu}
                                            className={inputClass}
                                            onChange={(e) => setData('nama_ibu', e.target.value)}
                                            required
                                        />
                                        <InputError message={errors.nama_ibu} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="pekerjaan_ibu" value="Pekerjaan Ibu *" className={labelClass} />
                                        <TextInput
                                            id="pekerjaan_ibu"
                                            type="text"
                                            name="pekerjaan_ibu"
                                            value={data.pekerjaan_ibu}
                                            className={inputClass}
                                            onChange={(e) => setData('pekerjaan_ibu', e.target.value)}
                                            required
                                        />
                                        <InputError message={errors.pekerjaan_ibu} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="no_hp_ortu" value="No. HP Orang Tua *" className={labelClass} />
                                        <TextInput
                                            id="no_hp_ortu"
                                            type="text"
                                            name="no_hp_ortu"
                                            value={data.no_hp_ortu}
                                            className={inputClass}
                                            onChange={(e) => setData('no_hp_ortu', e.target.value)}
                                            placeholder="08xxxxxxxxxx"
                                            required
                                        />
                                        <InputError message={errors.no_hp_ortu} className="mt-2" />
                                    </div>

                                    <div className="md:col-span-2">
                                        <InputLabel htmlFor="alamat_ortu" value="Alamat Orang Tua" className={labelClass} />
                                        <textarea
                                            id="alamat_ortu"
                                            name="alamat_ortu"
                                            value={data.alamat_ortu}
                                            onChange={(e) => setData('alamat_ortu', e.target.value)}
                                            className={inputClass}
                                            rows="3"
                                            placeholder="Kosongkan jika sama dengan alamat pribadi"
                                        />
                                        <InputError message={errors.alamat_ortu} className="mt-2" />
                                    </div>
                                </div>
                            )}

                            {currentStep === 3 && (
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div>
                                        <InputLabel htmlFor="asal_sekolah" value="Asal Sekolah *" className={labelClass} />
                                        <TextInput
                                            id="asal_sekolah"
                                            type="text"
                                            name="asal_sekolah"
                                            value={data.asal_sekolah}
                                            className={inputClass}
                                            onChange={(e) => setData('asal_sekolah', e.target.value)}
                                            required
                                        />
                                        <InputError message={errors.asal_sekolah} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="tahun_lulus" value="Tahun Lulus *" className={labelClass} />
                                        <TextInput
                                            id="tahun_lulus"
                                            type="text"
                                            name="tahun_lulus"
                                            value={data.tahun_lulus}
                                            className={inputClass}
                                            onChange={(e) => setData('tahun_lulus', e.target.value)}
                                            placeholder="2025"
                                            maxLength="4"
                                            required
                                        />
                                        <InputError message={errors.tahun_lulus} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="jurusan_sekolah" value="Jurusan" className={labelClass} />
                                        <TextInput
                                            id="jurusan_sekolah"
                                            type="text"
                                            name="jurusan_sekolah"
                                            value={data.jurusan_sekolah}
                                            className={inputClass}
                                            onChange={(e) => setData('jurusan_sekolah', e.target.value)}
                                        />
                                        <InputError message={errors.jurusan_sekolah} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="nilai_rata_rata" value="Nilai Rata-rata" className={labelClass} />
                                        <TextInput
                                            id="nilai_rata_rata"
                                            type="number"
                                            name="nilai_rata_rata"
                                            value={data.nilai_rata_rata}
                                            className={inputClass}
                                            onChange={(e) => setData('nilai_rata_rata', e.target.value)}
                                            step="0.01"
                                            min="0"
                                            max="100"
                                            placeholder="85.50"
                                        />
                                        <InputError message={errors.nilai_rata_rata} className="mt-2" />
                                    </div>
                                </div>
                            )}

                            {currentStep === 4 && (
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div>
                                        <InputLabel htmlFor="prodi_pilihan_1" value="Pilihan Prodi 1 *" className={labelClass} />
                                        <select
                                            id="prodi_pilihan_1"
                                            name="prodi_pilihan_1"
                                            value={data.prodi_pilihan_1}
                                            onChange={(e) => setData('prodi_pilihan_1', e.target.value)}
                                            className={selectClass}
                                            required
                                        >
                                            <option value="">Pilih Program Studi</option>
                                            {prodis.map((prodi) => (
                                                <option key={prodi.id} value={prodi.id}>
                                                    {prodi.nama_prodi} ({prodi.jenjang})
                                                </option>
                                            ))}
                                        </select>
                                        <InputError message={errors.prodi_pilihan_1} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="prodi_pilihan_2" value="Pilihan Prodi 2" className={labelClass} />
                                        <select
                                            id="prodi_pilihan_2"
                                            name="prodi_pilihan_2"
                                            value={data.prodi_pilihan_2}
                                            onChange={(e) => setData('prodi_pilihan_2', e.target.value)}
                                            className={selectClass}
                                        >
                                            <option value="">Pilih Program Studi (Opsional)</option>
                                            {prodis
                                                .filter((prodi) => prodi.id != data.prodi_pilihan_1)
                                                .map((prodi) => (
                                                    <option key={prodi.id} value={prodi.id}>
                                                        {prodi.nama_prodi} ({prodi.jenjang})
                                                    </option>
                                                ))}
                                        </select>
                                        <InputError message={errors.prodi_pilihan_2} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="password" value="Password *" className={labelClass} />
                                        <TextInput
                                            id="password"
                                            type="password"
                                            name="password"
                                            value={data.password}
                                            className={inputClass}
                                            onChange={(e) => setData('password', e.target.value)}
                                            required
                                        />
                                        <InputError message={errors.password} className="mt-2" />
                                        <p className="mt-1 text-xs text-[#633d25]">Minimal 8 karakter</p>
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="password_confirmation" value="Konfirmasi Password *" className={labelClass} />
                                        <TextInput
                                            id="password_confirmation"
                                            type="password"
                                            name="password_confirmation"
                                            value={data.password_confirmation}
                                            className={inputClass}
                                            onChange={(e) => setData('password_confirmation', e.target.value)}
                                            required
                                        />
                                        <InputError message={errors.password_confirmation} className="mt-2" />
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-between border-t border-[#e8d4c2] pt-6">
                                <div>
                                    {currentStep > 1 && <StepButton onClick={prevStep} variant="secondary">← Sebelumnya</StepButton>}
                                </div>

                                <div className="flex space-x-3">
                                    {currentStep < totalSteps ? (
                                        <StepButton onClick={nextStep} variant="primary">Selanjutnya →</StepButton>
                                    ) : (
                                        <StepButton type="submit" disabled={processing} variant="primary">
                                            {processing ? 'Memproses...' : 'Daftar Sekarang'}
                                        </StepButton>
                                    )}
                                </div>
                            </div>
                        </form>
                    </div>

                    <div className="mt-8 border border-[#e8d4c2] bg-white p-6">
                        <div className="flex items-start">
                            <svg className="mr-3 mt-0.5 h-6 w-6 flex-shrink-0 text-[#7f4f2e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <h3 className="mb-2 font-semibold text-[#22130d]">Informasi Penting:</h3>
                                <ul className="space-y-1 text-sm text-[#633d25]">
                                    <li>• Pastikan data yang diisi sudah benar dan sesuai dokumen</li>
                                    <li>• Setelah mendaftar, Anda akan mendapat akun untuk upload dokumen</li>
                                    <li>• Biaya pendaftaran: <strong className="text-[#7f4f2e]">{periodePmb.formatted_biaya}</strong></li>
                                    <li>• Hubungi panitia PMB jika mengalami kesulitan</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
