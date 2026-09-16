import { Head, useForm } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';

export default function CheckStatus() {
    const { data, setData, post, processing, errors } = useForm({
        no_pendaftaran: '',
        nik: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('pmb.status.check'));
    };

    const inputClass =
        'mt-1 block w-full border-[#e8d4c2] bg-[#fbf7f3] px-3 py-2.5 text-sm text-[#22130d] shadow-none focus:border-[#7f4f2e] focus:outline-none focus:ring-1 focus:ring-[#7f4f2e]';
    const labelClass = 'block text-xs font-semibold uppercase tracking-wider text-[#633d25]';

    return (
        <GuestLayout>
            <Head title="Cek Status Pendaftaran" />

            <div className="min-h-dvh bg-[#f5f0eb] py-12">
                <div className="mx-auto max-w-md px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <span className="inline-block border border-[#7f4f2e] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#7f4f2e]">
                            Penerimaan Mahasiswa Baru
                        </span>
                        <h1 className="mt-4 text-3xl font-bold text-[#22130d]">Cek Status Pendaftaran</h1>
                        <p className="mt-2 text-sm text-[#633d25]">
                            Masukkan nomor pendaftaran dan NIK untuk melihat status pendaftaran PMB Anda
                        </p>
                    </div>

                    <div className="mt-8 border border-[#e8d4c2] bg-white p-6">
                        <h2 className="mb-5 text-lg font-semibold text-[#22130d]">Form Cek Status</h2>

                        <form onSubmit={submit} className="space-y-5">
                            <div>
                                <InputLabel htmlFor="no_pendaftaran" value="Nomor Pendaftaran" className={labelClass} />
                                <TextInput
                                    id="no_pendaftaran"
                                    type="text"
                                    name="no_pendaftaran"
                                    value={data.no_pendaftaran}
                                    className={inputClass}
                                    onChange={(e) => setData('no_pendaftaran', e.target.value)}
                                    placeholder="PMB2025001"
                                    required
                                />
                                <InputError message={errors.no_pendaftaran} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="nik" value="NIK (16 digit)" className={labelClass} />
                                <TextInput
                                    id="nik"
                                    type="text"
                                    name="nik"
                                    value={data.nik}
                                    className={inputClass}
                                    onChange={(e) => setData('nik', e.target.value)}
                                    maxLength="16"
                                    placeholder="1234567890123456"
                                    required
                                />
                                <InputError message={errors.nik} className="mt-2" />
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className={`w-full border border-[#7f4f2e] bg-[#7f4f2e] px-4 py-3 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-[#633d25] ${
                                    processing ? 'opacity-40' : ''
                                }`}
                            >
                                {processing ? 'Mencari...' : 'Cek Status'}
                            </button>
                        </form>
                    </div>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-[#633d25]">
                            Belum mendaftar?{' '}
                            <a href={route('pmb.create')} className="font-semibold text-[#7f4f2e] hover:underline">
                                Daftar sekarang
                            </a>
                        </p>
                    </div>

                    <div className="mt-6 border border-[#e8d4c2] bg-white p-4">
                        <div className="flex items-start">
                            <svg className="mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-[#7f4f2e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <h3 className="mb-1 font-semibold text-[#22130d]">Catatan:</h3>
                                <p className="text-sm text-[#633d25]">
                                    Nomor pendaftaran dan NIK harus sesuai dengan data yang Anda daftarkan.
                                    Jika mengalami masalah, silakan hubungi panitia PMB.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
