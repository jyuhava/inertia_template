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

export default function PmbIndex({ periodePmb, prodis = [] }) {
    return (
        <GuestLayout>
            <Head title="PMB - STIT Al Wafi Bogor" />

            <div className="bg-[#f5f0eb] text-[#22130d]">
                <section className="relative overflow-hidden border-b border-[#e8d4c2] bg-[#22130d]">
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `radial-gradient(${brown[400]} 1px, transparent 1px)`, backgroundSize: '24px 24px' }} />
                    <div className="pointer-events-none absolute -right-24 top-0 h-80 w-80 border border-[#7f4f2e]/30" />
                    <div className="pointer-events-none absolute -left-24 bottom-0 h-64 w-64 border border-[#7f4f2e]/30" />

                    <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
                        <div className="mx-auto max-w-4xl text-center">
                            <span className="inline-block border border-[#d4b394] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#d4b394]">
                                Penerimaan Mahasiswa Baru
                            </span>
                            <h1 className="mt-5 text-3xl font-bold leading-tight text-white sm:text-5xl">
                                PMB STIT Al Wafi Bogor
                                <span className="mt-1 block text-[#d4b394]">Tahun Akademik 2026</span>
                            </h1>
                            <p className="mx-auto mt-5 max-w-3xl text-sm leading-relaxed text-[#e8d4c2] sm:text-base">
                                Jalur pendaftaran modern untuk calon mahasiswa yang ingin berkembang dalam lingkungan pendidikan
                                tinggi Islam yang unggul, aplikatif, dan berkarakter.
                            </p>
                        </div>

                        <div className="mx-auto mt-10 max-w-5xl border border-[#7f4f2e] bg-[#22130d]/80 p-5 sm:p-6 lg:p-8">
                            {periodePmb ? (
                                <>
                                    <div className="grid gap-6 lg:grid-cols-12 lg:items-center">
                                        <div className="lg:col-span-8">
                                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d4b394]">Periode Aktif</p>
                                            <h2 className="mt-1 text-2xl font-bold text-white sm:text-3xl">{periodePmb.nama_periode}</h2>
                                            <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-[#e8d4c2] sm:grid-cols-2">
                                                <div className="border border-[#7f4f2e] bg-[#22130d] p-3">
                                                    <p className="text-xs uppercase tracking-wider text-[#d4b394]">Pendaftaran</p>
                                                    <p className="mt-1 font-semibold text-white">
                                                        {new Date(periodePmb.tanggal_buka).toLocaleDateString('id-ID')} -{' '}
                                                        {new Date(periodePmb.tanggal_tutup).toLocaleDateString('id-ID')}
                                                    </p>
                                                </div>
                                                <div className="border border-[#7f4f2e] bg-[#22130d] p-3">
                                                    <p className="text-xs uppercase tracking-wider text-[#d4b394]">Biaya Pendaftaran</p>
                                                    <p className="mt-1 font-semibold text-[#d4b394]">
                                                        Rp {(periodePmb.biaya_pendaftaran || 0).toLocaleString('id-ID')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="lg:col-span-4">
                                            <div className="grid gap-2">
                                                <Link
                                                    href={route('pmb.create')}
                                                    className="border border-[#7f4f2e] bg-[#7f4f2e] px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#633d25]"
                                                >
                                                    Daftar Sekarang
                                                </Link>
                                                <Link
                                                    href={route('pmb.status.form')}
                                                    className="border border-[#e8d4c2] bg-transparent px-4 py-3 text-center text-sm font-semibold text-[#e8d4c2] transition hover:bg-[#e8d4c2]/10"
                                                >
                                                    Cek Status
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="border border-[#d4b394] bg-[#7f4f2e]/10 p-5 text-center">
                                    <h3 className="text-lg font-semibold text-[#d4b394]">Periode PMB belum dibuka</h3>
                                    <p className="mt-2 text-sm text-[#e8d4c2]">
                                        Belum ada periode pendaftaran aktif. Silakan cek berkala untuk pembaruan informasi.
                                    </p>
                                    <Link
                                        href={route('pmb.status.form')}
                                        className="mt-4 inline-block border border-[#d4b394] bg-transparent px-4 py-2 text-sm font-semibold text-[#d4b394] transition hover:bg-[#d4b394]/10"
                                    >
                                        Cek Status Pendaftaran
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                <main className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
                    <section className="border border-[#e8d4c2] bg-white p-5 sm:p-6">
                        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7f4f2e]">Program Studi</p>
                                <h2 className="mt-1 text-2xl font-bold text-[#22130d]">Pilihan Studi di STIT Al Wafi</h2>
                            </div>
                            <p className="text-sm text-[#633d25]">Pilih program yang sesuai minat dan rencana karier Anda.</p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {prodis.length > 0 ? (
                                prodis.map((prodi) => (
                                    <article key={prodi.id} className="overflow-hidden border border-[#e8d4c2] bg-[#fbf7f3]">
                                        <div className="bg-[#7f4f2e] p-4">
                                            <p className="text-xs font-semibold uppercase tracking-wider text-[#e8d4c2]">{prodi.jenjang}</p>
                                            <h3 className="mt-1 text-lg font-bold text-white">{prodi.nama_prodi}</h3>
                                        </div>
                                        <div className="space-y-2 p-4 text-sm text-[#633d25]">
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

                    <section className="border border-[#e8d4c2] bg-white p-5 sm:p-6">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7f4f2e]">Alur Pendaftaran</p>
                        <h2 className="mt-1 text-2xl font-bold text-[#22130d]">Langkah PMB</h2>
                        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            {flow.map((item) => (
                                <article key={item.step} className="border border-[#e8d4c2] bg-[#fbf7f3] p-4">
                                    <span className="inline-block border border-[#7f4f2e] px-2.5 py-1 text-xs font-semibold text-[#7f4f2e]">
                                        {item.step}
                                    </span>
                                    <h3 className="mt-3 text-base font-semibold text-[#22130d]">{item.title}</h3>
                                    <p className="mt-1 text-sm text-[#633d25]">{item.description}</p>
                                </article>
                            ))}
                        </div>
                    </section>

                    <section className="relative overflow-hidden border border-[#e8d4c2] bg-[#22130d] p-5 sm:p-6">
                        <PixelDivider className="absolute -left-3 top-0 opacity-20" />
                        <PixelDivider flip className="absolute -right-3 bottom-0 opacity-20" />
                        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d4b394]">Kontak PMB</p>
                                <h2 className="mt-1 text-2xl font-bold text-white">Butuh Bantuan?</h2>
                                <p className="mt-2 text-sm text-[#e8d4c2]">Tim PMB STIT Al Wafi siap membantu proses pendaftaran Anda.</p>
                            </div>
                            <div className="grid w-full gap-2 text-sm text-[#e8d4c2] lg:max-w-lg lg:grid-cols-1">
                                <div className="border border-[#7f4f2e] bg-[#22130d] px-4 py-3">WhatsApp: 0811-135-1044</div>
                                <div className="border border-[#7f4f2e] bg-[#22130d] px-4 py-3">Email: pmb@alwafi.ac.id</div>
                                <div className="border border-[#7f4f2e] bg-[#22130d] px-4 py-3">
                                    Alamat: Jl. Raya Arco No.1, Ragamukti, Citayam, Tajurhalang, Bogor 16320
                                </div>
                            </div>
                        </div>
                    </section>
                </main>

                <footer className="border-t border-[#e8d4c2] bg-[#22130d] py-6">
                    <div className="mx-auto max-w-7xl px-4 text-center text-xs text-[#d4b394] sm:px-6 lg:px-8">
                        © 2026 STIT Al Wafi Bogor. Seluruh hak cipta dilindungi.
                    </div>
                </footer>
            </div>
        </GuestLayout>
    );
}
