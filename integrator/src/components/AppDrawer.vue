<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue';
import AppIcon from './AppIcon.vue';

/** AppDrawer — panel samping untuk detail (payload, response, log). */
const props = withDefaults(defineProps<{ open: boolean; title?: string; subtitle?: string; width?: string }>(), {
    title: '',
    subtitle: '',
    width: 'max-w-4xl',
});

const emit = defineEmits<{ close: [] }>();

const onKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && props.open) emit('close');
};

watch(
    () => props.open,
    (open) => {
        document.body.style.overflow = open ? 'hidden' : '';
        if (open) {
            window.addEventListener('keydown', onKeydown);
            return;
        }
        window.removeEventListener('keydown', onKeydown);
    },
);

onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKeydown);
    document.body.style.overflow = '';
});
</script>

<template>
    <Teleport to="body">
        <div v-if="open" class="fixed inset-0 z-50 flex justify-end">
            <div class="absolute inset-0 bg-neutral-900/40" @click="emit('close')" />
            <aside class="relative flex h-full w-full flex-col border-l border-neutral-300 bg-white shadow-xl" :class="width">
                <header class="flex items-start justify-between gap-3 border-b border-neutral-200 px-4 py-3">
                    <div class="min-w-0">
                        <h2 class="truncate text-[13.5px] font-semibold text-neutral-900">{{ title }}</h2>
                        <p v-if="subtitle" class="mt-0.5 truncate text-2xs text-neutral-500">{{ subtitle }}</p>
                    </div>
                    <div class="flex items-center gap-1.5">
                        <slot name="header-actions" />
                        <button type="button" class="btn btn-ghost px-1.5" aria-label="Tutup panel" @click="emit('close')">
                            <AppIcon name="x" :size="15" />
                        </button>
                    </div>
                </header>

                <div class="min-h-0 flex-1 overflow-y-auto p-4">
                    <slot />
                </div>

                <footer v-if="$slots.footer" class="flex flex-wrap items-center justify-end gap-2 border-t border-neutral-200 bg-neutral-50 px-4 py-2.5">
                    <slot name="footer" />
                </footer>
            </aside>
        </div>
    </Teleport>
</template>
