<script setup lang="ts">
import { computed } from 'vue';
import type { ColumnDefinition } from '@/types/common';
import AppIcon from './AppIcon.vue';
import StatusBadge from './StatusBadge.vue';
import EmptyState from './EmptyState.vue';
import LoadingState from './LoadingState.vue';
import { rowString, rowValue } from '@/types/rows';
import { displayValue, formatDate, formatDateTime, formatNumber, humanizeKey } from '@/utils/format';

/**
 * DataTable — tabel data generik (enterprise style):
 * seleksi baris, sorting, sticky header, kolom yang dapat disembunyikan,
 * sel khusus via slot `cell-<key>`, dan area aksi per baris.
 */
const props = withDefaults(
    defineProps<{
        columns: ColumnDefinition[];
        rows: unknown[];
        loading?: boolean;
        selectable?: boolean;
        selected?: string[];
        rowKey?: string;
        sort?: { key: string; direction: 'asc' | 'desc' } | null;
        clickableRows?: boolean;
        emptyTitle?: string;
        emptyMessage?: string;
        dense?: boolean;
        loadingRows?: number;
    }>(),
    {
        loading: false,
        selectable: false,
        selected: () => [],
        rowKey: 'localId',
        sort: null,
        clickableRows: false,
        emptyTitle: 'Tidak ada data',
        emptyMessage: 'Belum ada data yang cocok dengan filter saat ini. Ubah filter atau muat ulang.',
        dense: true,
        loadingRows: 6,
    },
);

const emit = defineEmits<{
    select: [string];
    'select-all': [];
    sort: [string, 'asc' | 'desc' | null];
    'row-click': [unknown];
}>();

const visibleColumns = computed(() => props.columns.filter((column) => !column.defaultHidden));

const keyOf = (row: unknown): string => rowString(row, props.rowKey) || rowString(row, 'localId') || rowString(row, 'id');
const isSelected = (row: unknown): boolean => props.selected.includes(keyOf(row));

const statusKeys = new Set(['dataStatus', 'mappingStatus', 'status']);

const displayFor = (column: ColumnDefinition, row: unknown): { kind: 'status' | 'date' | 'datetime' | 'number' | 'boolean' | 'array' | 'text'; text: string } => {
    const value = rowValue(row, column.key);

    if (statusKeys.has(column.key) && typeof value === 'string' && /^[A-Z_]+$/.test(value)) {
        return { kind: 'status', text: value };
    }
    if (column.key.endsWith('At') || column.key.endsWith('_at')) {
        return { kind: 'datetime', text: formatDateTime(value as string) };
    }
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return { kind: 'date', text: formatDate(value) };
    }
    if (typeof value === 'number') {
        return { kind: 'number', text: formatNumber(value) };
    }
    if (typeof value === 'boolean') {
        return { kind: 'boolean', text: value ? 'Ya' : 'Tidak' };
    }
    if (Array.isArray(value)) {
        return { kind: 'array', text: value.length === 0 ? '—' : value.join(', ') };
    }
    return { kind: 'text', text: displayValue(value) };
};

const nextSortDirection = (column: ColumnDefinition): 'asc' | 'desc' | null => {
    if (!props.sort || props.sort.key !== column.key) return 'asc';
    if (props.sort.direction === 'asc') return 'desc';
    return null;
};

const allSelectedOnPage = computed(() => props.rows.length > 0 && props.rows.every((row) => isSelected(row)));
const someSelectedOnPage = computed(() => props.rows.some((row) => isSelected(row)) && !allSelectedOnPage.value);

const cellClass = (column: ColumnDefinition): string =>
    [column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : '', column.mono ? 'data-table-cell-mono' : ''].join(' ');

const humanize = humanizeKey;
</script>

<template>
    <div>
        <LoadingState v-if="loading && rows.length === 0" :rows="loadingRows" label="Memuat data…" />

        <EmptyState v-else-if="rows.length === 0" :title="emptyTitle" :message="emptyMessage" />

        <div v-else class="table-wrap">
            <table class="data-table">
                <thead>
                    <tr>
                        <th v-if="selectable" class="w-8">
                            <input
                                type="checkbox"
                                class="h-3.5 w-3.5"
                                :checked="allSelectedOnPage"
                                :indeterminate.prop="someSelectedOnPage"
                                aria-label="Pilih semua baris pada halaman ini"
                                @change="emit('select-all')"
                            />
                        </th>
                        <th
                            v-for="column in visibleColumns"
                            :key="column.key"
                            :class="[column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : '', column.width]"
                            :title="humanize(column.key)"
                        >
                            <button
                                v-if="column.sortable"
                                type="button"
                                class="inline-flex items-center gap-1 uppercase tracking-wider hover:text-neutral-800"
                                @click="emit('sort', column.key, nextSortDirection(column))"
                            >
                                {{ column.label }}
                                <AppIcon
                                    :name="sort?.key === column.key ? (sort?.direction === 'asc' ? 'chevron' : 'chevron-down') : 'dots'"
                                    :size="11"
                                    :class="sort?.key === column.key ? 'text-neutral-800' : 'text-neutral-300'"
                                />
                            </button>
                            <span v-else>{{ column.label }}</span>
                        </th>
                        <th v-if="$slots.actions" class="w-[1%] whitespace-nowrap text-right">Aksi</th>
                    </tr>
                </thead>

                <tbody>
                    <tr
                        v-for="row in rows"
                        :key="keyOf(row)"
                        :class="[isSelected(row) ? 'is-selected' : '', clickableRows ? 'cursor-pointer' : '']"
                        @click="clickableRows && emit('row-click', row)"
                    >
                        <td v-if="selectable" @click.stop>
                            <input
                                type="checkbox"
                                class="h-3.5 w-3.5"
                                :checked="isSelected(row)"
                                :aria-label="`Pilih ${keyOf(row)}`"
                                @change="emit('select', keyOf(row))"
                            />
                        </td>

                        <td v-for="column in visibleColumns" :key="column.key" :class="cellClass(column)">
                            <slot :name="`cell-${column.key}`" :row="row" :value="rowValue(row, column.key)">
                                <template v-if="displayFor(column, row).kind === 'status'">
                                    <StatusBadge :status="String(rowValue(row, column.key))" :kind="column.key === 'mappingStatus' ? 'mapping' : 'data'" />
                                </template>
                                <template v-else-if="column.key === 'conflictFields'">
                                    <span v-if="Array.isArray(rowValue(row, column.key)) && (rowValue(row, column.key) as string[]).length > 0" class="badge border-red-200 bg-red-50 text-red-700">
                                        {{ (rowValue(row, column.key) as string[]).join(', ') }}
                                    </span>
                                    <span v-else class="text-2xs text-neutral-500">—</span>
                                </template>
                                <template v-else>
                                    <span :class="displayFor(column, row).kind === 'text' && displayFor(column, row).text === '(kosong)' ? 'text-neutral-600' : ''">
                                        {{ displayFor(column, row).text }}
                                    </span>
                                </template>
                            </slot>
                        </td>

                        <td v-if="$slots.actions" class="whitespace-nowrap text-right" @click.stop>
                            <div class="flex items-center justify-end gap-1">
                                <slot name="actions" :row="row" />
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div v-if="loading && rows.length > 0" class="border-t border-neutral-200 bg-neutral-50 px-3 py-1.5 text-2xs text-neutral-500">
            Memuat ulang data…
        </div>
    </div>
</template>
