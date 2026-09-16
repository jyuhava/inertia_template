import { useEffect, useState } from 'react';
import Sidebar from '@/Components/Sidebar';
import TopNavbar from '@/Components/TopNavbar';
import MobileBottomNav from '@/Components/MobileBottomNav';
import PwaInstallPrompt from '@/Components/PwaInstallPrompt';
import FlashMessage from '@/Components/FlashMessage';

export default function AdminLayout({ children, title = 'Dashboard' }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const toggleSidebar = () => {
        setSidebarOpen((open) => !open);
    };

    const closeSidebar = () => {
        setSidebarOpen(false);
    };

    const toggleSidebarCollapse = () => {
        setSidebarCollapsed((collapsed) => !collapsed);
    };

    // Kunci scroll body saat drawer mobile terbuka, dan tutup saat layar diperbesar.
    useEffect(() => {
        const isMobile = () => window.matchMedia('(max-width: 1023px)').matches;

        if (sidebarOpen && isMobile()) {
            const previousOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';

            return () => {
                document.body.style.overflow = previousOverflow;
            };
        }
    }, [sidebarOpen]);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(min-width: 1024px)');
        const handleChange = (event) => {
            if (event.matches) {
                setSidebarOpen(false);
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    return (
        <div className="flex min-h-dvh bg-[#f4f4f5]">
            {/* Sidebar — desktop */}
            <div className={`hidden lg:block lg:flex-shrink-0 ${sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'}`}>
                <div className="fixed inset-y-0 left-0 z-30 h-screen">
                    <Sidebar
                        isOpen={sidebarOpen}
                        isCollapsed={sidebarCollapsed}
                        toggleSidebar={closeSidebar}
                        toggleCollapse={toggleSidebarCollapse}
                    />
                </div>
            </div>

            {/* Sidebar — mobile drawer */}
            <div className="lg:hidden">
                <Sidebar
                    isOpen={sidebarOpen}
                    isCollapsed={sidebarCollapsed}
                    toggleSidebar={closeSidebar}
                    toggleCollapse={toggleSidebarCollapse}
                />
            </div>

            {/* Main content area */}
            <div className="flex min-w-0 flex-1 flex-col">
                <TopNavbar
                    toggleSidebar={toggleSidebar}
                    toggleCollapse={toggleSidebarCollapse}
                    title={title}
                    sidebarCollapsed={sidebarCollapsed}
                />

                <main className="flex-1 overflow-x-hidden bg-[#f4f4f5]">
                    <div className="pb-mobile-nav py-2.5 sm:py-3.5">
                        <div className="mx-auto max-w-7xl px-3 sm:px-5 lg:px-6">
                            <div className="min-h-full">{children}</div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Navigasi bawah khusus mobile/tablet */}
            <MobileBottomNav onOpenMenu={toggleSidebar} />

            {/* Ajakan pasang PWA */}
            <PwaInstallPrompt />

            {/* Flash Messages */}
            <FlashMessage />
        </div>
    );
}
