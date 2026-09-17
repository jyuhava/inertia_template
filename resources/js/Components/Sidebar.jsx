import { Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

function useMediaQuery(query) {
    const [matches, setMatches] = useState(() =>
        typeof window === 'undefined' ? false : window.matchMedia(query).matches,
    );

    useEffect(() => {
        const mediaQuery = window.matchMedia(query);
        const handleChange = (event) => setMatches(event.matches);

        setMatches(mediaQuery.matches);
        mediaQuery.addEventListener('change', handleChange);

        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [query]);

    return matches;
}

function StaffSidebar({ isOpen, isCollapsed, toggleSidebar, toggleCollapse }) {
    const { url } = usePage();
    const user = usePage().props.auth.user;
    const [expandedMenus, setExpandedMenus] = useState({});

    // Di layar kecil sidebar selalu tampil penuh (mode collapse hanya untuk desktop).
    const isMobile = useMediaQuery('(max-width: 1023px)');
    const collapsed = isCollapsed && !isMobile;

    const toggleSubmenu = (itemName) => {
        setExpandedMenus((prev) => ({
            ...prev,
            [itemName]: !(prev[itemName] ?? isMobile),
        }));
    };

    const closeOnMobile = () => {
        if (isMobile && isOpen) {
            toggleSidebar();
        }
    };

    const isActive = (href) => {
        if (href === '#' || !href) return false;
        return url.startsWith(href.replace(route('dashboard'), '/dashboard').replace(/^https?:\/\/[^/]+/, ''));
    };

    const adminMenu = [
        {
            category: 'Master Data',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
            ),
            items: [
                { name: 'Program Studi', href: '/admin/prodi' },
                { name: 'Tahun Ajaran', href: '/admin/tahun-ajaran' },
                { name: 'Semester', href: '/admin/semester' },
                { name: 'Mata Kuliah', href: '/admin/mata-kuliah' },
                { name: 'Kurikulum', href: '/admin/kurikulum' },
                { name: 'Ruangan', href: '/admin/ruangan' },
            ]
        },
        {
            category: 'Sumber Daya',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
            items: [
                { name: 'Dosen', href: '/admin/dosen' },
                { name: 'Mahasiswa', href: route('admin.mahasiswa.index') },
                { name: 'Manajemen Akun', href: '/admin/user-management' },
            ]
        },
        {
            category: 'Perkuliahan',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 9a2 2 0 11-4 0V8a2 2 0 012-2h4a2 2 0 012 2v8a2 2 0 11-4 0z" />
                </svg>
            ),
            items: [
                { name: 'Jadwal Kuliah', href: '/admin/jadwal-kuliah' },
                { name: 'Kelas Kuliah', href: '/admin/kelas-kuliah' },
                { name: 'Jadwal Akademik', href: '/admin/jadwal-akademik' },
                { name: 'Periode KRS', href: '/admin/periode-krs' },
                { name: 'Manajemen KRS', href: '/admin/krs' },
                { name: 'KHS', href: '/admin/khs' },
            ]
        },
        {
            category: 'PMB',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
            ),
            items: [
                { name: 'Periode PMB', href: '/admin/periode-pmb' },
                { name: 'Dokumen PMB', href: '/admin/dokumen-pmb' },
                { name: 'Calon Mahasiswa', href: '/admin/calon-mahasiswa' },
            ]
        },
        {
            category: 'Pembelajaran',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
            ),
            items: [
                { name: "LMS Let's", href: route('admin.lms-courses.index') },
            ]
        },
        {
            category: 'LPM',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 008 10.172V5L8 4z" />
                </svg>
            ),
            items: [
                { name: 'Dashboard LPM', href: '/admin/lpm' },
                { name: 'Program', href: '/admin/lpm/programs' },
                { name: 'Proposal', href: '/admin/lpm/proposals' },
            ]
        },
    ];

    const mahasiswaMenu = [
        {
            category: 'Akademik',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
            ),
            items: [
                { name: 'KRS', href: '/mahasiswa/krs' },
                { name: 'KHS', href: '/mahasiswa/khs' },
                { name: 'Kehadiran', href: '/mahasiswa/absensi' },
                { name: 'Surat Aktif', href: '/mahasiswa/surat-aktif' },
            ]
        },
        {
            category: 'Pembelajaran',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
            ),
            items: [
                { name: "LMS Let's", href: route('mahasiswa.lms.index') },
            ]
        },
    ];

    const dosenMenu = [
        {
            category: 'Mengajar',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 9a2 2 0 11-4 0V8a2 2 0 012-2h4a2 2 0 012 2v8a2 2 0 11-4 0z" />
                </svg>
            ),
            items: [
                { name: 'Jadwal Mengajar', href: '/dosen/jadwal' },
                { name: 'Penilaian', href: '/dosen/jadwal' },
                { name: 'Absensi', href: '/dosen/jadwal' },
            ]
        },
        {
            category: 'Pembelajaran',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0 -3.332.477-4.5 1.253" />
                </svg>
            ),
            items: [
                { name: 'LMS', href: route('dosen.lms.index') },
            ]
        },
        {
            category: 'LPM',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 008 10.172V5L8 4z" />
                </svg>
            ),
            items: [
                { name: 'Proposal Saya', href: '/dosen/lpm' },
                { name: 'Pengajuan Baru', href: '/dosen/lpm/proposals/create' },
                { name: 'Review Tugas', href: '/dosen/lpm/reviews' },
            ]
        },
    ];

    const roleCategories = user.role === 'admin' ? adminMenu : user.role === 'mahasiswa' ? mahasiswaMenu : user.role === 'dosen' ? dosenMenu : [];

    const standaloneMenu = [
        {
            name: 'Dashboard',
            href: route('dashboard'),
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
            ),
            current: url === '/dashboard' || url === '/admin/dashboard'
        },
        {
            name: 'Notulen Rapat',
            href: route('meeting-minutes.index'),
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
            current: url.startsWith('/meeting-minutes')
        },
        ...(user.role !== 'mahasiswa' ? [
            {
                name: 'Raker',
                href: '/raker',
                icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 9a2 2 0 11-4 0V8a2 2 0 012-2h4a2 2 0 012 2v8a2 2 0 11-4 0zm10-4a2 2 0 11-4 0v-4a2 2 0 014 0v4z" />
                    </svg>
                ),
                current: url.startsWith('/raker') && !url.startsWith('/raker/sessions')
            },
            ...(user.role === 'admin' ? [
                {
                    name: 'Manajemen Raker',
                    href: '/raker/sessions',
                    icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                    ),
                    current: url.startsWith('/raker/sessions')
                }
            ] : [])
        ] : []),
        {
            name: 'Laporan',
            href: '#',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
            current: false
        },
        {
            name: 'Pengaturan',
            href: route('profile.edit'),
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
            current: url.startsWith('/profile')
        }
    ];

    // Tema sidebar: mahasiswa = hitam dominan, role lain = putih bersih.
    const dark = user.role === 'mahasiswa';

    const panelBg = dark ? 'bg-neutral-950' : 'bg-white';
    const panelText = dark ? 'text-neutral-100' : 'text-neutral-900';
    const lineBorder = dark ? 'border-neutral-800' : 'border-neutral-200';
    const lineBg = dark ? 'bg-neutral-800' : 'bg-neutral-200';
    const titleCls = dark ? 'text-white' : 'text-neutral-900';
    const mutedCls = dark ? 'text-neutral-500' : 'text-neutral-500';
    const iconBoxCls = dark ? 'border-neutral-800 bg-neutral-900' : 'border-brand-200 bg-brand-50';
    const iconTextCls = dark ? 'text-brand-400' : 'text-brand-700';
    const dotCls = dark ? 'bg-brand-400' : 'bg-brand-500';
    const ghostBtnCls = dark
        ? 'text-neutral-400 hover:border-neutral-800 hover:bg-white/5 hover:text-white'
        : 'text-neutral-600 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-800';
    const closeBtnCls = dark
        ? 'border-neutral-800 text-neutral-400 hover:border-neutral-600 hover:text-white'
        : 'border-neutral-200 text-neutral-500 hover:border-neutral-300 hover:text-neutral-900';

    const activeCls = dark
        ? 'rounded-lg bg-brand-500/15 text-brand-300'
        : 'rounded-lg bg-brand-50 text-brand-800';
    const inactiveCls = dark
        ? 'rounded-lg text-neutral-400 hover:text-white hover:bg-white/5'
        : 'rounded-lg text-neutral-600 hover:text-brand-800 hover:bg-brand-50';
    const subInactiveCls = dark
        ? 'rounded-md text-neutral-500 hover:text-white hover:bg-white/5'
        : 'rounded-md text-neutral-500 hover:text-brand-800 hover:bg-brand-50';

    const cardCls = dark ? 'border border-white/10 bg-white/5' : 'border border-neutral-200 bg-neutral-50';
    const groupLabelCls = dark ? 'text-neutral-600' : 'text-neutral-400';

    const navItemClass = (active) => `
        flex items-center text-xs font-bold uppercase tracking-widest transition-colors duration-200 relative group
        ${collapsed ? 'px-2.5 py-2 justify-center' : isMobile ? 'px-3.5 py-3' : 'px-3.5 py-2'}
        ${active ? activeCls : inactiveCls}
    `;

    const categoryButtonClass = (active) => `
        w-full flex items-center text-xs font-bold uppercase tracking-widest transition-colors duration-200 relative group
        ${collapsed ? 'px-2.5 py-2 justify-center' : isMobile ? 'px-3.5 py-3 justify-between' : 'px-3.5 py-2 justify-between'}
        ${active ? activeCls : inactiveCls}
    `;

    const subItemClass = (active) => `
        flex items-center text-[11px] font-bold uppercase tracking-wider transition-colors duration-200
        ${isMobile ? 'py-2.5 px-3' : 'py-1.5 px-3'}
        ${active ? activeCls : subInactiveCls}
    `;

    return (
        <>
            {/* Mobile backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-20 bg-black/70 backdrop-blur-sm transition-opacity lg:hidden"
                    onClick={toggleSidebar}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    ${collapsed ? 'lg:w-16' : 'w-[84vw] max-w-[19rem] lg:w-64'}
                    ${panelBg} ${panelText} transition-all duration-300 ease-out
                    lg:fixed lg:inset-y-0 lg:left-0 lg:translate-x-0
                    ${isOpen ? 'fixed inset-y-0 left-0 z-40 translate-x-0' : 'fixed inset-y-0 left-0 z-40 -translate-x-full'}
                    border-r ${lineBorder}
                    flex flex-col h-dvh
                `}
                aria-hidden={!isOpen && isMobile}
            >
                {/* Logo Section */}
                <div className="flex h-14 flex-shrink-0 items-center justify-between border-b ${lineBorder} ${panelBg} px-3.5">
                    <Link href="/" className={`flex min-w-0 items-center group ${collapsed ? 'w-full justify-center' : ''}`}>
                        <div className="relative flex-shrink-0">
                            <div className={`flex h-8 w-8 items-center justify-center overflow-hidden border ${iconBoxCls}`}>
                                <img
                                    src="https://alwafi.ac.id/assets/img/stit.png"
                                    alt="Logo"
                                    className="h-7 w-auto object-contain"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                    }}
                                />
                                <div className="hidden h-full w-full items-center justify-center">
                                    <span className={`text-[10px] font-extrabold tracking-widest ${iconTextCls}`}>SI</span>
                                </div>
                            </div>
                        </div>
                        {!collapsed && (
                            <div className="ml-2.5 overflow-hidden">
                                <h1 className={`text-xs font-extrabold uppercase tracking-[0.2em] ${titleCls}`}>SIAKAD</h1>
                                <p className={`-mt-0.5 text-[9px] uppercase tracking-widest ${mutedCls}`}>STIT Al Wafi</p>
                            </div>
                        )}
                    </Link>

                    <button
                        type="button"
                        onClick={toggleSidebar}
                        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center border ${closeBtnCls} transition-colors lg:hidden`}
                        aria-label="Tutup menu"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* User Info */}
                {!collapsed && (
                    <div className="flex-shrink-0 border-b ${lineBorder} ${panelBg} px-3.5 py-2.5">
                        <div className="flex items-center gap-2.5">
                            <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center border ${iconBoxCls}`}>
                                <span className={`text-xs font-extrabold tracking-widest ${iconTextCls}`}>
                                    {user.name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className={`truncate text-xs font-bold uppercase tracking-wider ${titleCls}`}>{user.name}</p>
                                <p className={`text-[9px] uppercase tracking-widest ${mutedCls}`}>{user.role}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <nav className={`flex-1 overflow-y-auto py-2.5 pb-3 space-y-0.5 ${collapsed ? 'px-2' : 'px-3'}`}>
                    {/* Standalone items */}
                    {standaloneMenu.map((item) => (
                        <div key={item.name}>
                            {item.name === 'Login LMS' ? (
                                <a
                                    href={item.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={closeOnMobile}
                                    className={navItemClass(item.current)}
                                    title={collapsed ? item.name : ''}
                                >
                                    <span className={`flex-shrink-0 ${collapsed ? '' : 'mr-3'}`}>{item.icon}</span>
                                    {!collapsed && <span>{item.name}</span>}
                                    {item.current && <span className={`absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full ${dotCls}`} />}
                                    {collapsed && (
                                        <div className="pointer-events-none absolute left-full z-50 ml-3 whitespace-nowrap border border-neutral-800 bg-neutral-900 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                            {item.name}
                                        </div>
                                    )}
                                </a>
                            ) : (
                                <Link
                                    href={item.href}
                                    onClick={closeOnMobile}
                                    className={navItemClass(item.current)}
                                    title={collapsed ? item.name : ''}
                                >
                                    <span className={`flex-shrink-0 ${collapsed ? '' : 'mr-3'}`}>{item.icon}</span>
                                    {!collapsed && <span>{item.name}</span>}
                                    {item.current && <span className={`absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full ${dotCls}`} />}
                                    {collapsed && (
                                        <div className="pointer-events-none absolute left-full z-50 ml-3 whitespace-nowrap border border-neutral-800 bg-neutral-900 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                            {item.name}
                                        </div>
                                    )}
                                </Link>
                            )}
                        </div>
                    ))}

                    {/* Divider */}
                    {!collapsed && roleCategories.length > 0 && (
                        <div className="pb-1 pt-2">
                            <div className={`h-px ${lineBg}`} />
                        </div>
                    )}

                    {/* Categorized role menus */}
                    {roleCategories.map((category) => {
                        const categoryActive = category.items.some((sub) => url.startsWith(sub.href));
                        const expanded = expandedMenus[category.category] ?? (categoryActive || isMobile);

                        return (
                            <div key={category.category}>
                                <button
                                    onClick={() => toggleSubmenu(category.category)}
                                    className={categoryButtonClass(categoryActive)}
                                    title={collapsed ? category.category : ''}
                                    aria-expanded={!collapsed ? expanded : undefined}
                                >
                                    {categoryActive && (
                                        <span className={`absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full ${dotCls}`} />
                                    )}
                                    <div className="flex items-center">
                                        <span className={`flex-shrink-0 ${collapsed ? '' : 'mr-3'}`}>{category.icon}</span>
                                        {!collapsed && <span>{category.category}</span>}
                                    </div>
                                    {!collapsed && (
                                        <svg
                                            className={`h-3.5 w-3.5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    )}
                                </button>

                                {!collapsed && expanded && (
                                    <div className={`ml-3 mt-0.5 space-y-0.5 border-l ${lineBorder} pl-2.5`}>
                                        {category.items.map((subItem) => (
                                            <Link
                                                key={subItem.name}
                                                href={subItem.href}
                                                onClick={closeOnMobile}
                                                className={subItemClass(url.startsWith(subItem.href))}
                                            >
                                                <span className="truncate">{subItem.name}</span>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* Bottom Section - Fixed at bottom left */}
                <div className={`safe-bottom sticky bottom-0 z-50 flex-shrink-0 border-t ${lineBorder} ${panelBg} p-2.5 ${collapsed ? 'lg:w-16' : 'w-full'}`}>
                    {collapsed ? (
                        <button
                            onClick={toggleCollapse}
                            className={`flex w-full items-center justify-center border border-transparent py-2 ${ghostBtnCls} transition-colors duration-200`}
                            title="Expand Sidebar"
                        >
                            <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                            </svg>
                        </button>
                    ) : (
                        <div className="space-y-1.5">
                            <div className={`px-2 text-[9px] font-bold uppercase tracking-[0.2em] ${mutedCls}`}>
                                {user.role}
                            </div>
                            <Link
                                href={route('logout')}
                                method="post"
                                as="button"
                                className={`group flex w-full items-center border border-transparent px-3 py-2.5 text-xs font-bold uppercase tracking-widest ${ghostBtnCls} transition-colors duration-200 lg:py-2`}
                            >
                                <svg className="mr-2.5 h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                Keluar
                            </Link>
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
}

/* ==================================================================== *
 * SIDEBAR MAHASISWA — layout baru: hitam dominan + aksen emas
 * Struktur: brand bar → kartu profil → grup menu berlabel → footer
 * ==================================================================== */

const navIcon = 'h-[18px] w-[18px]';

const MhsIcons = {
    dashboard: (
        <svg className={navIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
    ),
    notulen: (
        <svg className={navIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
    ),
    laporan: (
        <svg className={navIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
    ),
    pengaturan: (
        <svg className={navIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    ),
    krs: (
        <svg className={navIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
    ),
    khs: (
        <svg className={navIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
        </svg>
    ),
    kehadiran: (
        <svg className={navIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
    ),
    surat: (
        <svg className={navIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
    ),
    lms: (
        <svg className={navIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
    ),
};

function MahasiswaSidebar({ isOpen, isCollapsed, toggleSidebar, toggleCollapse }) {
    const { url } = usePage();
    const user = usePage().props.auth.user;

    const isMobile = useMediaQuery('(max-width: 1023px)');
    const collapsed = isCollapsed && !isMobile;

    const closeOnMobile = () => {
        if (isMobile && isOpen) toggleSidebar();
    };

    const isActive = (href) => {
        if (!href || href === '#') return false;
        const path = href.replace(/^https?:\/\/[^/]+/, '');
        if (path === '/dashboard') return url === '/dashboard' || url === '/mahasiswa/dashboard';
        return url.startsWith(path);
    };

    const groups = [
        {
            label: 'Menu Utama',
            items: [
                { name: 'Dashboard', href: route('dashboard'), icon: MhsIcons.dashboard },
                { name: 'Notulen Rapat', href: route('meeting-minutes.index'), icon: MhsIcons.notulen },
                { name: 'Laporan', href: '#', icon: MhsIcons.laporan },
                { name: 'Pengaturan', href: route('profile.edit'), icon: MhsIcons.pengaturan },
            ],
        },
        {
            label: 'Akademik',
            items: [
                { name: 'KRS', href: '/mahasiswa/krs', icon: MhsIcons.krs },
                { name: 'KHS', href: '/mahasiswa/khs', icon: MhsIcons.khs },
                { name: 'Kehadiran', href: '/mahasiswa/absensi', icon: MhsIcons.kehadiran },
                { name: 'Surat Aktif', href: '/mahasiswa/surat-aktif', icon: MhsIcons.surat },
            ],
        },
        {
            label: 'Pembelajaran',
            items: [{ name: "LMS Let's", href: route('mahasiswa.lms.index'), icon: MhsIcons.lms }],
        },
    ];

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 z-20 bg-black/70 backdrop-blur-sm transition-opacity lg:hidden"
                    onClick={toggleSidebar}
                    aria-hidden="true"
                />
            )}

            <aside
                className={`
                    ${collapsed ? 'lg:w-[72px]' : 'w-[86vw] max-w-[20rem] lg:w-[268px]'}
                    flex h-dvh flex-col bg-neutral-950 text-neutral-100 transition-all duration-300 ease-out
                    lg:fixed lg:inset-y-0 lg:left-0 lg:translate-x-0
                    ${isOpen ? 'fixed inset-y-0 left-0 z-40 translate-x-0' : 'fixed inset-y-0 left-0 z-40 -translate-x-full'}
                    border-r border-white/5
                `}
                aria-hidden={!isOpen && isMobile}
            >
                {/* Brand bar */}
                <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/5 px-3.5">
                    <Link
                        href="/"
                        className={`flex min-w-0 items-center gap-2.5 ${collapsed ? 'w-full justify-center' : ''}`}
                    >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 shadow-lg shadow-brand-900/40 ring-1 ring-white/10">
                            <img
                                src="https://alwafi.ac.id/assets/img/stit.png"
                                alt="Logo"
                                className="h-6 w-auto object-contain"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                }}
                            />
                            <span className="hidden h-full w-full items-center justify-center text-[11px] font-extrabold tracking-widest text-white">
                                SI
                            </span>
                        </span>

                        {!collapsed && (
                            <span className="min-w-0">
                                <span className="block truncate text-[13px] font-extrabold uppercase tracking-[0.18em] text-white">
                                    SIAKAD
                                </span>
                                <span className="block truncate text-[9px] font-extrabold uppercase tracking-[0.18em] text-brand-400">
                                    STIT Al Wafi
                                </span>
                            </span>
                        )}
                    </Link>

                    <button
                        type="button"
                        onClick={toggleSidebar}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-neutral-500 transition hover:bg-white/5 hover:text-white lg:hidden"
                        aria-label="Tutup menu"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Kartu profil */}
                {!collapsed && (
                    <div className="shrink-0 px-3.5 pt-3.5">
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500/20 via-white/[0.04] to-transparent p-3.5 ring-1 ring-white/10">
                            <span className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-brand-500/15" />

                            <div className="relative flex items-center gap-3">
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 text-sm font-extrabold text-white shadow-lg shadow-brand-900/40">
                                    {user.name.charAt(0).toUpperCase()}
                                </span>

                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-[13px] font-extrabold leading-tight text-white">
                                        {user.name}
                                    </p>
                                    <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-brand-500/20 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.14em] text-brand-300 ring-1 ring-brand-500/30">
                                        <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
                                        {user.role}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigasi bergrup */}
                <nav className={`mt-3 flex-1 space-y-4 overflow-y-auto pb-4 ${collapsed ? 'px-2.5' : 'px-3'}`}>
                    {groups.map((group) => (
                        <div key={group.label}>
                            {!collapsed && (
                                <p className="px-2.5 pb-1.5 text-[9px] font-extrabold uppercase tracking-[0.22em] text-neutral-600">
                                    {group.label}
                                </p>
                            )}

                            <div className="space-y-0.5">
                                {group.items.map((item) => {
                                    const active = isActive(item.href);

                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            onClick={closeOnMobile}
                                            title={collapsed ? item.name : ''}
                                            className={`group relative flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-[12px] font-bold transition-all duration-150 ${
                                                collapsed ? 'justify-center' : ''
                                            } ${
                                                active
                                                    ? 'bg-brand-500/15 text-brand-300'
                                                    : 'text-neutral-400 hover:bg-white/5 hover:text-white'
                                            }`}
                                        >
                                            {active && (
                                                <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-400" />
                                            )}

                                            <span
                                                className={`shrink-0 transition-colors ${
                                                    active
                                                        ? 'text-brand-400'
                                                        : 'text-neutral-500 group-hover:text-neutral-300'
                                                }`}
                                            >
                                                {item.icon}
                                            </span>

                                            {!collapsed && <span className="truncate">{item.name}</span>}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Footer */}
                <div className="safe-bottom shrink-0 border-t border-white/5 p-2.5">
                    {collapsed ? (
                        <button
                            onClick={toggleCollapse}
                            className="flex w-full items-center justify-center rounded-xl py-2.5 text-neutral-500 transition hover:bg-white/5 hover:text-white"
                            title="Perluas sidebar"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                            </svg>
                        </button>
                    ) : (
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-[12px] font-bold text-neutral-400 transition hover:bg-rose-500/10 hover:text-rose-300"
                        >
                            <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Keluar
                        </Link>
                    )}
                </div>
            </aside>
        </>
    );
}

export default function Sidebar(props) {
    const user = usePage().props.auth.user;

    return user.role === 'mahasiswa' ? <MahasiswaSidebar {...props} /> : <StaffSidebar {...props} />;
}
