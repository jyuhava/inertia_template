import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { EntityKey, ValidationIssue, ValidationSummary } from '@/types/integration';
import { ValidationService, severityOrder, type SeverityKey } from '@/services/ValidationService';
import { ApiError } from '@/api/http';

export interface ValidationTotals {
    total: number;
    valid: number;
    critical: number;
    error: number;
    warning: number;
    info: number;
    conflict: number;
}

/**
 * validation store
 * ----------------
 * Validation Center: ringkasan, daftar masalah, dan filter aktif.
 */
export const useValidationStore = defineStore('integrator/validation', () => {
    const summaries = ref<ValidationSummary[]>([]);
    const totals = ref<ValidationTotals>({ total: 0, valid: 0, critical: 0, error: 0, warning: 0, info: 0, conflict: 0 });
    const issues = ref<ValidationIssue[]>([]);
    const grouped = ref<{ code: string; message: string; entity: EntityKey; severity: SeverityKey; count: number }[]>([]);
    const meta = ref({ page: 1, perPage: 25, total: 0, lastPage: 1 });

    const filters = ref<{ entity: EntityKey | ''; severity: SeverityKey | ''; search: string }>({ entity: '', severity: '', search: '' });

    const loading = ref(false);
    const error = ref<string | null>(null);

    const blockingCount = computed(() => totals.value.critical + totals.value.error);
    const totalIssues = computed(() => totals.value.critical + totals.value.error + totals.value.warning + totals.value.info);
    const hasBlocking = computed(() => blockingCount.value > 0);
    const worstEntities = computed(() => [...summaries.value].sort((a, b) => b.critical + b.error - (a.critical + a.error)).slice(0, 5));

    const severityFilterOptions = [
        { value: '', label: 'Semua tingkat' },
        { value: 'critical', label: 'Critical' },
        { value: 'error', label: 'Error' },
        { value: 'warning', label: 'Warning' },
        { value: 'info', label: 'Info' },
    ];

    const loadSummary = async (): Promise<void> => {
        loading.value = true;
        error.value = null;
        try {
            const response = await ValidationService.summary();
            summaries.value = response.summaries;
            totals.value = response.totals;
        } catch (caught) {
            error.value = caught instanceof ApiError ? caught.normalized.message : 'Gagal memuat ringkasan validasi.';
        } finally {
            loading.value = false;
        }
    };

    const loadIssues = async (query: { page?: number; perPage?: number } = {}): Promise<void> => {
        loading.value = true;
        error.value = null;
        try {
            const response = await ValidationService.issues({
                page: query.page ?? meta.value.page,
                perPage: query.perPage ?? meta.value.perPage,
                search: filters.value.search || undefined,
                filters: {
                    entity: filters.value.entity || undefined,
                    severity: filters.value.severity || undefined,
                },
            });
            issues.value = response.data;
            meta.value = response.meta;
            grouped.value = response.grouped;
        } catch (caught) {
            error.value = caught instanceof ApiError ? caught.normalized.message : 'Gagal memuat daftar masalah validasi.';
        } finally {
            loading.value = false;
        }
    };

    const applyFilters = async (patch: Partial<typeof filters.value>): Promise<void> => {
        filters.value = { ...filters.value, ...patch };
        await loadIssues({ page: 1 });
    };

    const resetFilters = async (): Promise<void> => {
        filters.value = { entity: '', severity: '', search: '' };
        await loadIssues({ page: 1 });
    };

    const countFor = (entity: EntityKey, severity: SeverityKey): number => {
        const summary = summaries.value.find((item) => item.entity === entity);
        return summary ? summary[severity] : 0;
    };

    const sortedIssues = computed(() => [...issues.value].sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]));

    return {
        summaries,
        totals,
        issues,
        grouped,
        meta,
        filters,
        loading,
        error,
        blockingCount,
        totalIssues,
        hasBlocking,
        worstEntities,
        severityFilterOptions,
        sortedIssues,
        loadSummary,
        loadIssues,
        applyFilters,
        resetFilters,
        countFor,
    };
});
