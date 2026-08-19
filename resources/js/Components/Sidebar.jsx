import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function Sidebar({ isOpen, isCollapsed, toggleSidebar, toggleCollapse }) {
    const { url } = usePage();
    const user = usePage().props.auth.user;
    const [expandedMenus, setExpandedMenus] = useState({});

    const toggleSubmenu = (itemName) => {
        setExpandedMenus(prev => ({
            ...prev,
            [itemName]: !prev[itemName]
        }));
    };

    const closeOnMobile = () => {
        if (window.innerWidth < 1024 && isOpen) {
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

    const gridPattern = {
        backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)
        `,
        backgroundSize: '24px 24px'
    };

    const navItemClass = (active) => `
        flex items-center py-3 text-xs font-semibold uppercase tracking-widest transition-colors duration-200 relative group
        ${isCollapsed ? 'px-3 justify-center' : 'px-4'}
        ${active
            ? 'bg-[#1a1a1a] text-white border border-[#333]'
            : 'text-neutral-400 hover:text-white hover:bg-[#151515] border border-transparent hover:border-[#333]'
        }
    `;

    const categoryButtonClass = (active) => `
        w-full flex items-center py-3 text-xs font-semibold uppercase tracking-widest transition-colors duration-200 relative group
        ${isCollapsed ? 'px-3 justify-center' : 'px-4 justify-between'}
        ${active
            ? 'bg-[#1a1a1a] text-white border border-[#333]'
            : 'text-neutral-400 hover:text-white hover:bg-[#151515] border border-transparent hover:border-[#333]'
        }
    `;

    const subItemClass = (active) => `
        flex items-center py-2 px-3 text-[11px] font-medium uppercase tracking-wider transition-colors duration-200
        ${active
            ? 'bg-[#1a1a1a] text-white border border-[#333]'
            : 'text-neutral-500 hover:text-white hover:bg-[#151515] border border-transparent hover:border-[#333]'
        }
    `;

    return (
        <>
            {/* Mobile backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity lg:hidden z-20"
                    onClick={toggleSidebar}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    ${isCollapsed ? 'lg:w-16' : 'w-[85vw] max-w-64 lg:w-64'}
                    bg-[#0a0a0a] text-white transition-all duration-300 ease-out
                    lg:fixed lg:inset-y-0 lg:left-0 lg:translate-x-0
                    ${isOpen ? 'fixed inset-y-0 left-0 z-40 translate-x-0' : 'fixed inset-y-0 left-0 z-40 -translate-x-full'}
                    border-r border-[#222]
                    flex flex-col h-screen
                `}
                style={gridPattern}
            >
                {/* Logo Section */}
                <div className="flex items-center h-20 px-4 border-b border-[#222] bg-[#0a0a0a] flex-shrink-0 z-10">
                        <Link href="/" className={`flex items-center group ${isCollapsed ? 'justify-center w-full' : ''}`}>
                            <div className="relative flex-shrink-0">
                                <div className="h-10 w-10 border border-white/80 bg-[#111] flex items-center justify-center overflow-hidden">
                                    <img
                                        src="https://alwafi.ac.id/assets/img/stit.png"
                                        alt="Logo"
                                        className="h-8 w-auto object-contain"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                        }}
                                    />
                                    <div className="hidden h-full w-full items-center justify-center">
                                        <span className="text-xs font-bold tracking-widest text-white">SI</span>
                                    </div>
                                </div>
                            </div>
                            {!isCollapsed && (
                                <div className="ml-3 overflow-hidden">
                                    <h1 className="text-sm font-bold tracking-[0.2em] uppercase text-white">SIAKAD</h1>
                                    <p className="text-[10px] uppercase tracking-widest text-neutral-500 -mt-0.5">STIT Al Wafi</p>
                                </div>
                            )}
                        </Link>
                    </div>

                {/* User Info */}
                {!isCollapsed && (
                    <div className="p-4 border-b border-[#222] bg-[#0a0a0a] flex-shrink-0 z-10">
                            <div className="flex items-center gap-3">
                                <div className="h-11 w-11 border border-[#333] bg-[#111] flex items-center justify-center flex-shrink-0">
                                    <span className="text-sm font-bold tracking-widest text-white">
                                        {user.name.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-white truncate">{user.name}</p>
                                    <p className="text-[10px] uppercase tracking-widest text-neutral-500 mt-0.5">{user.role}</p>
                                </div>
                            </div>
                        </div>
                    )}

                {/* Navigation */}
                <nav className={`flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#333] scrollbar-track-transparent py-6 space-y-1 ${isCollapsed ? 'px-3' : 'px-4'} pb-4`}>
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
                                        title={isCollapsed ? item.name : ''}
                                    >
                                        <span className={`flex-shrink-0 ${isCollapsed ? '' : 'mr-4'}`}>{item.icon}</span>
                                        {!isCollapsed && <span>{item.name}</span>}
                                        {item.current && <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white" />}
                                        {isCollapsed && (
                                            <div className="absolute left-full ml-3 px-3 py-2 bg-[#151515] text-white text-[10px] font-semibold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 border border-[#333]">
                                                {item.name}
                                            </div>
                                        )}
                                    </a>
                                ) : (
                                    <Link
                                        href={item.href}
                                        onClick={closeOnMobile}
                                        className={navItemClass(item.current)}
                                        title={isCollapsed ? item.name : ''}
                                    >
                                        <span className={`flex-shrink-0 ${isCollapsed ? '' : 'mr-4'}`}>{item.icon}</span>
                                        {!isCollapsed && <span>{item.name}</span>}
                                        {item.current && <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white" />}
                                        {isCollapsed && (
                                            <div className="absolute left-full ml-3 px-3 py-2 bg-[#151515] text-white text-[10px] font-semibold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 border border-[#333]">
                                                {item.name}
                                            </div>
                                        )}
                                    </Link>
                                )}
                            </div>
                        ))}

                        {/* Divider */}
                        {!isCollapsed && roleCategories.length > 0 && (
                            <div className="pt-4 pb-2">
                                <div className="h-px bg-[#222]" />
                            </div>
                        )}

                        {/* Categorized role menus */}
                        {roleCategories.map((category) => {
                            const categoryActive = category.items.some(sub => url.startsWith(sub.href));
                            const expanded = expandedMenus[category.category] ?? categoryActive;

                            return (
                                <div key={category.category}>
                                    <button
                                        onClick={() => toggleSubmenu(category.category)}
                                        className={categoryButtonClass(categoryActive)}
                                        title={isCollapsed ? category.category : ''}
                                    >
                                        <div className="flex items-center">
                                            <span className={`flex-shrink-0 ${isCollapsed ? '' : 'mr-4'}`}>{category.icon}</span>
                                            {!isCollapsed && <span>{category.category}</span>}
                                        </div>
                                        {!isCollapsed && (
                                            <svg
                                                className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        )}
                                    </button>

                                    {!isCollapsed && expanded && (
                                        <div className="mt-1 ml-4 space-y-1 border-l border-[#333] pl-3">
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
                <div className={`sticky bottom-0 z-50 p-4 border-t border-[#222] bg-[#0a0a0a] flex-shrink-0 ${isCollapsed ? 'lg:w-16' : 'w-full'}`}>
                        {isCollapsed ? (
                            <button
                                onClick={toggleCollapse}
                                className="w-full flex items-center justify-center py-3 text-neutral-400 hover:text-white hover:bg-[#151515] border border-transparent hover:border-[#333] transition-colors duration-200"
                                title="Expand Sidebar"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                </svg>
                            </button>
                        ) : (
                            <div className="space-y-2">
                                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-600 px-2">
                                    {user.role}
                                </div>
                                <Link
                                    href={route('logout')}
                                    method="post"
                                    as="button"
                                    className="w-full flex items-center py-2.5 px-3 text-xs font-semibold uppercase tracking-widest text-neutral-400 hover:text-white hover:bg-[#151515] border border-transparent hover:border-[#333] transition-colors duration-200 group"
                                >
                                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
