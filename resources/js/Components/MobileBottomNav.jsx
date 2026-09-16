import { Link, usePage } from '@inertiajs/react';
import {
    AcademicCapIcon,
    BeakerIcon,
    BookOpenIcon,
    CalendarDaysIcon,
    ClipboardDocumentListIcon,
    EllipsisHorizontalIcon,
    HomeIcon,
    UserGroupIcon,
} from '@heroicons/react/24/outline';

/**
 * Navigasi bawah khusus layar kecil (< lg).
 * Menampilkan 4 menu terpenting per role + tombol "Lainnya" yang membuka drawer sidebar.
 */
export default function MobileBottomNav({ onOpenMenu }) {
    const { url, props } = usePage();
    const user = props.auth?.user;
    const role = user?.role;

    const pathOf = (href) => {
        if (!href) return '';
        try {
            return href.replace(/^https?:\/\/[^/]+/, '');
        } catch {
            return href;
        }
    };

    const safeRoute = (name, fallback = '#') => {
        try {
            return route(name);
        } catch {
            return fallback;
        }
    };

    const menus = {
        mahasiswa: [
            { name: 'Beranda', href: safeRoute('mahasiswa.dashboard'), icon: HomeIcon, match: '/mahasiswa/dashboard' },
            { name: 'KRS', href: safeRoute('mahasiswa.krs.index'), icon: ClipboardDocumentListIcon, match: '/mahasiswa/krs' },
            { name: 'KHS', href: safeRoute('mahasiswa.khs.index'), icon: AcademicCapIcon, match: '/mahasiswa/khs' },
            { name: 'LMS', href: safeRoute('mahasiswa.lms.index'), icon: BookOpenIcon, match: '/mahasiswa/lms' },
        ],
        dosen: [
            { name: 'Beranda', href: safeRoute('dosen.dashboard'), icon: HomeIcon, match: '/dosen/dashboard' },
            { name: 'Jadwal', href: safeRoute('dosen.jadwal'), icon: CalendarDaysIcon, match: '/dosen/jadwal' },
            { name: 'LMS', href: safeRoute('dosen.lms.index'), icon: BookOpenIcon, match: '/dosen/lms' },
            { name: 'LPM', href: safeRoute('dosen.lpm.proposals.index'), icon: BeakerIcon, match: '/dosen/lpm' },
        ],
        admin: [
            { name: 'Beranda', href: safeRoute('admin.dashboard'), icon: HomeIcon, match: '/admin/dashboard' },
            { name: 'Mahasiswa', href: safeRoute('admin.mahasiswa.index'), icon: UserGroupIcon, match: '/admin/mahasiswa' },
            { name: 'KRS', href: '/admin/krs', icon: ClipboardDocumentListIcon, match: '/admin/krs' },
            { name: 'LMS', href: safeRoute('admin.lms-courses.index'), icon: BookOpenIcon, match: '/admin/lms' },
        ],
        calon_mahasiswa: [
            { name: 'Beranda', href: safeRoute('calon-mahasiswa.dashboard'), icon: HomeIcon, match: '/calon-mahasiswa' },
        ],
    };

    const items = menus[role] || [];

    if (items.length === 0) {
        return null;
    }

    const isActive = (item) => {
        const path = pathOf(url);
        return path === item.match || path.startsWith(`${item.match}/`);
    };

    const columns = items.length + 1;

    return (
        <nav
            className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200 bg-white/95 backdrop-blur lg:hidden"
            aria-label="Navigasi utama"
        >
            <div className="grid" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
                {items.map((item) => {
                    const active = isActive(item);
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`relative flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] font-semibold uppercase tracking-wider transition-colors ${
                                active ? 'text-neutral-900' : 'text-neutral-500 active:bg-neutral-100'
                            }`}
                            aria-current={active ? 'page' : undefined}
                        >
                            <span
                                className={`absolute top-0 h-0.5 w-8 transition-colors ${active ? 'bg-neutral-900' : 'bg-transparent'}`}
                            />
                            <Icon className="h-5 w-5" />
                            <span className="w-full truncate text-center leading-none">{item.name}</span>
                        </Link>
                    );
                })}

                <button
                    type="button"
                    onClick={onOpenMenu}
                    className="relative flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 px-1 py-2 text-[9px] font-semibold uppercase tracking-wider text-neutral-500 transition-colors active:bg-neutral-100"
                    aria-label="Buka semua menu"
                >
                    <EllipsisHorizontalIcon className="h-5 w-5" />
                    <span className="w-full truncate text-center leading-none">Lainnya</span>
                </button>
            </div>
        </nav>
    );
}
