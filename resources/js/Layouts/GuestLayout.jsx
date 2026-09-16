import { Link } from '@inertiajs/react';
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

export default function GuestLayout({ children }) {
    const [mobileOpen, setMobileOpen] = useState(false);

    const navLinks = [
        { label: 'PMB', href: '/pmb' },
        { label: 'Cek Status', href: '/pmb/cek-status' },
    ];

    return (
        <div className="min-h-dvh bg-[#f5f0eb]">
            <header className="sticky top-0 z-50 border-b border-[#e8d4c2] bg-[#f5f0eb]/95 backdrop-blur">
                <div className="mx-auto max-w-6xl px-4 sm:px-6">
                    <div className="flex h-14 items-center justify-between">
                        <Link href="/" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
                            <div className="flex h-8 w-8 items-center justify-center border border-[#d4b394] bg-white p-1">
                                <img
                                    src="https://alwafi.ac.id/assets/img/stit.png"
                                    alt="Logo STIT Al Wafi"
                                    className="h-full w-full object-contain"
                                />
                            </div>
                            <div>
                                <p className="text-[8px] font-bold uppercase tracking-[0.25em] text-[#7f4f2e]">SIAKAD</p>
                                <p className="text-xs font-bold uppercase tracking-wide text-[#22130d]">STIT Al Wafi</p>
                            </div>
                        </Link>

                        <nav className="hidden items-center gap-1.5 md:flex">
                            {navLinks.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="px-2.5 py-1.5 text-xs font-bold uppercase tracking-widest text-[#4f311f] transition hover:text-[#7f4f2e]"
                                >
                                    {item.label}
                                </Link>
                            ))}
                            <Link
                                href="/login"
                                className="ml-1 border border-[#7f4f2e] bg-[#7f4f2e] px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-[#633d25]"
                            >
                                Login
                            </Link>
                        </nav>

                        <button
                            type="button"
                            onClick={() => setMobileOpen((prev) => !prev)}
                            className="inline-flex items-center justify-center border border-[#d4b394] p-1.5 text-[#4f311f] hover:bg-[#e8d4c2] md:hidden"
                            aria-expanded={mobileOpen}
                            aria-label="Toggle navigation"
                        >
                            <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {mobileOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>

                    {mobileOpen ? (
                        <nav className="space-y-1 border-t border-[#e8d4c2] py-2 md:hidden">
                            {navLinks.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMobileOpen(false)}
                                    className="block px-2.5 py-1.5 text-xs font-bold uppercase tracking-widest text-[#4f311f] transition hover:bg-[#e8d4c2]"
                                >
                                    {item.label}
                                </Link>
                            ))}
                            <Link
                                href="/login"
                                onClick={() => setMobileOpen(false)}
                                className="mt-1 block border border-[#7f4f2e] bg-[#7f4f2e] px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-[#633d25]"
                            >
                                Login
                            </Link>
                        </nav>
                    ) : null}
                </div>
            </header>

            <main>{children}</main>
        </div>
    );
}
