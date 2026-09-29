<script setup lang="ts">
import AppIcon from './AppIcon.vue';

/**
 * BulkActionBar — muncul ketika ada baris terpilih.
 * Semua aksi massal (validasi, bandingkan, pratinjau payload, sinkronkan,
 * export) berangkat dari sini.
 */
withDefaults(defineProps<{ count: number; label?: string; disabled?: boolean }>(), { label: 'data dipilih', disabled: false });

const emit = defineEmits<{ clear: [] }>();
</script>

<template>
    <div class="flex flex-wrap items-center gap-2 border-b border-brand-300 bg-brand-50 px-3 py-2">
        <span class="flex items-center gap-1.5 text-[12.5px] font-semibold text-brand-900">
            <AppIcon name="check" :size="14" />
            {{ count }} {{ label }}
        </span>
        <div class="flex flex-wrap items-center gap-1.5">
            <slot />
        </div>
        <button type="button" class="btn btn-ghost btn-xs ml-auto" :disabled="disabled" @click="emit('clear')">
            <AppIcon name="x" :size="12" />
            Bersihkan pilihan
        </button>
    </div>
</template>
