import { computed, ref } from 'vue';
import type { ListQuery, PaginationMeta } from '@/types/common';
import type { DataStatus, EntityKey } from '@/types/integration';
import { SiakadService } from '@/services/SiakadService';
import { entityDefinitions } from '@/config/entities';
import { rowString } from '@/types/rows';
import { appConfig } from '@/config/app.config';

export interface EntityTableState {
    query: ListQuery;
}

/**
 * useEntityTable
 * --------------
 * Composable tabel data generik untuk SEMUA entitas:
 *  - filter (periode, prodi, status data, status pemetaan, filter khusus entitas)
 *  - pencarian, sorting, pagination (server-side)
 *  - seleksi baris untuk bulk action
 *  - statistik status (kartu ringkasan)
 */
export const useEntityTable = (entity: EntityKey) => {
    const definition = entityDefinitions[entity];

    const rows = ref<Record<string, unknown>[]>([]);
    const stats = ref<Record<string, number>>({});
    const capability = ref<string>(definition.acts.syncCapability);
    const capabilityNote = ref<string>(definition.acts.capabilityNote);
    const meta = ref<PaginationMeta>({ page: 1, perPage: appConfig.defaultPageSize, total: 0, lastPage: 1 });
    const loading = ref(false);
    const error = ref<string | null>(null);

    const selection = ref<string[]>([]);
    const filters = ref<Record<string, string>>({});
    const search = ref('');
    const sort = ref<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    const loadedPages = ref<Record<number, Record<string, unknown>[]>>({});

    const totalSelected = computed(() => selection.value.length);
    const allSelected = computed(() => rows.value.length > 0 && selection.value.length === rows.value.length);
    const someSelected = computed(() => selection.value.length > 0 && !allSelected.value);
    const hasFilters = computed(() => Object.values(filters.value).some((value) => value !== '') || search.value !== '');
    const activeFilterCount = computed(() => Object.values(filters.value).filter((value) => value !== '').length + (search.value ? 1 : 0));

    const canSync = computed(() => capability.value === 'full' || capability.value === 'update-only');
    const readOnlyReason = computed(() => (canSync.value ? null : capabilityNote.value));

    const applyClientSort = (rowsToSort: Record<string, unknown>[]): Record<string, unknown>[] => {
        if (!sort.value) return rowsToSort;
        const { key, direction } = sort.value;
        return [...rowsToSort].sort((a, b) => {
            const left = String(a[key] ?? '');
            const right = String(b[key] ?? '');
            if (left === right) return 0;
            const compare = left > right ? 1 : -1;
            return direction === 'asc' ? compare : -compare;
        });
    };

    const load = async (options: { page?: number; keepSelection?: boolean } = {}): Promise<void> => {
        loading.value = true;
        error.value = null;
        const page = options.page ?? meta.value.page;

        try {
            const response = await SiakadService.listEntity(entity, {
                page,
                perPage: meta.value.perPage,
                search: search.value || undefined,
                filters: { ...filters.value },
            });

            loadedPages.value = { ...loadedPages.value, [page]: response.data as unknown as Record<string, unknown>[] };
            rows.value = applyClientSort(response.data as unknown as Record<string, unknown>[]);
            meta.value = response.meta;
            stats.value = response.stats as unknown as Record<string, number>;
            capability.value = response.capability;
            capabilityNote.value = response.capabilityNote;

            if (!options.keepSelection) {
                const visible = new Set(rows.value.map((row) => rowString(row, 'localId')));
                selection.value = selection.value.filter((id) => visible.has(id));
            }
        } catch (caught) {
            error.value = (caught as Error).message;
            rows.value = [];
        } finally {
            loading.value = false;
        }
    };

    const reload = async (): Promise<void> => {
        await load({ page: 1 });
    };

    const setPage = async (page: number): Promise<void> => {
        meta.value = { ...meta.value, page };
        await load({ page, keepSelection: true });
    };

    const setPerPage = async (perPage: number): Promise<void> => {
        meta.value = { ...meta.value, perPage, page: 1 };
        await load({ page: 1, keepSelection: true });
    };

    const setFilter = async (key: string, value: string): Promise<void> => {
        filters.value = { ...filters.value, [key]: value };
        await load({ page: 1, keepSelection: true });
    };

    const setSearch = async (value: string): Promise<void> => {
        search.value = value;
        await load({ page: 1, keepSelection: true });
    };

    const setSort = async (key: string, direction: 'asc' | 'desc' | null): Promise<void> => {
        sort.value = direction === null ? null : { key, direction };
        rows.value = applyClientSort(loadedPages.value[meta.value.page] ?? rows.value);
        if (!sort.value) await load({ page: meta.value.page, keepSelection: true });
    };

    const resetFilters = async (): Promise<void> => {
        filters.value = {};
        search.value = '';
        sort.value = null;
        await load({ page: 1, keepSelection: true });
    };

    const toggleRow = (localId: string): void => {
        selection.value = selection.value.includes(localId) ? selection.value.filter((id) => id !== localId) : [...selection.value, localId];
    };

    const toggleAll = (): void => {
        if (allSelected.value) {
            selection.value = [];
            return;
        }
        selection.value = rows.value.map((row) => rowString(row, 'localId'));
    };

    const selectIds = (ids: string[]): void => {
        selection.value = Array.from(new Set([...selection.value, ...ids]));
    };

    const clearSelection = (): void => {
        selection.value = [];
    };

    const filterOptions = (filterKey: string): { value: string; label: string }[] => {
        const filter = definition.filters.find((item) => item.key === filterKey);
        return filter?.options ?? [];
    };

    const statusCount = (status: DataStatus | string): number => {
        const statsRecord = stats.value as Record<string, number>;
        const source = statsRecord[status] ?? statsRecord[status.toLowerCase()] ?? 0;
        return Number(source ?? 0);
    };

    const rowsForCurrentPage = computed(() => rows.value);

    return {
        definition,
        rows,
        rowsForCurrentPage,
        stats,
        capability,
        capabilityNote,
        canSync,
        readOnlyReason,
        meta,
        loading,
        error,
        selection,
        filters,
        search,
        sort,
        totalSelected,
        allSelected,
        someSelected,
        hasFilters,
        activeFilterCount,
        load,
        reload,
        setPage,
        setPerPage,
        setFilter,
        setSearch,
        setSort,
        resetFilters,
        toggleRow,
        toggleAll,
        selectIds,
        clearSelection,
        filterOptions,
        statusCount,
    };
};

export type EntityTable = ReturnType<typeof useEntityTable>;
