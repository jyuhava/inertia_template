<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue';
import AppIcon from './AppIcon.vue';
import type { ActionMenuItem } from '@/types/ui';

/**
 * ActionMenu — dropdown "Aksi Lainnya" (refresh, validate, compare,
 * preview payload, export, retry, reset filter, riwayat).
 */
const props = withDefaults(defineProps<{ items: ActionMenuItem[]; label?: string; align?: 'left' | 'right'; compact?: boolean }>(), {
    label: 'Aksi Lainnya',
    align: 'right',
    compact: true,
});

const emit = defineEmits<{ select: [string] }>();

const open = ref(false);

const toggle = (): void => {
    open.value = !open.value;
    if (open.value) {
        window.addEventListener('click', onOutsideClick, { once: true });
    }
};

const onOutsideClick = (): void => {
    open.value = false;
};

onBeforeUnmount(() => window.removeEventListener('click', onOutsideClick));

const select = (item: ActionMenuItem): void => {
    if (item.disabled) return;
    open.value = false;
    emit('select', item.key);
};
</script>

<template>
    <div class="relative inline-block" @click.stop>
        <button type="button" class="btn btn-secondary" :class="compact ? 'btn-xs' : ''" :disabled="items.length === 0" :aria-label="label" :title="label" @click="toggle">
            <AppIcon name="dots" :size="14" />
            <span v-if="!compact">{{ label }}</span>
            <AppIcon name="chevron-down" :size="12" />
        </button>

        <div v-if="open" class="absolute z-30 mt-1 w-64 border border-neutral-300 bg-white shadow-lg" :class="align === 'right' ? 'right-0' : 'left-0'">
            <button
                v-for="item in items"
                :key="item.key"
                type="button"
                class="flex w-full items-start gap-2 px-3 py-2 text-left transition disabled:cursor-not-allowed disabled:opacity-40"
                :class="item.tone === 'danger' ? 'hover:bg-red-50' : 'hover:bg-neutral-100'"
                :disabled="item.disabled"
                @click="select(item)"
            >
                <AppIcon v-if="item.icon" :name="item.icon" :size="14" class="mt-0.5" :class="item.tone === 'danger' ? 'text-red-600' : 'text-neutral-500'" />
                <span class="min-w-0 flex-1">
                    <span class="block text-[12.5px] font-medium" :class="item.tone === 'danger' ? 'text-red-700' : 'text-neutral-800'">{{ item.label }}</span>
                    <span v-if="item.description" class="mt-0.5 block text-2xs leading-snug text-neutral-500">{{ item.description }}</span>
                </span>
                <span v-if="item.shortcut" class="font-mono text-[10px] text-neutral-400">{{ item.shortcut }}</span>
            </button>
        </div>
    </div>
</template>
