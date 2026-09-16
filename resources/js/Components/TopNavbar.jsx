import { useEffect, useMemo, useState } from 'react';
import { usePage } from '@inertiajs/react';
import Dropdown from '@/Components/Dropdown';

export default function TopNavbar({ toggleSidebar, toggleCollapse, title = 'Dashboard', sidebarCollapsed = false }) {
    const user = usePage().props.auth.user;
    const [searchQuery, setSearchQuery] = useState('');
    const [searchOpen, setSearchOpen] = useState(false);

    const getCurrentTime = () =>
        new Date().toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });

    const [currentTime, setCurrentTime] = useState(getCurrentTime());

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(getCurrentTime());
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    // Tutup panel pencarian mobile saat layar melebar ke desktop.
    useEffect(() => {
        const mediaQuery = window.matchMedia('(min-width: 1024px)');
        const handleChange = (event) => {
            if (event.matches) {
                setSearchOpen(false);
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    const currentDate = useMemo(
        () =>
            new Date().toLocaleDateString('id-ID', {
                weekday: 'short',
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            }),
        [],
    );

    // Navbar terang (jangan hitam) tapi mengikuti bahasa desain sidebar:
    // sudut rounded-xl, permukaan lembut, aksen emas, tile avatar gradien emas.
    const t = {
        header: 'bg-white/95 backdrop-blur',
        iconBtn:
            'rounded-xl border border-neutral-200 bg-neutral-50/70 text-neutral-500 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800',
        iconBtnActive: 'rounded-xl border border-brand-300 bg-brand-50 text-brand-800',
        title: 'text-neutral-900',
        subtitle: 'text-neutral-500',
        time: 'text-brand-700',
        searchInput:
            'rounded-xl border border-neutral-200 bg-neutral-50/70 text-neutral-700 placeholder-neutral-400 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100',
        searchIcon: 'text-neutral-400',
        clearBtn: 'text-neutral-400 hover:text-brand-700',
        userBtn: 'rounded-xl border border-neutral-200 bg-neutral-50/70 hover:border-brand-300 hover:bg-brand-50',
        avatar: 'rounded-lg bg-gradient-to-br from-brand-400 to-brand-700 text-neutral-950 ring-1 ring-black/5',
        userName: 'text-neutral-900',
        userRole: 'text-neutral-500',
        chevron: 'text-neutral-500',
        notifDot: 'bg-brand-500 ring-2 ring-white',
        dropdownPanel: 'border border-neutral-200 bg-white py-1.5 shadow-xl shadow-neutral-900/5',
        dropdownHead: 'border-b border-neutral-200 bg-brand-50/60',
        dropdownName: 'text-neutral-900',
        dropdownEmail: 'text-neutral-500',
        dropdownLink: 'text-neutral-600 hover:bg-brand-50 hover:text-brand-800',
        mobilePanel: 'border-neutral-200 bg-white',
    };

    return (
        <header className={`safe-top sticky top-0 z-20 ${t.header}`}>
            <div className="flex items-center justify-between gap-2 px-3 py-2 sm:gap-3 sm:px-5">
                <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
                    <button
                        onClick={toggleSidebar}
                        className={`p-1.5 transition ${t.iconBtn} lg:hidden`}
                        aria-label="Buka menu"
                    >
                        <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    <button
                        onClick={toggleCollapse}
                        className={`hidden p-1.5 transition ${t.iconBtn} lg:block`}
                        title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                        aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        <svg
                            className={`h-[18px] w-[18px] transform transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                        </svg>
                    </button>

                    <div className="min-w-0">
                        <h1 className={`truncate text-[11px] font-extrabold uppercase tracking-[0.15em] sm:text-sm sm:tracking-[0.2em] ${t.title}`}>
                            {title}
                        </h1>
                        <p className={`hidden text-[10px] uppercase tracking-widest sm:block ${t.subtitle}`}>
                            {currentDate} • <span className={t.time}>{currentTime}</span>
                        </p>
                    </div>
                </div>

                <div className="hidden flex-1 px-4 lg:block xl:max-w-md">
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
                            <svg className={`h-3.5 w-3.5 ${t.searchIcon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Cari menu atau data..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`block w-full py-1.5 pl-8 pr-8 text-xs ${t.searchInput}`}
                        />
                        {searchQuery ? (
                            <button
                                onClick={() => setSearchQuery('')}
                                className={`absolute inset-y-0 right-0 flex items-center pr-2.5 ${t.clearBtn}`}
                                aria-label="Hapus pencarian"
                            >
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        ) : null}
                    </div>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2">
                    <button
                        onClick={() => setSearchOpen((open) => !open)}
                        className={`p-1.5 transition lg:hidden ${searchOpen ? t.iconBtnActive : t.iconBtn}`}
                        aria-label="Cari"
                        aria-expanded={searchOpen}
                    >
                        <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </button>

                    <button
                        className={`relative hidden p-1.5 transition sm:block ${t.iconBtn}`}
                        aria-label="Notifikasi"
                    >
                        <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <span className={`absolute right-0 top-0 h-1.5 w-1.5 ${t.notifDot}`} />
                    </button>

                    <Dropdown>
                        <Dropdown.Trigger>
                            <button className={`flex items-center gap-2 p-1 transition focus:outline-none sm:p-1.5 ${t.userBtn}`}>
                                <div className={`flex h-7 w-7 items-center justify-center sm:h-8 sm:w-8 ${t.avatar}`}>
                                    <span className="text-xs font-extrabold tracking-widest">
                                        {user.name.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div className="hidden text-left md:block">
                                    <p className={`max-w-36 truncate text-xs font-bold uppercase tracking-wider ${t.userName}`}>{user.name}</p>
                                    <p className={`text-[9px] uppercase tracking-widest ${t.userRole}`}>{user.role}</p>
                                </div>
                                <svg className={`hidden h-3.5 w-3.5 md:block ${t.chevron}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                        </Dropdown.Trigger>

                        <Dropdown.Content align="right" width="56" contentClasses={`${t.dropdownPanel} rounded-xl`}>
                            <div className={`px-3 py-2 ${t.dropdownHead}`}>
                                <p className={`truncate text-xs font-bold uppercase tracking-wider ${t.dropdownName}`}>{user.name}</p>
                                <p className={`truncate text-[10px] tracking-widest ${t.dropdownEmail}`}>{user.email}</p>
                            </div>

                            <Dropdown.Link href={route('profile.edit')} className={t.dropdownLink}>
                                Profil Saya
                            </Dropdown.Link>
                            <Dropdown.Link href={route('logout')} method="post" as="button" className={t.dropdownLink}>
                                Keluar
                            </Dropdown.Link>
                        </Dropdown.Content>
                    </Dropdown>
                </div>
            </div>

            {/* Pencarian mobile — muncul di bawah bar agar tidak berebut ruang */}
            {searchOpen && (
                <div className={`border-t px-3 pb-2.5 pt-2 lg:hidden ${t.mobilePanel}`}>
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
                            <svg className={`h-4 w-4 ${t.searchIcon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            autoFocus
                            placeholder="Cari menu atau data..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`block w-full py-2 pl-9 pr-9 text-sm ${t.searchInput}`}
                        />
                        {searchQuery ? (
                            <button
                                onClick={() => setSearchQuery('')}
                                className={`absolute inset-y-0 right-0 flex items-center pr-2.5 ${t.clearBtn}`}
                                aria-label="Hapus pencarian"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        ) : null}
                    </div>
                </div>
            )}

            {/* Garis emas tipis — penghubung visual dengan sidebar */}
            <div className="h-[2px] w-full bg-gradient-to-r from-brand-500 via-brand-400 to-brand-100" />
        </header>
    );
}
