import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { OperatorSession } from '@/types/common';
import { SiakadService } from '@/services/SiakadService';
import { appConfig } from '@/config/app.config';
import { ApiError } from '@/api/http';

/**
 * auth store
 * ----------
 * Menyimpan SESI OPERATOR di memori saja.
 * Tidak ada token/kredensial Neo Feeder di sini — backend yang memegangnya.
 */
export const useAuthStore = defineStore('integrator/auth', () => {
    const session = ref<OperatorSession | null>(null);
    const loading = ref(false);
    const ready = ref(false);
    const error = ref<string | null>(null);

    const isAuthenticated = computed(() => session.value !== null);
    const isMockMode = computed(() => session.value?.mockMode ?? appConfig.mockMode);

    const bootstrap = async (): Promise<void> => {
        if (ready.value || loading.value) return;
        loading.value = true;
        error.value = null;
        try {
            session.value = await SiakadService.session();
        } catch (caught) {
            error.value = caught instanceof ApiError ? caught.normalized.message : 'Tidak dapat memuat sesi operator.';
        } finally {
            loading.value = false;
            ready.value = true;
        }
    };

    const hasPermission = (permission: string): boolean => session.value?.permissions.includes(permission) ?? false;

    const displayName = computed(() => session.value?.name ?? 'Operator');
    const institution = computed(() => session.value?.institution ?? '—');
    const roleLabel = computed(() => {
        if (!session.value) return '—';
        const labels: Record<string, string> = {
            admin: 'Administrator',
            operator: 'Operator PDDikti',
            akademik: 'Staff Akademik',
            dosen: 'Dosen',
        };
        return labels[session.value.role] ?? session.value.role;
    });

    return {
        session,
        loading,
        ready,
        error,
        isAuthenticated,
        isMockMode,
        displayName,
        institution,
        roleLabel,
        bootstrap,
        hasPermission,
    };
});
