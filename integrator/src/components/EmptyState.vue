<script setup lang="ts">
import AppIcon from '@/components/AppIcon.vue';

/** EmptyState — kondisi kosong yang menjelaskan langkah berikutnya. */
withDefaults(
    defineProps<{
        title?: string;
        message?: string;
        icon?: string;
        actionLabel?: string;
        compact?: boolean;
    }>(),
    { title: 'Tidak ada data', message: 'Belum ada data yang cocok dengan filter saat ini.', icon: 'search', actionLabel: '', compact: false },
);

defineEmits<{ action: [] }>();
</script>

<template>
    <div class="flex flex-col items-center justify-center text-center" :class="compact ? 'px-4 py-6' : 'px-6 py-12'">
        <div class="mb-3 flex h-9 w-9 items-center justify-center border border-neutral-200 bg-neutral-50 text-neutral-400">
            <AppIcon :name="icon" :size="18" />
        </div>
        <p class="text-[13px] font-semibold text-neutral-800">{{ title }}</p>
        <p class="mt-1 max-w-md text-[12px] leading-relaxed text-neutral-500">{{ message }}</p>
        <button v-if="actionLabel" type="button" class="btn btn-secondary mt-3" @click="$emit('action')">{{ actionLabel }}</button>
        <slot />
    </div>
</template>
