<script setup lang="ts">
import type { DetailTab } from '@/types/ui';

/** EntityTabs — navigasi tab pada halaman detail entitas. */
const props = defineProps<{ tabs: DetailTab[]; modelValue: string }>();

const emit = defineEmits<{ 'update:modelValue': [string] }>();

const toneClass = (tone: DetailTab['tone']): string => (tone === 'danger' ? 'text-red-700' : tone === 'warning' ? 'text-amber-700' : 'text-neutral-500');
</script>

<template>
    <div class="flex flex-wrap items-center gap-1 border-b border-neutral-200 bg-white px-2">
        <button
            v-for="tab in props.tabs"
            :key="tab.key"
            type="button"
            class="relative px-3 py-2 text-[12.5px] font-medium transition"
            :class="props.modelValue === tab.key ? 'text-neutral-900' : 'text-neutral-500 hover:text-neutral-800'"
            @click="emit('update:modelValue', tab.key)"
        >
            <span>{{ tab.label }}</span>
            <span v-if="tab.count !== undefined && tab.count > 0" class="ml-1.5 badge border-neutral-300 bg-neutral-100" :class="toneClass(tab.tone)">{{ tab.count }}</span>
            <span v-if="props.modelValue === tab.key" class="absolute inset-x-0 -bottom-px h-0.5 bg-neutral-900" />
        </button>
        <div class="ml-auto flex items-center gap-1.5 py-1.5">
            <slot name="actions" />
        </div>
    </div>
</template>
