<script setup lang="ts">
import { computed } from 'vue';
import type { EntityFilterDefinition } from '@/config/entities';
import AppIcon from './AppIcon.vue';
import { usePeriodStore } from '@/stores/period';

/**
 * FilterPanel — panel filter kompak di atas tabel.
 * Opsi periode & prodi selalu berasal dari API (store), bukan hardcode.
 */
const props = withDefaults(
    defineProps<{
        filters: EntityFilterDefinition[];
        values: Record<string, string>;
        search: string;
        activeCount?: number;
        loading?: boolean;
        compact?: boolean;
    }>(),
    { activeCount: 0, loading: false, compact: true },
);

const emit = defineEmits<{
    'update:search': [string];
    'update:filter': [string, string];
    reset: [];
}>();

const period = usePeriodStore();

const hasAny = computed(() => Object.values(props.values).some((value) => value !== '') || props.search !== '');

const onChange = (key: string, value: string): void => emit('update:filter', key, value);

const searchPlaceholder = computed(() => {
    const searchFilter = props.filters.find((filter) => filter.type === 'search');
    return searchFilter?.placeholder ?? 'Cari…';
});
</script>

<template>
    <div class="border-b border-neutral-200 bg-white px-3 py-2.5">
        <div class="flex flex-wrap items-end gap-2">
            <div class="min-w-[220px] flex-1">
                <label class="label" for="integrator-search">Pencarian</label>
                <div class="relative">
                    <AppIcon name="search" :size="14" class="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                        id="integrator-search"
                        class="input pl-7"
                        type="search"
                        :placeholder="searchPlaceholder"
                        :value="search"
                        @input="emit('update:search', ($event.target as HTMLInputElement).value)"
                    />
                </div>
            </div>

            <template v-for="filter in filters" :key="filter.key">
                <div v-if="filter.type !== 'search'" :class="filter.width ?? 'w-44'">
                    <label class="label">{{ filter.label }}</label>

                    <select v-if="filter.type === 'period'" class="select" :value="values[filter.key] ?? ''" @change="onChange(filter.key, ($event.target as HTMLSelectElement).value)">
                        <option value="">Semua periode</option>
                        <option v-for="item in period.periods" :key="item.id" :value="String(item.id)">{{ item.namaSemester }}</option>
                    </select>

                    <select v-else-if="filter.type === 'prodi'" class="select" :value="values[filter.key] ?? ''" @change="onChange(filter.key, ($event.target as HTMLSelectElement).value)">
                        <option value="">Semua program studi</option>
                        <option v-for="item in period.prodiOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
                    </select>

                    <select v-else-if="filter.type === 'select'" class="select" :value="values[filter.key] ?? ''" @change="onChange(filter.key, ($event.target as HTMLSelectElement).value)">
                        <option value="">{{ filter.placeholder ?? 'Semua' }}</option>
                        <option v-for="option in filter.options ?? []" :key="option.value" :value="option.value">{{ option.label }}</option>
                    </select>

                    <select v-else-if="filter.type === 'boolean'" class="select" :value="values[filter.key] ?? ''" @change="onChange(filter.key, ($event.target as HTMLSelectElement).value)">
                        <option value="">Semua</option>
                        <option value="1">Ya</option>
                        <option value="0">Tidak</option>
                    </select>

                    <input v-else-if="filter.type === 'date'" type="date" class="input" :value="values[filter.key] ?? ''" @change="onChange(filter.key, ($event.target as HTMLInputElement).value)" />

                    <input v-else class="input" :placeholder="filter.placeholder ?? ''" :value="values[filter.key] ?? ''" @input="onChange(filter.key, ($event.target as HTMLInputElement).value)" />
                </div>
            </template>

            <div class="flex items-center gap-2 pb-0.5">
                <button type="button" class="btn btn-secondary" :disabled="loading" @click="emit('reset')">
                    <AppIcon name="x" :size="13" />
                    Reset
                </button>
                <span v-if="hasAny" class="badge border-brand-300 bg-brand-50 text-brand-800">{{ activeCount || 1 }} filter aktif</span>
            </div>
        </div>
    </div>
</template>
