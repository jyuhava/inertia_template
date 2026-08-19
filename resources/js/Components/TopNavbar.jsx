import { useEffect, useMemo, useState } from 'react';
import { usePage } from '@inertiajs/react';
import Dropdown from '@/Components/Dropdown';

export default function TopNavbar({ toggleSidebar, toggleCollapse, title = 'Dashboard', sidebarCollapsed = false }) {
    const user = usePage().props.auth.user;
    const [searchQuery, setSearchQuery] = useState('');

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

    return (
        <header className="sticky top-0 z-20 border-b border-[#e5e5e5] bg-white">
            <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
                <div className="flex min-w-0 items-center gap-3">
                    <button
                        onClick={toggleSidebar}
                        className="border border-[#e5e5e5] p-2 text-neutral-600 transition hover:border-black hover:text-black hover:bg-neutral-100 lg:hidden"
                        aria-label="Buka menu"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    <button
                        onClick={toggleCollapse}
                        className="hidden border border-[#e5e5e5] p-2 text-neutral-600 transition hover:border-black hover:text-black hover:bg-neutral-100 lg:block"
                        title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                        aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        <svg
                            className={`h-5 w-5 transform transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                        </svg>
                    </button>

                    <div className="min-w-0">
                        <h1 className="truncate text-sm font-bold uppercase tracking-[0.2em] text-black sm:text-base">{title}</h1>
                        <p className="hidden text-[10px] uppercase tracking-widest text-neutral-500 sm:block">
                            {currentDate} • <span className="text-black">{currentTime}</span>
                        </p>
                    </div>
                </div>

                <div className="hidden flex-1 px-4 lg:block xl:max-w-md">
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <svg className="h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Cari menu atau data..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full border border-[#e5e5e5] bg-neutral-50 py-2 pl-9 pr-9 text-xs text-neutral-700 placeholder-neutral-400 focus:border-black focus:bg-white focus:outline-none"
                        />
                        {searchQuery ? (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-400 hover:text-black"
                                aria-label="Clear search"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        ) : null}
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                    <button
                        className="relative hidden border border-[#e5e5e5] p-2 text-neutral-600 transition hover:border-black hover:text-black hover:bg-neutral-100 sm:block"
                        aria-label="Notifikasi"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <span className="absolute right-0 top-0 h-2 w-2 bg-black" />
                    </button>

                    <Dropdown>
                        <Dropdown.Trigger>
                            <button className="flex items-center gap-2 border border-[#e5e5e5] p-1.5 transition hover:border-black hover:bg-neutral-100 focus:outline-none sm:p-2">
                                <div className="h-9 w-9 border border-black bg-black text-white flex items-center justify-center">
                                    <span className="text-sm font-bold tracking-widest">
                                        {user.name.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div className="hidden text-left md:block">
                                    <p className="max-w-36 truncate text-xs font-semibold uppercase tracking-wider text-black">{user.name}</p>
                                    <p className="text-[10px] uppercase tracking-widest text-neutral-500">{user.role}</p>
                                </div>
                                <svg className="hidden h-4 w-4 text-neutral-500 md:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                        </Dropdown.Trigger>

                        <Dropdown.Content align="right" width="56" className="mt-2 border border-[#e5e5e5] bg-white">
                            <div className="border-b border-[#e5e5e5] bg-neutral-50 px-4 py-3">
                                <p className="text-xs font-semibold uppercase tracking-wider text-black">{user.name}</p>
                                <p className="text-[10px] tracking-widest text-neutral-500">{user.email}</p>
                            </div>

                            <Dropdown.Link href={route('profile.edit')} className="text-neutral-600 hover:text-black hover:bg-neutral-100">Profil Saya</Dropdown.Link>
                            <Dropdown.Link href={route('logout')} method="post" as="button" className="text-neutral-600 hover:text-black hover:bg-neutral-100">
                                Keluar
                            </Dropdown.Link>
                        </Dropdown.Content>
                    </Dropdown>
                </div>
            </div>
        </header>
    );
}
