<script setup lang="ts">
import { computed } from 'vue';
import AppIcon from './AppIcon.vue';

/** PaginationBar — pagination server-side + pemilih jumlah baris. */
const props = defineProps<{
    page: number;
    perPage: number;
    total: number;
    lastPage: number;
    perPageOptions?: number[];
    loading?: boolean;
}>();

const emit = defineEmits<{ 'page-change': [number]; 'per-page-change': [number] }>();

const options = computed(() => props.perPageOptions ?? [10, 25, 50, 100]);

const from = computed(() => (props.total === 0 ? 0 : (props.page - 1) * props.perPage + 1));
const to = computed(() => Math.min(props.total, props.page * props.perPage));

const pages = computed(() => {
    const total = props.lastPage;
    const current = props.page;
    const windowSize = 5;
    let start = Math.max(1, current - Math.floor(windowSize / 2));
    const end = Math.min(total, start + windowSize - 1);
    start = Math.max(1, end - windowSize + 1);
    const items: (number | '…')[] = [];
    if (start > 1) items.push(1, '…');
    for (let index = start; index <= end; index += 1) items.push(index);
    if (end < total) items.push('…', total);
    return items;
});
</script>

<template>
    <div class="flex flex-wrap items-center gap-3 border-t border-neutral-200 px-3 py-2">
        <p class="text-2xs text-neutral-500">
            Menampilkan <span class="font-semibold text-neutral-700">{{ from }}–{{ to }}</span> dari <span class="font-semibold text-neutral-700">{{ total }}</span> data
        </p>

        <label class="flex items-center gap-1.5 text-2xs text-neutral-500">
            Baris
            <select class="select w-[68px] py-0.5 text-2xs" :value="perPage" @change="emit('per-page-change', Number(($event.target as HTMLSelectElement).value))">
                <option v-for="option in options" :key="option" :value="option">{{ option }}</option>
            </select>
        </label>

        <div class="ml-auto flex items-center gap-1">
            <button type="button" class="btn btn-secondary btn-xs" :disabled="page <= 1 || loading" @click="emit('page-change', page - 1)">
                <AppIcon name="arrow_left" :size="12" />
                Sebelumnya
            </button>

            <div class="hidden items-center gap-1 md:flex">
                <template v-for="(item, index) in pages" :key="`${item}-${index}`">
                    <span v-if="item === '…'" class="px-1 text-2xs text-neutral-400">…</span>
                    <button
                        v-else
                        type="button"
                        class="min-w-[26px] border px-1.5 py-0.5 text-[11.5px] font-semibold transition"
                        :class="item === page ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-500'"
                        :disabled="loading"
                        @click="emit('page-change', item as number)"
                    >
                        {{ item }}
                    </button>
                </template>
            </div>

            <span class="text-2xs text-neutral-500 md:hidden">Halaman {{ page }} / {{ lastPage }}</span>

            <button type="button" class="btn btn-secondary btn-xs" :disabled="page >= lastPage || loading" @click="emit('page-change', page + 1)">
                Berikutnya
                <AppIcon name="arrow_right" :size="12" />
            </button>
        </div>
    </div>
</template>
