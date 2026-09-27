import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';
import type { SiakadSemester } from '@/types/siakad';
import { SiakadService } from '@/services/SiakadService';
import { appConfig } from '@/config/app.config';

export interface PeriodRow extends SiakadSemester {
    mappingStatus: string;
    pddiktiId: string | null;
}

export interface ProdiOption {
    value: string;
    label: string;
    kode: string;
    mapped: boolean;
}

/**
 * period store
 * ------------
 * Periode dan program studi adalah dua filter utama pada seluruh modul.
 * Nilainya berasal dari API (tidak pernah di-hardcode) dan pilihan terakhir
 * disimpan sebagai preferensi operator.
 */
export const usePeriodStore = defineStore('integrator/period', () => {
    const periods = ref<PeriodRow[]>([]);
    const prodiOptions = ref<ProdiOption[]>([]);
    const activePeriodId = ref<string | null>(null);
    const selectedPeriodId = ref<string | null>(null);
    const selectedProdiId = ref<string | null>(null);
    const loading = ref(false);
    const error = ref<string | null>(null);

    const selectedPeriod = computed(() => periods.value.find((period) => String(period.id) === selectedPeriodId.value) ?? null);
    const selectedProdi = computed(() => prodiOptions.value.find((prodi) => prodi.value === selectedProdiId.value) ?? null);
    const periodLabel = computed(() => selectedPeriod.value?.namaSemester ?? 'Semua periode');
    const prodiLabel = computed(() => selectedProdi.value?.label ?? 'Semua program studi');
    const mappedPeriods = computed(() => periods.value.filter((period) => Boolean(period.pddiktiId)));

    const load = async (force = false): Promise<void> => {
        if (periods.value.length > 0 && !force) return;
        loading.value = true;
        error.value = null;
        try {
            const [periodResponse, prodiResponse] = await Promise.all([SiakadService.periods(), SiakadService.prodiOptions()]);
            periods.value = periodResponse.data;
            prodiOptions.value = prodiResponse;

            const stored = localStorage.getItem(appConfig.storageKeys.recentPeriod);
            const storedPeriod = stored ? periods.value.find((period) => String(period.id) === stored) : null;

            activePeriodId.value = periodResponse.active === null ? null : String(periodResponse.active);
            selectedPeriodId.value = selectedPeriodId.value ?? (storedPeriod ? String(storedPeriod.id) : activePeriodId.value);
        } catch (caught) {
            error.value = (caught as Error).message;
        } finally {
            loading.value = false;
        }
    };

    watch(selectedPeriodId, (value) => {
        if (!value) return;
        try {
            localStorage.setItem(appConfig.storageKeys.recentPeriod, value);
        } catch {
            /* abaikan */
        }
    });

    const setPeriod = (value: string | null): void => {
        selectedPeriodId.value = value;
    };

    const setProdi = (value: string | null): void => {
        selectedProdiId.value = value;
    };

    const resetFilters = (): void => {
        selectedProdiId.value = null;
        selectedPeriodId.value = activePeriodId.value;
    };

    /** Parameter filter siap pakai untuk seluruh endpoint daftar. */
    const filterParams = computed(() => {
        const params: Record<string, string> = {};
        if (selectedPeriodId.value) params.periodId = selectedPeriodId.value;
        if (selectedProdiId.value) params.prodiId = selectedProdiId.value;
        return params;
    });

    return {
        periods,
        prodiOptions,
        activePeriodId,
        selectedPeriodId,
        selectedProdiId,
        loading,
        error,
        selectedPeriod,
        selectedProdi,
        periodLabel,
        prodiLabel,
        mappedPeriods,
        filterParams,
        load,
        setPeriod,
        setProdi,
        resetFilters,
    };
});
