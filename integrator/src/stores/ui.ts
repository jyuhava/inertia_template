import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import { appConfig } from '@/config/app.config';

export interface ToastMessage {
    id: string;
    tone: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
    detail?: string | null;
    timeout?: number;
}

interface UiPreferences {
    sidebarCollapsed: boolean;
    pageSize: number;
    showDenseTable: boolean;
    autoRefreshDashboard: boolean;
}

const readPreferences = (): UiPreferences => {
    const fallback: UiPreferences = { sidebarCollapsed: false, pageSize: appConfig.defaultPageSize, showDenseTable: false, autoRefreshDashboard: true };
    try {
        const raw = localStorage.getItem(appConfig.storageKeys.uiPreferences);
        if (!raw) return fallback;
        return { ...fallback, ...(JSON.parse(raw) as Partial<UiPreferences>) };
    } catch {
        return fallback;
    }
};

/**
 * ui store
 * --------
 * Preferensi tampilan + toast. Hanya preferensi non-sensitif yang dipersist
 * ke localStorage (tidak pernah token/kredensial).
 */
export const useUiStore = defineStore('integrator/ui', () => {
    const preferences = readPreferences();

    const sidebarCollapsed = ref(preferences.sidebarCollapsed);
    const sidebarMobileOpen = ref(false);
    const pageSize = ref(preferences.pageSize);
    const autoRefreshDashboard = ref(preferences.autoRefreshDashboard);
    const toasts = ref<ToastMessage[]>([]);
    const activeDrawer = ref<string | null>(null);

    watch(
        [sidebarCollapsed, pageSize, autoRefreshDashboard],
        () => {
            try {
                localStorage.setItem(
                    appConfig.storageKeys.uiPreferences,
                    JSON.stringify({
                        sidebarCollapsed: sidebarCollapsed.value,
                        pageSize: pageSize.value,
                        showDenseTable: false,
                        autoRefreshDashboard: autoRefreshDashboard.value,
                    } satisfies UiPreferences),
                );
            } catch {
                /* penyimpanan penuh / private mode — abaikan */
            }
        },
        { deep: true },
    );

    const pushToast = (toast: Omit<ToastMessage, 'id'>): string => {
        const id = `toast-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
        toasts.value = [...toasts.value, { id, timeout: toast.timeout ?? 5200, ...toast }];
        const duration = toast.timeout ?? 5200;
        if (duration > 0) {
            window.setTimeout(() => removeToast(id), duration);
        }
        return id;
    };

    const removeToast = (id: string): void => {
        toasts.value = toasts.value.filter((toast) => toast.id !== id);
    };

    const clearToasts = (): void => {
        toasts.value = [];
    };

    const toggleSidebar = (): void => {
        sidebarCollapsed.value = !sidebarCollapsed.value;
    };

    const openDrawer = (name: string): void => {
        activeDrawer.value = name;
    };

    const closeDrawer = (): void => {
        activeDrawer.value = null;
    };

    return {
        sidebarCollapsed,
        sidebarMobileOpen,
        pageSize,
        autoRefreshDashboard,
        toasts,
        activeDrawer,
        pushToast,
        removeToast,
        clearToasts,
        toggleSidebar,
        openDrawer,
        closeDrawer,
    };
});
