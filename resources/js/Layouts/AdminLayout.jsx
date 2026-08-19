import { useState } from 'react';
import Sidebar from '@/Components/Sidebar';
import TopNavbar from '@/Components/TopNavbar';
import FlashMessage from '@/Components/FlashMessage';

export default function AdminLayout({ children, title = 'Dashboard' }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const toggleSidebarCollapse = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    return (
        <div className="min-h-screen flex bg-[#f4f4f5]">
            {/* Sidebar */}
            <div className={`hidden lg:block lg:flex-shrink-0 ${sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'}`}>
                <div className="fixed inset-y-0 left-0 z-30 h-screen">
                    <Sidebar
                        isOpen={sidebarOpen}
                        isCollapsed={sidebarCollapsed}
                        toggleSidebar={toggleSidebar}
                        toggleCollapse={toggleSidebarCollapse}
                    />
                </div>
            </div>

            {/* Mobile Sidebar */}
            <div className="lg:hidden">
                <Sidebar
                    isOpen={sidebarOpen}
                    isCollapsed={sidebarCollapsed}
                    toggleSidebar={toggleSidebar}
                    toggleCollapse={toggleSidebarCollapse}
                />
            </div>

            {/* Main content area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Navigation */}
                <TopNavbar 
                    toggleSidebar={toggleSidebar} 
                    toggleCollapse={toggleSidebarCollapse}
                    title={title} 
                    sidebarCollapsed={sidebarCollapsed}
                />

                {/* Page content */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#f4f4f5]">
                    <div className="py-4 sm:py-6">
                        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
                            <div className="min-h-full">
                                {children}
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Flash Messages */}
            <FlashMessage />
        </div>
    );
}
