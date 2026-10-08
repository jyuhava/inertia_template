import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { DashboardSummary, MonitoringSummary } from '@/types/integration';
import { SiakadService } from '@/services/SiakadService';
import { ApiError } from '@/api/http';

/**
 * dashboard store
 * ---------------
 * Ringkasan global (dashboard) dan monitoring sinkronisasi.
 */
export const useDashboardStore = defineStore('integrator/dashboard', () => {
    const summary = ref<DashboardSummary | null>(null);
    const monitoring = ref<MonitoringSummary | null>(null);
    const loading = ref(false);
    const loadingMonitoring = ref(false);
    const error = ref<string | null>(null);
    const lastLoadedAt = ref<string | null>(null);

    const totals = computed(() => summary.value?.totals ?? null);
    const connection = computed(() => summary.value?.connection ?? null);
    const isConnected = computed(() => summary.value?.connection.status === 'CONNECTED');

    const syncProgress = computed(() => {
        if (!summary.value) return 0;
        const { siakad, synced } = summary.value.totals;
        return siakad === 0 ? 0 : Math.round((synced / siakad) * 100);
    });

    const attentionItems = computed(() => {
        if (!summary.value) return [];
        const { invalid, failed, conflict, unmapped } = summary.value.totals;
        return [
            { key: 'invalid', label: 'Data tidak valid', value: invalid, tone: 'danger' as const },
            { key: 'failed', label: 'Gagal dikirim', value: failed, tone: 'danger' as const },
            { key: 'conflict', label: 'Konflik data', value: conflict, tone: 'warning' as const },
            { key: 'unmapped', label: 'Belum dipetakan', value: unmapped, tone: 'neutral' as const },
        ].filter((item) => item.value > 0);
    });

    const load = async (): Promise<void> => {
        loading.value = true;
        error.value = null;
        try {
            summary.value = await SiakadService.dashboard();
            lastLoadedAt.value = new Date().toISOString();
        } catch (caught) {
            error.value = caught instanceof ApiError ? caught.normalized.message : 'Gagal memuat ringkasan dashboard.';
        } finally {
            loading.value = false;
        }
    };

    const loadMonitoring = async (): Promise<void> => {
        loadingMonitoring.value = true;
        error.value = null;
        try {
            monitoring.value = await SiakadService.monitoring();
        } catch (caught) {
            error.value = caught instanceof ApiError ? caught.normalized.message : 'Gagal memuat data monitoring.';
        } finally {
            loadingMonitoring.value = false;
        }
    };

    return {
        summary,
        monitoring,
        loading,
        loadingMonitoring,
        error,
        lastLoadedAt,
        totals,
        connection,
        isConnected,
        syncProgress,
        attentionItems,
        load,
        loadMonitoring,
    };
});
