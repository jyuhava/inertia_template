<script setup lang="ts">
import { computed, ref } from 'vue';
import AppIcon from '@/components/AppIcon.vue';
import { useUiStore, type ToastMessage } from '@/stores/ui';

/**
 * ToastHost — notifikasi global. Detail teknis disembunyikan pada bagian
 * yang dapat dibuka (expandable) agar pesan utama tetap manusiawi.
 */
const ui = useUiStore();
const expanded = ref<Record<string, boolean>>({});

const toneClasses: Record<ToastMessage['tone'], string> = {
    success: 'border-emerald-300 bg-emerald-50 text-emerald-900',
    error: 'border-red-300 bg-red-50 text-red-900',
    warning: 'border-amber-300 bg-amber-50 text-amber-900',
    info: 'border-sky-300 bg-sky-50 text-sky-900',
};

const iconFor = (tone: ToastMessage['tone']): string => (tone === 'success' ? 'check' : tone === 'error' ? 'alert' : tone === 'warning' ? 'alert' : 'info');

const toasts = computed(() => ui.toasts);

const toggleDetail = (id: string): void => {
    expanded.value = { ...expanded.value, [id]: !expanded.value[id] };
};
</script>

<template>
    <div class="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[360px] max-w-[92vw] flex-col gap-2">
        <div v-for="toast in toasts" :key="toast.id" class="pointer-events-auto border bg-white p-3 shadow-sm" :class="toneClasses[toast.tone]">
            <div class="flex items-start gap-2">
                <AppIcon :name="iconFor(toast.tone)" :size="16" class="mt-0.5 shrink-0" />
                <div class="min-w-0 flex-1">
                    <p class="text-[12.5px] font-semibold">{{ toast.title }}</p>
                    <p v-if="toast.message" class="mt-0.5 text-[12px] leading-relaxed opacity-90">{{ toast.message }}</p>

                    <div v-if="toast.detail" class="mt-1.5">
                        <button type="button" class="text-2xs font-semibold uppercase tracking-wide underline opacity-80" @click="toggleDetail(toast.id)">
                            {{ expanded[toast.id] ? 'Sembunyikan detail teknis' : 'Lihat detail teknis' }}
                        </button>
                        <pre v-if="expanded[toast.id]" class="mt-1 max-h-40 overflow-auto border border-current/20 bg-white/70 p-2 font-mono text-[10.5px] leading-relaxed">{{ toast.detail }}</pre>
                    </div>
                </div>
                <button type="button" class="opacity-60 hover:opacity-100" aria-label="Tutup notifikasi" @click="ui.removeToast(toast.id)">
                    <AppIcon name="x" :size="14" />
                </button>
            </div>
        </div>
    </div>
</template>
