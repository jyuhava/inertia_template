import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

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

const mediaLogos = [
    { name: 'Kemenag', src: 'https://alwafi.ac.id/assets/img/stit.png' },
    { name: 'STIT Al Wafi', src: 'https://alwafi.ac.id/assets/img/stit.png' },
    { name: 'Yayasan Al Sudais', src: 'https://alwafi.ac.id/assets/img/stit.png' },
    { name: 'MPI', src: 'https://alwafi.ac.id/assets/img/stit.png' },
    { name: 'Bogor', src: 'https://alwafi.ac.id/assets/img/stit.png' },
    { name: 'Akademik', src: 'https://alwafi.ac.id/assets/img/stit.png' },
];

const openRoles = [
    { title: 'Manajemen Pendidikan Islam', type: 'Program Studi', rate: 'S1', tags: ['Akademik', 'Islam', 'Profesional'] },
    { title: 'Pendidik Profesional', type: 'Lulusan', rate: 'Karir', tags: ['Mengajar', 'Riset', 'Pengabdian'] },
    { title: 'Sistem Akademik Terpadu', type: 'Layanan', rate: 'Digital', tags: ['KRS', 'KHS', 'LMS'] },
    { title: 'Kampus Modern', type: 'Fasilitas', rate: 'Bogor', tags: ['Tajurhalang', 'Citayam', 'Ragamukti'] },
    { title: 'Legalitas Resmi', type: 'Status', rate: 'KMA', tags: ['2024', 'Terakreditasi', 'Islam'] },
];

const domains = [
    { title: 'Akademik', desc: 'KRS, KHS, jadwal kuliah, transkrip, dan periode akademik terintegrasi.' },
    { title: 'Perkuliahan', desc: 'LMS, materi, tugas, forum diskusi, dan absensi dalam satu alur.' },
    { title: 'Administrasi', desc: 'Data dosen, mahasiswa, program studi, dan dokumen kampus terkelola rapi.' },
    { title: 'Komunikasi', desc: 'Notifikasi, pengumuman, dan laporan akademik tersalurkan lebih cepat.' },
];

const benefits = [
    { title: 'Integrasi Penuh', desc: 'Satu sistem untuk seluruh kebutuhan akademik kampus.' },
    { title: 'Akses Fleksibel', desc: 'Dosen dan mahasiswa dapat mengakses kapan saja, di mana saja.' },
    { title: 'Data Terpusat', desc: 'Informasi akademik tersimpan rapi dan mudah ditelusuri.' },
    { title: 'Proses Transparan', desc: 'Penilaian, absensi, dan evaluasi dapat dipantau secara real-time.' },
    { title: 'Efisiensi Waktu', desc: 'Pengajuan KRS, pengumpulan tugas, dan laporan lebih cepat.' },
    { title: 'Pendampingan Karir', desc: 'Mencetak lulusan yang kompeten dan siap mengabdi.' },
];

const processSteps = [
    { number: '1', title: 'Daftar', desc: 'Calon mahasiswa mendaftar melalui portal PMB online.' },
    { number: '2', title: 'Seleksi', desc: 'Proses verifikasi berkas dan ujian seleksi akademik.' },
    { number: '3', title: 'Kuliah', desc: 'Mahasiswa mengikuti perkuliahan dengan dukungan LMS.' },
];

const faqs = [
    { q: 'Program studi apa yang tersedia?', a: 'Saat ini STIT Al Wafi Bogor menyelenggarakan Program Studi Manajemen Pendidikan Islam (MPI) jenjang S1.' },
    { q: 'Bagaimana cara mendaftar?', a: 'Pendaftaran dapat dilakukan melalui portal PMB online dengan mengunggah dokumen yang diminta.' },
    { q: 'Apa saja fasilitas kampus?', a: 'Kampus dilengkapi ruang perkuliahan, perpustakaan, laboratorium, dan akses LMS.' },
    { q: 'Apakah sudah memiliki legalitas resmi?', a: 'Ya, STIT Al Wafi telah mendapatkan legalitas operasional KMA No. 1044 Tahun 2024.' },
];

function PixelDivider({ flip = false, className = '' }) {
    const pattern = [
        '█▀▄ ▄▀█ ▀▄▀ █ █ █▀█ █▀▀',
        '█▄▀ █▀█ █░█ █▄█ █▀▄ ██▄',
    ];
    return (
        <div className={`w-full overflow-hidden ${className}`}>
            <div
                className={`flex flex-wrap items-end justify-between gap-1 text-[10px] font-bold leading-none tracking-tighter text-[${brown[500]}] opacity-90 sm:text-xs md:text-sm lg:text-base ${flip ? 'rotate-180' : ''}`}
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

function MarqueeText({ text, className = '' }) {
    return (
        <div className={`overflow-hidden whitespace-nowrap ${className}`}>
            <div className="animate-marquee inline-block">
                {Array.from({ length: 4 }).map((_, i) => (
                    <span key={i} className="mx-8 text-6xl font-black uppercase tracking-tighter text-white/10 sm:text-7xl md:text-8xl lg:text-9xl">
                        {text}
                    </span>
                ))}
            </div>
        </div>
    );
}

export default function Welcome({ auth }) {
    const [openFaq, setOpenFaq] = useState(null);

    const toggleFaq = (index) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    return (
        <>
            <Head title="SIAKAD STIT Al Wafi" />

            <style>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    animation: marquee 30s linear infinite;
                }
            `}</style>

            <div className="min-h-dvh bg-[#f5f0eb] text-[#22130d]">
                {/* Header */}
                <header className="sticky top-0 z-50 border-b border-[#e8d4c2] bg-[#f5f0eb]/95 backdrop-blur">
                    <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center border border-[#d4b394] bg-white">
                                <img src="https://alwafi.ac.id/assets/img/stit.png" alt="Logo" className="h-full w-full object-contain" />
                            </div>
                            <div>
                                <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#7f4f2e]">Sistem Informasi Akademik</p>
                                <p className="text-xs font-bold uppercase tracking-wide text-[#22130d]">STIT Al Wafi Bogor</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {auth.user ? (
                                <Link
                                    href={route('dashboard')}
                                    className="border border-[#7f4f2e] bg-[#7f4f2e] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white transition hover:bg-[#633d25]"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={route('login')}
                                        className="border border-[#d4b394] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[#7f4f2e] transition hover:border-[#7f4f2e] hover:bg-[#7f4f2e] hover:text-white"
                                    >
                                        Masuk
                                    </Link>
                                    <Link
                                        href={route('register')}
                                        className="border border-[#7f4f2e] bg-[#7f4f2e] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white transition hover:bg-[#633d25]"
                                    >
                                        Daftar
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                <main>
                    {/* Hero */}
                    <section className="relative overflow-hidden border-b border-[#e8d4c2]">
                        <div className="mx-auto max-w-6xl px-6 py-16 lg:py-24">
                            <div className="grid gap-12 lg:grid-cols-2">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#7f4f2e]">SIAKAD Terpadu</p>
                                    <h1 className="mt-4 text-5xl font-black leading-[0.95] tracking-tight text-[#22130d] sm:text-6xl lg:text-7xl">
                                        Digitalisasi
                                        <span className="block text-[#7f4f2e]">Akademik Kampus</span>
                                    </h1>
                                    <p className="mt-6 max-w-md text-sm leading-7 text-[#4f311f]">
                                        Platform layanan akademik yang dirancang dengan pendekatan minimalis dan terstruktur
                                        untuk admin, dosen, dan mahasiswa STIT Al Wafi Bogor.
                                    </p>
                                    {!auth.user && (
                                        <div className="mt-8 flex flex-wrap gap-3">
                                            <Link
                                                href={route('login')}
                                                className="border border-[#7f4f2e] bg-[#7f4f2e] px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-white transition hover:bg-[#633d25]"
                                            >
                                                Akses SIAKAD
                                            </Link>
                                            <Link
                                                href={route('register')}
                                                className="border border-[#7f4f2e] px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-[#7f4f2e] transition hover:bg-[#7f4f2e] hover:text-white"
                                            >
                                                Buat Akun
                                            </Link>
                                        </div>
                                    )}
                                </div>

                                <div className="relative">
                                    <div className="absolute -right-6 -top-6 h-24 w-24 border border-[#d4b394] bg-white" />
                                    <div className="absolute -bottom-6 -left-6 h-24 w-24 bg-[#7f4f2e]" />
                                    <div className="relative border border-[#d4b394] bg-white p-6">
                                        <div className="mb-4 flex items-center gap-3">
                                            <div className="h-px flex-1 bg-[#e8d4c2]" />
                                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7f4f2e]">Profil Singkat</span>
                                            <div className="h-px flex-1 bg-[#e8d4c2]" />
                                        </div>
                                        <ul className="space-y-3 text-sm leading-6 text-[#4f311f]">
                                            <li className="flex gap-3">
                                                <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-[#7f4f2e]" />
                                                <span>Berada di bawah naungan Yayasan Al Sudais Indonesia.</span>
                                            </li>
                                            <li className="flex gap-3">
                                                <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-[#7f4f2e]" />
                                                <span>Berorientasi pada integrasi ilmu modern dan nilai-nilai keislaman.</span>
                                            </li>
                                            <li className="flex gap-3">
                                                <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-[#7f4f2e]" />
                                                <span>Fokus pembelajaran praktis seperti micro-teaching dan riset.</span>
                                            </li>
                                            <li className="flex gap-3">
                                                <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-[#7f4f2e]" />
                                                <span>Mencetak lulusan yang kompeten, berakhlak, dan siap mengabdi.</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Media logos */}
                    <section className="border-b border-[#e8d4c2] bg-white">
                        <div className="mx-auto max-w-6xl px-6 py-8">
                            <p className="mb-5 text-center text-[9px] font-bold uppercase tracking-[0.25em] text-[#7f4f2e]">Dukungan & Mitra</p>
                            <div className="flex flex-wrap items-center justify-center gap-8 opacity-70 grayscale">
                                {mediaLogos.map((logo) => (
                                    <div key={logo.name} className="flex h-10 items-center justify-center">
                                        <img src={logo.src} alt={logo.name} className="h-full w-auto object-contain" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Open roles */}
                    <section className="border-b border-[#e8d4c2] bg-[#7f4f2e]">
                        <div className="mx-auto max-w-6xl px-6 py-14">
                            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                                <h2 className="text-3xl font-black text-white sm:text-4xl">
                                    Layanan <span className="text-[#e8d4c2]">Kampus</span>
                                </h2>
                                <Link
                                    href={route('login')}
                                    className="border border-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white transition hover:bg-white hover:text-[#7f4f2e]"
                                >
                                    Lihat Semua →
                                </Link>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {openRoles.map((role) => (
                                    <article key={role.title} className="border border-[#9e6b42] bg-[#633d25] p-5 transition hover:bg-[#4f311f]">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-[#d4b394]">{role.type}</p>
                                                <h3 className="mt-1 text-lg font-bold text-white">{role.title}</h3>
                                            </div>
                                            <span className="border border-[#d4b394] px-2 py-1 text-[10px] font-bold text-[#e8d4c2]">{role.rate}</span>
                                        </div>
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {role.tags.map((tag) => (
                                                <span key={tag} className="border border-[#9e6b42] px-2 py-0.5 text-[10px] font-bold text-[#e8d4c2]">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Pixel divider */}
                    <PixelDivider className="bg-[#7f4f2e] py-3" />

                    {/* Process */}
                    <section className="border-b border-[#e8d4c2] bg-white">
                        <div className="mx-auto max-w-6xl px-6 py-14">
                            <div className="grid gap-10 lg:grid-cols-2">
                                <div>
                                    <h2 className="text-3xl font-black leading-tight text-[#22130d] sm:text-4xl">
                                        Alur <span className="text-[#7f4f2e]">Akademik</span>
                                    </h2>
                                    <p className="mt-4 max-w-md text-sm leading-7 text-[#4f311f]">
                                        Proses akademik dirancang agar calon mahasiswa, dosen, dan admin dapat berinteraksi
                                        dengan sistem secara jelas dan efisien.
                                    </p>
                                    <Link
                                        href={route('register')}
                                        className="mt-6 inline-flex items-center gap-2 border border-[#7f4f2e] bg-[#7f4f2e] px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white transition hover:bg-[#633d25]"
                                    >
                                        <span className="h-1.5 w-1.5 bg-white" />
                                        Mulai Sekarang
                                    </Link>
                                </div>
                                <div className="space-y-4">
                                    {processSteps.map((step) => (
                                        <div key={step.number} className="flex gap-4">
                                            <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-[#7f4f2e] bg-[#7f4f2e] text-lg font-black text-white">
                                                {step.number}
                                            </div>
                                            <div className="border-b border-[#e8d4c2] pb-4">
                                                <h3 className="text-lg font-bold text-[#22130d]">{step.title}</h3>
                                                <p className="mt-1 text-sm text-[#4f311f]">{step.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Domains */}
                    <section className="border-b border-[#e8d4c2] bg-[#f5f0eb]">
                        <div className="mx-auto max-w-6xl px-6 py-14">
                            <div className="mb-8 text-center">
                                <h2 className="text-3xl font-black text-[#22130d] sm:text-4xl">Domain SIAKAD</h2>
                                <p className="mt-3 text-sm text-[#4f311f]">Sistem mencakup seluruh aspek operasional akademik kampus.</p>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                {domains.map((domain) => (
                                    <article key={domain.title} className="border border-[#d4b394] bg-white p-5 transition hover:border-[#7f4f2e]">
                                        <h3 className="text-sm font-bold uppercase tracking-wide text-[#22130d]">{domain.title}</h3>
                                        <p className="mt-3 text-sm leading-6 text-[#4f311f]">{domain.desc}</p>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Benefits */}
                    <section className="border-b border-[#e8d4c2] bg-white">
                        <div className="mx-auto max-w-6xl px-6 py-14">
                            <div className="grid gap-10 lg:grid-cols-12">
                                <div className="lg:col-span-4">
                                    <h2 className="text-3xl font-black leading-tight text-[#22130d] sm:text-4xl">
                                        Mengapa Memilih <span className="text-[#7f4f2e]">SIAKAD</span>
                                    </h2>
                                </div>
                                <div className="lg:col-span-8">
                                    <div className="grid gap-px bg-[#e8d4c2] md:grid-cols-2">
                                        {benefits.map((benefit) => (
                                            <article key={benefit.title} className="bg-white p-5 transition hover:bg-[#fbf7f3]">
                                                <h3 className="text-sm font-bold uppercase tracking-wide text-[#22130d]">{benefit.title}</h3>
                                                <p className="mt-2 text-sm leading-6 text-[#4f311f]">{benefit.desc}</p>
                                            </article>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Pixel divider */}
                    <PixelDivider className="bg-white py-3" flip />

                    {/* FAQ */}
                    <section className="border-b border-[#e8d4c2] bg-[#f5f0eb]">
                        <div className="mx-auto max-w-3xl px-6 py-16">
                            <div className="mb-10 text-center">
                                <h2 className="text-3xl font-black text-[#22130d] sm:text-4xl">Pertanyaan Umum</h2>
                                <p className="mt-3 text-sm text-[#4f311f]">Berikut jawaban untuk beberapa pertanyaan yang sering diajukan.</p>
                            </div>
                            <div className="space-y-3">
                                {faqs.map((faq, index) => (
                                    <div key={index} className="border-b border-[#d4b394]">
                                        <button
                                            onClick={() => toggleFaq(index)}
                                            className="flex w-full items-center justify-between py-4 text-left"
                                        >
                                            <span className="text-sm font-bold text-[#22130d]">{faq.q}</span>
                                            <span className="ml-4 flex h-6 w-6 shrink-0 items-center justify-center border border-[#7f4f2e] text-[#7f4f2e]">
                                                {openFaq === index ? '−' : '+'}
                                            </span>
                                        </button>
                                        {openFaq === index && (
                                            <div className="pb-4 text-sm leading-6 text-[#4f311f]">{faq.a}</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* CTA */}
                    <section className="bg-[#22130d]">
                        <div className="mx-auto max-w-4xl px-6 py-16 text-center">
                            <h2 className="text-3xl font-black text-white sm:text-4xl">
                                Siap Bergabung dengan <span className="text-[#d4b394]">STIT Al Wafi?</span>
                            </h2>
                            <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-[#e8d4c2]">
                                Daftar sekarang dan mulai perjalanan akademik yang lebih terstruktur, modern, dan berorientasi pada nilai Islam.
                            </p>
                            <Link
                                href={route('register')}
                                className="mt-8 inline-flex items-center gap-2 border border-white px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-white transition hover:bg-white hover:text-[#22130d]"
                            >
                                <span className="h-1.5 w-1.5 bg-[#d4b394]" />
                                Daftar Sekarang
                            </Link>
                        </div>
                    </section>

                    {/* Marquee */}
                    <MarqueeText text="BRING YOUR POTENTIAL" className="border-b border-[#e8d4c2] bg-[#22130d] py-6" />
                </main>

                {/* Footer */}
                <footer className="bg-[#22130d]">
                    <div className="mx-auto max-w-6xl px-6 py-12">
                        <div className="grid gap-10 lg:grid-cols-12">
                            <div className="lg:col-span-4">
                                <div className="flex h-14 w-14 items-center justify-center border border-[#7f4f2e] bg-white">
                                    <img src="https://alwafi.ac.id/assets/img/stit.png" alt="Logo" className="h-full w-full object-contain" />
                                </div>
                                <p className="mt-4 text-2xl font-black text-white">STIT Al Wafi</p>
                                <p className="text-sm text-[#d4b394]">Bogor, Indonesia</p>
                            </div>
                            <div className="grid gap-6 sm:grid-cols-2 lg:col-span-8 lg:grid-cols-4">
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-white">Kampus</h4>
                                    <ul className="mt-3 space-y-2 text-sm text-[#d4b394]">
                                        <li>Tentang</li>
                                        <li>Program Studi</li>
                                        <li>Fasilitas</li>
                                        <li>Kontak</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-white">Akademik</h4>
                                    <ul className="mt-3 space-y-2 text-sm text-[#d4b394]">
                                        <li>KRS</li>
                                        <li>KHS</li>
                                        <li>Jadwal</li>
                                        <li>LMS</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-white">Layanan</h4>
                                    <ul className="mt-3 space-y-2 text-sm text-[#d4b394]">
                                        <li>PMB Online</li>
                                        <li>Surat Komitmen</li>
                                        <li>Perpustakaan</li>
                                        <li>Bantuan</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-white">Sosial</h4>
                                    <ul className="mt-3 space-y-2 text-sm text-[#d4b394]">
                                        <li>Instagram</li>
                                        <li>Facebook</li>
                                        <li>YouTube</li>
                                        <li>Website</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-[#3f281b] pt-6 text-[10px] font-bold uppercase tracking-widest text-[#9e6b42] sm:flex-row">
                            <p>© 2026 SIAKAD STIT Al Wafi Bogor</p>
                            <p>Layanan akademik yang lebih tertib, cepat, dan profesional</p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
