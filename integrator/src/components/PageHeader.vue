<script setup lang="ts">
import AppIcon from '@/components/AppIcon.vue';

/** PageHeader — judul halaman, deskripsi singkat, dan area aksi. */
defineProps<{
    title: string;
    description?: string;
    hint?: string;
    icon?: string;
    tone?: 'neutral' | 'warning' | 'danger';
}>();
</script>

<template>
    <div class="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div class="min-w-0">
            <div class="flex items-center gap-2">
                <AppIcon v-if="icon" :name="icon" :size="18" class="text-neutral-500" />
                <h1 class="text-[16px] font-semibold tracking-tight text-neutral-900">{{ title }}</h1>
                <span v-if="tone === 'warning'" class="badge border-amber-300 bg-amber-50 text-amber-800">perlu perhatian</span>
                <span v-if="tone === 'danger'" class="badge border-red-300 bg-red-50 text-red-700">terblokir</span>
            </div>
            <p v-if="description" class="mt-1 max-w-3xl text-[12.5px] leading-relaxed text-neutral-600">{{ description }}</p>
            <p v-if="hint" class="mt-1 max-w-3xl text-2xs text-neutral-600">{{ hint }}</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
            <slot name="actions" />
        </div>
    </div>
</template>
