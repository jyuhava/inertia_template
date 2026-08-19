import { Head, Link } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';

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

const flow = [
    {
        step: '01',
        title: 'Daftar Akun PMB',
        description: 'Lengkapi formulir awal dan data calon mahasiswa secara online.',
    },
    {
        step: '02',
        title: 'Upload Dokumen',
        description: 'Unggah berkas persyaratan sesuai petunjuk sistem.',
    },
    {
        step: '03',
        title: 'Verifikasi Panitia',
        description: 'Tim PMB memverifikasi data dan kelengkapan dokumen.',
    },
    {
        step: '04',
        title: 'Pengumuman & Registrasi',
        description: 'Cek hasil seleksi dan lanjutkan proses registrasi ulang.',
    },
];

function PixelDivider({ flip = false, className = '' }) {
    return (
        <div className={`w-full overflow-hidden ${className}`}>
            <div
                className={`flex flex-wrap items-end justify-between gap-1 text-[10px] font-bold leading-none tracking-tighter sm:text-xs md:text-sm lg:text-base ${flip ? 'rotate-180' : ''}`}
                style={{ color: brown[500] }}
            >
                {Array.from({ length: 24 }).map((_, i) => (
                    <span key={i} className="inline-block px-0.5">
                        {i % 3 === 0 ? '█' : i % 3 === 1 ? '▀' : '▄'}
                    </span>
                ))}
            </div>
        </div>
    );
}

export default function Register({ periodePmb, prodis = [] }) {
    return (
        <GuestLayout>
            <Head title="PMB - STIT Al Wafi Bogor" />

            <div className="min-h-screen bg-[#f5f0eb] text-[#22130d]">
                {/* Hero */}
                <section className="relative overflow-hidden border-b border-[#e8d4c2] bg-[#7f4f2e]">
                    <div className="absolute right-0 top-0 h-40 w-40 border border-[#9e6b42] bg-[#633d25]" />
                    <div className="absolute bottom-0 left-0 h-32 w-32 bg-[#633d25]" />

                    <div className="relative mx-auto max-w-6xl px-6 py-16 lg:py-24">
                        <div className="mx-auto max-w-4xl text-center">
                            <span className="inline-block border border-[#e8d4c2] bg-[#633d25] px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#f5ebe0]">
                                Penerimaan Mahasiswa Baru
                            </span>
                            <h1 className="mt-5 text-3xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
                                PMB STIT Al Wafi Bogor
                                <span className="mt-1 block text-[#e8d4c2]">Tahun Akademik 2026</span>
                            </h1>
                            <p className="mx-auto mt-5 max-w-3xl text-sm leading-relaxed text-[#f5ebe0] sm:text-base">
                                Jalur pendaftaran modern untuk calon mahasiswa yang ingin berkembang dalam lingkungan pendidikan
                                tinggi Islam yang unggul, aplikatif, dan berkarakter.
                            </p>
                        </div>

                        <div className="mx-auto mt-10 max-w-5xl border border-[#d4b394] bg-white p-5 sm:p-6 lg:p-8">
                            {periodePmb ? (
                                <div className="grid gap-6 lg:grid-cols-12 lg:items-center">
                                    <div className="lg:col-span-8">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7f4f2e]">Periode Aktif</p>
                                        <h2 className="mt-1 text-2xl font-bold text-[#22130d] sm:text-3xl">{periodePmb.nama_periode}</h2>
                                        <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-[#4f311f] sm:grid-cols-2">
                                            <div className="border border-[#e8d4c2] bg-[#fbf7f3] p-3">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-[#7f4f2e]">Pendaftaran</p>
                                                <p className="mt-1 font-bold text-[#22130d]">
                                                    {new Date(periodePmb.tanggal_buka).toLocaleDateString('id-ID')} -{' '}
                                                    {new Date(periodePmb.tanggal_tutup).toLocaleDateString('id-ID')}
                                                </p>
                                            </div>
                                            <div className="border border-[#e8d4c2] bg-[#fbf7f3] p-3">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-[#7f4f2e]">Biaya Pendaftaran</p>
                                                <p className="mt-1 font-bold text-[#7f4f2e]">
                                                    Rp {(periodePmb.biaya_pendaftaran || 0).toLocaleString('id-ID')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="lg:col-span-4">
                                        <div className="grid gap-2">
                                            <Link
                                                href={route('pmb.create')}
                                                className="border border-[#7f4f2e] bg-[#7f4f2e] px-4 py-3 text-center text-xs font-bold uppercase tracking-widest text-white transition hover:bg-[#633d25]"
                                            >
                                                Daftar Sekarang
                                            </Link>
                                            <Link
                                                href={route('pmb.status.form')}
                                                className="border border-[#7f4f2e] px-4 py-3 text-center text-xs font-bold uppercase tracking-widest text-[#7f4f2e] transition hover:bg-[#7f4f2e] hover:text-white"
                                            >
                                                Cek Status
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="border border-[#d4b394] bg-[#fbf7f3] p-5 text-center">
                                    <h3 className="text-lg font-bold text-[#22130d]">Periode PMB belum dibuka</h3>
                                    <p className="mt-2 text-sm text-[#4f311f]">
                                        Belum ada periode pendaftaran aktif. Silakan cek berkala untuk pembaruan informasi.
                                    </p>
                                    <Link
                                        href={route('pmb.status.form')}
                                        className="mt-4 inline-block border border-[#7f4f2e] px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#7f4f2e] transition hover:bg-[#7f4f2e] hover:text-white"
                                    >
                                        Cek Status Pendaftaran
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                <PixelDivider className="bg-[#7f4f2e] py-3" />

                <main className="mx-auto max-w-6xl space-y-8 px-6 py-10 lg:py-14">
                    {/* Program Studi */}
                    <section className="border border-[#e8d4c2] bg-white p-5 sm:p-6">
                        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7f4f2e]">Program Studi</p>
                                <h2 className="mt-1 text-2xl font-bold text-[#22130d]">Pilihan Studi di STIT Al Wafi</h2>
                            </div>
                            <p className="text-sm text-[#4f311f]">Pilih program yang sesuai minat dan rencana karier Anda.</p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {prodis.length > 0 ? (
                                prodis.map((prodi) => (
                                    <article key={prodi.id} className="overflow-hidden border border-[#d4b394] bg-[#fbf7f3]">
                                        <div className="bg-[#7f4f2e] p-4">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#e8d4c2]">{prodi.jenjang}</p>
                                            <h3 className="mt-1 text-lg font-bold text-white">{prodi.nama_prodi}</h3>
                                        </div>
                                        <div className="space-y-2 p-4 text-sm text-[#4f311f]">
                                            <p>Izin Operasional: {prodi.akreditasi || 'KMA RI No. 1044 Tahun 2024'}</p>
                                            <p>Durasi Studi: 8 Semester</p>
                                            <p>Gelar Lulusan: S.Pd.</p>
                                            {prodi.deskripsi ? <p className="pt-1 text-[#7f4f2e]">{prodi.deskripsi}</p> : null}
                                        </div>
                                    </article>
                                ))
                            ) : (
                                <div className="border border-dashed border-[#d4b394] p-6 text-sm text-[#7f4f2e] md:col-span-2 xl:col-span-3">
                                    Data program studi belum tersedia.
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Alur */}
                    <section className="border border-[#e8d4c2] bg-white p-5 sm:p-6">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7f4f2e]">Alur Pendaftaran</p>
                        <h2 className="mt-1 text-2xl font-bold text-[#22130d]">Langkah PMB</h2>
                        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            {flow.map((item) => (
                                <article key={item.step} className="border border-[#d4b394] bg-[#fbf7f3] p-4">
                                    <span className="inline-flex border border-[#7f4f2e] bg-[#7f4f2e] px-2.5 py-1 text-[10px] font-bold text-white">
                                        {item.step}
                                    </span>
                                    <h3 className="mt-3 text-base font-bold text-[#22130d]">{item.title}</h3>
                                    <p className="mt-1 text-sm text-[#4f311f]">{item.description}</p>
                                </article>
                            ))}
                        </div>
                    </section>

                    {/* Kontak */}
                    <section className="border border-[#e8d4c2] bg-[#22130d] p-5 sm:p-6">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d4b394]">Kontak PMB</p>
                                <h2 className="mt-1 text-2xl font-bold text-white">Butuh Bantuan?</h2>
                                <p className="mt-2 text-sm text-[#e8d4c2]">Tim PMB STIT Al Wafi siap membantu proses pendaftaran Anda.</p>
                            </div>
                            <div className="grid w-full gap-2 text-sm text-[#f5ebe0] lg:max-w-lg lg:grid-cols-1">
                                <div className="border border-[#7f4f2e] bg-[#3f281b] px-4 py-3">WhatsApp: 0811-135-1044</div>
                                <div className="border border-[#7f4f2e] bg-[#3f281b] px-4 py-3">Email: pmb@alwafi.ac.id</div>
                                <div className="border border-[#7f4f2e] bg-[#3f281b] px-4 py-3">
                                    Alamat: Jl. Raya Arco No.1, Ragamukti, Citayam, Tajurhalang, Bogor 16320
                                </div>
                            </div>
                        </div>
                    </section>
                </main>

                <footer className="border-t border-[#e8d4c2] bg-[#22130d] py-6">
                    <div className="mx-auto max-w-6xl px-6 text-center text-[10px] font-bold uppercase tracking-widest text-[#9e6b42]">
                        © 2026 STIT Al Wafi Bogor. Seluruh hak cipta dilindungi.
                    </div>
                </footer>
            </div>
        </GuestLayout>
    );
}
