<script setup lang="ts">
import { computed } from 'vue';
import AppIcon from '@/components/AppIcon.vue';
import { formatNumber } from '@/utils/format';
import type { StatusTone } from '@/types/common';

/**
 * StatCard — kartu statistik kompak (dipakai dashboard & daftar entitas).
 * Mendukung nilai besar, keterangan, dan tautan filter.
 */
const props = withDefaults(
    defineProps<{
        label: string;
        value: number | string | null | undefined;
        hint?: string;
        tone?: StatusTone;
        icon?: string;
        to?: string;
        clickable?: boolean;
        active?: boolean;
        compact?: boolean;
    }>(),
    { tone: 'neutral', hint: '', icon: '', to: '', clickable: false, active: false, compact: false },
);

const toneBorder: Record<StatusTone, string> = {
    neutral: 'border-neutral-200',
    info: 'border-sky-200',
    success: 'border-emerald-200',
    warning: 'border-amber-200',
    danger: 'border-red-200',
    accent: 'border-brand-300',
};

const toneValue: Record<StatusTone, string> = {
    neutral: 'text-neutral-900',
    info: 'text-sky-700',
    success: 'text-emerald-700',
    warning: 'text-amber-700',
    danger: 'text-red-700',
    accent: 'text-brand-800',
};

const displayValue = computed(() => (typeof props.value === 'number' ? formatNumber(props.value) : (props.value ?? '—')));
const wrapperClass = computed(() => [toneBorder[props.tone], props.active ? 'ring-1 ring-neutral-900' : '', props.clickable || props.to ? 'cursor-pointer hover:border-neutral-400' : '']);
</script>

<template>
    <component
        :is="to ? 'RouterLink' : clickable ? 'button' : 'div'"
        :to="to || undefined"
        :type="clickable && !to ? 'button' : undefined"
        class="block border bg-white text-left transition"
        :class="[wrapperClass, compact ? 'px-3 py-2' : 'px-3.5 py-3']"
    >
        <div class="flex items-start justify-between gap-2">
            <p class="kv-label">{{ label }}</p>
            <AppIcon v-if="icon" :name="icon" :size="14" class="text-neutral-400" />
        </div>
        <p class="mt-1 font-semibold leading-none" :class="[toneValue[tone], compact ? 'text-[19px]' : 'text-[24px]']">{{ displayValue }}</p>
        <p v-if="hint" class="mt-1 text-2xs leading-snug text-neutral-500">{{ hint }}</p>
    </component>
</template>
