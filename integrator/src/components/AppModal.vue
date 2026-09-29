<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue';
import AppIcon from './AppIcon.vue';

/** AppModal — dialog tengah dengan ukuran adaptif. */
const props = withDefaults(
    defineProps<{
        open: boolean;
        title?: string;
        subtitle?: string;
        size?: 'sm' | 'md' | 'lg' | 'xl';
        closeOnBackdrop?: boolean;
    }>(),
    { title: '', subtitle: '', size: 'md', closeOnBackdrop: true },
);

const emit = defineEmits<{ close: [] }>();

const sizeClass: Record<string, string> = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
};

const onKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && props.open) emit('close');
};

watch(
    () => props.open,
    (open) => {
        if (open) {
            window.addEventListener('keydown', onKeydown);
            return;
        }
        window.removeEventListener('keydown', onKeydown);
    },
);

onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown));
</script>

<template>
    <Teleport to="body">
        <div v-if="open" class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 lg:p-8">
            <div class="fixed inset-0 bg-neutral-900/50" @click="closeOnBackdrop && emit('close')" />
            <div class="relative w-full border border-neutral-300 bg-white shadow-lg" :class="sizeClass[size]" role="dialog" aria-modal="true">
                <header class="flex items-start justify-between gap-3 border-b border-neutral-200 px-4 py-3">
                    <div class="min-w-0">
                        <h2 class="text-[13.5px] font-semibold text-neutral-900">{{ title }}</h2>
                        <p v-if="subtitle" class="mt-0.5 text-2xs text-neutral-500">{{ subtitle }}</p>
                    </div>
                    <button type="button" class="btn btn-ghost px-1.5" aria-label="Tutup dialog" @click="emit('close')">
                        <AppIcon name="x" :size="15" />
                    </button>
                </header>

                <div class="max-h-[72vh] overflow-y-auto p-4">
                    <slot />
                </div>

                <footer v-if="$slots.footer" class="flex flex-wrap items-center justify-end gap-2 border-t border-neutral-200 bg-neutral-50 px-4 py-2.5">
                    <slot name="footer" />
                </footer>
            </div>
        </div>
    </Teleport>
</template>
