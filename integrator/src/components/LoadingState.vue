<script setup lang="ts">
/** LoadingState — skeleton baris tabel / panel. */
withDefaults(defineProps<{ rows?: number; label?: string }>(), { rows: 5, label: 'Memuat data…' });
</script>

<template>
    <div class="p-4" aria-busy="true" aria-live="polite">
        <p class="mb-3 text-2xs font-semibold uppercase tracking-wider text-neutral-500">{{ label }}</p>
        <div class="space-y-2">
            <div v-for="index in rows" :key="index" class="flex gap-2">
                <div class="h-4 animate-pulse bg-neutral-200" :style="{ width: `${18 + ((index * 7) % 30)}%` }" />
                <div class="h-4 flex-1 animate-pulse bg-neutral-100" />
                <div class="h-4 w-16 animate-pulse bg-neutral-200" />
            </div>
        </div>
    </div>
</template>
